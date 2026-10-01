const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');

assert.match(html, /\.rb-inline-note-editor-title \{[^}]*cursor: grab;[^}]*user-select: none;/, 'RULEBOOK 메모 헤더가 드래그 영역임을 표시해야 합니다.');
assert.match(html, /querySelector\('\.rb-inline-note-editor-title'\)\.addEventListener\('mousedown', rbStartInlineMemoDrag\)/, '헤더에만 드래그 시작을 연결해야 합니다.');
assert.match(html, /event\.target\.closest\?\.\('button,input,textarea,select,\[contenteditable="true"\]'\)/, '입력 요소 조작으로 드래그를 시작하면 안 됩니다.');
assert.match(html, /editor\._avoidRect = null/, '수동 이동 후 자동 배치가 위치를 되돌리면 안 됩니다.');
assert.match(html, /rbStopInlineMemoDrag\(\);[\s\S]*?rbInlineMemoEditorState = null/, '모달 종료 시 드래그 리스너를 정리해야 합니다.');

const start = html.indexOf('function rbStartInlineMemoDrag(event)');
const end = html.indexOf('\nfunction rbOpenInlineMemoEditor(', start);
assert.ok(start >= 0 && end > start, 'RULEBOOK 메모 드래그 함수를 찾을 수 있어야 합니다.');

const listeners = new Map();
const editor = {
  _avoidRect: {},
  style: {},
  getBoundingClientRect: () => ({ left: 100, top: 100, width: 270, height: 160 }),
};
const context = {
  rbInlineMemoDragState: null,
  window: { innerWidth: 1000, innerHeight: 800 },
  document: {
    addEventListener: (name, fn) => listeners.set(name, fn),
    removeEventListener: name => listeners.delete(name),
  },
};
vm.createContext(context);
vm.runInContext(`${html.slice(start, end)}\nthis.start = rbStartInlineMemoDrag; this.move = rbMoveInlineMemoEditor; this.stop = rbStopInlineMemoDrag; this.dragState = () => rbInlineMemoDragState;`, context);

let prevented = false;
context.start({
  button: 0,
  target: { closest: () => ({}) },
  currentTarget: { closest: () => editor },
  preventDefault: () => { prevented = true; },
  clientX: 110,
  clientY: 110,
});
assert.equal(prevented, false, '입력 요소에서는 드래그를 시작하면 안 됩니다.');
assert.equal(context.dragState(), null);

context.start({
  button: 0,
  target: { closest: () => null },
  currentTarget: { closest: () => editor },
  preventDefault: () => { prevented = true; },
  clientX: 110,
  clientY: 110,
});
assert.equal(prevented, true);
assert.equal(editor._avoidRect, null);
assert.ok(context.dragState());

context.move({ clientX: 2000, clientY: 2000 });
assert.equal(editor.style.left, '722px');
assert.equal(editor.style.top, '632px');
context.stop();
assert.equal(context.dragState(), null);
assert.equal(listeners.has('mousemove'), false);

console.log('rulebook inline memo drag checks: OK');
