const fs = require('fs'), path = require('path'), vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13,10)).join(String.fromCharCode(10));
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok', m); };
const cut = (a, b) => html.slice(html.indexOf(a), html.indexOf(b));
ok(html.includes('onchange="musicFetchYoutube(true)" onkeydown="musicYtKey(event)"'), 'URL 칸 onkeydown/onchange');
ok(html.includes('<img id="music-yt-thumb" class="music-yt-thumb" alt="" hidden'), '미리보기 img');
ok(html.includes('.music-yt-thumb { width: 100%; max-height: 180px; object-fit: cover; border-radius: 8px; }'), 'CSS');
const code = cut('function musicParseYoutubeId', 'function musicPlayerHtml') + cut('let musicYtLastId', 'function openMusicYoutubeModal') + cut('// URL 아래 상태 줄', 'async function musicFetchYoutube') + cut('async function musicFetchYoutube', 'function musicYtThumbFor') + cut('function musicYtThumbFor', 'function musicAddYoutube');
const els = {};
const mkEl = () => ({ value: '', textContent: '', hidden: true, dataset: {}, src: '', attrs: {}, setAttribute(k, v) { this.attrs[k] = v; }, getAttribute(k) { return k === 'src' ? this.src : this.attrs[k]; } });
['music-yt-url', 'music-yt-title', 'music-yt-artist', 'music-yt-status', 'music-yt-error', 'music-yt-thumb'].forEach(id => els[id] = mkEl()); els['music-yt-status'].hidden = true;
let calls = 0, oembedOk = true;
const ctx = { BOOKMARK_META_JINA_URL: 'https://r.jina.ai/', BOOKMARK_META_SERVICE_TIMEOUT_MS: [25000], bookmarkTimeoutSignal: () => ({ signal: undefined, clear() {} }), document: { getElementById: id => els[id] }, encodeURIComponent, fetch: async url => { if (!/oembed/.test(url)) return { ok: false, status: 500, json: async () => ({}) }; calls++; if (!oembedOk) throw new Error('mock fail'); return { ok: true, json: async () => ({ title: 'T', author_name: 'A', thumbnail_url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mock.jpg' }) }; }, console };
vm.createContext(ctx); vm.runInContext(code + ';this.f={musicFetchYoutube,musicYtKey,musicYtThumbFor,reset(){musicYtLastId=""}}', ctx);
(async () => {
  const f = ctx.f;
  els['music-yt-url'].value = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
  // 키: 조합 중 Enter 는 무시
  let prevented = false;
  f.musicYtKey({ key: 'Enter', isComposing: true, keyCode: 229, preventDefault() { prevented = true; } });
  ok(!prevented && calls === 0, '조합 중 Enter 무시');
  // Enter → 조회, 이어진 change(auto) 는 중복 호출 안 함
  f.musicYtKey({ key: 'Enter', isComposing: false, keyCode: 13, preventDefault() { prevented = true; } });
  await new Promise(r => setTimeout(r, 20));
  ok(prevented && calls === 1, 'Enter 로 조회 1회');
  await f.musicFetchYoutube(true);
  ok(calls === 1, '같은 URL change 중복 방지');
  ok(els['music-yt-thumb'].hidden === false && els['music-yt-thumb'].src.endsWith('mock.jpg'), 'oEmbed thumbnail_url 표시');
  ok(els['music-yt-title'].value === 'T' && els['music-yt-artist'].value === 'A', '제목·아티스트 채움');
  ok(f.musicYtThumbFor('dQw4w9WgXcQ').endsWith('mock.jpg'), '추가 시 표시한 썸네일 저장');
  await f.musicFetchYoutube(); ok(calls === 2, '수동 버튼은 다시 조회');
  // oEmbed 실패해도 id 기반 썸네일
  f.reset(); oembedOk = false; els['music-yt-thumb'].hidden = true; els['music-yt-thumb'].src = '';
  await f.musicFetchYoutube(true);
  ok(els['music-yt-thumb'].hidden === false && els['music-yt-thumb'].src === 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg', 'oEmbed 실패 시 hqdefault 표시');
  // 잘못된 URL
  els['music-yt-url'].value = 'nope'; await f.musicFetchYoutube(true);
  ok(els['music-yt-thumb'].hidden === true && els['music-yt-error'].textContent.includes('알아볼 수 없습니다'), '잘못된 URL 은 오류·썸네일 숨김');
  ok(f.musicYtThumbFor('abc') === 'https://i.ytimg.com/vi/abc/hqdefault.jpg', '썸네일 없으면 기존 hqdefault');
  // 상태 줄(#303): 불러오는 중 → 완료 / 실패, 실패 후 같은 주소 Enter 재시도 가능, 잘못된 주소는 숨김
  { const st = els['music-yt-status']; f.reset(); oembedOk = true; els['music-yt-url'].value = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    const seen = []; const orig = Object.getOwnPropertyDescriptor(st, 'textContent');
    let cur = ''; Object.defineProperty(st, 'textContent', { get: () => cur, set: v => { cur = v; seen.push(st.dataset.state + ':' + v); }, configurable: true });
    const p = f.musicFetchYoutube(true); await p;
    ok(seen[0] === 'loading:불러오는 중…' && seen[seen.length - 1] === 'done:불러오기 완료' && st.hidden === false, '상태 줄: 불러오는 중… → 불러오기 완료');
    seen.length = 0; f.reset(); oembedOk = false; await f.musicFetchYoutube(true);
    ok(seen[0] === 'loading:불러오는 중…' && /^error:제목을 불러오지 못했습니다/.test(seen[seen.length - 1]), '실패하면 오류 문구');
    calls = 0; oembedOk = true; await f.musicFetchYoutube(true); ok(calls === 1, '실패한 주소는 Enter 로 다시 시도할 수 있음');
    els['music-yt-url'].value = 'nope'; await f.musicFetchYoutube(true); ok(st.hidden === true, '잘못된 주소는 상태 줄 숨김'); }
  console.log('fails=' + fails); process.exit(fails ? 1 : 0);
})();
