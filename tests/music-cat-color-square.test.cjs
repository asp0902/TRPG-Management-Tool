const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13,10)).join(String.fromCharCode(10));
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok', m); };
const sel = '.music-modal .music-cat-row input[type="color"]';
ok(html.includes(sel + ' { width: 28px; height: 28px; flex: none; box-sizing: border-box; padding: 0;'), '28×28·flex none·border-box(.music-modal 로 우선순위 상향)');
ok(html.includes(sel + '::-webkit-color-swatch-wrapper { padding: 0; }'), 'swatch-wrapper padding 0');
ok(html.includes(sel + '::-webkit-color-swatch { border: none; border-radius: 5px; }') && html.includes(sel + '::-moz-color-swatch { border: none; border-radius: 5px; }'), 'swatch border none·radius 5px(webkit·moz)');
console.log('fails=' + fails); process.exit(fails ? 1 : 0);
