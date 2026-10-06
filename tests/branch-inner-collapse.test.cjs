const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');

assert.match(html, /\.branch-inner-block-label \{\s*flex: 1; font-size: 14px;/);
assert.match(html, /\.branch-inner-block-header \{[\s\S]*?padding: 9px 10px;/);
assert.match(html, /\.branch-inner-content-block > \.branch-inner-block-header > \.branch-inner-block-label \{\s*font-size: 13px;\s*height: 24px;\s*line-height: 24px;/);
assert.match(html, /\.branch-inner-content-block:not\(\.is-collapsed\) > \.branch-inner-block-header > \.branch-inner-block-label \{\s*color: #000;/);
assert.match(html, /class="branch-inner-block branch-inner-content-block\$\{ib\.collapsed \? ' is-collapsed' : ''\}"/);
assert.match(html, /\.branch-inner-block\.is-collapsed > \.bib-items \{ display: none; \}/);
assert.match(html, /\.branch-inner-content-block \+ \.branch-inner-content-block \{ margin-top: -1px; \}/);
assert.match(html, /\.bib-items \{[\s\S]*?padding: 8px 10px;/);
assert.match(html, /ib\.collapsed = ib\.collapsed === true;[\s\S]*?normalizeIbItems\(ib\)/);
assert.match(html, /branch-inner-block branch-inner-content-block\$\{ib\.collapsed \? ' is-collapsed' : ''\}/);
assert.match(html, /class="branch-inner-collapse-btn"[\s\S]*?aria-expanded="\$\{ib\.collapsed \? 'false' : 'true'\}"[\s\S]*?toggleBranchInnerBlockCollapsed/);
assert.equal((html.match(/class="branch-inner-collapse-btn"/g) || []).length, 1, '접기 버튼은 일반 내용 블록 렌더러에만 있어야 합니다.');
assert.doesNotMatch(html, /\.branch-inner-block\.is-collapsed > \.branch-inner-block-actions/);
assert.doesNotMatch(html, /\.branch-inner-content-block > \.bib-items > \.bib-item-text > \.bib-item-text-ce \{[\s\S]*?padding-right: 56px;/);
assert.match(html, /\.branch-inner-block:hover:not\(:has\(\.bib-item:hover, \.block:hover\)\) > \.branch-inner-block-actions/);
assert.match(html, /\.bib-item-text:hover:not\(:has\(\.block:hover\)\) > \.bib-item-ctrl/);
assert.match(html, /function positionOwnedFloatingActions\(target\)/);

const toggle = html.match(/function toggleBranchInnerBlockCollapsed\(blockId, ibId, cid\) \{[\s\S]*?\n\}/)?.[0];
assert.ok(toggle);
assert.match(toggle, /isBranchInnerRollBlock\(ib\) \|\| ib\.type === 'callout'/);
assert.match(toggle, /ib\.collapsed = !ib\.collapsed/);
assert.match(toggle, /commitScenarioHistory\(`branch:\$\{blockId\}:\$\{ibId\}:collapsed`, \{ force: true \}\)/);
assert.match(toggle, /rerenderBlockElement\(blockId, cid \|\| 'blocks-container'\)/);

console.log('branch inner collapse checks: OK');
