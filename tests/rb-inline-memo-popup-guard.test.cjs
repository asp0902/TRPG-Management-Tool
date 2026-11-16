const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13, 10)).join(String.fromCharCode(10));
// #261: 편집 팝업이 열려 있으면 메모 미리보기 말풍선을 띄우지 않는다
const show = html.slice(html.indexOf('function rbShowInlineMemoPopup'), html.indexOf('function rbHideInlineMemoPopup'));
assert.ok(/rb-inline-note-editor[\s\S]*?display !== 'none'\) \{ rbHideInlineMemoPopup\(\); return; \}/.test(show.split('rbGetInlineMemoHtml')[0]));
const open = html.slice(html.indexOf('function rbOpenInlineMemoEditor'), html.indexOf('const editor = rbEnsureInlineMemoEditor();', html.indexOf('function rbOpenInlineMemoEditor')));
assert.ok(open.includes('rbHideInlineMemoPopup();'));
console.log('rb inline memo popup guard: OK');
