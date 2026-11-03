const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');

// 토글 블록 머리·내용 여백 정리(#190)
assert.match(html, /\.toggle-block-head \{[^}]*margin-bottom: 0;/);
assert.match(html, /\.toggle-block-icon \{\s*font-size: 12px;\s*line-height: 1;/);
assert.match(html, /\.toggle-content-wrap \{\s*background: #f9f9f9; border-radius: 4px; padding: 6px 8px; margin-top: 6px;/);
assert.match(html, /\.toggle-content-wrap > \.block-children-wrap \{\s*--child-indent: 6px;\s*margin-top: 0;/);
// 펼친 토글은 머리와 내용 칸이 하나의 회색 상자, 빈 내용은 한 줄 높이(#190 재작업)
assert.match(html, /\.toggle-block-head\.open \{\s*background: #f9f9f9; border-radius: 4px 4px 0 0; padding: 4px 8px 2px;/);
assert.match(html, /\.toggle-block-head\.open \+ \.toggle-content-wrap \{\s*margin-top: 0; border-radius: 0 0 4px 4px; padding: 0 8px 4px;/);
assert.match(html, /\.toggle-content-wrap > \.block-children-wrap > \.block\.block-text\.block-child \{ min-height: 22px; \}/);
console.log('toggle spacing checks: OK');
