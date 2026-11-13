const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');
// 인세인 긴 글 칸: 저장값은 매크로 그대로, 포커스가 없을 때만 서식 미리보기(#232)
assert.ok(html.includes('const INSANE_MACRO_RE = '));
assert.match(html, /function syncInsaneMacroPreviews\(root\)/);
assert.match(html, /preview\.innerHTML = renderCssMacroPreviewHtml\(ta\.value\)/);
assert.match(html, /textarea\.is-macro-hidden \{ display: none; \}/);
// 내보내기는 미리보기를 제거하고 원문 textarea 를 그대로 둔다
assert.ok(html.includes("clone.querySelectorAll('.sh-macro-preview, .sh-macro-editor, .sh-macro-rawbadge').forEach(el => el.remove());")); // #251: 편집기도 함께 제거
console.log('insane macro preview checks: OK');
