const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');

assert.match(html, /\.branch-choice-grid \{[^}]*display: grid;[^}]*grid-template-columns: repeat\(auto-fit, minmax\(min\(100%, 280px\), 1fr\)\);[^}]*grid-auto-rows: 1fr;/s);
assert.match(html, /\.branch-choice \{[^}]*width: 100%;[^}]*min-width: 0;[^}]*height: 100%;/s);
assert.match(html, /\.branch-choice-input \{[^}]*field-sizing: content;[^}]*white-space: pre-wrap;[^}]*overflow-wrap: anywhere;/s);
assert.match(html, /<textarea class="branch-choice-input" rows="1"[^>]*oninput="updBranch\([^>]*>\$\{esc\(getBranchDisplayLabel\(branch, index\)\)\}<\/textarea>/);
assert.doesNotMatch(html, /function syncBranchChoiceWidth/);
assert.doesNotMatch(html, /--branch-cols:/);
assert.match(html, /class="branch-inner-block-add branch-header-add"[^>]*onclick="openBranchAddMenu/);
assert.doesNotMatch(html, /class="branch-choice-add"/);
assert.match(html, /function openBranchAddMenu\(event, blockId, cid\)[\s\S]*?label: '선택지 추가'[\s\S]*?addBranch\(blockId, cid\)[\s\S]*?label: '내용 추가'[\s\S]*?addBranchInnerBlock\(blockId, cid\)/);
assert.match(html, /\.branch-header-row \.branch-header-add \{ border: none; \}/);
assert.match(html, /\.branch-inner-content-block \{ margin-left: 2px; \}/);

console.log('branch choice wrap checks: OK');
