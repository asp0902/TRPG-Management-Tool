const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');
const render = html.match(/function renderBlockTags\(container, cid\) \{[\s\S]*?\n\}/)[0];
const markers = [];
const target = { classList: { add() {} }, appendChild: el => markers.push(el) };
const container = { querySelectorAll: () => [], querySelector: () => target };
const ref = { blockId: 'one', cid: 'rb-blocks-container', chapterId: 'chapter-one' };
let edited;
const context = {
  container, currentChapterId: 'chapter-one', CSS: { escape: String },
  getMemoOwner: () => ({ blockTags: {
    one: { name: '<b>Important</b>', color: '#2563eb', blockRef: ref },
    otherChapter: { name: 'Hidden', blockRef: { ...ref, chapterId: 'chapter-two' } },
    otherPage: { name: 'Hidden', blockRef: { ...ref, cid: 'blocks-container' } },
  } }),
  document: { createElement: () => ({ style: {}, setAttribute(name, value) { this[name] = value; } }) },
  openBlockTagEditor: value => { edited = value; },
};
vm.runInNewContext(`${render}; renderBlockTags(container, 'rb-blocks-container');`, context);
assert.equal(markers.length, 1, 'Only the current page and chapter should display tags');
assert.equal(markers[0].title, '<b>Important</b>');
assert.ok(!markers[0].innerHTML.includes('Important'), 'Tag names must not be rendered as HTML');
assert.equal(markers[0].style.color, '#2563eb');
markers[0].onclick({ stopPropagation() {} });
assert.equal(edited, ref, 'Clicking a tag must edit the same block');
console.log('block tag checks: OK');
const picker = html.match(/function openBlockTagColorPicker\(input\) \{[\s\S]*?\n\}/)[0];
const colorForm = { elements: { color: {}, hex: {} } };
const cancel = {};
const colorDialog = {
  setAttribute() {}, showModal() {}, close() { this.onclose(); }, remove() {},
  querySelector: selector => selector === 'form' ? colorForm : selector === '[data-cancel]' ? cancel : { appendChild() {} },
};
const colorInput = { value: '#123456' };
vm.runInNewContext(`${picker}; openBlockTagColorPicker(input);`, {
  input: colorInput, CP_PRESETS: [], getRecentBlockTagColors: () => [],
  document: { createElement: () => colorDialog, body: { appendChild() {} } },
});
colorForm.elements.color.value = '#abcdef';
colorForm.elements.color.oninput();
assert.equal(colorInput.value, '#123456', 'Draft must not change the tag color');
cancel.onclick();
assert.equal(colorInput.value, '#123456', 'Cancel preserves the original color');
colorForm.elements.hex.value = 'invalid';
colorForm.onsubmit({ preventDefault() {} });
assert.equal(colorInput.value, '#123456', 'Invalid colors must not commit');
colorForm.elements.hex.value = '#abcdef';
colorForm.onsubmit({ preventDefault() {} });
assert.equal(colorInput.value, '#abcdef', 'Confirm commits the chosen color');
const recentColorsFunction = html.match(/function getRecentBlockTagColors\(color\) \{[\s\S]*?\n\}/)[0];
let storedColors = JSON.stringify(['#ABCDEF', '#abcdef', 'invalid', '#123456']);
const recentContext = { localStorage: {
  getItem: () => storedColors,
  setItem: (_key, value) => { storedColors = value; },
} };
vm.createContext(recentContext);
vm.runInContext(recentColorsFunction, recentContext);
assert.deepEqual(Array.from(vm.runInContext("getRecentBlockTagColors('#123456')", recentContext)), ['#123456', '#abcdef']);
assert.deepEqual(JSON.parse(storedColors), ['#123456', '#abcdef']);
storedColors = '{invalid json';
assert.equal(vm.runInContext('getRecentBlockTagColors().length', recentContext), 0);
storedColors = JSON.stringify(Array.from({ length: 20 }, (_, i) => '#' + i.toString(16).padStart(6, '0')));
assert.equal(vm.runInContext('getRecentBlockTagColors().length', recentContext), 12);
