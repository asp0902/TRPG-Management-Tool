const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13,10)).join(String.fromCharCode(10));
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok', m); };
ok(html.includes('.bookmark-grid-break { grid-column: 1 / -1; height: 0; }'), 'CSS 구분 요소');
ok(html.includes("(i && !bookmark.pinned && pinnedFirst[i - 1].pinned ? '<div class=\"bookmark-grid-break\" aria-hidden=\"true\"></div>' : '')"), '고정→비고정 경계에서만 삽입');
console.log('fails=' + fails); process.exit(fails ? 1 : 0);
