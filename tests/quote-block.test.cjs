const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');

assert.match(
  html,
  /title="링크"[^>]*>[\s\S]*?<\/button>\s*<button[^>]*id="tb-quote-btn"[^>]*title="인용\/해제"/,
  '인용 버튼은 링크 버튼 바로 뒤에 있어야 합니다.',
);
assert.match(html, /function tbRemoveQuote\(root, quote\)/, '인용 해제 함수가 필요합니다.');
assert.match(html, /if \(existing\) return tbRemoveQuote\(root, existing\);/, '인용 버튼은 기존 인용을 해제해야 합니다.');
assert.match(html, /ctx\.block\.children\.push\(\.\.\.children\)/, '인용 해제 시 하위 블록을 보존해야 합니다.');
assert.match(html, /label: '인용 블록 삭제',[\s\S]*?danger: true,[\s\S]*?deleteQuoteBlock\(quoteEl\)/, '인용 메뉴에 삭제 기능이 필요합니다.');
assert.match(html, /li\|blockquote\|b/, '정보 탭 저장값은 blockquote를 HTML로 복원해야 합니다.');
assert.match(html, /function tbApplyQuoteBlockType\(root, range, tagName\)/, '인용 내부 문단 유형 적용 경로가 필요합니다.');
assert.match(
  html,
  /!tbApplyQuoteBlockType\(ce, range, val\)\) document\.execCommand\('formatBlock'/,
  '인용 외곽 블록은 formatBlock 교체 대상에서 제외해야 합니다.',
);
assert.match(html, /function makeQuoteChildBlockTargetKey\(/, '인용 전용 하위 블록 저장 경로가 필요합니다.');
assert.match(html, /function hydrateQuoteChildBlocks\(/, '저장된 하위 블록을 인용 안에 렌더해야 합니다.');
assert.match(
  html,
  /class="editor-quote-content">' \+ content \+ '<\/div>/,
  '인용 본문은 하위 블록과 분리된 편집 영역이어야 합니다.',
);
assert.match(html, /caret\.selectNodeContents\(quote\.querySelector\(':scope > \.editor-quote-content'\) \|\| quote\)/, '새 인용의 커서는 본문 안에 놓여야 합니다.');
assert.match(html, /const htmlRoot = quoteContent && root\.contains\(quoteContent\) \? quoteContent : root;/, '인용 본문만 들여쓰기해야 합니다.');
assert.match(
  html,
  /label: '하위 블록 추가',[\s\S]*?action: \(\) => insertQuoteChildBlock/,
  '인용 메뉴에서 하위 블록을 추가할 수 있어야 합니다.',
);
assert.match(
  html,
  /function placeQuoteChildAnchor\([\s\S]*?insertRange\.insertNode\(anchor\)/,
  '인용 하위 블록 위치 표식은 현재 커서에 삽입되어야 합니다.',
);
assert.match(
  html,
  /isOwnQuotePosition\(quoteEl, range\.startContainer\)[\s\S]*?isOwnQuotePosition\(quoteEl, range\.endContainer\)/,
  '여러 문단으로 나뉜 인용에서도 실제 커서 범위를 사용해야 합니다.',
);
assert.match(
  html,
  /if \(anchor\) anchor\.after\(wrap\);\s*else quote\.appendChild\(wrap\);/,
  '인용 하위 블록은 위치 표식 뒤에 렌더되어야 합니다.',
);
assert.match(
  html,
  /data-quote-id="' \+ quoteId \+ '"/,
  '새 인용에는 하위 블록 연결용 ID가 저장되어야 합니다.',
);
assert.match(
  html,
  /wrap\.querySelectorAll\('\.editor-quote-children'\)\.forEach\(node => node\.remove\(\)\)/,
  '렌더링 UI는 인용 원문 HTML에 저장되면 안 됩니다.',
);
assert.match(
  html,
  /openQuoteContextMenu\(quote, event\.clientX, event\.clientY, event\);\s*\}, true\);/,
  '인용 블록 우클릭 메뉴는 선택 텍스트 컨텍스트를 전달해야 합니다.',
);
assert.match(html, /\.editor-quote > \.editor-quote-children,[\s\S]*?width: calc\(100% \+ 20px\); max-width: calc\(100% \+ 20px\)/, '인용 하위 블록의 좌우 외곽 여백이 같아야 합니다.');
assert.match(html, /\.editor-quote-children:has\(> \.block > \.block-body > \.column-grid\) \{ border-top: 0; \}/, '인용 내부 단 나누기 위에는 자동 구분선을 표시하면 안 됩니다.');
assert.match(html, /\.editor-quote-children \.block-body:has\(> \.column-grid\) \{ white-space: normal; \}/, '인용 내부 단 나누기에서 템플릿 공백이 높이를 만들면 안 됩니다.');
assert.match(html, /\.editor-quote-children \.column-cell \{ padding-block: 6px; \}/, '인용 내부 각 단의 상하 여백은 좁게 유지해야 합니다.');

const quoteMenuFunction = html.match(/function openQuoteContextMenu\(quoteEl, x, y, event = null\) \{[\s\S]*?\n\}/)?.[0];
assert.ok(quoteMenuFunction, '인용 블록 메뉴 함수를 찾을 수 없습니다.');
let quoteMenuItems = [];
vm.runInNewContext(`${quoteMenuFunction}; openQuoteContextMenu(quote, 10, 20, event);`, {
  quote: {},
  event: {},
  tbGetVariationCtxItems: () => [{ label: '개변 추가' }],
  tbGetScenarioMemoCtxItems: () => [{ label: '메모 추가' }],
  getQuoteBlockContext: () => null,
  getQuoteChildInsertRange: () => null,
  makeQuoteChildInsertCtxItem: () => null,
  tbShowCtxMenu: (_x, _y, items) => { quoteMenuItems = items; },
});
assert.equal(quoteMenuItems[0].label, '개변 추가', '인용 블록 메뉴 첫 항목에 개변 기능이 있어야 합니다.');
assert.ok(quoteMenuItems.some(item => item.label === '메모 추가'), '인용 블록 메뉴에 메모 추가 기능이 있어야 합니다.');

const memoMenuFunction = html.match(/function tbGetScenarioMemoCtxItems\(withSeparator = false, blockRef = null\) \{[\s\S]*?\n\}/)?.[0];
assert.ok(memoMenuFunction, '시나리오 메모 메뉴 함수를 찾을 수 없습니다.');
let memoAddCount = 0;
let memoBlockRef = null;
const memoMenuContext = {
  currentPage: 'script',
  addMemo: blockRef => { memoAddCount += 1; memoBlockRef = blockRef; },
};
vm.runInNewContext(`${memoMenuFunction}; items = tbGetScenarioMemoCtxItems(false, { blockId: 'child', rootBlockId: 'root', cid: 'blocks-container' });`, memoMenuContext);
assert.equal(memoMenuContext.items[0]?.label, '메모 추가', 'SCRIPT 블록 메뉴에 메모 추가 항목이 있어야 합니다.');
memoMenuContext.items[0].action();
assert.equal(memoAddCount, 1, '메모 추가 항목은 공용 메모 생성 기능을 실행해야 합니다.');
assert.equal(memoBlockRef.blockId, 'child', '우클릭한 블록 ID를 메모 생성 기능에 전달해야 합니다.');
assert.equal(memoBlockRef.rootBlockId, 'root', '상위 블록 ID를 메모 생성 기능에 전달해야 합니다.');
memoMenuContext.currentPage = 'rulebook';
vm.runInNewContext('items = tbGetScenarioMemoCtxItems();', memoMenuContext);
assert.equal(memoMenuContext.items[0]?.label, '메모 추가', 'RULEBOOK 블록 메뉴에도 메모 추가 항목이 있어야 합니다.');
memoMenuContext.items[0].action();
assert.equal(memoAddCount, 2, 'RULEBOOK 메모 추가도 공용 메모 생성 기능을 실행해야 합니다.');
memoMenuContext.currentPage = 'character';
vm.runInNewContext('items = tbGetScenarioMemoCtxItems();', memoMenuContext);
assert.equal(memoMenuContext.items.length, 0, '블록 편집기가 아닌 페이지에는 메모 메뉴를 노출하면 안 됩니다.');

assert.match(html, /id="rb-detail-memo-toggle"[^>]*onclick="toggleRulebookMemo\(\)"/, 'RULEBOOK 상세 화면에 메모장 버튼이 있어야 합니다.');
assert.match(html, /title="찾아 바꾸기 \(Ctrl\+H\)"[\s\S]*?<\/button>\s*<button[^>]*id="rb-detail-memo-toggle"/, 'RULEBOOK 메모장 버튼은 찾아 바꾸기 버튼 바로 오른쪽에 있어야 합니다.');
assert.match(html, /rulebookMemoButton\.style\.display = rulebookChapterActive \? '' : 'none'/, 'RULEBOOK 메모장 버튼은 룰북 챕터에서만 보여야 합니다.');
assert.match(html, /id="rb-memo-panel"[\s\S]*?id="rb-memo-list"/, 'RULEBOOK 메모 패널과 목록이 있어야 합니다.');
assert.match(html, /id="rb-memo-panel"[\s\S]*?startScriptSidePanelResize\(event, 'rulebookMemo'\)/, 'RULEBOOK 메모 패널에 폭 조절 핸들이 있어야 합니다.');
assert.match(html, /rulebookMemo: 'trpg-rulebook-memo-width'/, 'RULEBOOK 메모 패널 폭을 별도 저장해야 합니다.');
assert.match(html, /applyScriptSidePanelWidth\('rulebookMemo', loadScriptSidePanelWidth\('rulebookMemo'\)\)/, 'RULEBOOK 메모 패널을 열 때 저장된 폭을 복원해야 합니다.');
assert.match(html, /memos: Array\.isArray\(rb\.memos\) \? rb\.memos : \[\]/, 'RULEBOOK 메모 데이터가 정규화되어야 합니다.');
assert.match(html, /currentPage === 'rulebook' \? 'rb-memo-list' : 'memo-list'/, '페이지별 메모 목록을 구분해야 합니다.');

const sidePanelResizeFunction = html.match(/function onScriptSidePanelResize\(ev\) \{[\s\S]*?\n\}/)?.[0];
assert.ok(sidePanelResizeFunction, '패널 폭 조절 함수를 찾을 수 없습니다.');
const sidePanelResizeContext = {
  _scriptSidePanelResize: { type: 'rulebookMemo', startX: 500, startWidth: 200 },
  applyScriptSidePanelWidth: (type, width) => { sidePanelResizeContext.result = { type, width }; },
};
vm.runInNewContext(`${sidePanelResizeFunction}; onScriptSidePanelResize({ clientX: 450 });`, sidePanelResizeContext);
assert.deepEqual(sidePanelResizeContext.result, { type: 'rulebookMemo', width: 250 }, 'RULEBOOK 우측 메모 패널을 왼쪽으로 드래그하면 폭이 늘어야 합니다.');

const memoOwnerStart = html.indexOf('function getMemoOwner()');
const memoOwnerEnd = html.indexOf('\nfunction deleteMemo(', memoOwnerStart);
assert.ok(memoOwnerStart >= 0 && memoOwnerEnd > memoOwnerStart, '공용 메모 저장 함수를 찾을 수 없습니다.');
const rulebookOwner = { id: 'rulebook', memos: [] };
const scenarioOwner = { id: 'scenario', memos: [] };
const memoOwnerContext = {
  currentPage: 'rulebook',
  state: { scenarios: [scenarioOwner], rulebooks: [rulebookOwner] },
  curRb: () => rulebookOwner,
  cur: () => scenarioOwner,
  mkId: () => 'memo-id',
  currentChapterId: 'chapter-id',
  getGenericBlockById: () => ({ type: 'text', content: '연결된 블록' }),
  rbGetTocTitleFromBlock: () => '연결된 블록',
  persist: () => {},
  renderMemoPanel: () => {},
  openMemoPop: () => {},
};
vm.runInNewContext(`${html.slice(memoOwnerStart, memoOwnerEnd)}; addMemo(); addMemo({ blockId: 'child', rootBlockId: 'root', cid: 'rb-blocks-container' });`, memoOwnerContext);
assert.equal(rulebookOwner.memos.length, 2, 'RULEBOOK에서 만든 메모는 해당 룰북에 저장되어야 합니다.');
assert.equal(scenarioOwner.memos.length, 0, 'RULEBOOK 메모가 시나리오에 섞이면 안 됩니다.');
assert.equal(rulebookOwner.memos[0].blockRef, undefined, '상단 추가 버튼의 메모는 페이지 메모로 유지해야 합니다.');
assert.deepEqual(JSON.parse(JSON.stringify(rulebookOwner.memos[1].blockRef)), {
  blockId: 'child',
  rootBlockId: 'root',
  cid: 'rb-blocks-container',
  label: '연결된 블록',
  chapterId: 'chapter-id',
}, '우클릭 메모는 소속 블록 정보를 저장해야 합니다.');
assert.match(html, /class="memo-item-source"[\s\S]*?sourceLabel/, '메모 목록에 소속 블록을 표시해야 합니다.');
assert.match(html, /\.has-block-memo::before[\s\S]*?width: 10px;[\s\S]*?height: 10px;[\s\S]*?background: #e53935;[\s\S]*?clip-path: polygon\(0 0, 100% 0, 100% 100%\)/, '메모가 연결된 블록에 우상단 빨간 삼각형을 표시해야 합니다.');
assert.doesNotMatch(html, /\.editor-quote\.has-block-memo::before\s*\{\s*right:/, '인용 메모 마커도 실제 우상단 모서리에 있어야 합니다.');
assert.match(html, /\.block\.block-chapter\.has-block-memo::before\s*\{\s*top:\s*4px;\s*right:\s*4px;/, '소제목 메모 마커는 둥근 모서리 안쪽에 표시해야 합니다.');
assert.match(html, /renderBlockMemoMarkers\(cid\);/, '블록을 다시 렌더한 뒤 메모 마커를 복원해야 합니다.');
assert.match(html, /const memos = getMemos\(\);\s*renderBlockMemoMarkers\(\);/, '메모 추가·삭제 후 마커를 즉시 갱신해야 합니다.');
assert.match(html, /querySelectorAll\('\.has-block-memo'\)[\s\S]*?removeAttribute\('data-memo-count'\)/, '인용 저장값에서 메모 마커 UI 속성을 제거해야 합니다.');

const memoMarkerFunction = html.match(/function renderBlockMemoMarkers\(cid = currentPage === 'rulebook' \? 'rb-blocks-container' : 'blocks-container'\) \{[\s\S]*?\n\}/)?.[0];
assert.ok(memoMarkerFunction, '블록 메모 마커 함수를 찾을 수 없습니다.');
const memoMarkerTarget = { dataset: {}, classList: { add(value) { this.value = value; } } };
const memoMarkerContainer = {
  querySelectorAll: () => [],
  querySelector: selector => selector.includes('data-id="block-id"') ? memoMarkerTarget : null,
};
const memoMarkerContext = {
  currentPage: 'script',
  currentChapterId: null,
  CSS: { escape: value => value },
  document: { getElementById: () => memoMarkerContainer },
  getMemos: () => [
    { blockRef: { blockId: 'block-id', cid: 'blocks-container' } },
    { blockRef: { blockId: 'block-id', cid: 'blocks-container' } },
  ],
};
vm.runInNewContext(`${memoMarkerFunction}; renderBlockMemoMarkers();`, memoMarkerContext);
assert.equal(memoMarkerTarget.classList.value, 'has-block-memo', '연결된 블록에 메모 마커 클래스를 추가해야 합니다.');
assert.equal(memoMarkerTarget.dataset.memoCount, '2', '블록에 연결된 메모 개수를 표시해야 합니다.');

[
  'tbBuildBlockCtxMenu',
  'buildRollResultCtxMenu',
  'openEndingFieldCtxMenu',
  'buildBranchConnectMenu',
  'openIbRollItemCtxMenu',
  'openIbRollResultCtxMenu',
  'openIbItemCalloutCtxMenu',
  'openBranchInnerBlockCtxMenu',
  'buildBranchInnerRollCtxMenu',
  'openBranchIbRollResultCtxMenu',
  'openQuoteContextMenu',
].forEach(name => {
  const start = html.indexOf(`function ${name}(`);
  const end = html.indexOf('\nfunction ', start + 1);
  assert.ok(start >= 0, `${name} 함수를 찾을 수 없습니다.`);
  assert.match(html.slice(start, end < 0 ? html.length : end), /tbGetScenarioMemoCtxItems\([^,]+,\s*\{\s*blockId:/, `${name}에서 우클릭한 블록 ID를 메모에 전달해야 합니다.`);
});

const colorFunction = html.match(/function getQuoteTextColor\(background\) \{[\s\S]*?\n\}/)?.[0];
assert.ok(colorFunction, '인용 글자색 계산 함수를 찾을 수 없습니다.');
const accentFunction = html.match(/function getQuoteAccentColor\(background\) \{[\s\S]*?\n\}/)?.[0];
assert.ok(accentFunction, '인용 라벨 색상 계산 함수를 찾을 수 없습니다.');
const context = {
  EDITOR_QUOTE_DEFAULT_BACKGROUND: '#303238',
  normalizePickerColor: color => color,
};
vm.runInNewContext(`${colorFunction}\n${accentFunction}; result = [getQuoteTextColor('#ffffff'), getQuoteTextColor('#303238')]; accent = getQuoteAccentColor('#e92323');`, context);
assert.deepEqual(Array.from(context.result), ['#202124', '#f5f5f5']);
assert.equal(context.accent, '#ed6262', '인용 라벨은 배경색과 같은 계열의 대비색이어야 합니다.');
assert.match(html, /quoteEl\.style\.borderLeftColor = getQuoteAccentColor\(color\)/, '배경색 변경 시 왼쪽 라벨 색상도 함께 바꿔야 합니다.');
assert.match(html, /if \(centered\) \{\s*if \(lastFocusedTA\) lastFocusedTA\.blur\(\);\s*setTimeout\(\(\) => document\.getElementById\('cp-hex'\)\.focus\(\), 30\);\s*\}/, '텍스트 색상 패널은 선택 영역의 포커스를 빼앗으면 안 됩니다.');
assert.match(html, /class="rb-inline-note-editor-body" contenteditable="true"/, '선택 영역 메모 입력칸은 시각적 서식을 지원해야 합니다.');
assert.match(html, /body\.innerHTML = rbGetInlineMemoHtml\(options\.noteEl\)/, '기존 메모 서식을 편집기에 복원해야 합니다.');
assert.match(html, /rbSetInlineMemoContent\(noteEl, noteHtml\)/, '메모의 서식 HTML과 일반 텍스트를 함께 저장해야 합니다.');
assert.match(html, /popup\.innerHTML = noteHtml/, '메모 팝업에 저장된 서식을 렌더링해야 합니다.');
assert.match(html, /editor\.contains\(event\.target\) \|\| tbIsFormatUtility\(event\.target\)/, '서식 도구 사용 중 메모 편집기가 닫히면 안 됩니다.');
assert.match(html, /\.tb-font-menu\s*\{[\s\S]*?z-index:\s*10061/, '메모 편집기 위에서 글꼴 목록을 선택할 수 있어야 합니다.');

const deleteFunction = html.match(/function deleteQuoteBlock\(quoteEl\) \{[\s\S]*?\n\}/)?.[0];
assert.ok(deleteFunction, '인용 블록 삭제 함수를 찾을 수 없습니다.');
const editable = { events: 0, focused: false, dispatchEvent() { this.events += 1; } };
const block = { quoteChildren: { quote1: [{ id: 'child1' }] } };
const quote = {
  dataset: { quoteId: 'quote1' },
  removed: false,
  closest: () => editable,
  remove() { this.removed = true; },
};
const deleteContext = {
  confirm: () => true,
  getQuoteBlockContext: () => ({ block }),
  getQuoteChildrenMap: target => target.quoteChildren,
  Event: function Event(type) { this.type = type; },
  placeCaretAtEnd: target => { target.focused = true; },
  lastFocusedTA: null,
  savedCERange: {},
  savedFormatTarget: {},
  _savedFormatSel: {},
};
vm.runInNewContext(`${deleteFunction}; result = deleteQuoteBlock(quote);`, { ...deleteContext, quote });
assert.equal(quote.removed, true, '인용 DOM을 제거해야 합니다.');
assert.equal(block.quoteChildren, undefined, '인용 하위 블록 데이터도 제거해야 합니다.');
assert.equal(editable.events, 1, '삭제 결과를 저장해야 합니다.');
assert.equal(editable.focused, true, '삭제 후 편집기로 커서를 돌려야 합니다.');

console.log('quote block checks: OK');
