const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');

assert.match(html, /select:not\(\.ct-select\) \{[\s\S]*?appearance: none;[\s\S]*?background-position: right 11px center;[\s\S]*?padding-right: 27px;/);
assert.match(html, /\.ct-select \{[\s\S]*?background-position: right 11px center; padding-right: 25px !important;/);
assert.match(html, /data-template-key="coc7e"\]\[data-section-id="weapons"\][^\n]*select \{ appearance: none;[^\n]*background-image: none;/);
assert.match(html, /\.sh-sheet-insane \[data-section-id="abilities"\] select\.sh-repeat-input \{[^}]*padding-right: 20px;[^}]*background-position: right 6px center;/);
assert.match(html, /\.sh-add-select \{ min-width: 110px; height: 30px;/);
assert.match(html, /select\.sh-field-input,[\s\S]*?\.sh-coc-misc-select \{ height: 32px; \}/);

console.log('select arrow spacing checks: OK');
