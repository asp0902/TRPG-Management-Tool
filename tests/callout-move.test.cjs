const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('TRPG 작업 관리 도구.html', 'utf8');
const moveBlock = html.match(/function moveBlock\(id, dir, cid = 'blocks-container'\) \{[\s\S]*?\n\}/)?.[0];
assert.ok(moveBlock, 'moveBlock must exist');
assert.match(html, /if \(target\.cid === 'blocks-container' && !target\.parent\) selectBlock\(b\.id\);/);

const blocks = [{ id: 'text', type: 'text' }, { id: 'callout', type: 'callout' }];
const calls = [];
const context = {
  getBlockArrayInfo(id) {
    const index = blocks.findIndex(block => block.id === id);
    return index < 0 ? null : { array: blocks, index, block: blocks[index], rootCid: 'blocks-container', rootBlocks: blocks };
  },
  normalizeBlockTree() {},
  commitBlockTreeChange: (...args) => calls.push(['commit', ...args]),
  renderRootBlocksByCid: cid => calls.push(['render', cid]),
  focusBlockAfterRender: id => calls.push(['focus', id]),
};
vm.createContext(context);
vm.runInContext(`${moveBlock}; this.run = moveBlock;`, context);
context.run('callout', 'up');

assert.deepEqual(blocks.map(block => block.id), ['callout', 'text']);
assert.deepEqual(calls.map(call => call[0]), ['commit', 'render', 'focus']);

console.log('callout move checks: OK');
