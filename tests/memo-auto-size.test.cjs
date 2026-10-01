const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');

assert.match(html, /\.memo-popup \{[\s\S]*?height: auto;[\s\S]*?max-height: calc\(100vh - 24px\)/, '일반 메모 팝업은 뷰포트 제한 안에서 자동 높이를 써야 합니다.');
assert.match(html, /\.memo-popup-body \{[\s\S]*?min-height: 48px; max-height: calc\(100dvh - 88px\)[\s\S]*?overflow-y: auto/, '긴 일반 메모는 최대 높이 뒤 스크롤되어야 합니다.');
assert.match(html, /\.memo-popup:not\(\[data-manual-size="1"\]\) \.memo-popup-body \{ flex: 0 1 auto; \}/, '자동 높이 팝업의 본문은 내용 높이를 따라야 합니다.');
assert.match(html, /\.rb-inline-note-editor \{[\s\S]*?max-height: calc\(100dvh - 16px\)[\s\S]*?overflow: auto/, '선택 영역 메모는 외곽 모달에서 스크롤되어야 합니다.');
assert.match(html, /\.rb-inline-note-editor-body \{[\s\S]*?min-height: min\(44px,[\s\S]*?max-height: none[\s\S]*?overflow: visible/, '선택 영역 메모 입력칸에는 중복 스크롤이 없어야 합니다.');
assert.match(html, /el\.dataset\.manualSize = '1'/, '수동 리사이즈를 자동 크기보다 우선해야 합니다.');
assert.match(html, /window\.addEventListener\('resize', fitOpenMemoPopups\)/, '창 크기 변경 시 열린 메모를 보정해야 합니다.');

const start = html.indexOf('function fitMemoPopup(popup)');
const end = html.indexOf('\nfunction fitOpenMemoPopups()', start);
assert.ok(start >= 0 && end > start, '메모 크기 보정 함수를 찾을 수 있어야 합니다.');
const context = { window: { innerWidth: 1000, innerHeight: 800 } };
vm.createContext(context);
vm.runInContext(`${html.slice(start, end)}\nthis.fit = fitMemoPopup;`, context);

const popup = {
  isConnected: true,
  dataset: {},
  style: { height: '260px' },
  getBoundingClientRect: () => ({ left: 900, top: 700, width: 320, height: 260 }),
};
context.fit(popup);
assert.equal(popup.style.height, 'auto');
assert.equal(popup.style.left, '668px');
assert.equal(popup.style.top, '528px');

popup.dataset.manualSize = '1';
popup.style.height = '220px';
context.fit(popup);
assert.equal(popup.style.height, '220px', '사용자가 조절한 높이는 자동 초기화하지 않아야 합니다.');

console.log('memo auto size checks: OK');
