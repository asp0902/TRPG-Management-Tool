const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');
const first = { nodeType: 3, nodeName: '#text' };
const second = { nodeType: 1, nodeName: 'DIV', style: {}, matches: () => true };
let wrapper, saved = false;
const ce = { contentEditable: 'true', childNodes: [first, second], contains: () => true,
  querySelectorAll: () => [second], insertBefore: node => { wrapper = node; },
  dispatchEvent: () => { saved = true; }, closest: () => ce };
first.parentElement = ce;
const range = { startContainer: first, endContainer: first, intersectsNode: () => true };
const context = { lastFocusedTA: ce, Node: { TEXT_NODE: 3, ELEMENT_NODE: 1 }, Event: class {},
  window: { getSelection: () => ({ rangeCount: 1, getRangeAt: () => range }) },
  document: { createElement: () => ({ style: {}, appendChild() {} }) } };
vm.createContext(context);
vm.runInContext(html.match(/function tbAlignCE\([^]*?\n\}/)[0], context);
context.tbAlignCE('center');
assert.equal(wrapper.style.textAlign, 'center');
assert.equal(second.style.textAlign, 'center');
assert.ok(saved);
