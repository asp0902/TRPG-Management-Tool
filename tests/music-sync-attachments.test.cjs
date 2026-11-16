const fs = require('fs'), path = require('path'), vm = require('vm'), crypto = require('crypto');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13,10)).join(String.fromCharCode(10));
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok', m); };
const cut = (a, b) => html.slice(html.indexOf(a), html.indexOf(b));
// 정적: 연결 지점
ok(html.includes('await musicSyncUploads(); // MUSIC 음원(#296)'), '기존 백그라운드 업로드(syncAttachmentsToGitHub)에 MUSIC 음원 포함');
ok(html.includes("sha256: str('sha256'), mime: str('mime')"), '트랙 메타에 sha256·mime');
ok(html.includes("try { track.sha256 = await sha256Hex(file); track.mime = file.type || ''; }") && html.includes('musicSyncUploads(); // 음원 업로드(#296·#297)'), '곡 추가·파일 첨부 시 해시 계산·업로드 요청');
ok(html.includes('blob = await musicDownloadTrack(track); renderMusicPage();') && html.includes("showToast('음원을 받는 중…')"), '상세 열 때 Blob 없고 sha256 있으면 받는 중… 표시 후 다운로드');
ok(!/attachments\//.test(cut('async function deleteMusicTrack', '// ── 폴더 ──')), '곡 삭제 시 저장소 파일은 지우지 않음');
ok(html.includes('async function fetchAttachmentFromGitHub') && html.includes('const blob = await fetchAttachmentFromGitHub(att);'), '첨부 다운로드 로직을 공용 함수로 분리(해시 검증 포함)');

// ── 단위: 업로드·다운로드 (fetch/저장소는 전부 mock, 실제 저장소·토큰 없음) ──
const sha = buf => crypto.createHash('sha256').update(buf).digest('hex');
const sha256Hex = async blob => sha(Buffer.from(await blob.arrayBuffer()));
// #297 로 Drive 블록이 앞에 붙었으므로 GitHub 모드(Drive 설정 없음)만 검증한다
const code = cut('// ── Google Drive 음원 저장(#297)', 'async function openMusicDetail');
const mk = () => {
  const c = { token: 'FAKE-TEST-TOKEN', enabled: true, blobs: {}, uploads: [], statusPuts: [], toasts: [], puts: [], persisted: 0, readKeys: [], tagsReturn: { cover: null } };
  const ctx = {
    state: { musicTracks: [] }, attachDoneSet: new Set(), musicLocalIds: new Set(), musicCoverUrls: {}, URL: { createObjectURL: () => 'blob:cover' }, Blob,
    getGitHubSyncToken: () => c.token, isGitHubSyncEnabled: () => c.enabled, persist: () => c.persisted++, showToast: m => c.toasts.push(m), console: { error() {} },
    sha256Hex, musicBlobGet: async k => { c.readKeys.push(k); return c.blobs[k] || null; }, musicBlobPut: async (k, b) => { c.blobs[k] = b; c.puts.push(k); },
    uploadAttachmentToGitHub: async (shaHex, blob) => { c.uploads.push([shaHex, blob.size]); },
    attachTx: async (store) => { c.statusPuts.push(store); },
    fetchAttachmentFromGitHub: async att => { c.fetched = att.sha256; if (c.fetchFail) throw new Error('해시가 맞지 않습니다'); return new Blob([c.remoteBytes]); },
    musicReadTags: async () => c.tagsReturn,
    musicBlobKeys: async () => Object.keys(c.blobs), refreshAttachmentIndex: async () => {},
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, window: {}, document: {}, setTimeout, clearTimeout, Date, Math, Number, String, Promise, encodeURIComponent, fetch: async () => { throw new Error('외부 호출 금지'); },
  };
  vm.createContext(ctx); vm.runInContext(code + ';this.f={musicSyncUploads,musicDownloadTrack}', ctx); return { c, ctx };
};
(async () => {
  // 업로드: 옛 곡(sha 없음)은 해시 계산·등록 후 업로드, 이미 올라간 곡은 Blob 도 읽지 않음, 유튜브 단독·Blob 없음은 건너뜀
  let { c, ctx } = mk();
  const bytes = Buffer.from('audio-bytes-1');
  c.blobs.old = new Blob([bytes], { type: 'audio/mpeg' }); c.blobs.att = new Blob([Buffer.from('attached')]);
  const done = sha(Buffer.from('done'));
  ctx.attachDoneSet.add(done);
  ctx.state.musicTracks.push(
    { id: 'old', kind: 'file', sha256: '', mime: '' },
    { id: 'att', kind: 'youtube', attached: true, sha256: '', mime: '' },
    { id: 'done', kind: 'file', sha256: done, mime: '' },
    { id: 'yt', kind: 'youtube', attached: false, sha256: '' },
    { id: 'nofile', kind: 'file', sha256: '' });
  await ctx.f.musicSyncUploads();
  ok(ctx.state.musicTracks[0].sha256 === sha(bytes) && ctx.state.musicTracks[0].mime === 'audio/mpeg', '옛 곡: 해시·mime 메타 등록(한 번)');
  ok(c.uploads.length === 2 && c.uploads[0][0] === sha(bytes) && c.uploads[1][0] === sha(Buffer.from('attached')), '업로드 대기 포함: 파일 곡·유튜브+첨부 파일만 올림');
  ok(!c.readKeys.includes('done') && !c.readKeys.includes('yt'), '이미 올라간 곡·유튜브 단독은 Blob 을 읽지 않음');
  ok(ctx.attachDoneSet.has(sha(bytes)) && c.statusPuts.length === 2 && c.persisted >= 1, '완료 기록(status)·메타 저장');
  const n = c.uploads.length; await ctx.f.musicSyncUploads(); ok(c.uploads.length === n, '두 번째 실행은 다시 올리지 않음');
  // 토큰 없음·자동 동기화 꺼짐 → 미동작
  for (const off of ['token', 'enabled']) {
    ({ c, ctx } = mk()); c[off] = off === 'token' ? '' : false; c.blobs.x = new Blob(['x']); ctx.state.musicTracks.push({ id: 'x', kind: 'file', sha256: '' });
    await ctx.f.musicSyncUploads(); ok(c.uploads.length === 0 && c.readKeys.length === 0 && ctx.state.musicTracks[0].sha256 === '', off + ' 없음/꺼짐 → 업로드·해시 등록 안 함');
  }
  // 다운로드: 다른 기기(Blob 없음 + sha 있음)
  ({ c, ctx } = mk()); c.remoteBytes = Buffer.from('remote-audio'); c.tagsReturn = { cover: { bytes: new Uint8Array([1, 2]), mime: 'image/png' } };
  const tr = { id: 'r1', kind: 'file', sha256: sha(c.remoteBytes), mime: 'audio/mpeg' };
  const blob = await ctx.f.musicDownloadTrack(tr);
  ok(blob && blob.type === 'audio/mpeg' && c.fetched === tr.sha256 && c.puts[0] === 'r1' && ctx.musicLocalIds.has('r1'), '다운로드 → MUSIC_DB(트랙 id 키) 저장·mime 복원·로컬 표시');
  ok(c.puts.includes('cover:r1') && ctx.musicCoverUrls.r1 === 'blob:cover', '받은 음원의 ID3 에서 표지 다시 생성');
  ok(ctx.attachDoneSet.has(tr.sha256), '받은 해시는 업로드 완료로 표시');
  // 해시 불일치 → 저장 안 함·토스트
  ({ c, ctx } = mk()); c.fetchFail = true;
  const bad = await ctx.f.musicDownloadTrack({ id: 'r2', kind: 'file', sha256: 'abc' });
  ok(bad === null && c.puts.length === 0 && c.toasts.length === 1, '해시 불일치/실패 → 저장 안 함·null·안내 토스트');
  // 토큰 없음·꺼짐·sha 없음 → 다운로드 시도 안 함
  for (const [label, mod, t] of [['토큰 없음', { token: '' }, { sha256: 'abc' }], ['동기화 꺼짐', { enabled: false }, { sha256: 'abc' }], ['sha 없는 옛 곡', {}, { sha256: '' }]]) {
    ({ c, ctx } = mk()); Object.assign(c, mod); const r = await ctx.f.musicDownloadTrack({ id: 'r3', kind: 'file', ...t });
    ok(r === null && !c.fetched && c.toasts.length === 0, label + ' → 다운로드 안 함(기존 「이 기기에 파일 없음」 유지)');
  }
  // ── 공용 다운로드 함수: 단일 파일·큰 파일 조각(목록) 모두 받고 해시 검증 ──
  const fcode = cut('async function fetchAttachmentFromGitHub', 'async function downloadAttachmentFromGitHub');
  const data = Buffer.alloc(100, 7), shaData = sha(data);
  const run = async (files, expectSha) => {
    const fctx = { githubContentsUrl: p => 'https://x/' + p, GITHUB_SYNC_BRANCH: 'sync', encodeURIComponent, sha256Hex, Blob,
      githubSyncRequest: async (url, o) => { const key = url.split('/').pop().split('?')[0]; if (!(key in files)) { if (o && o.allow404) return null; throw new Error('404'); } return { text: async () => files[key] }; },
      fetchGitHubBlob: async p => new Blob([files[p.split('/').pop()]]) };
    vm.createContext(fctx); vm.runInContext(fcode + ';this.f=fetchAttachmentFromGitHub', fctx);
    return await fctx.f({ sha256: expectSha });
  };
  let r = await run({ [shaData]: data }, shaData);
  ok(Buffer.from(await r.arrayBuffer()).equals(data), '작은 파일: attachments/<sha> 받아 해시 일치');
  const manifest = JSON.stringify({ sha256: shaData, size: 100, parts: [{ name: shaData + '.part0' }, { name: shaData + '.part1' }] });
  r = await run({ [shaData + '.json']: manifest, [shaData + '.part0']: data.subarray(0, 60), [shaData + '.part1']: data.subarray(60) }, shaData);
  ok(Buffer.from(await r.arrayBuffer()).equals(data), '큰 파일: 목록(parts)대로 조각을 이어 붙여 해시 일치');
  let threw = false; try { await run({ [shaData]: Buffer.from('tampered') }, shaData); } catch (e) { threw = /해시가 맞지 않습니다/.test(e.message); }
  ok(threw, '변조/손상된 파일은 해시 불일치로 거부');
  console.log('fails=' + fails); process.exit(fails ? 1 : 0);
})();
