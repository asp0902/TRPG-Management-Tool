const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13,10)).join(String.fromCharCode(10));
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok', m); };
ok(html.includes("localStorage.setItem('trpg-music-debug', JSON.stringify(log.slice(-30)))"), '진단 로그는 localStorage 최근 30건');
ok(html.includes("musicDebug('musicStop'") && html.includes("musicDebug('openMusicDetail'") && html.includes("musicDebug('player removed'") && html.includes("'window ' + type") && html.includes("musicDebug('visibility'"), '플레이어 정지·상세 열기·플레이어 제거·창 포커스·가시성 기록');
ok(!/musicDebug\([^)]*(token|Token|key)/i.test(html.slice(html.indexOf('function musicDebug'), html.indexOf('function musicStop') + 200)), '진단 로그에 토큰·키를 남기지 않음');
console.log('fails=' + fails); process.exit(fails ? 1 : 0);
