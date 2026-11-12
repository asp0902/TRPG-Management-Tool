const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');
// 스크립트 폴더 화면(#208): 시작 시 마지막 스크립트를 복원하지 않고 폴더 화면을 보인다.
assert.match(html, /<div id="script-home" style="display:none"><\/div>/);
assert.match(html, /id="script-home-btn"[^>]*onclick="goScriptHome\(\)"/);
// #212: 같은 탭 새로고침만 sessionStorage 로 복원, 폴더 화면에서는 지운다.
assert.match(html, /sessionStorage\.getItem\(LAST_SCRIPT_VIEW_KEY\)/);
assert.match(html, /sessionStorage\.setItem\(LAST_SCRIPT_VIEW_KEY/);
assert.doesNotMatch(html, /localStorage\.(get|set)Item\(LAST_SCRIPT_VIEW_KEY/);
assert.match(html, /function showEmptyState\(\) \{\s*clearLastScriptView\(\);/);
assert.match(html, /const _lastScriptView = loadLastScriptView\(\);\s*state\.currentId = null;[\s\S]*?select\(_lastScriptView\.scenarioId, _lastScriptView\.tab\);[\s\S]*?showEmptyState\(\);\s*\}\s*if \(isCharacterSheetPopupMode\(\)\)/);
assert.match(html, /select\('\$\{scenario\.id\}','info'\)/);
assert.match(html, /isScript && cur\(\) \? '' : 'none'/);
console.log('script home checks: OK');
// #209: 사이드바(폴더 안·밖)와 폴더 화면 카드는 표시 시 compareScenarioSidebarItems 로 정렬한다(저장 순서는 그대로).
assert.match(html, /scenario\.folderId === folderId\)\.sort\(compareScenarioSidebarItems\)/);
assert.match(html, /\.sort\(compareScenarioSidebarItems\) \/\/ #209\s*\.forEach\(scenario => frag\.appendChild\(createScenarioItem\(scenario\)\)\)/);
assert.match(html, /sc\.folderId === folder\.id\)\.sort\(compareScenarioSidebarItems\)/);
assert.match(html, /!folderIds\.has\(sc\.folderId\)\)\.sort\(compareScenarioSidebarItems\)/);
console.log('script sidebar sort checks: OK');
