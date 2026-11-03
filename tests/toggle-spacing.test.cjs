const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');

// 토글 블록 머리·내용 여백 정리(#190)
assert.match(html, /\.toggle-block-head \{[^}]*margin-bottom: 0;/);
assert.match(html, /\.toggle-block-icon \{\s*font-size: 12px;\s*line-height: 1;/);
assert.match(html, /\.toggle-content-wrap \{\s*background: #f9f9f9; border-radius: 4px; padding: 6px 8px; margin-top: 6px;/);
assert.match(html, /\.toggle-content-wrap > \.block-children-wrap \{\s*--child-indent: 6px;\s*margin-top: 0;/);
console.log('toggle spacing checks: OK');
