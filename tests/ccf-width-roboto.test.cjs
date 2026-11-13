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
assert.ok(html.includes('const CCF_USER_DEFAULT_WIDTH = 271;') && html.includes('contentWidth: 328,'));
// 초기화 블록(ccfWidthNow 호출)보다 먼저 선언돼야 한다(TDZ)
assert.ok(html.indexOf('const CCF_USER_DEFAULT_WIDTH') < html.indexOf("rootStyle.setProperty('--ccf-width'"));
const store = {};
const ls = {};
const ctx = { CCF_USER_DEFAULT_WIDTH: 271, CCFOLIA_PREVIEW: { contentWidth: 328 }, colorSplitLoadStore: () => store, colorSplitSaveStore: v => { Object.keys(store).forEach(k => delete store[k]); Object.assign(store, v); }, localStorage: { getItem: k => ls[k] || null, setItem: (k, v) => { ls[k] = v; } } };
vm = require('node:vm'); vm.runInNewContext(html.slice(a, b) + '\nthis.w = ccfWidthNow; this.mig = ccfMigrateWidth;', ctx);
assert.equal(ctx.w(), 271); store.width = 271; assert.equal(ctx.w(), 271); store.width = 100; assert.equal(ctx.w(), 271); store.width = '600'; assert.equal(ctx.w(), 600);
// 마이그레이션: 328 은 한 번만 271 로, 다른 값은 유지, 이후 사용자가 고른 328 은 유지
store.width = 328; ctx.mig(); assert.equal(store.width, 271); store.width = 328; ctx.mig(); assert.equal(store.width, 328);
for (const k in ls) delete ls[k]; store.width = 300; ctx.mig(); assert.equal(store.width, 300);
console.log('ccf width roboto checks: OK');
