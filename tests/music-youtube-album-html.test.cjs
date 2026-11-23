const fs = require('fs'), path = require('path'), vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13, 10)).join(String.fromCharCode(10));
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok', m); };
const cut = (a, b) => html.slice(html.indexOf(a), html.indexOf(b));
const code = cut('function musicParseYoutubeId', 'function musicPlayerHtml') + cut('function musicParseJinaMusic', 'function musicYtThumbFor');
const els = {}, mkEl = v => ({ value: v || '', dataset: {} });
const reset = () => { ['music-yt-url', 'music-yt-artist', 'music-yt-album'].forEach(id => els[id] = mkEl()); els['music-yt-url'].value = 'https://www.youtube.com/watch?v=RgBRkmf1n3Q'; els['music-yt-artist'].value = '채널명'; els['music-yt-artist'].dataset.auto = '채널명'; };
let calls = [], md = '', htmlText = null, htmlStatus = 200;
const ctx = {
  document: { getElementById: id => els[id] || null }, console, JSON,
  BOOKMARK_META_JINA_URL: 'https://r.jina.ai/', BOOKMARK_META_SERVICE_TIMEOUT_MS: [25000],
  bookmarkTimeoutSignal: () => ({ signal: undefined, clear() {} }),
  fetch: async (url, opt) => {
    const isHtml = !!(opt && opt.headers && opt.headers['X-Return-Format'] === 'html'); calls.push(isHtml ? 'html' : 'md');
    if (isHtml) { if (htmlText === null) throw new Error('network'); return { ok: htmlStatus === 200, status: htmlStatus, text: async () => htmlText }; }
    return { ok: true, status: 200, json: async () => ({ data: { content: md } }) };
  },
};
vm.createContext(ctx); vm.runInContext(code + ';this.f={musicParseJinaMusic,musicParseJinaHtml,musicFetchAlbumInfo}', ctx);
const glued = ['## Music 1 song', '', '[![Image 10](https://i.ytimg.com/a.jpg) # Farewell Threshold Laudanum (From "Henry May Long" Soundtrack) #### Max Richter Henry May Long (Original Motion Picture Soundtrack)](https://www.youtube.com/watch?v=ENoslPCB8ZA)', '', '## Video details'].join('\n');
const BS = String.fromCharCode(92), Q = String.fromCharCode(34);
const frag = '..."videoAttributeViewModel":{"title":"Farewell Threshold Laudanum (From ' + BS + Q + 'Henry May Long' + BS + Q + ' Soundtrack)","subtitle":"Max Richter","secondarySubtitle":{"content":"Henry May Long (Original Motion Picture Soundtrack)"}},"videoAttributeViewModel":{"title":"다른 곡"}';
(async () => {
  const f = ctx.f;
  const p = f.musicParseJinaHtml(frag);
  ok(p.artist === 'Max Richter' && p.album === 'Henry May Long (Original Motion Picture Soundtrack)', 'html 순수 파싱: 아티스트·앨범(첫 항목만)');
  ok(p.song === 'Farewell Threshold Laudanum (From "Henry May Long" Soundtrack)', '제목의 \\" 복원');
  ok(f.musicParseJinaHtml('"videoAttributeViewModel":{"title":"T","subtitle":"A"}').album === '', 'secondarySubtitle 없으면 앨범 없음');
  ok(f.musicParseJinaHtml('<html>없음</html>') === null, 'videoAttributeViewModel 없으면 null');
  // 붙은 한 줄 + html 폴백 성공
  reset(); md = glued; calls = []; htmlText = frag; await f.musicFetchAlbumInfo('RgBRkmf1n3Q');
  ok(calls.join() === 'md,html' && els['music-yt-artist'].value === 'Max Richter' && els['music-yt-album'].value === 'Henry May Long (Original Motion Picture Soundtrack)', '앨범 없을 때만 html 재요청 → 아티스트 Max Richter·앨범 채움');
  // 폴백 실패(네트워크 / HTTP 오류 / 구조 없음) → 붙은 문자열을 아티스트에 넣지 않음
  for (const [label, text, st] of [['네트워크 실패', null, 200], ['HTTP 오류', '', 500], ['구조 없음', '<html></html>', 200]]) {
    reset(); md = glued; calls = []; htmlText = text; htmlStatus = st; await f.musicFetchAlbumInfo('RgBRkmf1n3Q');
    ok(els['music-yt-artist'].value === '채널명' && els['music-yt-album'].value === '', 'html 폴백 ' + label + ' → 채널명 유지·붙은 문자열 미삽입');
  }
  htmlStatus = 200;
  // 기존 형식은 추가 요청 없이 동일 결과
  reset(); calls = []; md = '## Music 1 song\n# S\n#### Artist A\nAlbum A\n'; await f.musicFetchAlbumInfo('RgBRkmf1n3Q');
  ok(calls.join() === 'md' && els['music-yt-artist'].value === 'Artist A' && els['music-yt-album'].value === 'Album A', '#283 줄 나뉜 형식: 추가 요청 없음');
  reset(); calls = []; md = '## Music 1 song\n[![I](u) # The French Library #### Franz Gordon [The French Library](https://x)](u)\n'; await f.musicFetchAlbumInfo('RgBRkmf1n3Q');
  ok(calls.join() === 'md' && els['music-yt-artist'].value === 'Franz Gordon' && els['music-yt-album'].value === 'The French Library', '#322 한 줄+앨범 링크: 추가 요청 없음');
  // 사용자 입력 유지
  reset(); els['music-yt-artist'].value = '내 이름'; els['music-yt-album'].value = '내 앨범'; md = glued; calls = []; htmlText = frag; await f.musicFetchAlbumInfo('RgBRkmf1n3Q');
  ok(els['music-yt-artist'].value === '내 이름' && els['music-yt-album'].value === '내 앨범', '사용자 입력값 덮어쓰지 않음');
  process.exit(fails ? 1 : 0);
})();
