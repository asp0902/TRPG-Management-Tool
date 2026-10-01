const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');
const commands = [];
const range = { collapsed: false };
const selection = { rangeCount: 1, isCollapsed: false, getRangeAt: () => range, removeAllRanges() {}, addRange() {} };
const context = {
  lastFocusedTA: { contentEditable: 'true', focus() {}, dispatchEvent() {} },
  window: { getSelection: () => selection }, Event: class {},
  tbCleanCEContainerStyle() {}, _savedFormatSel: null,
  document: { execCommand: command => commands.push(command), createElement() { throw Error('Must not wrap paragraphs'); } },
};
vm.createContext(context);
vm.runInContext(html.match(/function tbApplyCEInlineStyle\([^]*?\n\}/)[0], context);
assert.equal(context.tbApplyCEInlineStyle('fontStyle', 'italic'), true);
assert.equal(context.tbApplyCEInlineStyle('fontStyle', 'italic'), true);
assert.deepEqual(commands, ['italic', 'italic']);
