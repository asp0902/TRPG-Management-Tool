const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');

// 북마크 정보 가져오기: 직접 조회가 실패할 때만 외부 조회 서비스로 대체(#191)
assert.match(html, /const BOOKMARK_META_SERVICE_URL = 'https:\/\/api\.microlink\.io\/';/);
assert.match(html, /async function fetchBookmarkMetaViaService\(targetUrl, signal\)/);
assert.match(html, /title="[^"]*외부 조회 서비스\(microlink\)로 이 URL을 보내[^"]*"/, '버튼 안내');
assert.doesNotMatch(html, /data\.data\?\.logo/, 'logo 는 쓰지 않는다');

const start = html.indexOf('const BOOKMARK_META_SERVICE_URL');
const end = html.indexOf('function extractBookmarkGenericMetadata');
assert.ok(start > 0 && end > start);
const calls = [];
const ctx = {
  calls,
  fetch: async (url) => {
    calls.push(String(url));
    if (ctx.mode === 'ok') return { status: 200, ok: true, json: async () => ({ status: 'success', data: { title: ' 제목 ', image: { url: 'https://img/x.png' }, logo: { url: 'https://logo' } } }) };
    if (ctx.mode === '429') return { status: 429, ok: false, json: async () => ({}) };
    if (ctx.mode === 'fail') return { status: 200, ok: true, json: async () => ({ status: 'fail' }) };
    throw new Error('net');
  },
  encodeURIComponent,
  fetchBookmarkPageDocument: async () => { if (ctx.direct === 'fail') throw new Error('CORS'); return {}; },
  extractBookmarkGenericMetadata: () => ({ title: '직접', image: '' }),
};
vm.runInNewContext(`${html.slice(start, end)}\nthis.viaService = fetchBookmarkMetaViaService; this.generic = fetchBookmarkGenericMeta; this.describe = describeBookmarkFetchError; this.Err = BookmarkMetaServiceError;`, ctx);

(async () => {
  ctx.mode = 'ok';
  let r = await ctx.viaService('https://a.com/p?x=1', undefined);
  assert.equal(r.title, '제목'); assert.equal(r.image, 'https://img/x.png');
  assert.match(calls[0], /^https:\/\/api\.microlink\.io\/\?url=https%3A%2F%2Fa\.com%2Fp%3Fx%3D1$/);

  calls.length = 0; ctx.direct = 'ok';
  r = await ctx.generic('https://a.com', undefined);
  assert.equal(r.title, '직접'); assert.equal(calls.length, 0, 'CORS 허용 사이트는 외부 서비스를 부르지 않는다');

  ctx.direct = 'fail'; ctx.mode = 'ok'; let notified = 0;
  r = await ctx.generic('https://a.com', undefined, () => { notified += 1; });
  assert.equal(r.title, '제목'); assert.equal(notified, 1); assert.equal(calls.length, 1);

  ctx.mode = '429';
  await assert.rejects(ctx.generic('https://a.com', undefined), e => e.kind === 'rate-limit');
  ctx.mode = 'fail';
  await assert.rejects(ctx.generic('https://a.com', undefined), e => e.kind === 'service');
  ctx.mode = 'net';
  await assert.rejects(ctx.generic('https://a.com', undefined), e => e.kind === 'network');
  const aborted = { aborted: true };
  await assert.rejects(ctx.generic('https://a.com', aborted), e => e.kind === 'timeout');

  assert.match(ctx.describe(new ctx.Err('rate-limit')), /사용량 초과/);
  assert.match(ctx.describe(new ctx.Err('timeout')), /시간 초과/);
  console.log('bookmark meta service checks: OK');
})().catch(e => { console.error(e); process.exit(1); });
