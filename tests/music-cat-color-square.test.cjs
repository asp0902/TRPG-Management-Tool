const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13,10)).join(String.fromCharCode(10));
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok', m); };
const sel = '.music-modal .music-cat-row input[type="color"]';
ok(html.includes(sel + ' { width: 28px; height: 28px; flex: none; box-sizing: border-box; padding: 0; border: 1px solid #ddd; border-radius: 6px; background: #fff;'), '바깥 28×28 흰 배경·#ddd 테두리·border-box(#310)');
ok(html.includes(sel + '::-webkit-color-swatch-wrapper { padding: 4px; }'), 'swatch-wrapper padding 4px → 안쪽 18×18');
ok(html.includes(sel + '::-webkit-color-swatch { border: 1px solid rgba(0,0,0,.15); border-radius: 3px; }') && html.includes(sel + '::-moz-color-swatch { border: 1px solid rgba(0,0,0,.15); border-radius: 3px; }'), 'swatch 테두리 rgba(0,0,0,.15)·radius 3px(webkit·moz)');
console.log('fails=' + fails); process.exit(fails ? 1 : 0);
