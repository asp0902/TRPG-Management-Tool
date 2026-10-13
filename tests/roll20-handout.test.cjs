const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');
const context = vm.createContext({});
for (const name of ['decodeCssMacroPreviewValue', 'normalizeCssMacroPreviewStyleText', 'tryParseCssMacroToken', 'buildRoll20HandoutHtml']) {
  vm.runInContext(html.match(new RegExp(`function ${name}\\([^]*?\\n\\}`))[0], context);
}
const macro = fs.readFileSync(path.join(__dirname, 'roll20-handout.fixture.txt'), 'utf8');
const { html: out, images } = context.buildRoll20HandoutHtml(macro);

assert.deepEqual(Array.from(images), [
  'https://i.imgur.com/aBnOCE4.png', 'https://i.imgur.com/8AoANzm.png', 'https://i.imgur.com/gbGv9gg.png', 'https://i.imgur.com/7PBP6ds.png',
]);
assert.deepEqual([...out.matchAll(/<img src="([^"]+)"/g)].map(m => m[1]), Array.from(images), '그림 4개가 순서대로 나와야 합니다.');
assert.match(out, /^<table bgcolor="#000000" width="476"/);
assert.match(out, /<td bgcolor="#000000" align="center"/);
assert.equal([...out.matchAll(/<span style="color:#e53935;">【사명】<\/span>/g)].length, 1, '【사명】만 #E53935 span 이어야 합니다.');
assert.equal((out.match(/<span/g) || []).length, 1, '그 밖의 span 은 없어야 합니다.');
assert.ok(!/>\.</.test(out), '스페이서 . 글자는 출력하지 않습니다.');
assert.match(out, /<p style="margin:[^"]*color:#009688; font-size:16px; font-weight:bold;">PC<\/p>/);
assert.match(out, /묘한 놀이공원에 오게 되었다\./);
assert.match(out, /당신은 GMPC와 함께 「나나헬 파크」라는<br>묘한 놀이공원에 오게 되었다\./, '같은 줄의 padding-top 0 블록은 <br> 로 묶습니다.');
assert.match(out, /손님은 우리뿐이고,<br>'7대 죄악'이 테마라고 하는 이 장소⋯⋯<br>기묘하다\./);
assert.match(out, /<p style="margin:5px 0 0;[^"]*">공개 정보<\/p>/);

// 허용 태그·스타일만, 위험한 입력은 이스케이프/제거
const tags = new Set([...out.matchAll(/<\/?([a-z0-9]+)/gi)].map(m => m[1].toLowerCase()));
assert.deepEqual([...tags].sort(), ['br', 'img', 'p', 'span', 'table', 'td', 'tr']);
assert.ok(!/javascript:|\son[a-z]+=|<script/i.test(out));

const evil = context.buildRoll20HandoutHtml('/desc [<script>alert(1)</script>](#" style="color:red; background-image:url(javascript:x); font-size:14px;")[x](javascript:alert(1))[y](https://e.com/a"onerror="x.png)').html;
assert.ok(!/<script|<img|background-image/i.test(evil) && !/<[^>]*\son[a-z]+=/i.test(evil) && !/<[^>]*javascript:/i.test(evil), evil);
assert.match(evil, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);

// 불러온 그림 폭: 표 폭 = 가장 넓은 그림, 그 폭 이상인 그림은 width 100%
const wide = context.buildRoll20HandoutHtml(macro, { 'https://i.imgur.com/aBnOCE4.png': 500, 'https://i.imgur.com/8AoANzm.png': 163 }).html;
assert.match(wide, /^<table bgcolor="#000000" width="500"/);
assert.match(wide, /<img src="https:\/\/i\.imgur\.com\/aBnOCE4\.png" width="500" style="display:block; width:100%;/);

assert.match(html, /async function copyRoll20HandoutHtml\(html\)[\s\S]*?new ClipboardItem\(\{ 'text\/html'[\s\S]*?execCommand\('copy'\)/);
assert.match(html, /async function copyRoll20Handout\(\)[\s\S]*?copyRoll20HandoutHtml\(/);
assert.match(html, /async function copyRoll20HandoutFromPreview\(button, event\)[\s\S]*?event\.preventDefault\(\);[\s\S]*?event\.stopPropagation\(\);[\s\S]*?copyRoll20HandoutHtml\(/);
assert.equal((html.match(/class="r20-copy-btn"/g) || []).length, 3, 'CSS 매크로 페이지·인트로·핸드아웃 PREVIEW 세 곳에 버튼이 있어야 합니다.');
assert.match(html, /\.css-macro-preview-wrap:has\(\.roll20-chat\) \.r20-copy-btn \{ display: inline-block; \}/);
assert.match(html, /id="r20ho-backdrop"/);
console.log('roll20 handout checks: OK');
