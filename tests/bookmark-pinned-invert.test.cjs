const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13,10)).join(String.fromCharCode(10));
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok', m); };
ok(html.includes('.bookmark-card.pinned { border-color: #1a1a1a; background: #1a1a1a; }'), '고정 카드 어두운 배경');
[
  '.bookmark-card.pinned .bookmark-card-title { color: #fff; }',
  '.bookmark-card.pinned .bookmark-card-url { color: #8a8a8a; }',
  '.bookmark-card.pinned .bookmark-card-notes { color: #d0d0d0; }',
  '.bookmark-card.pinned .bookmark-thumb-placeholder { background: #2a2a2a; }',
  '.bookmark-card.pinned .bookmark-card-btn { background: #2a2a2a; color: #e5e5e5; border-color: #3a3a3a; }',
  '.bookmark-card.pinned .bookmark-card-btn:hover { background: #333; color: #fff; }',
  '.bookmark-card.pinned .bookmark-card-btn.del:hover { background: #3a1f1f; color: #ef4444; border-color: #ef4444; }',
].forEach(r => ok(html.includes(r), r.split('{')[0].trim()));
ok(html.includes('.bookmark-pin-btn[aria-pressed="true"] { opacity: 1; color: #ef4444; background: #fff;'), '압정 빨강 유지');
console.log('fails=' + fails); process.exit(fails ? 1 : 0);
