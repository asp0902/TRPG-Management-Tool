const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');
let f = 0; const ok = (c, m) => { if (!c) { f++; console.log('FAIL', m); } else console.log('ok', m); };
ok(/\.tb-bullet-presets \{ display: grid; grid-template-columns: repeat\(4, minmax\(0, 1fr\)\); gap: 5px; max-height: 145px; overflow-y: auto;/.test(html), '글머리 기호 4열·gap 5px·max-height 145px·스크롤');
ok(/\.tb-bullet-preset \{ height: 32px;/.test(html), '기호 칸 높이 32px');
ok(/\.tb-bullet-menu \{ width: 204px;/.test(html), '메뉴 폭 204px 유지');
process.exit(f ? 1 : 0);
