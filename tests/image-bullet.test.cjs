const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');

// 이미지 글머리(#177): 본문에는 id 만, 그림은 state.customBulletImages
const start = html.indexOf('const TB_IMG_BULLET_PREFIX');
const end = html.indexOf('function tbRefreshBulletImageStyles');
assert.ok(start > 0 && end > start);
const state = { customBulletImages: [] };
const ctx = { state };
vm.runInNewContext(`${html.slice(start, end)}\nthis.norm = tbNormalizeBulletImages; this.get = tbGetBulletImages; this.id = tbBulletImageId; this.safe = tbSafeBulletId;`, ctx);

assert.equal(ctx.id('<img>abc'), 'abc');
assert.equal(ctx.id('•'), '');
assert.equal(ctx.safe('../x'), '');
assert.equal(ctx.safe('img-1_a'), 'img-1_a');
const png = 'data:image/png;base64,AA==';
assert.equal(JSON.stringify(ctx.norm([
  { id: 'a', name: 'n', dataUrl: png },
  { id: 'a', name: 'dup', dataUrl: png },
  { id: 'b', name: 'bad', dataUrl: 'data:text/html,<b>' },
  { id: '../c', name: 'bad', dataUrl: png },
  { id: 'elder-sign', deleted: true },
]).map(item => item.id)), JSON.stringify(['a', 'elder-sign']));

// 엘더 사인: 건드리기 전에는 내장본이 맨 앞에, 삭제 표시가 있으면 다시 만들지 않는다
state.customBulletImages = [];
assert.equal(ctx.get()[0].id, 'elder-sign');
assert.equal(ctx.get()[0].builtin, true);
state.customBulletImages = [{ id: 'elder-sign', name: '', deleted: true }];
assert.equal(ctx.get().some(item => item.id === 'elder-sign'), false, '삭제한 엘더 사인은 되살아나지 않는다');
state.customBulletImages = [{ id: 'elder-sign', name: '엘더 사인', dataUrl: png }];
assert.equal(ctx.get().filter(item => item.id === 'elder-sign').length, 1);
assert.equal(ctx.get()[0].builtin, undefined, '교체한 엘더 사인은 등록 이미지');

// 연결: 적용 시 id 만 dataset 에, 선택자·메뉴·보존
assert.match(html, /function tbSetListBullet\(list, symbol\)/);
assert.match(html, /list\.dataset\.tbBulletImg = tbBulletImageId\(symbol\)/);
assert.match(html, /ul\[data-tb-bullet="image"\]\[data-tb-bullet-img="'/);
assert.match(html, /ul\[data-tb-bullet="elder-sign"\]/, '기존 문서의 elder-sign 목록 호환');
assert.match(html, /const allowedAttrs = new Set\(\['data-tb-bullet', 'data-tb-bullet-img',/);
assert.match(html, /customBulletImages: tbNormalizeBulletImages\(data\.customBulletImages\)/);
assert.match(html, /menu\.addEventListener\('paste'/);
assert.doesNotMatch(html, /--tb-elder-sign/, '엘더 사인 전용 CSS 변수는 이미지 항목으로 옮겼다');
console.log('image bullet checks: OK');
