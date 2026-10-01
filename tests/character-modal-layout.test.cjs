const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');

assert.match(html, /\.ch-modal-rule-row\s*>\s*\*\s*\{\s*min-width:\s*0;/);
assert.match(html, /<div class="ch-modal-rule-row" style="display:flex;gap:8px;align-items:center;">/);

console.log('character modal layout checks: OK');
