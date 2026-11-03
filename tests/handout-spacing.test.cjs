const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');

// 핸드아웃 내용 칸 아래 공백(#187): 88px 최소 높이 제거, 여백 축소
assert.match(html, /\.handout-column \.block-ce \{ min-height: 1\.7em; margin-bottom: 6px; \}/);
assert.doesNotMatch(html, /\.handout-column \.block-ce \{ min-height: 88px/);
assert.match(html, /\.handout-shared \{ border-top: 1px solid var\(--border\); padding-top: 8px; \}/);
console.log('handout spacing checks: OK');
