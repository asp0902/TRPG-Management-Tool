const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');

assert.doesNotMatch(html, /rb-inline-note-(?:save|cancel)|rb-inline-note-editor-actions/, '저장/취소 버튼은 없어야 합니다.');
assert.match(html, /body\.addEventListener\('input',[\s\S]*?rbAutoSaveInlineMemoEditor\(\)/, '입력 시 자동 저장해야 합니다.');
assert.match(html, /body\.addEventListener\('compositionend',[\s\S]*?rbAutoSaveInlineMemoEditor\(\)/, 'IME 조합 완료 시 저장해야 합니다.');

const start = html.indexOf('function rbAutoSaveInlineMemoEditor()');
const end = html.indexOf('\nfunction rbEnsureInlineMemoPopup()', start);
assert.ok(start >= 0 && end > start, '자동 저장 함수를 찾을 수 있어야 합니다.');

const body = { innerHTML: '', innerText: '', textContent: '' };
const title = { textContent: '' };
const editor = { querySelector: selector => selector.includes('title') ? title : body };
const appliedMark = { id: 'memo' };
const calls = [];
const context = {
  rbInlineMemoEditorState: { editable: {}, range: {}, noteEl: null, mode: 'add' },
  document: { getElementById: () => editor },
  sanitizeCssMacroPreviewHtml: value => value,
  rbApplyInlineMemo: (...args) => { calls.push(['apply', ...args]); return appliedMark; },
  rbUpdateInlineMemo: (...args) => { calls.push(['update', ...args]); return true; },
};
vm.createContext(context);
vm.runInContext(`${html.slice(start, end)}\nthis.run = rbAutoSaveInlineMemoEditor;`, context);

assert.equal(context.run(), false, '빈 첫 입력은 메모를 만들지 않아야 합니다.');
assert.equal(calls.length, 0);

body.innerHTML = '첫 메모';
body.innerText = '첫 메모';
assert.equal(context.run(), true);
assert.equal(calls[0][0], 'apply');
assert.equal(calls[0][4].preserveFocus, true, '생성 중 편집기 포커스를 보존해야 합니다.');
assert.equal(context.rbInlineMemoEditorState.noteEl, appliedMark);
assert.equal(title.textContent, '메모 수정');

body.innerHTML = '수정';
body.innerText = '수정';
assert.equal(context.run(), true);
assert.equal(calls[1][0], 'update');
assert.equal(calls[1][1], appliedMark);
assert.equal(calls[1][2], '수정');
assert.equal(calls[1][3].showPopup, false);

body.innerHTML = '';
body.innerText = '';
assert.equal(context.run(), true, '기존 메모의 빈 내용도 자동 저장해야 합니다.');
assert.equal(calls[2][0], 'update');
assert.equal(calls[2][1], appliedMark);
assert.equal(calls[2][2], '');
assert.equal(calls[2][3].showPopup, false);

console.log('rulebook inline memo autosave tests passed');
