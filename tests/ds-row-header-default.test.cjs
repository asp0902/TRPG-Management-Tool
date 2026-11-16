const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13,10)).join(String.fromCharCode(10));
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok', m); };
const fn = html.slice(html.indexOf('function ds_normalizeRowHeaderWidth'), html.indexOf('function normalizeDataSheetEntry'));
ok(fn.includes('if (isNaN(w)) w = 32;'), '기본 폭 32');
ok(fn.includes('if (w < 24) w = 24;'), '최소 24 유지');
ok(html.includes('function ds_autoFitRowHeader(onlyGrow)') && html.includes("ds_autoFitRowHeader(true);"), '행 이름 모드 전환 시 폭만 키움');
console.log('fails=' + fails); process.exit(fails ? 1 : 0);
