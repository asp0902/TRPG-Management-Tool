const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13,10)).join(String.fromCharCode(10));
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok', m); };
const fn = html.slice(html.indexOf('async function openMusicDetail'), html.indexOf('function musicEditField'));
ok(fn.indexOf("const src = track.kind === 'file' ?") < fn.indexOf("src === 'file' && musicCanDownload()"), '파일을 받는 것은 파일 소스를 고른 때만(유튜브 재생 중에는 받기·로그인 창 없음)');
ok(fn.includes('파일 받기</button>'), 'Blob 이 없으면 「파일 받기」 버튼으로 받음');
ok(html.includes("if (!interactive) return ''; // 자동 동작(시작·동기화)은 로그인 창을 열지 않는다"), '자동 동작은 구글 로그인 창을 열지 않음');
ok(html.includes('.music-audio-player { width: 100%; box-sizing: border-box; display: flex; align-items: center; gap: 10px; padding: 12px 16px; background: #000;') && !html.includes('<audio class="music-audio" controls'), '파일 재생 플레이어: 기본 컨트롤 대신 순수 검정(#000) 커스텀 플레이어(#316)');
console.log('fails=' + fails); process.exit(fails ? 1 : 0);
