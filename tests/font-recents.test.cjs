const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');

assert.match(html, /class="tb-font-menu-section">최근 사용 항목</, '글꼴 메뉴에 최근 사용 영역이 필요합니다.');
assert.match(html, /class="tb-font-menu-section">모든 글꼴</, '글꼴 메뉴에 전체 목록 영역이 필요합니다.');
assert.match(html, /customFonts: state\.customFonts,[\s\S]*?recentFonts: state\.recentFonts,/, '최근 글꼴을 앱 저장 데이터에 포함해야 합니다.');
assert.match(html, /async function bootstrapApp\(\) \{\s*await load\(\);\s*await initGitHubSync\(\);\s*loadCustomFonts\(\);\s*updateFontDropdown\(\);/, '로컬·GitHub 저장 데이터를 읽은 뒤 글꼴 목록을 복원해야 합니다.');
assert.doesNotMatch(html, /\.block-text-ce:has\(span\[style\*="font-family"\]\)\s*\{\s*line-height:/, '부분 글꼴 때문에 편집기 전체 줄간격이 바뀌면 안 됩니다.');
assert.match(html, /\[contenteditable="true"\] span\[style\*="font-family"\]\s*\{\s*line-height:\s*inherit;/, '부분 글꼴은 편집기의 줄간격을 그대로 따라야 합니다.');

const normalizeFunction = html.match(/function normalizeFontNameForCompare\(name\) \{[\s\S]*?\n\}/)?.[0];
const uniqueFunction = html.match(/function uniqueFontNames\(list\) \{[\s\S]*?\n\}/)?.[0];
const prependFunction = html.match(/function prependRecentFont\(recentFonts, name\) \{[\s\S]*?\n\}/)?.[0];
assert.ok(normalizeFunction && uniqueFunction && prependFunction, '최근 글꼴 정규화 함수를 찾을 수 없습니다.');
const context = { MAX_RECENT_FONTS: 5 };
vm.runInNewContext(`${normalizeFunction}\n${uniqueFunction}\n${prependFunction}\nresult = prependRecentFont(['Arial', 'Georgia', 'Tahoma', 'Impact', 'Verdana'], 'Georgia');`, context);
assert.deepEqual(Array.from(context.result), ['Georgia', 'Arial', 'Tahoma', 'Impact', 'Verdana']);

console.log('font recent checks: OK');
