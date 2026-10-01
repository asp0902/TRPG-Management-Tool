const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');

assert.match(html, /\.sh-coc-wealth-currency-cell \{[^}]*grid-template-columns: 1\.25em minmax\(0, 1fr\);/);
assert.match(html, /\.sh-coc-wealth-currency-value \{[^}]*display: inline-flex;[^}]*justify-content: center;[^}]*max-width: 100%;[^}]*white-space: nowrap;/);
assert.match(html, /\.sh-coc-wealth-value-cell \{[^}]*padding-inline: 4px;/);
assert.match(html, /\.sh-coc-wealth-assets-usd,[\s\S]*?\.sh-coc-wealth-assets-jpy \{ font-size: 11px; \}/);

console.log('CoC wealth alignment checks: OK');
