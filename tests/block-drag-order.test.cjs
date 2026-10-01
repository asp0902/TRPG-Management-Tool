const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');
const extract = name => {
  const start = html.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} 함수를 찾을 수 없습니다.`);
  let depth = 0, opened = false;
  for (let i = html.indexOf('{', start); i < html.length; i += 1) {
    if (html[i] === '{') { depth += 1; opened = true; }
    if (html[i] === '}') depth -= 1;
    if (opened && depth === 0) return html.slice(start, i + 1);
  }
  throw new Error(`${name} 함수 범위를 찾을 수 없습니다.`);
};

const blocks = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
let savedOrder = null;
const context = {
  getBlockArrayInfo(id) {
    const index = blocks.findIndex(block => block.id === id);
    return index < 0 ? null : { block: blocks[index], array: blocks, index, rootBlocks: blocks, rootCid: 'blocks-container' };
  },
  normalizeBlockTree() {},
  getBlockListByTargetKey() { return null; },
  makeChildBlockTargetKey() { return ''; },
  isDescendantBlockId() { return false; },
  commitBlockTreeChange() { savedOrder = blocks.map(block => block.id); },
};
vm.createContext(context);
vm.runInContext(extract('moveBlockDataToPointerDrop'), context);

const before = blocks.map(block => block.id);
const result = context.moveBlockDataToPointerDrop('a', 'blocks-container', {
  kind: 'block', targetId: 'b', targetCid: 'blocks-container', position: 'after',
});
assert.deepEqual(before, ['a', 'b', 'c']);
assert.deepEqual(blocks.map(block => block.id), ['b', 'a', 'c']);
assert.deepEqual(savedOrder, ['b', 'a', 'c']);
assert.equal(result.rootCid, 'blocks-container');
assert.equal(result.movedId, 'a');

const dragEnd = extract('handleBlockPointerDragEnd');
const commitAt = dragEnd.indexOf('moveBlockDataToPointerDrop');
assert.ok(commitAt < dragEnd.indexOf('renderRootBlocksByCid', commitAt));
assert.ok(dragEnd.indexOf('renderRootBlocksByCid', commitAt) < dragEnd.indexOf('cleanupBlockPointerDragState', commitAt));
assert.doesNotMatch(dragEnd, /setTimeout/);

console.log('block drag order checks: OK');
