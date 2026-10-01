const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');

assert.doesNotMatch(html, /memo-popup-toolbar|memo-fmt-btn|memoFmt\(|memoApplyTextColor\(/, '메모 전용 서식 툴바가 남아 있으면 안 됩니다.');
assert.match(html, /class="memo-popup-body"[\s\S]*?contenteditable="true"[\s\S]*?oninput="saveMemoPop/, '팝업 메모는 공통 contenteditable 및 자동 저장 경로를 유지해야 합니다.');
assert.match(html, /formatReturnTarget: tbCloneFormatTarget\(tbResolveFormatTarget\(\)\)/, '선택 영역 메모는 기존 툴바 대상을 기억해야 합니다.');
assert.match(html, /div\._formatReturnTarget = tbCloneFormatTarget\(tbResolveFormatTarget\(\)\)/, '팝업 메모는 기존 툴바 대상을 기억해야 합니다.');
assert.match(html, /tbRestoreFormatTarget\(returnTarget, body\)/, '선택 영역 메모 종료 시 기존 대상을 복원해야 합니다.');
assert.match(html, /tbRestoreFormatTarget\(el\._formatReturnTarget, body\)/, '팝업 메모 종료 시 기존 대상을 복원해야 합니다.');

const start = html.indexOf('function tbCloneFormatTarget(target)');
const end = html.indexOf('\nfunction tbIsTextField(el)', start);
assert.ok(start >= 0 && end > start, '툴바 대상 복원 함수를 찾을 수 있어야 합니다.');

const oldRange = { cloneRange() { return this; } };
const oldEditor = { isConnected: true };
const memoEditor = { isConnected: false };
const context = {
  lastFocusedTA: memoEditor,
  savedFormatTarget: { type: 'ce', ta: memoEditor, range: null },
  savedCERange: null,
  _savedFormatSel: null,
  tbIsFormatUtility: () => false,
  tbRangeInsideRoot: () => true,
};
vm.createContext(context);
vm.runInContext(`${html.slice(start, end)}\nthis.restore = tbRestoreFormatTarget;`, context);

assert.equal(context.restore({ type: 'ce', ta: oldEditor, range: oldRange }, memoEditor), true);
assert.equal(context.lastFocusedTA, oldEditor);
assert.equal(context.savedFormatTarget.ta, oldEditor);
assert.equal(context.savedCERange, oldRange);

const newEditor = { isConnected: true };
context.lastFocusedTA = newEditor;
context.savedFormatTarget = { type: 'ce', ta: newEditor, range: null };
assert.equal(context.restore({ type: 'ce', ta: oldEditor, range: oldRange }, memoEditor), false);
assert.equal(context.lastFocusedTA, newEditor, '다른 본문으로 이동한 뒤에는 이전 대상을 덮어쓰지 않아야 합니다.');

console.log('memo common format toolbar checks: OK');
