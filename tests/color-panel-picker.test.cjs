const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');

// 색상 패널 자체 선택기(#188)
assert.match(html, /<div id="cp-picker" class="cp-picker" hidden>/);
assert.match(html, /native\.addEventListener\('click', event => \{ event\.preventDefault\(\); cpTogglePicker\(\); \}\);/, '견본 클릭은 기본 색상 창 대신 선택기를 연다');
assert.match(html, /if \(cpPickerIsOpen\(\)\) cpTogglePicker\(false\); else closeColorPanel\(\);/, 'Esc 는 선택기부터 접는다');
assert.match(html, /function cpClampPanel\(\)/);
assert.match(html, /window\.EyeDropper/);

// 색 변환
const start = html.indexOf('function cpHexToRgb(hex)');
const end = html.indexOf('function cpPickerIsOpen()');
assert.ok(start > 0 && end > start);
const ctx = {};
vm.runInNewContext(`${html.slice(start, end)}\nthis.toRgb = cpHexToRgb; this.toHex = cpRgbToHex255; this.toHsv = cpRgbToHsv; this.fromHsv = cpHsvToHex;`, ctx);
for (const hex of ['#000000', '#ffffff', '#ff0000', '#3366cc', '#29cc29', '#808080', '#ffcc29']) {
  const rgb = ctx.toRgb(hex);
  const hsv = ctx.toHsv(rgb.r, rgb.g, rgb.b);
  assert.equal(ctx.fromHsv(hsv.h, hsv.s, hsv.v), hex, `HSV 왕복 ${hex}`);
  assert.equal(ctx.toHex(rgb.r, rgb.g, rgb.b), hex);
}
assert.equal(ctx.toRgb('red'), null);
console.log('color panel picker checks: OK');
