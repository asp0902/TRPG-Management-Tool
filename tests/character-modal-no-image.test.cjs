const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');

// 캐릭터 모달에서 이미지 URL 필드 제거(#183): 저장 때 기존 ch.image 를 덮어쓰지 않는다
for (const gone of ['id="ch-image"', 'ch-image-file', 'ch-thumb-preview', 'updateChThumbPreview', 'onCharacterImageFile', 'ch-modal-img']) {
  assert.ok(!html.includes(gone), `${gone} 가 남아 있습니다.`);
}
const save = html.slice(html.indexOf('function saveCharacterModal()'), html.indexOf('function deleteCharacter()'));
assert.doesNotMatch(save, /ch\.image\s*=/, '편집 저장이 ch.image 를 덮어쓰면 안 된다');
assert.match(save, /image: '',/, '새 캐릭터 기본 이미지는 빈 값');
assert.match(save, /image: ch\.image \|\| ''/, '룰북 변경 시 새 시트도 기존 이미지를 쓴다');
console.log('character modal no image checks: OK');
