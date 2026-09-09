const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');

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
  document: { getElementById: () => ({ classList: { contains: () => true } }) },
  lastFocusedTA: null,
  tbSaveCERange: () => calls.push('range'),
  tbIndent: direction => calls.push(direction),
};
vm.runInNewContext(shortcutFunction, context);
context.handleFormatIndentShortcut({ key: 'Tab', shiftKey: false, target: editor, preventDefault: () => calls.push('prevented') });
context.handleFormatIndentShortcut({ key: 'Tab', shiftKey: true, target: editor, preventDefault: () => calls.push('prevented') });
assert.deepEqual(calls, ['prevented', 'range', 1, 'prevented', 'range', -1]);

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

const indentStart = html.indexOf('function tbIndent(dir) {');
const indentEnd = html.indexOf('function tbGetCEFormatRange', indentStart);
const indentFunction = html.slice(indentStart, indentEnd).trim();
const selectedEditor = { contentEditable: 'true' };
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
  savedCERange: null,
  tbRangeInsideRoot: () => true,
  tbIndentContentEditable: target => indentTargets.push(target),
  tbIndentTextInput: () => assert.fail('contenteditable을 일반 입력칸으로 처리했습니다.'),
};
vm.runInNewContext(indentFunction, indentContext);
indentContext.tbIndent(1);
assert.equal(indentTargets[0], selectedEditor, '마지막 포커스가 없어도 현재 선택 영역의 편집기를 사용해야 합니다.');

console.log('indent shortcut checks: OK');
