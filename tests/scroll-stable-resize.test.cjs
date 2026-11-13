const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13, 10)).join(String.fromCharCode(10));
// 입력할 때 화면이 위로 튀지 않게(#250): auto-resize 가 높이를 접는 동안 스크롤 위치를 유지하고, 미리보기는 다시 그리는 동안 높이를 고정한다
assert.ok(html.includes('function withStableScroll(anchorEl, fn)'));
const resize = html.slice(html.indexOf('function btcpAutoResize'), html.indexOf('function refreshCssMacroTextareaHeights'));
assert.ok(resize.includes('withStableScroll(ta, () => {') && resize.includes("ta.style.height = '0px';"));
assert.ok(html.includes('function setPreviewHtmlStable(preview, html)') && html.includes("preview.style.minHeight = preview.offsetHeight + 'px';"));
assert.ok(html.includes('setPreviewHtmlStable(preview, renderMacroPreviewNoHint(value));\n  restoreCssMacroEditViewportAnchor'));
assert.ok(html.includes('withStableScroll(introTa, () => syncIntroMacroTextareaSizeInner(blockId));'));
console.log('scroll stable resize checks: OK');
