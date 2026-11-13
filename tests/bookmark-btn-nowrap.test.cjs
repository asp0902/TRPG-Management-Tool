const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split('\r\n').join('\n');
// 북마크 버튼은 한 줄 유지(#240)
assert.match(html, /\.bookmark-card-btn \{\n  white-space: nowrap;\n  flex-shrink: 0;/);
assert.match(html, /\.bookmark-tag-suggestion \{\n  border: none;[\s\S]*?white-space: nowrap;/);
assert.match(html, /\.bookmark-card-footer \{\n  display: flex;\n  justify-content: flex-end;\n  gap: 4px;\n  padding: 0 10px 12px;/);
console.log('bookmark btn nowrap checks: OK');
