const assert = require('node:assert/strict');
const { createHash, webcrypto } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');
const cut = (start, end) => html.slice(html.indexOf(start), html.indexOf(end));
const syncCode = cut('const GITHUB_SYNC_TIMEOUT_MS', 'const GITHUB_SYNC_STALE_MS')
  .replace('95 * 1024 * 1024', '1024').replace('40 * 1024 * 1024', '128');
const latest = 'trpg-tool.latest.json';
const server = 'https://api.github.com/contents/';
const savedAt = '2026-11-28T10:20:00.000Z';
const buffer = data => Buffer.from(JSON.stringify(data));
const gitSha = data => createHash('sha1').update(`blob ${data.length}\0`).update(data).digest('hex');

function fixture() {
  const files = new Map();
  const puts = [];
  const gets = [];
  const imported = [];
  const storage = new Map();
  const api = { files, puts, gets, imported, storage, scheduled: 0 };
  const context = vm.createContext({
    Blob, crypto: webcrypto, AbortController, setTimeout, clearTimeout,
    GITHUB_SYNC_BRANCH: 'sync', GITHUB_SYNC_LAST_SHA_KEY: 'sha', GITHUB_SYNC_LAST_AT_KEY: 'at',
    githubSyncTrace: null, githubSyncRevision: 0, githubSyncDirty: false, githubSyncDirtySince: 0,
    localStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
    getGitHubSyncToken: () => 'test', getGitHubSyncApiUrl: () => `${server}${latest}`,
    githubSyncMark: () => {}, githubContentsUrl: name => `${server}${name}`,
    scheduleGitHubSync: () => { api.scheduled += 1; },
    makeImportPayload: data => imported.push(data),
    blobToBase64: async blob => Buffer.from(await blob.arrayBuffer()).toString('base64'),
    fetch: async (url, options) => {
      const name = new URL(url).pathname.replace('/contents/', '');
      if (options.method !== 'PUT') {
        gets.push(name);
        const data = files.get(name);
        if (!data) return Response.json({}, { status: 404 });
        if (options.headers.Accept === 'application/vnd.github.raw+json') return new Response(data);
        return Response.json({ sha: gitSha(data), size: data.length });
      }
      assert.ok(options.body.length <= 1024);
      const { branch, content, sha } = JSON.parse(options.body);
      assert.equal(branch, 'sync');
      const data = Buffer.from(content, 'base64');
      puts.push(name);
      const failure = api.beforePut?.(name, data);
      if (failure) return Response.json({}, { status: failure });
      const previous = files.get(name);
      if (previous && gitSha(previous) !== sha) return Response.json({}, { status: 409 });
      files.set(name, data);
      return Response.json({ content: { sha: gitSha(data), size: data.length } }, { status: 201 });
    },
  });
  vm.runInContext(syncCode + cut('async function putGitHubFile', '// 이미지 전용 공개 저장소')
    + cut('async function fetchGitHubBlob', 'async function uploadAttachmentToGitHub'), context);
  api.context = context;
  api.read = async () => (await context.getGitHubSyncRemote(await context.getGitHubSyncMeta())).data;
  api.write = (data, sha) => context.putGitHubSyncPayload(data, sha);
  return api;
}

function largeState() {
  const prefix = '{"version":3,"scenarios":[{"id":"s","title":"';
  const boundary = 'x'.repeat(127 - Buffer.byteLength(prefix)) + '🚀';
  return {
    savedAt, version: 3, scenarios: [{ id: 's', title: boundary }],
    records: Array.from({ length: 14 }, (_, id) => ({ id, notes: `${id} ${'한글'.repeat(id + 1)}` })),
    bookmarks: [{ id: 'with-file', attachments: [{ sha256: '1'.repeat(64), size: 55 }] }],
    musicTracks: [{ id: 'music', attached: true, sha256: '2'.repeat(64) }],
    futureField: { other: '그대로' },
  };
}

const plain = value => JSON.parse(JSON.stringify(value));

test('작은 백업은 기존 형식, 기존 단일 JSON과 배열 백업도 원격에서 읽는다', async () => {
  const api = fixture();
  const small = { savedAt, scenarios: [{ id: 's', title: '한글' }] };
  assert.equal(await api.write(small), gitSha(api.files.get(latest)));
  assert.deepEqual(api.puts, [latest]);
  assert.deepEqual(plain(await api.read()), small);
  api.files.set(latest, buffer([{ id: 'old' }]));
  assert.deepEqual(plain(await api.read()), [{ id: 'old' }]);
});

