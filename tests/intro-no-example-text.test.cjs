const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split('\r\n').join('\n');
// 인트로 블록은 예시·안내 문구가 없다(#238). 공통 미리보기 안내 문구는 다른 화면용이라 유지.
assert.ok(!html.includes('인트로 매크로 코드를 입력하세요'));
assert.ok(html.includes("return String(value || '').trim() ? renderCssMacroPreviewHtml(value) : '';"));
assert.ok(html.includes('${renderMacroPreviewNoHint(introContent)}'));
assert.ok(html.includes("setPreviewHtmlStable(preview, renderMacroPreviewNoHint(value));")); // #250 에서 스크롤 유지 래퍼를 거치게 바뀜
assert.ok(html.includes('매크로를 입력하면 여기에 미리보기가 표시됩니다.'));
console.log('intro no example text checks: OK');
// #246: CSS MACRO 페이지도 같은 방식(입력칸 placeholder 없음, 미리보기 빈 상태 문구 없음). 공통 렌더러 문구는 다른 화면용이라 유지.
assert.ok(!html.includes('Roll20용 CSS 매크로를 입력하세요'));
assert.ok(html.includes('data-css-macro-id="${item.id}">${renderMacroPreviewNoHint(getCssMacroResolvedContent(item))}</div>'));
assert.ok(html.includes('setPreviewHtmlStable(preview, renderMacroPreviewNoHint(value));\n  restoreCssMacroEditViewportAnchor'));
console.log('css macro no example text checks: OK');
