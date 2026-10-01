const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');

assert.match(html, /class="tb-font-menu-section">최근 사용 항목</, '글꼴 메뉴에 최근 사용 영역이 필요합니다.');
assert.match(html, /class="tb-font-menu-section">모든 글꼴</, '글꼴 메뉴에 전체 목록 영역이 필요합니다.');
assert.match(html, /customFonts: state\.customFonts,[\s\S]*?recentFonts: state\.recentFonts,/, '최근 글꼴을 앱 저장 데이터에 포함해야 합니다.');
assert.match(html, /async function bootstrapApp\(\) \{\s*await load\(\);\s*if \(!isCharacterSheetPopupMode\(\)\) await initGitHubSync\(\);\s*loadCustomFonts\(\);\s*updateFontDropdown\(\);/, '로컬·GitHub 저장 데이터를 읽은 뒤 글꼴 목록을 복원해야 합니다.');
assert.doesNotMatch(html, /\.block-text-ce:has\(span\[style\*="font-family"\]\)\s*\{\s*line-height:/, '부분 글꼴 때문에 편집기 전체 줄간격이 바뀌면 안 됩니다.');
assert.match(html, /\[contenteditable="true"\] span\[style\*="font-family"\]:not\(:has\(:is\(br, div, p, li, ul, ol, blockquote, h1, h2, h3, h4\)\)\)\s*\{\s*line-height:\s*0;/, '단일 줄의 부분 글꼴만 편집기의 줄 상자 높이를 바꾸지 않아야 합니다.');
assert.doesNotMatch(html, /\[contenteditable="true"\] span\[style\*="font-family"\]\s*\{\s*line-height:\s*0;/, '여러 줄을 감싼 글꼴 span의 줄간격을 0으로 만들면 안 됩니다.');
assert.match(html, /\[contenteditable="true"\]\[style\*="Nanum Myeongjo"\],[\s\S]*?-webkit-text-stroke:\s*0\.15px currentColor;/, 'Nanum Myeongjo의 가는 획을 편집 영역에서 보강해야 합니다.');
assert.match(html, /function tbTightenNanumMyeongjoCommas\(root\)[\s\S]*?character === ',' && \/\[가-힣\]\[\^,\\s\]\*\$\/[\s\S]*?className = 'tb-nanum-myeongjo-comma'/, 'Nanum Myeongjo의 한글 토큰 뒤 쉼표만 별도 표시해야 합니다.');
assert.match(html, /\.tb-nanum-myeongjo-comma[\s\S]*?margin-left:\s*-0\.08em;[\s\S]*?margin-right:\s*0\.08em;/, 'Nanum Myeongjo 쉼표의 위치만 국소 보정해야 합니다.');
assert.match(html, /function tbEndFontPreview\(fontFamily = ''\)[\s\S]*?tbTightenNanumMyeongjoCommas\(span\)/, '글꼴 미리보기 확정 경로도 Nanum Myeongjo 쉼표를 보정해야 합니다.');
assert.doesNotMatch(html, /\[style\*="Nanum Myeongjo"\][^{]*\{[^}]*letter-spacing:/, 'Nanum Myeongjo 전체 자간을 변경하면 안 됩니다.');

const normalizeFunction = html.match(/function normalizeFontNameForCompare\(name\) \{[\s\S]*?\n\}/)?.[0];
const uniqueFunction = html.match(/function uniqueFontNames\(list\) \{[\s\S]*?\n\}/)?.[0];
const prependFunction = html.match(/function prependRecentFont\(recentFonts, name\) \{[\s\S]*?\n\}/)?.[0];
assert.ok(normalizeFunction && uniqueFunction && prependFunction, '최근 글꼴 정규화 함수를 찾을 수 없습니다.');
const context = { MAX_RECENT_FONTS: 5 };
vm.runInNewContext(`${normalizeFunction}\n${uniqueFunction}\n${prependFunction}\nresult = prependRecentFont(['Arial', 'Georgia', 'Tahoma', 'Impact', 'Verdana'], 'Georgia');`, context);
assert.deepEqual(Array.from(context.result), ['Georgia', 'Arial', 'Tahoma', 'Impact', 'Verdana']);

console.log('font recent checks: OK');
