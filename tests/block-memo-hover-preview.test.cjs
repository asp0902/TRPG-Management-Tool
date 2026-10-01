const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');

assert.match(html, /\.block-memo-preview \{[\s\S]*?position: fixed;[\s\S]*?max-height:[\s\S]*?overflow: auto;/, '미리보기는 뷰포트 안에서 스크롤 가능해야 합니다.');
assert.match(html, /rbPositionFloatingAtPoint\(preview, rect\.right \+ 8, rect\.top, rect\)/, '미리보기는 블록을 피하는 공용 배치 함수를 사용해야 합니다.');
assert.match(html, /preview\.addEventListener\('mouseenter',[\s\S]*?preview\.addEventListener\('mouseleave'/, '블록에서 미리보기로 이동해도 닫히면 안 됩니다.');
assert.match(html, /document\.addEventListener\('scroll', hideBlockMemoPreview, true\)/, '스크롤 시 떠 있는 미리보기를 닫아야 합니다.');
assert.match(html, /document\.addEventListener\('dragstart', hideBlockMemoPreview\)/, '드래그 동작을 미리보기가 방해하면 안 됩니다.');

const fn = html.match(/function renderBlockMemoMarkers\(cid = currentPage === 'rulebook' \? 'rb-blocks-container' : 'blocks-container'\) \{[\s\S]*?\n\}/)?.[0];
assert.ok(fn, '블록 메모 연결 함수를 찾을 수 없습니다.');

const target = { dataset: {}, classList: { add(value) { this.value = value; } } };
const container = {
  querySelectorAll: () => [],
  querySelector: selector => selector.includes('data-id="block"') ? target : null,
};
const local = { id: 'local', blockRef: { blockId: 'block', cid: 'blocks-container' } };
const shared = { id: 'shared', blockRef: { blockId: 'block', cid: 'blocks-container', ownerId: 'script-a' } };
const foreign = { id: 'foreign', blockRef: { blockId: 'block', cid: 'blocks-container', ownerId: 'script-b' } };
const links = new WeakMap();
vm.runInNewContext(`${fn}; renderBlockMemoMarkers();`, {
  currentPage: 'script',
  currentChapterId: null,
  document: { getElementById: () => container },
  CSS: { escape: value => value },
  renderBlockTags: () => {},
  getMemoOwner: () => ({ id: 'script-a' }),
  getMemos: () => [local],
  getSharedMemos: () => [shared, foreign],
  blockMemoPreviewMemos: links,
});

assert.equal(target.dataset.memoCount, '2');
assert.deepEqual(Array.from(links.get(target), memo => memo.id), ['local', 'shared']);
assert.equal(target.classList.value, 'has-block-memo');

console.log('block memo hover preview tests passed');
