const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');
const helper = html.slice(html.indexOf('function moveRulebook(id,'), html.indexOf('function _rbSuppleListHtml'));
const context = {};

vm.runInNewContext(`
  const state = { rulebooks: [
    { id: 'a', parentId: null },
    { id: 'a-supple', parentId: 'a' },
    { id: 'b', parentId: null },
    { id: 'b-supple', parentId: 'b' },
  ] };
  let query = '';
  let saves = 0;
  let savedIds = [];
  let pageRenders = 0;
  let listRenders = 0;
  const document = { getElementById: () => ({ value: query }) };
  function persist() { saves += 1; savedIds = state.rulebooks.map(item => item.id); }
  function renderRulebookPage() { pageRenders += 1; }
  function renderList() { listRenders += 1; }
  ${helper}
  const moved = moveRulebook('b', -1);
  const blockedAtTop = moveRulebook('b', -1);
  query = '검색 중';
  const blockedBySearch = moveRulebook('a', -1);
  result = { ids: state.rulebooks.map(item => item.id), savedIds, parents: state.rulebooks.map(item => item.parentId), moved, blockedAtTop, blockedBySearch, saves, pageRenders, listRenders };
`, context);

assert.deepEqual(Array.from(context.result.ids), ['b', 'a-supple', 'a', 'b-supple']);
assert.deepEqual(Array.from(context.result.savedIds), Array.from(context.result.ids));
assert.deepEqual(Array.from(context.result.parents), [null, 'a', null, 'b']);
assert.deepEqual({ ...context.result, ids: undefined, savedIds: undefined, parents: undefined }, {
  ids: undefined,
  savedIds: undefined,
  parents: undefined,
  moved: true,
  blockedAtTop: false,
  blockedBySearch: false,
  saves: 1,
  pageRenders: 1,
  listRenders: 1,
});
assert.doesNotMatch(html, /compareRulebookSidebarItems/, '사이드바 제목순 정렬이 남아 있습니다.');
assert.match(html, /onclick="moveRulebook\([\s\S]*?title="아래로 이동"/, '최상위 룰북 이동 버튼이 필요합니다.');
assert.match(html, /class="rulebook-drag-handle" draggable="' \+ \(q \? 'false' : 'true'\)/, '검색 중에는 드래그 핸들이 비활성화되어야 합니다.');
assert.match(html, /function reorderRulebook\(sourceId, targetId, placeAfter\)/);

const dragContext = {};
vm.runInNewContext(`
  const state = { rulebooks: [
    { id: 'a', parentId: null },
    { id: 'a-supple', parentId: 'a' },
    { id: 'b', parentId: null },
    { id: 'b-supple', parentId: 'b' },
    { id: 'c', parentId: null },
  ] };
  let saves = 0, pageRenders = 0, listRenders = 0;
  const document = { getElementById: () => ({ value: '' }), querySelectorAll: () => [] };
  function persist() { saves += 1; }
  function renderRulebookPage() { pageRenders += 1; }
  function renderList() { listRenders += 1; }
  ${helper}
  const moved = reorderRulebook('c', 'a', false);
  dragResult = { ids: state.rulebooks.map(item => item.id), parents: state.rulebooks.map(item => item.parentId), moved, saves, pageRenders, listRenders };
`, dragContext);
assert.deepEqual(Array.from(dragContext.dragResult.ids), ['c', 'a-supple', 'a', 'b-supple', 'b']);
assert.deepEqual(Array.from(dragContext.dragResult.parents), [null, 'a', null, 'b', null]);
assert.deepEqual({ ...dragContext.dragResult, ids: undefined, parents: undefined }, { ids: undefined, parents: undefined, moved: true, saves: 1, pageRenders: 1, listRenders: 1 });

console.log('rulebook order checks: OK');
