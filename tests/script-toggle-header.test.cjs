const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');

assert.match(html, /\.toggle-block-head \{[^}]*align-items: center;[^}]*margin-bottom: 2px;/s);
assert.match(html, /\.toggle-title-inp \{[^}]*min-height: 22px;[^}]*line-height: 22px;/s);
assert.match(html, /\.toggle-content-wrap \{[^}]*padding: 8px; margin-top: 10px;/s);
assert.match(html, /\.toggle-content-wrap > \.block-children-wrap > \.block:is\(\.block-branch, \.block-roll,[^{]*\) \{[^}]*width: calc\(100% - var\(--child-indent\)\);[^}]*margin-right: var\(--child-indent\);/s);
assert.doesNotMatch(html, /\.toggle-block-head\.open \.toggle-(?:title-inp|block-btn)\s*\{/);
assert.match(html, /function syncScriptToggleBlockUI\(blockEl, collapsed\)[\s\S]*?head\.classList\.toggle\('open', !collapsed\)[\s\S]*?content\.classList\.toggle\('collapsed', !!collapsed\)/);

console.log('script toggle header checks: OK');
