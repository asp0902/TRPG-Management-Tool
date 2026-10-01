const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');

assert.match(html, /\.rb-inline-note-popup \{[\s\S]*?width: max-content;[\s\S]*?max-width: min\(280px, calc\(100vw - 16px\)\);[\s\S]*?box-sizing: border-box;[\s\S]*?padding: 8px 12px;/);
assert.match(html, /function rbShowInlineMemoPopup\(noteEl\)[\s\S]*?popup\.innerHTML = noteHtml;[\s\S]*?rbPositionInlineMemoPopup\(noteEl, popup\)/);
assert.match(html, /\.rb-inline-note-editor \{[\s\S]*?width: 270px;[\s\S]*?padding: 10px;/);

console.log('rulebook inline memo preview spacing checks: OK');
