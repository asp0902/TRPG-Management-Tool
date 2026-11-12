const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split('\r\n').join('\n');
// 코코포리아 복사 뒤 이미지 파일 저장(#234): 복사가 먼저, 저장은 .then 안에서, 토스트는 하나
assert.match(html, /async function downloadCharacterSheetImage\(character, sheet\)/);
assert.doesNotMatch(html, /notifySheetApiIconOmitted/);
for (const fn of ['copyCharacterSheetAPI', 'copyInsaneSheetTransfer']) {
  const body = html.slice(html.indexOf('function ' + fn + '('), html.indexOf('function ' + fn + '(') + 1500);
  const copy = body.indexOf('_copyTextWithFallback('), save = body.indexOf('saveCharacterSheetImageAfterCopy(ch, sheet)');
  assert.ok(copy > 0 && save > copy, fn + ': 복사 뒤에 저장');
}
assert.ok(html.includes("a.download = name"));
console.log('cocofolia image download checks: OK');