test('UTF-8 문자가 경계에 걸려도 나눈 전체 상태와 파일 참조를 복원한다', async () => {
  const api = fixture();
  const data = largeState();
  await api.write(data);
  const manifest = JSON.parse(api.files.get(latest));
  assert.equal(manifest.trpgSyncFormat, 'trpg-tool-split-v1');
  assert.ok(manifest.parts.length > 4);
  assert.equal(api.puts.at(-1), latest);
  const firstPart = api.files.get(`sync-state/${manifest.parts[0]}`);
  assert.equal(firstPart[127], 0xf0, '4바이트 UTF-8 문자의 첫 바이트에서 조각이 잘린다');
  assert.deepEqual(plain(await api.read()), data);
});

test('중단 후에도 이전 최신본을 유지하고 재시도는 완료된 조각을 재사용한다', async () => {
  const api = fixture();
  const old = buffer({ savedAt, records: [{ id: 'old' }] });
  api.files.set(latest, old);
  const data = largeState();
  api.beforePut = name => api.puts.length === 3 && name !== latest ? 503 : undefined;
  await assert.rejects(api.write(data, gitSha(old)), /503/);
  assert.deepEqual(api.files.get(latest), old);
  const complete = new Set(api.puts.slice(0, 2));
  assert.equal(complete.size, 2);
  api.puts.length = 0;
  api.beforePut = null;
  data.savedAt = '2026-11-28T10:25:00.000Z';
  await api.write(data, gitSha(old));
  assert.ok(api.puts.every(name => !complete.has(name)));
  assert.deepEqual(plain(await api.read()), data);
});

test('동일 조각 경쟁은 재확인하고 다른 기기가 갱신한 최신본을 덮어쓰지 않는다', async () => {
  const api = fixture();
  const old = buffer({ savedAt, records: [{ id: 'old' }] });
  const concurrent = buffer({ savedAt, records: [{ id: 'concurrent' }] });
  api.files.set(latest, old);
  api.beforePut = (name, data) => {
    if (name === api.puts[0]) { api.files.set(name, data); return 422; }
    if (name === latest) api.files.set(latest, concurrent);
  };
  await assert.rejects(api.write(largeState(), gitSha(old)), /409/);
  assert.deepEqual(api.files.get(latest), concurrent);
  assert.ok(api.gets.filter(name => name === api.puts[0]).length >= 2);
  await assert.rejects(api.context.getGitHubSyncRemote({ sha: gitSha(old), size: old.length }), /읽는 동안 변경/);
});

test('손상되거나 빠진 조각과 잘못된 목록은 가져오기 전에 거부한다', async () => {
  const api = fixture();
  await api.write(largeState());
  const manifest = JSON.parse(api.files.get(latest));
  const name = `sync-state/${manifest.parts[0]}`;
  api.files.set(name, Buffer.alloc(128, 7));
  await assert.rejects(api.read(), /해시가 맞지 않습니다/);
  api.files.delete(name);
  await assert.rejects(api.read(), /404/);
  api.files.set(latest, buffer({ ...manifest, parts: ['../attachments/test'] }));
  await assert.rejects(api.read(), /조각 목록 형식/);
  assert.equal(api.imported.length, 0);
});

test('업로드 도중 생긴 편집은 다음 자동 동기화 대상으로 남긴다', () => {
  const api = fixture();
  api.context.githubSyncDirty = true;
  api.context.githubSyncRevision = 2;
  api.context.rememberGitHubSync('first', savedAt, 1);
  assert.equal(api.storage.get('sha'), 'first');
  assert.equal(api.context.githubSyncDirty, true);
  assert.equal(api.scheduled, 1);
  api.context.rememberGitHubSync('second', savedAt, 2);
  assert.equal(api.context.githubSyncDirty, false);
});

test('최신본 저장 후 응답을 잃으면 원격 SHA로 완료를 확인하되 새 편집은 지우지 않는다', async () => {
  const api = fixture();
  const data = largeState();
  api.beforePut = (name, bytes) => {
    if (name !== latest) return;
    api.files.set(name, bytes);
    return 503;
  };
  await assert.rejects(api.write(data), /503/);
  const meta = await api.context.getGitHubSyncMeta();
  api.context.recoverGitHubSyncPublication({ ...meta, sha: 'different' });
  assert.equal(api.storage.get('sha'), undefined);
  api.context.githubSyncDirty = true;
  api.context.recoverGitHubSyncPublication(meta);
  assert.equal(api.storage.get('sha'), meta.sha);
  assert.equal(api.storage.get('at'), data.savedAt);
  assert.equal(api.context.githubSyncDirty, true);
});
