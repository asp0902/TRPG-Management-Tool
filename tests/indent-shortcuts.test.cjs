const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');

const cleanupFunction = html.match(/function removeOrphanIndentWhitespace\(html\) \{[\s\S]*?\n\}/)?.[0];
assert.ok(cleanupFunction, '레거시 전각 공백 정리 함수를 찾을 수 없습니다.');
const cleanupContext = {};
vm.runInNewContext(cleanupFunction, cleanupContext);
const orphanIndent = '　'.repeat(17);
assert.equal(
  cleanupContext.removeOrphanIndentWhitespace(`<blockquote class="editor-quote"><div class="editor-quote-content"><h1><span>기능</span></h1>${orphanIndent}\n본문</div></blockquote>`),
  '<blockquote class="editor-quote"><div class="editor-quote-content"><h1><span>기능</span></h1>\n본문</div></blockquote>',
  '블록 종료 뒤에 누적된 숨은 전각 공백을 제거해야 합니다.',
);
assert.equal(
  cleanupContext.removeOrphanIndentWhitespace('<h1>　<span>기능</span></h1>\n본문'),
  '<h1>　<span>기능</span></h1>\n본문',
  '블록 내부의 정상 들여쓰기는 유지해야 합니다.',
);

assert.match(html, /id="tb-indent-btn"[^>]*title="들여쓰기\(Tab\)"/, '들여쓰기 버튼에 Tab 단축키를 표시해야 합니다.');
assert.match(html, /id="tb-outdent-btn"[^>]*title="내어쓰기 \(Shift\+Tab\)"/, '내어쓰기 버튼에 Shift+Tab 단축키를 표시해야 합니다.');
assert.match(
  html,
  /wrap\.addEventListener\('keydown', event => \{\s*if \(event\.key !== 'Tab'\) event\.stopPropagation\(\);/,
  '인용 하위 블록의 Tab 키는 공통 들여쓰기 처리기까지 전달되어야 합니다.',
);

const shortcutFunction = html.match(/function handleFormatIndentShortcut\(e\) \{[\s\S]*?\n\}/)?.[0];
assert.ok(shortcutFunction, '들여쓰기 단축키 처리 함수를 찾을 수 없습니다.');

const calls = [];
const editor = {
  contentEditable: 'true',
  closest(selector) {
    if (selector.includes('contenteditable') || selector.includes('#panel-body')) return this;
    return null;
  },
};
const context = {
  lastFocusedTA: null,
  tbSaveCERange: () => calls.push('range'),
  tbIndent: direction => calls.push(direction),
};
vm.runInNewContext(shortcutFunction, context);
context.handleFormatIndentShortcut({ key: 'Tab', shiftKey: false, target: editor, preventDefault: () => calls.push('prevented') });
context.handleFormatIndentShortcut({ key: 'Tab', shiftKey: true, target: editor, preventDefault: () => calls.push('prevented') });
assert.deepEqual(calls, ['prevented', 'range', 1, 'prevented', 'range', -1]);

const basicInfoEditor = {
  contentEditable: 'true',
  closest(selector) {
    if (selector.includes('contenteditable') || selector.includes('#panel-info') || selector === '#info-basic-grid') return this;
    return null;
  },
};
context.handleFormatIndentShortcut({ key: 'Tab', shiftKey: false, target: basicInfoEditor, preventDefault: () => calls.push('basic-prevented') });
assert.deepEqual(calls, ['prevented', 'range', 1, 'prevented', 'range', -1], '기본 정보의 Tab 키는 기본 포커스 이동을 유지해야 합니다.');
assert.match(html, /id="info-basic-grid"/, 'SCRIPT 기본 정보 그리드를 식별할 수 있어야 합니다.');
assert.match(html, /#i-rule\s*\{[\s\S]*?background-position:\s*right 12px center;/, '룰 정보 화살표에 우측 여백을 둬야 합니다.');

const shareLineFunction = html.match(/function _bnRectsShareLine\(a, b\) \{[\s\S]*?\n\}/)?.[0];
assert.ok(shareLineFunction, '방향키 줄 경계 비교 함수를 찾을 수 없습니다.');
const arrowContext = {};
vm.runInNewContext(shareLineFunction, arrowContext);
assert.equal(arrowContext._bnRectsShareLine({ top: 10, bottom: 30, height: 20 }, { top: 12, bottom: 28, height: 16 }), true);
assert.equal(arrowContext._bnRectsShareLine({ top: 10, bottom: 30, height: 20 }, { top: 32, bottom: 52, height: 20 }), false);
assert.match(
  html,
  /function _bnMoveCaretOneLine[\s\S]*?document\.caretPositionFromPoint[\s\S]*?_bnRectsShareLine/,
  '블록 내부 방향키는 인접한 시각적 줄의 커서 위치를 찾아야 합니다.',
);
assert.match(
  html,
  /document\.addEventListener\('keydown', handleFormatIndentShortcut, true\)/,
  '중첩 편집기가 이벤트 전파를 막아도 Tab 단축키를 먼저 처리해야 합니다.',
);
assert.match(
  html,
  /document\.getElementById\('format-bar'\)\.addEventListener\('mousedown', e => \{\s*if \(!e\.target\.closest\('button'\)\) return;\s*tbCaptureFormatTarget\(\);\s*e\.preventDefault\(\);/,
  '툴바 버튼은 포커스가 이동하기 전에 현재 편집 대상을 저장해야 합니다.',
);

const boundaryStart = html.indexOf('function tbSkipOpeningIndentBlocks');
const boundaryEnd = html.indexOf('function tbSkipIndentMarkers', boundaryStart);
const boundaryFunctions = boundaryStart >= 0 && boundaryEnd > boundaryStart
  ? html.slice(boundaryStart, boundaryEnd).trim()
  : '';
assert.ok(boundaryFunctions, '들여쓰기 경계 계산 함수를 찾을 수 없습니다.');
const boundaryContext = {};
vm.runInNewContext(boundaryFunctions, boundaryContext);
const nestedHtml = '<blockquote><div class="editor-quote-content">본문<span id="marker"></span></div></blockquote>';
assert.equal(
  boundaryContext.tbFindIndentBoundaryIndex(nestedHtml, nestedHtml.indexOf('<span')),
  nestedHtml.indexOf('본문'),
  '인용 본문의 중첩된 여는 태그 뒤를 들여쓰기 시작점으로 사용해야 합니다.',
);
const textAfterHeadingHtml = '<h1><span>기능</span></h1>\n캐릭터가 특정한 일을<span id="marker"></span>';
assert.equal(
  boundaryContext.tbFindIndentBoundaryIndex(textAfterHeadingHtml, textAfterHeadingHtml.indexOf('<span id="marker"')),
  textAfterHeadingHtml.indexOf('캐릭터'),
  '제목 뒤 첫 본문 줄은 줄바꿈 다음 위치부터 들여써야 합니다.',
);

const indentStart = html.indexOf('function tbIndent(dir) {');
const indentEnd = html.indexOf('function tbGetCEFormatRange', indentStart);
const indentFunction = html.slice(indentStart, indentEnd).trim();
assert.doesNotMatch(indentFunction, /queryCommandState\('insertOrderedList'\)/, '번호 목록은 브라우저 중첩 들여쓰기를 사용하면 안 됩니다.');

const listIndentStart = html.indexOf('function tbOrderedListItemFromNode');
const listIndentEnd = html.indexOf('function tbIndent(dir) {', listIndentStart);
const listIndentFunctions = html.slice(listIndentStart, listIndentEnd).trim();
assert.ok(listIndentFunctions, '번호 목록 시각적 들여쓰기 함수를 찾을 수 없습니다.');
const listItems = Array.from({ length: 4 }, () => ({
  nodeType: 1,
  tagName: 'LI',
  dataset: {},
  style: {
    values: {},
    setProperty(name, value) { this.values[name] = value; },
    removeProperty(name) { delete this.values[name]; },
  },
  closest(selector) { return selector === 'li' ? this : null; },
}));
const orderedList = { tagName: 'OL', children: listItems };
listItems.forEach(item => { item.parentElement = orderedList; });
let listInputEvents = 0;
const listRoot = { contains: item => listItems.includes(item), dispatchEvent: () => { listInputEvents += 1; } };
const listRange = {
  startContainer: { nodeType: 3, parentElement: listItems[1] },
  endContainer: { nodeType: 3, parentElement: listItems[3] },
};
const listContext = { Node: { ELEMENT_NODE: 1 }, Event: function Event() {} };
vm.runInNewContext(listIndentFunctions, listContext);
assert.equal(listContext.tbIndentOrderedListRange(listRoot, listRange, 1), true);
assert.deepEqual(listItems.map(item => item.dataset.listIndent || '0'), ['0', '1', '1', '1']);
assert.deepEqual(listItems.map(item => item.style.values['margin-inline-start'] || ''), ['', '1em', '1em', '1em']);
assert.deepEqual(Array.from(orderedList.children), listItems, '번호 목록의 항목 순서를 변경하면 안 됩니다.');
listContext.tbIndentOrderedListRange(listRoot, listRange, -1);
assert.deepEqual(listItems.map(item => item.dataset.listIndent || '0'), ['0', '0', '0', '0']);
assert.equal(listInputEvents, 2);

const selectedEditor = { contentEditable: 'true', isConnected: true };
const liveRange = {
  commonAncestorContainer: {
    nodeType: 3,
    parentElement: { closest: () => selectedEditor },
  },
  cloneRange() { return this; },
};
const indentTargets = [];
const indentContext = {
  Node: { ELEMENT_NODE: 1 },
  window: { getSelection: () => ({ rangeCount: 1, getRangeAt: () => liveRange }) },
  document: { queryCommandState: () => false },
  lastFocusedTA: null,
  savedFormatTarget: null,
  savedCERange: null,
  tbRangeInsideRoot: () => true,
  tbIndentOrderedListRange: () => false,
  tbIndentContentEditable: target => indentTargets.push(target),
  tbIndentTextInput: () => assert.fail('contenteditable을 일반 입력칸으로 처리했습니다.'),
};
vm.runInNewContext(indentFunction, indentContext);
indentContext.tbIndent(1);
assert.equal(indentTargets[0], selectedEditor, '마지막 포커스가 없어도 현재 선택 영역의 편집기를 사용해야 합니다.');
indentContext.window.getSelection = () => ({ rangeCount: 0 });
indentContext.lastFocusedTA = null;
indentContext.savedFormatTarget = { type: 'ce', ta: selectedEditor, range: liveRange };
indentContext.tbIndent(1);
assert.equal(indentTargets[1], selectedEditor, '툴바 클릭 전 저장한 편집기와 선택 영역을 사용해야 합니다.');

console.log('indent shortcut checks: OK');
