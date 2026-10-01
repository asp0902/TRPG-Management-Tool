const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');
const policyStart = html.indexOf('const BLOCK_DRAG_HANDLE_SELECTOR');
const policyEnd = html.indexOf('function syncBlockDraggableState', policyStart);
const policyCode = html.slice(policyStart, policyEnd).trim();
assert.ok(policyCode, '블록 드래그 시작점 판정을 찾을 수 없습니다.');

const context = { Node: { TEXT_NODE: 3 } };
vm.runInNewContext(policyCode, context);

const blockBody = { closest: () => null };
const dragHandle = { closest: selector => selector === '.block-drag-handle' ? dragHandle : null };
assert.equal(context.isBlockEditTarget(blockBody), true, '블록 내부 드래그는 텍스트 선택으로 처리해야 합니다.');
assert.equal(context.isBlockEditTarget(dragHandle), false, '전용 핸들 드래그는 블록 이동을 허용해야 합니다.');
assert.match(
  html,
  /function syncBlockDraggableState[\s\S]*?el\.draggable = false;[\s\S]*?BLOCK_DRAG_HANDLE_SELECTOR[\s\S]*?el\.draggable = true;/,
  '블록은 드래그 불가, 전용 핸들은 드래그 가능 상태로 동기화해야 합니다.',
);
assert.match(html, /#blocks-container \.block > \.block-drag-handle \{[\s\S]*?width:\s*8px;[\s\S]*?cursor:\s*grab;/,
  'SCRIPT 본문의 모든 블록에 8px 전용 드래그 핸들이 표시되어야 합니다.');
assert.match(html, /class="block-side-handle block-drag-handle" data-block-drag-handle/,
  '일반 블록 핸들은 명시적인 공통 class와 data attribute를 가져야 합니다.');
assert.match(html, /handle\.className = 'block-text-handle block-drag-handle';/,
  '텍스트와 구분선도 공통 드래그 핸들을 사용해야 합니다.');
assert.doesNotMatch(html, /class="callout-drag-handle"/,
  '콜아웃 내부에 중복 드래그 핸들이 남아 있으면 안 됩니다.');
assert.match(
  html,
  /\.block-actions\s*\{\s*position:\s*absolute;\s*top:\s*4px;\s*left:\s*100%;\s*right:\s*auto;/,
  '일반 블록의 플로팅 메뉴는 텍스트를 가리지 않는 우측 거터에 있어야 합니다.',
);

console.log('block drag selection checks: OK');
