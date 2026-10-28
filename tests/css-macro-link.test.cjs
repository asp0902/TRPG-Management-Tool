const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');
const start = html.indexOf('function decodeCssMacroPreviewValue');
const end = html.indexOf('// 코코포리아 채팅(CCFOLIA');
assert.ok(start > 0 && end > start);
const ctx = {};
vm.runInNewContext(`${html.slice(start, end)}\nthis.parse = tryParseCssMacroToken;`, ctx);

const style = 'margin: 0px 7px 7px 7px; font-size:13px; border:2px dotted #fff';
const withHash = `[💿 pater noster(주님의 기도) 외 7곡 ▶ ](https://youtu.be/8nlnJDNaj78?si=abc#" style="${style})`;
const noHash = `[재생](https://youtu.be/abc" style="color:red;font-size:20px)`;
const plain = '[보통](#" style="color:red)';

let t = ctx.parse(withHash, 0);
assert.equal(t.href, 'https://youtu.be/8nlnJDNaj78?si=abc', '#" 로 끝나는 URL 의 # 는 href 에서 뺀다');
assert.equal(t.text, '💿 pater noster(주님의 기도) 외 7곡 ▶ ');
assert.match(t.style, /dotted/);
assert.equal(t.end, withHash.length);

t = ctx.parse(noHash, 0);
assert.equal(t.href, 'https://youtu.be/abc');
assert.equal(t.style, 'color:red;font-size:20px');

t = ctx.parse(plain, 0);
assert.equal(t.href, '', '기존 (#" style=) 형태는 href 가 없다');
assert.equal(t.style, 'color:red');

assert.equal(ctx.parse('[x](https://a.com/i.png)', 0), null, '이미지 링크는 토큰이 아니다');
assert.equal(ctx.parse('[x](https://a.com/i.png "t")', 0), null);
assert.equal(ctx.parse('[x](ftp://a.com" style="color:red)', 0), null, 'https?:// 만 허용');


// #174: URL 링크형 style 조각이 있으면 롤20, (#" style= 단독은 코코포리아
const r20 = html.match(/function isRoll20Macro\(raw\) \{[^]*?\n\}/);
assert.ok(r20, 'isRoll20Macro 를 찾지 못했습니다.');
const c2 = {};
vm.runInNewContext(r20[0] + '; this.is = isRoll20Macro;', c2);
assert.equal(c2.is(withHash), true);
assert.equal(c2.is(noHash), true);
assert.equal(c2.is(plain), false, '(#" style= 단독은 코코포리아 유지');
assert.equal(c2.is('[i](https://i.imgur.com/a.png)'), false);
assert.equal(c2.is(plain + ' [i](https://i.imgur.com/a.png)'), true);
assert.equal(c2.is('/em x'), true);
assert.match(html, /\.roll20-chat \{[^}]*padding-top: var\(--r20-top-pad\)/);
assert.match(html, /line\.replace\(\/\\\]\\\(\\s\*<\?https\?:\\\/\\\/\[\^\\s"\)\]\+"\/gi, '\]\(X"'\)/, '롤20 판별은 URL 링크형 토큰을 이미지 링크로 세지 않는다');
console.log('css macro link checks: OK');
