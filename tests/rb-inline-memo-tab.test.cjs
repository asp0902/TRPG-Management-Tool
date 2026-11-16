const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13, 10)).join(String.fromCharCode(10));
// #262: 메모 팝업에서 TAB / Shift+TAB 들여쓰기
const fn = html.slice(html.indexOf('function handleFormatIndentShortcut'), html.indexOf("document.addEventListener('keydown', handleFormatIndentShortcut"));
assert.ok(fn.includes("#page-record-timeline, #rb-inline-note-editor')"));
// 자동 저장이 앞쪽 들여쓰기(전각 공백)를 지우지 않는다: trim() 이 아니라 trimEnd()
const save = html.slice(html.indexOf('function rbAutoSaveInlineMemoEditor'), html.indexOf('function rbEnsureInlineMemoPopup'));
assert.ok(save.includes("sanitizeCssMacroPreviewHtml(body?.innerHTML || '').trimEnd();"));
console.log('rb inline memo tab: OK');
