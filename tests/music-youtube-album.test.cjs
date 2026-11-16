const fs = require('fs'), path = require('path'), vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13,10)).join(String.fromCharCode(10));
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok', m); };
const cut = (a, b) => html.slice(html.indexOf(a), html.indexOf(b));
ok(html.includes('id="music-yt-album" type="text"') && !html.includes('music-yt-album-status') && !html.includes('외부 조회 서비스 jina 로 전송됨'), '앨범 칸 유지·상태 요소·상태 문구 없음(#291)');
ok(html.includes("album: document.getElementById('music-yt-album').value.trim()"), '추가 시 album 저장');
const code = cut('function musicParseYoutubeId', 'function musicPlayerHtml') + cut('function musicParseJinaMusic', 'function musicYtThumbFor');
const els = {};
const mkEl = v => ({ value: v || '', textContent: '', dataset: {} });
const reset = () => { ['music-yt-url', 'music-yt-artist', 'music-yt-album'].forEach(id => els[id] = mkEl()); els['music-yt-url'].value = 'https://www.youtube.com/watch?v=BHS56JR54Zw'; };
let fetched = [], body = null, status = 200, onFetch = null;
const ctx = {
  document: { getElementById: id => els[id] || null }, console,
  BOOKMARK_META_JINA_URL: 'https://r.jina.ai/', BOOKMARK_META_SERVICE_TIMEOUT_MS: [25000],
  bookmarkTimeoutSignal: () => ({ signal: undefined, clear() {} }),
  fetch: async url => { fetched.push(url); if (onFetch) await onFetch(); return { ok: status === 200, status, json: async () => body }; },
};
vm.createContext(ctx); vm.runInContext(code + ';this.f={musicParseJinaMusic,musicFetchAlbumInfo}', ctx);
const md = '# Title\n\n## Music 1 song\n![Image 1](https://i.ytimg.com/x.jpg)\n# Ended with the Night\n#### Paul-Marie Barbier\nEnded with the Night\n[Music](https://www.youtube.com/channel/abc)\n';
(async () => {
  const f = ctx.f;
  let r = f.musicParseJinaMusic(md);
  ok(r.song === 'Ended with the Night' && r.artist === 'Paul-Marie Barbier' && r.album === 'Ended with the Night', 'markdown 예시 파싱');
  ok(JSON.stringify(f.musicParseJinaMusic('# 제목\n본문만')) === JSON.stringify({ song: '', artist: '', album: '' }), 'Music 구간 없으면 빈 값');
  ok(f.musicParseJinaMusic('## Music\r\n# S\r\n#### A\r\nAlb\r\n').album === 'Alb', 'CRLF 처리');
  ok(f.musicParseJinaMusic('## Music 1 song\n# S\n#### A\n[Music](x)\n').album === '', '앨범 줄 없으면 빈 앨범(링크 줄은 제외)');

  // 채움: 앨범 비어 있음, 아티스트는 자동값(채널명)이므로 교체
  reset(); els['music-yt-artist'].value = '채널명'; els['music-yt-artist'].dataset.auto = '채널명';
  body = { data: { content: md } }; fetched = [];
  await f.musicFetchAlbumInfo('BHS56JR54Zw');
  ok(fetched.length === 1 && fetched[0] === 'https://r.jina.ai/https://www.youtube.com/watch?v=BHS56JR54Zw', 'jina 요청 URL(mock)');
  ok(els['music-yt-album'].value === 'Ended with the Night' && els['music-yt-artist'].value === 'Paul-Marie Barbier', '앨범 채움·자동 아티스트 교체');

  // 사용자가 고친 아티스트·앨범은 유지
  reset(); els['music-yt-artist'].value = '내가 쓴 이름'; els['music-yt-artist'].dataset.auto = '채널명'; els['music-yt-album'].value = '내 앨범';
  await f.musicFetchAlbumInfo('BHS56JR54Zw');
  ok(els['music-yt-artist'].value === '내가 쓴 이름' && els['music-yt-album'].value === '내 앨범', '사용자 입력값 유지');

  // 음악 정보 없음 / 실패
  reset(); body = { data: { content: '# 본문만' } }; await f.musicFetchAlbumInfo('BHS56JR54Zw');
  ok(els['music-yt-album'].value === '', '음악 정보 없음 → 채우지 않음(문구 없음)');
  reset(); status = 500; await f.musicFetchAlbumInfo('BHS56JR54Zw');
  ok(els['music-yt-album'].value === '' && els['music-yt-artist'].value === '', '실패 시 조용히 끝(채우지 않음)'); status = 200;

  // 늦은 응답 무시: 응답 전에 URL 이 바뀜 / 모달이 닫힘
  reset(); body = { data: { content: md } };
  onFetch = async () => { els['music-yt-url'].value = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'; };
  await f.musicFetchAlbumInfo('BHS56JR54Zw');
  ok(els['music-yt-album'].value === '', 'URL 바뀐 뒤 늦은 응답 무시');
  reset(); onFetch = async () => { for (const k of Object.keys(els)) delete els[k]; };
  await f.musicFetchAlbumInfo('BHS56JR54Zw').catch(() => { fails++; console.log('FAIL 닫힌 모달에서 예외'); });
  ok(true, '모달 닫힌 뒤 늦은 응답 무시(예외 없음)');
  console.log('fails=' + fails); process.exit(fails ? 1 : 0);
})();
