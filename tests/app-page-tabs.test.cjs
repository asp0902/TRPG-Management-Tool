const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');

assert.match(html, /id="app-page-tabs"[^>]*role="tablist"/, '열린 페이지 탭 목록이 필요합니다.');
assert.match(html, /function switchPage\(page\)[\s\S]*?ensureAppPageTab\(page\);[\s\S]*?renderAppPageTabs\(\);/, '페이지 전환 시 탭을 열고 활성 상태를 갱신해야 합니다.');
assert.match(html, /function closeAppPageTab\(page\)/, '페이지 탭 닫기 동작이 필요합니다.');
assert.match(html, /class="app-page-tab[\s\S]*?draggable="true"/, '페이지 탭은 드래그할 수 있어야 합니다.');
assert.match(html, /addEventListener\('dragstart'[\s\S]*?addEventListener\('drop'/, '페이지 탭 드래그 정렬 이벤트가 필요합니다.');
assert.match(html, /@media \(max-width: 900px\)[\s\S]*?#sidebar \{[\s\S]*?position: fixed;/, '태블릿 이하에서는 사이드바가 본문을 밀지 않아야 합니다.');
assert.match(html, /function syncSidebarForViewport\(event = compactSidebarMedia\)[\s\S]*?classList\.toggle\('collapsed', event\.matches\)/, '좁은 화면 진입 시 사이드바를 자동으로 접어야 합니다.');
assert.match(html, /function switchPage\(page\)[\s\S]*?closeSidebarOnCompactViewport\(\);/, '모바일에서 페이지 선택 후 사이드바를 닫아야 합니다.');

const pageHelpers = html.slice(html.indexOf("const CHARACTER_SHEET_PAGE_PREFIX"), html.indexOf('function loadOpenAppPages'));
assert.ok(pageHelpers.includes('function normalizeAppPages'), '열린 페이지 복원값 정규화 함수를 찾을 수 없습니다.');
const context = {
  CSS_MACRO_PAGE_LABELS: { script: 'SCRIPT', record: 'RECORD', rulebook: 'RULEBOOK', datasheet: 'DATA SHEET' },
};
vm.runInNewContext(`${pageHelpers}; result = normalizeAppPages(['record', 'record', 'unknown', 'datasheet', 'character-sheet:test-id', 'character-sheet:%', 'script']);`, context);
assert.deepEqual(Array.from(context.result), ['record', 'character-sheet:test-id', 'script']);

const moveHelper = html.slice(html.indexOf('function moveAppPageTab'), html.indexOf('function renderAppPageTabs'));
const moveContext = {};
vm.runInNewContext(`
  let openAppPages = ['script', 'record', 'rulebook'];
  let saves = 0;
  let renders = 0;
  function saveOpenAppPages() { saves += 1; }
  function renderAppPageTabs() { renders += 1; }
  ${moveHelper}
  const changed = moveAppPageTab('rulebook', 'script');
  const unchanged = moveAppPageTab('rulebook', 'script');
  result = { pages: openAppPages, saves, renders, changed, unchanged };
`, moveContext);
assert.deepEqual(Array.from(moveContext.result.pages), ['rulebook', 'script', 'record']);
assert.deepEqual({ ...moveContext.result, pages: undefined }, {
  pages: undefined, saves: 1, renders: 1, changed: true, unchanged: false,
});
assert.match(html, /function openCharacterSheet\(id\)[\s\S]*?switchPage\(getCharacterSheetPageId\(id\)\)/, '캐릭터 시트는 앱 탭으로 열려야 합니다.');
assert.match(html, /function switchPage\(page\)[\s\S]*?renderCharacterSheetPage\(characterSheetId\)/, '캐릭터 시트 탭 전환 시 시트를 렌더링해야 합니다.');

console.log('app page tab checks: OK');
