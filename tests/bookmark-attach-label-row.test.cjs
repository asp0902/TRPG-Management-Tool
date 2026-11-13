const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split('\r\n').join('\n');
// 북마크 팝업: 「＋ 파일 첨부」는 박스 밖, 「첨부 파일」 라벨 줄 오른쪽(#239)
const row = html.slice(html.indexOf('<div class="bookmark-form-label-row">'));
const box = row.slice(row.indexOf('<div class="bookmark-attach-box"'), row.indexOf('<div class="bookmark-attach-box"') + 400);
assert.ok(row.indexOf('clp-attach-add') < row.indexOf('<div class="bookmark-attach-box"'), '버튼이 박스보다 앞(밖)');
assert.ok(!box.includes('clp-attach-add') && !box.includes('bookmark-attach-input'), '박스 안에는 상태·목록만');
assert.ok(box.includes('bookmark-attach-status') && box.includes('bookmark-attach-list'));
assert.ok(html.includes("scrollId: 'bookmark-attach-box'"));
console.log('bookmark attach label row checks: OK');
