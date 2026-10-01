const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');
const row = { dataset: { recordId: 'one' } };
let selected = false;
let opened;
const context = vm.createContext({
  selectRecordSidebarItem(id, options) { assert.equal(id, 'one'); assert.equal(options.expand, false); selected = true; },
  document: { querySelectorAll() { assert.ok(selected); return [row]; } },
  openRecordHoverPopup(id, anchor) { opened = anchor; },
});
vm.runInContext(html.match(/function openRecordPreview\([^]*?\n\}/)[0], context);
context.openRecordPreview('one');
assert.equal(opened, row, 'Preview must anchor to the row after re-render');
assert.ok(!html.includes('onmouseenter="openRecordHoverPopup'));
assert.ok(!html.includes("popup.addEventListener('mouseleave', () => scheduleHideRecordHoverPopup())"));
