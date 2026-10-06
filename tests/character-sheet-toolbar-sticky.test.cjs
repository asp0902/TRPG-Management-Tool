const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');

assert.match(html, /\.sh-tabs-wrap \{[^}]*position: sticky;[^}]*top: 0;[^}]*z-index: 30;/);
assert.match(html, /\.sh-tabs-wrap \{[^}]*flex-wrap: wrap;[^}]*flex-shrink: 0;[^}]*background: (?:#fff|var\(--k-[a-z]+-ffffff[a-z-]*\));/);
assert.match(html, /\.ch-sheet-body \{[^}]*overflow-y: auto;/);
assert.match(html, /\.ch-sheet-modal\.sheet-wide-coc7e \.ch-sheet-body \{[^}]*padding-top: 8px;/);
assert.match(html, /class="sh-tabs-wrap">' \+ addSelect \+ popupBtn \+ duplicateBtn \+ moveButtons/);

console.log('character sheet sticky toolbar checks: OK');
