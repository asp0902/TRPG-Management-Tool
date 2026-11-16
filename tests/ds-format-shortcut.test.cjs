const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13,10)).join(String.fromCharCode(10));
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok', m); };
const i = html.indexOf("e.target.closest('#ds-editor-body') && ['b', 'i', '`', 'u']");
ok(i > 0, '데이터 시트 서식 단축키 분기');
ok(i < html.indexOf('if (!lastFocusedTA) return;', i - 400), 'lastFocusedTA 검사보다 앞');
ok(html.slice(i, i + 400).includes("ds_toggleCellStyle(key === 'b' ? 'b' : key === 'i' ? 'i' : 's')"), 'b/i/` → ds_toggleCellStyle');
ok(html.slice(i - 80, i).includes('!e.shiftKey && !e.altKey'), 'Shift·Alt 없을 때만');
console.log('fails=' + fails); process.exit(fails ? 1 : 0);
