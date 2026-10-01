const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');

assert.match(html, /onclick="addMemo\(\)" title="현재 스크립트 메모 추가" aria-label="현재 스크립트 메모 추가">＋<\/button>/);
assert.doesNotMatch(html, />현재 \+<\/button>|>공통 \+<\/button>/);
assert.match(html, /id="memo-pop-share-\$\{memoId\}" onclick="toggleMemoShared\('\$\{memoId\}'\)"/);
assert.match(html, /const label = shared \? '현재 스크립트 메모로 지정' : '공통 메모로 지정'/);
assert.match(html, /<div class="memo-section-title">공통<\/div>[\s\S]*?<div class="memo-section-title">현재 스크립트<\/div>/);
assert.match(html, /sharedMemoOwner: \{ memos: \[\] \}/, '공통 메모는 기존 저장 state에 포함되어야 합니다.');
assert.equal((html.match(/sharedMemoOwner: getSharedMemoOwner\(\)/g) || []).length, 2, '공통 메모는 앱 저장과 백업 payload에 포함되어야 합니다.');
assert.match(html, /state\.sharedMemoOwner = raw\.sharedMemoOwner[\s\S]*?\{ memos: \[\] \}/, '공통 메모는 앱 재실행 시 복원되어야 합니다.');
assert.match(html, /state\.sharedMemoOwner = payload\.sharedMemoOwner/, '공통 메모는 백업 복원 시 반영되어야 합니다.');
assert.match(html, /getSharedMemos\(\)\.push\(\.\.\.payload\.sharedMemoOwner\.memos\)/, '병합 가져오기에서도 공통 메모를 보존해야 합니다.');

const helpers = html.match(/function getSharedMemoOwner\(\) \{[\s\S]*?function getMemos\(owner = getMemoOwner\(\)\) \{[\s\S]*?\n\}/)?.[0];
assert.ok(helpers, '공통 메모 저장 함수를 찾을 수 없습니다.');

const scenarioA = { id: 'a', memos: [{ id: 'local-a' }] };
const scenarioB = { id: 'b', memos: [] };
const state = { scenarios: [scenarioA, scenarioB], rulebooks: [], sharedMemoOwner: { memos: [{ id: 'shared' }] } };
const context = { state, getMemoOwner: () => scenarioA };
vm.createContext(context);
vm.runInContext(helpers, context);

assert.equal(context.getSharedMemos()[0].id, 'shared');
assert.equal(context.getMemoOwnerById('shared'), state.sharedMemoOwner);
assert.equal(context.getMemoOwnerById('local-a'), scenarioA);
assert.deepEqual(Array.from(context.getMemos(scenarioB)), []);
assert.equal(state.sharedMemoOwner.memos[0].id, 'shared', '시나리오 전환 후에도 공통 메모가 유지되어야 합니다.');

const toggleSource = html.match(/function isSharedMemo\(memoId\) \{[\s\S]*?\r?\n\}\r?\nfunction deleteMemo/)?.[0].replace(/\r?\nfunction deleteMemo$/, '');
assert.ok(toggleSource, '공통 메모 전환 함수를 찾을 수 없습니다.');
Object.assign(context, {
  currentPage: 'script',
  cur: () => scenarioA,
  document: { getElementById: () => null },
  saveMemoPop() {}, persist() {}, renderMemoPanel() {}, renderBlockMemoMarkers() {}, updateMemoSharedButton() {},
});
vm.runInContext(toggleSource, context);
const linkedMemo = { id: 'linked', title: '메모', body: '내용', blockRef: { blockId: 'block-1' } };
scenarioA.memos.push(linkedMemo);
context.toggleMemoShared('linked');
assert.equal(state.sharedMemoOwner.memos.at(-1), linkedMemo, '같은 메모 객체를 공통 배열로 이동해야 합니다.');
assert.equal(linkedMemo.blockRef.ownerId, 'a', '공통 블록 메모는 원래 스크립트 연결을 유지해야 합니다.');
context.toggleMemoShared('linked');
assert.equal(scenarioA.memos.at(-1), linkedMemo, '공통 메모를 현재 스크립트로 되돌려야 합니다.');
assert.deepEqual(linkedMemo.blockRef, { blockId: 'block-1', ownerId: 'a' }, '블록 참조를 보존해야 합니다.');

console.log('script shared memo tests passed');
