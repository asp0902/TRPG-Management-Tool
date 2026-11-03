const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');

// 분기점 안 콜아웃 내용 칸만 13px(#186). 제목은 14px 유지.
assert.match(html, /\.branch-block \.bib-item-callout \.nested-callout-content,\s*\.branch-block \.branch-inner-callout \.nested-callout-content,\s*\.branch-block \.nested-callout-content,\s*\.branch-block \.callout-content-ce\.block-ce \{ font-size: 13px; \}/);
assert.match(html, /\.bib-item-callout \.nested-callout-header \.callout-title-inp \{ font-size: 14px; \}/);
console.log('branch callout font checks: OK');
