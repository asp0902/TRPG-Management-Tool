const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13,10)).join(String.fromCharCode(10));
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok', m); };
const fn = html.slice(html.indexOf('async function musicShowStorage'), html.indexOf('function musicSelectFolder'));
ok(fn.includes('음원은 이 기기와 Google Drive 에 저장됩니다') && fn.includes('음원은 이 기기와 GitHub 백업에 저장됩니다') && fn.includes('음원은 이 기기에만 저장됩니다'), '저장 위치 안내가 Drive·GitHub·기기 전용 상태에 따라 달라짐');
ok(fn.includes('이 기기 브라우저 저장소') && fn.includes('사용 가능 한도 약') && fn.includes('이 기기 디스크 여유 기준'), '용량 표시가 이 기기 브라우저 저장소 한도임을 명시');
console.log('fails=' + fails); process.exit(fails ? 1 : 0);
