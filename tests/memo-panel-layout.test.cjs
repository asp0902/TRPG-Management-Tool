const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('TRPG 작업 관리 도구.html', 'utf8');

assert.match(html, /\.memo-panel-header > span \{ flex: 1; text-align: center; \}/);
assert.match(html, /#rb-memo-panel \{ padding-top: 0; \}/);
assert.match(html, /#rb-memo-panel \.memo-panel-header \{ font-size: 12px; padding-top: 10px; \}/);
assert.match(html, /\.memo-panel-add-btn \{[\s\S]*?background: none; color: #bbb;[\s\S]*?font-size: 16px;/);
assert.equal((html.match(/class="memo-panel-add-btn"[^>]*>＋<\/button>/g) || []).length, 2);
assert.match(html, /\.memo-item \{[\s\S]*?align-items: start;/);
assert.match(html, /\.memo-item-drag \{[\s\S]*?align-items: flex-start;[\s\S]*?font-size: 10px;[\s\S]*?padding: 4px 0 0;/);
assert.match(html, /\.memo-item-main \{[\s\S]*?align-items: flex-start;/);

console.log('memo panel layout checks: OK');
