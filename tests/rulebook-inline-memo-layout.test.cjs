const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');

assert.match(html, /\.rb-inline-note-editor \{[\s\S]*?overflow: auto;[\s\S]*?scrollbar-gutter: stable both-edges;[\s\S]*?padding: 10px;/, '스크롤은 동일한 좌우 여백을 가진 외곽 모달에 있어야 합니다.');
assert.match(html, /\.rb-inline-note-editor-body \{[\s\S]*?max-height: none;[\s\S]*?overflow: visible;/, '입력칸 내부 스크롤은 없어야 합니다.');
assert.match(html, /options\.range\?\.getBoundingClientRect\?\.\(\) \|\| options\.noteEl\?\.getBoundingClientRect\?\.\(\)/, '선택 영역이나 기존 메모 위치를 배치 기준으로 사용해야 합니다.');

const start = html.indexOf('function rbPositionFloatingAtPoint(');
const end = html.indexOf('\nfunction rbOpenInlineMemoEditor(', start);
assert.ok(start >= 0 && end > start, 'RULEBOOK 메모 배치 함수를 찾을 수 있어야 합니다.');

const context = { window: { innerWidth: 1000, innerHeight: 800 } };
vm.createContext(context);
vm.runInContext(`${html.slice(start, end)}\nthis.position = rbPositionFloatingAtPoint;`, context);

const style = {};
const editor = {
  style,
  getBoundingClientRect: () => ({ width: 270, height: 160 }),
};
const selection = { left: 300, right: 500, top: 300, bottom: 340, width: 200, height: 40 };
context.position(editor, 350, 320, selection);
assert.equal(style.left, '300px');
assert.equal(style.top, '348px', '공간이 있으면 선택 영역 아래에 배치해야 합니다.');

const bottomSelection = { left: 300, right: 500, top: 700, bottom: 740, width: 200, height: 40 };
context.position(editor, 350, 720, bottomSelection);
assert.equal(style.left, '300px');
assert.equal(style.top, '532px', '아래 공간이 없으면 선택 영역 위에 배치해야 합니다.');

console.log('rulebook inline memo layout checks: OK');
