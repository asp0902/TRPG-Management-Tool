const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');

// 수기 입력: min=15, oninput 은 자르지 않고 onchange 에서 교정(#175)
assert.match(html, /class="sh-coc-attr-input" type="number" min="' \+ COC7E_ATTR_MANUAL_MIN \+ '"/);
assert.match(html, /onchange="' \+ esc\(onchange\) \+ '"/);
assert.doesNotMatch(html, /oninput[^\n]*commitCocAttrMin/, 'oninput 에서 최소값을 적용하면 타이핑 중 값이 튄다');

const start = html.indexOf('const COC7E_ATTR_MANUAL_MIN');
const end = html.indexOf('function _updateCocAttrSubVals');
assert.ok(start > 0 && end > start);
const saved = [];
const ctx = {
  saveSheetField: (...args) => saved.push(args),
  _updateCocAttrSubVals: () => {},
  _updateAttrLevelDesc: () => {},
  _COC7E_STAT_ATTRS: [{ id: 'str', hasLevelDesc: true }],
};
vm.runInNewContext(`${html.slice(start, end)}\nthis.commit = commitCocAttrMin; this.rollMin = _cocStatRollMin;`, ctx);
const el = value => ({ value });
let e = el('5'); ctx.commit(e, 'c', 's', 'sec', 'str'); assert.equal(e.value, '15'); assert.equal(saved.at(-1)[4], 15);
e = el('14'); ctx.commit(e, 'c', 's', 'sec', 'str'); assert.equal(e.value, '15');
const n = saved.length;
for (const v of ['15', '50', '', '0']) { e = el(v); ctx.commit(e, 'c', 's', 'sec', 'str'); assert.equal(e.value, v); }
assert.equal(saved.length, n, '15 이상·빈 값·0 은 건드리지 않는다');
assert.equal(ctx.rollMin('str'), 15);
assert.equal(ctx.rollMin('siz'), 40);
assert.equal(ctx.rollMin('int'), 40);
assert.equal(ctx.rollMin('edu'), 40);
assert.match(html, /Math\.max\(_cocStatRollMin\(fieldId\), value\)/);
assert.match(html, /Math\.max\(_cocStatRollMin\(attr\.id\), value\)/);
console.log('coc attr min checks: OK');
