const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split('\r\n').join('\n');
// 웹 업로드는 껐고(#233), 예전에 올린 raw URL 만 시작할 때 dataURL 로 되돌린다.
assert.doesNotMatch(html, /GITHUB_IMAGE_BRANCH|uploadPublicImage|describeImageUploadError/);
const a = html.indexOf('let webImageRestoreRunning'), b = html.indexOf('function onCharacterSheetImageFile');
assert.ok(a > 0 && b > a);
const P = 'https://raw.githubusercontent.com/asp0902/TRPG-Management-Tool/images/';
const ctx = { LEGACY_WEB_IMAGE_URL_PREFIX: P, toasts: [], persisted: 0, urls: [], _openCharacterSheetId: null,
  state: { characters: [] }, persist() { ctx.persisted++; }, showToast(m) { ctx.toasts.push(m); }, renderCharacterSheet() {},
  readBlobAsDataUrl: async blob => 'data:' + blob.type + ';base64,X',
  fetch: async url => { ctx.urls.push(url); if (ctx.fail) throw new Error('net'); return { ok: !/404/.test(url), status: 200, blob: async () => ({ type: /txt/.test(url) ? 'text/plain' : 'image/png' }) }; } };
vm.createContext(ctx);
vm.runInContext(html.slice(a, b) + '\nthis.run = restoreWebCharacterImages;', ctx);
(async () => {
  ctx.state.characters = [
    { id: 'c1', image: P + 'images/a.png', sheets: [{ id: 's1', image: P + 'images/a.png' }, { id: 's2', image: 'https://example.com/x.png' }, { id: 's3', image: 'data:image/png;base64,Q' }] },
    { id: 'c2', image: '', sheets: [{ id: 's4', image: P + 'images/404.png' }, { id: 's5', image: P + 'images/t.txt' }] },
  ];
  ctx.fail = true; await ctx.run();
  assert.equal(ctx.persisted, 0); assert.equal(ctx.toasts.length, 0); assert.equal(ctx.state.characters[0].sheets[0].image, P + 'images/a.png', '실패하면 URL 유지');
  ctx.fail = false; ctx.urls.length = 0; await ctx.run();
  const [c1, c2] = ctx.state.characters;
  assert.equal(c1.image, 'data:image/png;base64,X'); assert.equal(c1.sheets[0].image, 'data:image/png;base64,X');
  assert.equal(c1.sheets[1].image, 'https://example.com/x.png', '다른 URL 은 그대로'); assert.equal(c1.sheets[2].image, 'data:image/png;base64,Q');
  assert.equal(c2.sheets[0].image, P + 'images/404.png'); assert.equal(c2.sheets[1].image, P + 'images/t.txt', '이미지 아니면 유지');
  assert.equal(ctx.urls.filter(u => u.endsWith('a.png')).length, 1, '같은 URL 은 한 번만 fetch');
  assert.equal(ctx.persisted, 1); assert.deepEqual(ctx.toasts, ['웹 이미지 2개를 앱 데이터로 되돌렸습니다']);
  console.log('web image restore checks: OK');
})().catch(e => { console.error(e); process.exit(1); });
