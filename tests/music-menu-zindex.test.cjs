const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');
let f = 0; const ok = (c, m) => { if (!c) { f++; console.log('FAIL', m); } else console.log('ok', m); };
ok(/\.music-modal-backdrop \{[^}]*z-index: 12500/.test(html), '곡 모달 12500');
ok(html.includes("backdrop.style.zIndex = 12600") && html.includes("menu.style.zIndex = 12700"), '관리 창 12600·우클릭 메뉴 12700(곡 모달 위)');
ok(html.includes("style.zIndex = '30000'"), '색상 패널 30000(관리 창 위)');
process.exit(f ? 1 : 0);
