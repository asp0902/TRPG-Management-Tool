const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');
const source = html.match(/function shouldClearBranchSelectionFromClick\(target\) \{[\s\S]*?\n\}/)?.[0] || '';
const preserveSource = html.match(/function shouldPreserveScriptBodySelection\(target\) \{[\s\S]*?\n\}/)?.[0] || '';
const clearSource = html.match(/function clearScriptBodySelectionState\(panelBody\) \{[\s\S]*?\n\}/)?.[0] || '';

assert.match(source, /currentPage !== 'script'/);
assert.match(source, /getElementById\('panel-body'\)\?\.classList\.contains\('active'\)/);
assert.match(source, /el\.matches\('#panel-body, #panel-body > \.panel-inner'\)/);
assert.ok(source.indexOf("closest('.branch-choice')") < source.indexOf("el.matches('#panel-body"));
assert.match(source, /\.tb-ctx-menu/);
assert.doesNotMatch(source, /#rb-chapter/);
assert.match(preserveSource, /#format-bar/);
assert.match(preserveSource, /\.rb-modal-backdrop/);
assert.match(clearSource, /clearBlockRangeSelection\(\)/);
assert.match(clearSource, /selectBlock\(null\)/);
assert.match(clearSource, /clearAllActiveBranches\('blocks-container'\)/);
assert.match(html, /scriptBodyActive && !shouldPreserveScriptBodySelection\(e\.target\)/);

console.log('branch margin clear checks: OK');
