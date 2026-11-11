const assert = require('node:assert/strict');
// vm 컨텍스트의 배열은 prototype 이 달라 deepEqual 이 실패하므로 JSON 으로 비교한다.
const same = (actual, expected) => assert.equal(JSON.stringify(actual), JSON.stringify(expected));
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');

// GM·PL 이미지 여러 장(#203): 단일 필드(gmImage / image)는 항상 images[0] 과 같다(구버전 호환).
const start = html.indexOf('function normalizeRecordImageList');
const end = html.indexOf('function normalizeRecordSessionTags');
assert.ok(start > 0 && end > start);
const ctx = { mkId: () => 'id1' };
vm.runInNewContext(`${html.slice(start, end)}\nthis.norm = normalizeRecordImageList; this.pl = mkRecordPlayer; this.gm = mkRecordGm; this.players = normalizeRecordPlayersData;`, ctx);

// 기존 단일 값 → [값]
let p = ctx.pl({ plName: 'A', image: 'x' });
same(p.images, ['x']); assert.equal(p.image, 'x');
let g = ctx.gm({ gmName: 'G', gmImage: 'g1' });
same(g.gmImages, ['g1']); assert.equal(g.gmImage, 'g1');
// images 가 있으면 단일 필드는 images[0]
p = ctx.pl({ plName: 'A', images: ['a', 'b', 'c'], image: 'a' });
same(p.images, ['a', 'b', 'c']); assert.equal(p.image, 'a');
g = ctx.gm({ gmImages: ['a', 'b'], gmImage: 'a' });
assert.equal(g.gmImage, 'a'); assert.equal(g.gmImages.length, 2);
// 중복·빈 값 제거
same(ctx.norm(['a', '', 'a', ' b ', null, 3]), ['a', 'b']);
// 구버전 기기에서 단일 필드만 바꿨다면 그 값이 대표(맨 앞)
p = ctx.pl({ images: ['a', 'b'], image: 'z' });
same(p.images, ['z', 'a', 'b']); assert.equal(p.image, 'z');
p = ctx.pl({ images: ['a', 'b'], image: 'b' });
same(p.images, ['b', 'a']);
// 이미지가 없으면 빈 배열 / ''
p = ctx.pl({ plName: 'A' });
same(p.images, []); assert.equal(p.image, '');
// 빈 행 판정은 images.length 기준: 이미지만 있는 행은 남고, 아무것도 없으면 사라진다
let players = ctx.players([{ images: ['a'] }, { plName: '', pcName: '' }]);
assert.equal(players.length, 1);
// 저장 코드는 단일 필드와 배열을 함께 기록한다
assert.match(html, /gmImages: readRecordImageList\(document\.getElementById\('rf-gm-image'\)\)/);
assert.match(html, /images: readRecordImageList\(row\.querySelector\('\.record-player-image'\)\)/);
console.log('record multi images checks: OK');
