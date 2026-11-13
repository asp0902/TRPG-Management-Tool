const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split('\r\n').join('\n');
// 인트로 블록은 예시·안내 문구가 없다(#238). 공통 미리보기 안내 문구는 다른 화면용이라 유지.
assert.ok(!html.includes('인트로 매크로 코드를 입력하세요'));
assert.ok(html.includes("return String(value || '').trim() ? renderCssMacroPreviewHtml(value) : '';"));
assert.ok(html.includes('${renderIntroPreviewHtml(introContent)}'));
assert.ok(html.includes("preview.innerHTML = renderIntroPreviewHtml(value);"));
assert.ok(html.includes('매크로를 입력하면 여기에 미리보기가 표시됩니다.'));
console.log('intro no example text checks: OK');
