const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');
const helper = html.slice(html.indexOf('function moveRulebookSupplement'), html.indexOf('function _rbSuppleListHtml'));
const context = {};

vm.runInNewContext(`
  const state = { rulebooks: [
    { id: 'core', parentId: null },
    { id: 'a', parentId: 'core' },
    { id: 'other-core', parentId: null },
    { id: 'b', parentId: 'core' },
    { id: 'other-supple', parentId: 'other-core' },
  ] };
  let saves = 0;
  let pageRenders = 0;
  let listRenders = 0;
  function persist() { saves += 1; }
  function renderRulebookPage() { pageRenders += 1; }
  function renderList() { listRenders += 1; }
  ${helper}
  const moved = moveRulebookSupplement('b', -1);
  const blocked = moveRulebookSupplement('b', -1);
  result = { ids: state.rulebooks.map(item => item.id), moved, blocked, saves, pageRenders, listRenders };
`, context);

assert.deepEqual(Array.from(context.result.ids), ['core', 'b', 'other-core', 'a', 'other-supple']);
assert.deepEqual({ ...context.result, ids: undefined }, {
  ids: undefined,
  moved: true,
  blocked: false,
  saves: 1,
  pageRenders: 1,
  listRenders: 1,
});
assert.match(html, /title="위로 이동"[\s\S]*?title="아래로 이동"/, '서플리먼트 순서 이동 버튼이 필요합니다.');

console.log('rulebook supplement order checks: OK');
