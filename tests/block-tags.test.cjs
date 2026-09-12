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
