const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split('\r\n').join('\n');
// 북마크 카드 태그는 본문에 항상 두지 않고 태그 아이콘 팝오버로 본다(#235)
const card = html.slice(html.indexOf('function renderBookmarkPage()'), html.indexOf('function openBookmarkModal('));
assert.ok(!card.includes('bookmark-card-tags'), '카드 본문에 태그 영역 없음');
assert.ok(card.includes('fa-solid fa-tag') && card.includes('toggleBookmarkTagPopover('), '태그 있는 카드만 아이콘');
assert.ok(card.includes('closeBookmarkTagPopover();'), '다시 렌더링하면 닫힘');
assert.match(html, /function toggleBookmarkTagPopover\(bookmarkId, anchorEl\)/);
assert.match(html, /onclick="setBookmarkTagFilter\(this\.dataset\.tag\)"/);
assert.match(html, /closeBookmarkAttachPopover\(\);\n  closeBookmarkTagPopover\(\);\n  attachMemoEditingId/, '첨부 팝오버를 열면 태그 팝오버 닫힘');
console.log('bookmark tag popover checks: OK');
