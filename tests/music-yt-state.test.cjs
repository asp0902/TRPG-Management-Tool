const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13,10)).join(String.fromCharCode(10));
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok', m); };
ok(html.includes("rel=0&enablejsapi=1&origin=' + encodeURIComponent(") && !html.includes('loop=1&playlist='), '유튜브 iframe 에 상태 수신(enablejsapi·origin), playlist 방식 반복 제거(#318)');
ok(html.includes('id="music-yt-state">유튜브: 불러오는 중…</div>') && html.includes("musicYtShow('유튜브: ' + (MUSIC_YT_STATES[state] || state))"), '플레이어 아래 상태 표시(재생 중·일시정지·종료 등)');
ok(html.includes("musicYtShow('유튜브 오류 ' + data.info") && html.includes('153: ') && html.includes('150: '), '오류 코드 표시');
ok(html.includes('state === 2 && !musicYtWatch.retried && Date.now() - musicYtWatch.openedAt < 8000') && html.includes("state === -1 && musicYtWatch.played && musicYtWatch.resets < 2") && html.includes("musicYtCommand('playVideo')"), '시작 직후 저절로 멈추거나 재생 중 「시작 전」으로 돌아가면 다시 재생(횟수 제한)');
ok(html.includes("if (state === 0) { musicYtCommand('seekTo', [0, true]);"), '반복 재생: 영상이 끝나면 처음부터 다시 재생')
ok(html.includes("event.origin !== 'https://www.youtube.com'"), '유튜브가 보낸 메시지만 처리');
console.log('fails=' + fails); process.exit(fails ? 1 : 0);
