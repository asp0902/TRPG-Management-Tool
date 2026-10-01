const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');
const extract = name => html.match(new RegExp(`function ${name}\\([^]*?\\n\\}`))[0];
let stored = null;
const context = {
  currentRulebookId: 'book', currentChapterId: 'chapter', currentRulebookTocId: 'anchor',
  state: { rulebooks: [{ id: 'book' }] }, console,
  localStorage: { getItem: () => stored, setItem: (key, value) => { stored = value; }, removeItem: () => { stored = null; } },
  normalizeRbChapterEntries: () => [{ id: 'anchor' }],
  openRulebookDetail: id => { context.currentRulebookId = id; },
  rbSelectChapter: id => { context.currentRulebookTocId = id; },
};
vm.createContext(context);
vm.runInContext(extract('saveRulebookEditor') + '\n' + extract('restoreRulebookEditor'), context);
context.saveRulebookEditor();
context.currentRulebookId = null;
context.currentRulebookTocId = null;
context.restoreRulebookEditor();
assert.equal(context.currentRulebookId, 'book');
assert.equal(context.currentRulebookTocId, 'anchor');
context.currentRulebookId = null;
context.state.rulebooks = [];
context.restoreRulebookEditor();
assert.equal(stored, null);
