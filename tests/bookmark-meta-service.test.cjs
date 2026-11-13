const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');

// 북마크 정보 가져오기: 직접 조회가 실패할 때만 외부 조회 서비스로 대체(#191). 서비스는 [jina, microlink] 순(#199).
assert.match(html, /const BOOKMARK_META_JINA_URL = 'https:\/\/r\.jina\.ai\/';/);
assert.match(html, /const BOOKMARK_META_SERVICE_URL = 'https:\/\/api\.microlink\.io\/';/);
assert.match(html, /const BOOKMARK_META_SERVICES = \[requestBookmarkMetaJina, requestBookmarkMetaMicrolinkAuto\];/);
assert.match(html, /async function fetchBookmarkMetaViaService\(targetUrl, signal\)/);
assert.match(html, /title="[^"]*외부 조회 서비스\(jina \/ microlink\)로 이 URL을 보내[^"]*"/, '버튼 안내');
assert.match(html, /BOOKMARK_META_SERVICE_NOTICE = '이 URL이 외부 조회 서비스\(jina \/ microlink\)로 전송됩니다\.';/);
assert.doesNotMatch(html, /data\.data\?\.logo/, 'logo 는 쓰지 않는다');

const start = html.indexOf('const BOOKMARK_META_JINA_URL');
const end = html.indexOf('function extractBookmarkGenericMetadata');
assert.ok(start > 0 && end > start);
const calls = [];
// 서비스별 응답 모드(ctx.jina / ctx.ml): ok, 429, erate, fail, net, empty, empty-fast
const hang = opts => new Promise((_, reject) => opts.signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' }))));
const ctx = {
  calls,
  URL, AbortController, setTimeout, clearTimeout,
  fetch: async (url, opts) => {
    const u = String(url);
    calls.push(u);
    if (u.startsWith('https://r.jina.ai/')) {
      assert.equal(opts?.headers?.Accept, 'application/json');
      assert.deepEqual(Object.keys(opts.headers), ['Accept'], 'CORS 사전요청을 피하려고 Accept 만 쓴다');
      const mode = ctx.jina;
      if (mode === 'hang') return hang(opts);
      if (mode === 'ok') return { status: 200, ok: true, json: async () => ({ code: 200, data: { title: '본문 제목', url: 'https://a.com/p', metadata: { 'og:title': 'A &amp; B', 'og:image': '/img/x.png?a=1&amp;b=2' } } }) };
      if (mode === 'title-only') return { status: 200, ok: true, json: async () => ({ code: 200, data: { title: '그냥 제목', metadata: {} } }) };
      if (mode === 'empty') return { status: 200, ok: true, json: async () => ({ code: 200, data: { title: '', metadata: {} } }) };
      if (mode === '429') return { status: 429, ok: false, json: async () => ({}) };
      if (mode === 'body429') return { status: 200, ok: true, json: async () => ({ code: 429, status: 42901 }) };
      if (mode === 'fail') return { status: 451, ok: false, json: async () => ({}) };
      throw new Error('net');
    }
    const mode = ctx.ml;
    if (mode === 'hang') return hang(opts);
    if (mode === 'ok') return { status: 200, ok: true, json: async () => ({ status: 'success', data: { title: ' 제목 ', image: { url: 'https://img/x.png' }, logo: { url: 'https://logo' } } }) };
    if (mode === '429') return { status: 429, ok: false, json: async () => ({}) };
    if (mode === 'erate') return { status: 200, ok: true, json: async () => ({ status: 'fail', code: 'ERATE', message: 'Your daily rate limit has been reached' }) };
    if (mode === 'empty-fast') return { status: 200, ok: true, json: async () => (u.includes('prerender=false') ? { status: 'success', data: {} } : { status: 'success', data: { title: '렌더링 제목', image: null } }) };
    if (mode === 'fail') return { status: 200, ok: true, json: async () => ({ status: 'fail' }) };
    throw new Error('net');
  },
  encodeURIComponent,
  fetchBookmarkPageDocument: async () => { if (ctx.direct === 'fail') throw new Error('CORS'); return {}; },
  extractBookmarkGenericMetadata: () => ({ title: '직접', image: '' }),
};
vm.runInNewContext(`${html.slice(start, end).replace('[25000, 20000]', '[30, 30]')}\nthis.viaService = fetchBookmarkMetaViaService; this.generic = fetchBookmarkGenericMeta; this.describe = describeBookmarkFetchError; this.Err = BookmarkMetaServiceError;`, ctx);

const mlCalls = () => calls.filter(c => c.startsWith('https://api.microlink.io/'));
const jinaCalls = () => calls.filter(c => c.startsWith('https://r.jina.ai/'));

(async () => {
  // 1) jina 성공: microlink 호출 없음, 엔티티 정규화, 상대 이미지 URL 절대화
  ctx.jina = 'ok'; ctx.ml = 'ok';
  let r = await ctx.viaService('https://a.com/p?x=1', undefined);
  assert.equal(r.title, 'A & B'); assert.equal(r.image, 'https://a.com/img/x.png?a=1&b=2');
  assert.equal(jinaCalls().length, 1); assert.equal(mlCalls().length, 0, 'jina 성공 시 microlink 는 부르지 않는다');
  assert.equal(calls[0], 'https://r.jina.ai/https://a.com/p?x=1');
  // 같은 URL 재조회는 세션 캐시(요청 없음)
  calls.length = 0;
  r = await ctx.viaService('https://a.com/p?x=1', undefined);
  assert.equal(r.title, 'A & B'); assert.equal(calls.length, 0, '캐시 적중 시 요청 없음');

  // 2) metadata 가 없으면 data.title 사용
  calls.length = 0; ctx.jina = 'title-only';
  r = await ctx.viaService('https://t.com', undefined);
  assert.equal(r.title, '그냥 제목'); assert.equal(r.image, '');

  // 3) jina 429(HTTP·본문) → microlink 성공 (prerender=false 1차)
  for (const mode of ['429', 'body429', 'fail', 'net', 'empty']) {
    calls.length = 0; ctx.jina = mode; ctx.ml = 'ok';
    r = await ctx.viaService('https://f-' + mode + '.com', undefined);
    assert.equal(r.title, '제목', 'jina ' + mode + ' → microlink');
    assert.equal(jinaCalls().length, 1); assert.equal(mlCalls().length, 1);
    assert.match(mlCalls()[0], /&prerender=false&palette=false&audio=false&video=false&iframe=false$/);
  }

  // 4) microlink 1차가 비면 기본값으로 재시도(#196)
  calls.length = 0; ctx.jina = '429'; ctx.ml = 'empty-fast';
  r = await ctx.viaService('https://e.com', undefined);
  assert.equal(r.title, '렌더링 제목'); assert.equal(mlCalls().length, 2); assert.ok(!mlCalls()[1].includes('prerender'));

  // 5) 한도 초과 문구는 모든 서비스가 한도 초과일 때만
  calls.length = 0; ctx.jina = '429'; ctx.ml = 'erate';
  await assert.rejects(ctx.viaService('https://r1.com', undefined), e => e.kind === 'rate-limit');
  ctx.jina = 'body429'; ctx.ml = '429';
  await assert.rejects(ctx.viaService('https://r2.com', undefined), e => e.kind === 'rate-limit');
  ctx.jina = '429'; ctx.ml = 'fail';
  await assert.rejects(ctx.viaService('https://r3.com', undefined), e => e.kind === 'service', '하나라도 한도 초과가 아니면 일반 실패');
  ctx.jina = 'fail'; ctx.ml = 'erate';
  await assert.rejects(ctx.viaService('https://r4.com', undefined), e => e.kind === 'service');
  ctx.jina = 'net'; ctx.ml = 'net';
  await assert.rejects(ctx.viaService('https://r5.com', undefined), e => e.kind === 'network');
  ctx.jina = 'empty'; ctx.ml = 'fail';
  await assert.rejects(ctx.viaService('https://r6.com', undefined), e => e.kind === 'service');
  // 실패는 캐시하지 않는다
  ctx.jina = 'ok'; r = await ctx.viaService('https://r1.com', undefined);
  assert.equal(r.title, 'A & B');

  // 6) 직접 조회 성공 사이트는 외부 호출 0회, 실패 시에만 서비스 호출
  calls.length = 0; ctx.direct = 'ok';
  r = await ctx.generic('https://direct.com', undefined);
  assert.equal(r.title, '직접'); assert.equal(calls.length, 0, 'CORS 허용 사이트는 외부 서비스를 부르지 않는다');
  ctx.direct = 'fail'; ctx.jina = 'ok'; let notified = 0;
  r = await ctx.generic('https://blocked.com', undefined, () => { notified += 1; });
  assert.equal(r.title, 'A & B'); assert.equal(notified, 1); assert.equal(jinaCalls().length, 1); assert.equal(mlCalls().length, 0);

  // 7) 시간 초과
  const aborted = { aborted: true };
  await assert.rejects(ctx.generic('https://to.com', aborted), e => e.kind === 'timeout');

  // 8) 시간 제한 분리(#241): jina 단계만 시간 초과면 microlink 로 넘어가고, 둘 다면 시간 초과, 전체 중단이면 즉시 시간 초과
  calls.length = 0; ctx.jina = 'hang'; ctx.ml = 'ok';
  r = await ctx.viaService('https://hang1.com', undefined);
  assert.equal(r.title, '제목'); assert.equal(jinaCalls().length, 1); assert.equal(mlCalls().length, 1);
  ctx.jina = 'hang'; ctx.ml = 'hang';
  await assert.rejects(ctx.viaService('https://hang2.com', undefined), e => e.kind === 'timeout');
  calls.length = 0; ctx.jina = 'hang'; ctx.ml = 'ok';
  const parent = new AbortController(); setTimeout(() => parent.abort(), 5);
  await assert.rejects(ctx.viaService('https://hang3.com', parent.signal), e => e.kind === 'timeout');
  assert.equal(mlCalls().length, 0, '전체 중단이면 microlink 로 넘어가지 않는다');
  assert.match(html, /BOOKMARK_META_SERVICE_TIMEOUT_MS = \[25000, 20000\]/);
  assert.match(html, /BOOKMARK_META_TOTAL_TIMEOUT_MS = 35000/);
  assert.match(html, /최대 30초 정도 걸릴 수 있습니다/);
  assert.doesNotMatch(html, /12초 안에/);
  assert.match(ctx.describe(new ctx.Err('timeout')), /35초/);

  assert.match(ctx.describe(new ctx.Err('rate-limit')), /사용량 초과/);
  assert.match(ctx.describe(new ctx.Err('timeout')), /시간 초과/);
  console.log('bookmark meta service checks: OK');
})().catch(e => { console.error(e); process.exit(1); });
