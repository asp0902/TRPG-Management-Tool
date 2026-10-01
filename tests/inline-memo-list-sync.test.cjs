const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');

assert.match(html, /span\.dataset\.memoId = memoId/, '선택 영역 표식은 메모 ID를 저장해야 합니다.');
assert.match(html, /memo\.inlineMemo = true;[\s\S]*?getSharedMemos\(\) : getMemos\(\)/, '선택 영역 메모는 기존 전용 또는 공통 목록에 저장되어야 합니다.');
assert.match(html, /rbSyncInlineMemoViews\(memoId\)/, '메모장 편집은 선택 영역 메모에도 반영되어야 합니다.');
assert.match(html, /rbRemoveInlineMemoById\(memoId\);[\s\S]*?owner\.memos = owner\.memos\.filter/, '목록 삭제는 원문 표식과 저장 데이터를 함께 정리해야 합니다.');
assert.match(html, /rbHydrateInlineMemoLinks\(c\);/, '재진입 시 저장된 메모 ID 연결을 복원해야 합니다.');

const fn = html.match(/function rbGetInlineMemoCtxItems\(e, cid = ''\) \{[\s\S]*?\n\}/)?.[0];
assert.ok(fn, '선택 영역 메모 메뉴 함수를 찾을 수 없습니다.');

const range = { cloneRange: () => range };
const editable = {};
const opened = [];
const context = {
  currentPage: 'script',
  lastFocusedTA: null,
  rbCanUseInlineMemo: () => true,
  rbGetInlineMemoEditable: () => editable,
  rbGetSelectedInlineMemoRange: () => range,
  rbOpenInlineMemoEditor: options => opened.push(options),
  rbRemoveInlineMemo: () => {},
};
vm.createContext(context);
vm.runInContext(`${fn}; this.run = rbGetInlineMemoCtxItems;`, context);

const event = { target: { closest: () => null }, clientX: 10, clientY: 20 };
let items = context.run(event, 'blocks-container');
assert.deepEqual(Array.from(items, item => item.label), [
  '선택 영역 메모 추가 (현재 스크립트)',
  '선택 영역 메모 추가 (공통)',
]);
items[0].action();
items[1].action();
assert.equal(opened[0].shared, false);
assert.equal(opened[1].shared, true);

context.currentPage = 'rulebook';
items = context.run(event, 'rb-blocks-container');
assert.equal(items.length, 1);
assert.equal(items[0].label, '선택 영역 메모 추가');

const deleteFn = html.match(/function deleteMemo\(memoId, ev\) \{[\s\S]*?\n\}/)?.[0];
assert.ok(deleteFn, '목록 메모 삭제 함수를 찾을 수 없습니다.');
const owner = { memos: [{ id: 'linked' }, { id: 'other' }] };
let removedMarker = '';
vm.runInNewContext(`${deleteFn}; deleteMemo('linked');`, {
  getMemoOwnerById: () => owner,
  rbRemoveInlineMemoById: id => { removedMarker = id; },
  persist: () => {},
  renderMemoPanel: () => {},
  document: { getElementById: () => null },
});
assert.equal(removedMarker, 'linked');
assert.deepEqual(owner.memos, [{ id: 'other' }]);

console.log('inline memo list sync tests passed');
