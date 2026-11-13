const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13, 10)).join(String.fromCharCode(10));
// #256: PREVIEW 채팅 칸 폭(색 나눔 도구와 한 값 공유) + Roboto 웹 글꼴
assert.ok(html.includes('family=Roboto:ital,wght@0,400;0,700;1,400;1,700'));
assert.ok(html.includes("rootStyle.setProperty('--ccf-width', ccfWidthNow() + 'px');"));
assert.equal(html.split('class="ccf-width-input" type="number" min="200" max="600"').length - 1, 2);
assert.ok(html.includes('class="mcs-width" type="number" min="200" max="600"'));
assert.ok(html.includes("'italic bold 12px Roboto'") && html.includes('await ccfLoadFonts();'));
assert.ok(html.includes('.css-macro-preview-wrap:has(.roll20-chat) .ccf-width-label { display: none; }'));
const a = html.indexOf('function ccfWidthNow'), b = html.indexOf('function ccfLoadFonts');
const store = {};
const ctx = { CCFOLIA_PREVIEW: { contentWidth: 328 }, colorSplitLoadStore: () => store };
vm = require('node:vm'); vm.runInNewContext(html.slice(a, b) + '\nthis.w = ccfWidthNow;', ctx);
assert.equal(ctx.w(), 328); store.width = 271; assert.equal(ctx.w(), 271); store.width = 100; assert.equal(ctx.w(), 328); store.width = '600'; assert.equal(ctx.w(), 600);
console.log('ccf width roboto checks: OK');
