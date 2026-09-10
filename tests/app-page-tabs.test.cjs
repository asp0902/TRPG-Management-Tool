const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');

assert.match(html, /id="app-page-tabs"[^>]*role="tablist"/, '열린 페이지 탭 목록이 필요합니다.');
assert.match(html, /function switchPage\(page\)[\s\S]*?ensureAppPageTab\(page\);[\s\S]*?renderAppPageTabs\(\);/, '페이지 전환 시 탭을 열고 활성 상태를 갱신해야 합니다.');
assert.match(html, /function closeAppPageTab\(page\)/, '페이지 탭 닫기 동작이 필요합니다.');
assert.match(html, /@media \(max-width: 900px\)[\s\S]*?#sidebar \{[\s\S]*?position: fixed;/, '태블릿 이하에서는 사이드바가 본문을 밀지 않아야 합니다.');
assert.match(html, /function syncSidebarForViewport\(event = compactSidebarMedia\)[\s\S]*?classList\.toggle\('collapsed', event\.matches\)/, '좁은 화면 진입 시 사이드바를 자동으로 접어야 합니다.');
assert.match(html, /function switchPage\(page\)[\s\S]*?closeSidebarOnCompactViewport\(\);/, '모바일에서 페이지 선택 후 사이드바를 닫아야 합니다.');

const normalizeFunction = html.match(/function normalizeAppPages\(pages\) \{[\s\S]*?\n\}/)?.[0];
assert.ok(normalizeFunction, '열린 페이지 복원값 정규화 함수를 찾을 수 없습니다.');
const context = {
  CSS_MACRO_PAGE_LABELS: { script: 'SCRIPT', record: 'RECORD', rulebook: 'RULEBOOK', datasheet: 'DATA SHEET' },
};
vm.runInNewContext(`${normalizeFunction}; result = normalizeAppPages(['record', 'record', 'unknown', 'datasheet', 'script']);`, context);
assert.deepEqual(Array.from(context.result), ['record', 'script']);

console.log('app page tab checks: OK');
