const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');
// 스크립트 폴더 화면(#208): 시작 시 마지막 스크립트를 복원하지 않고 폴더 화면을 보인다.
assert.match(html, /<div id="script-home" style="display:none"><\/div>/);
assert.match(html, /id="script-home-btn"[^>]*onclick="goScriptHome\(\)"/);
assert.doesNotMatch(html, /const _lastScriptView = loadLastScriptView\(\);/);
assert.match(html, /state\.currentId = null;\s*showEmptyState\(\);\s*if \(isCharacterSheetPopupMode\(\)\)/);
assert.match(html, /select\('\$\{scenario\.id\}','info'\)/);
assert.match(html, /isScript && cur\(\) \? '' : 'none'/);
console.log('script home checks: OK');
