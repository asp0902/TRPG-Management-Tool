const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');
const extract = name => html.match(new RegExp(`function ${name}\\([^]*?\\n\\}`))[0];
const entry = { id: 'toc', title: 'Before', targetBlockId: 'block' };
let menu, saved = 0;
const context = {
  curRb: () => ({}), normalizeRbChapterEntries: () => [entry],
  rbGetPreviousVisibleParentCandidate: () => null,
  tbShowCtxMenu: (x, y, items) => { menu = items; },
  prompt: () => ' After ', commitRulebookHistory: () => {},
  persist: () => saved++, renderRbChapterList: () => {},
};
vm.createContext(context);
vm.runInContext(extract('rbRenameChapterPrompt') + '\n' + extract('rbOpenChapterCtxMenu'), context);
context.rbOpenChapterCtxMenu({ preventDefault() {}, stopPropagation() {} }, 'toc');
menu.find(item => item.label === '이름 변경').action();
assert.equal(entry.title, 'After');
assert.equal(entry.targetBlockId, 'block');
assert.equal(saved, 1);
context.prompt = () => null;
context.rbRenameChapterPrompt('toc');
assert.equal(saved, 1);
