const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13) + String.fromCharCode(10)).join(String.fromCharCode(10));
// 이미지 전용 공개 저장소 업로드(#219): sync 저장소와 분리, 같은 해시는 재업로드하지 않음
assert.match(html, /const GITHUB_IMAGE_REPO = 'asp0902\/TRPG-Management-Tool';/);
assert.match(html, /const GITHUB_IMAGE_BRANCH = 'images';/);
assert.match(html, /const GITHUB_SYNC_REPO = 'asp0902\/TRPG-Management-Tool-data';/);
assert.match(html, /label: '웹에 등록\(URL 만들기\)'/);
const a = html.indexOf('function getGitHubImageRawUrl'), b = html.indexOf('async function fetchGitHubBlob');
assert.ok(a > 0 && b > a);
const calls = [];
const ctx = {
  GITHUB_IMAGE_REPO: 'asp0902/TRPG-Management-Tool', GITHUB_IMAGE_BRANCH: 'images', GITHUB_IMAGE_MAX_BYTES: 25 * 1024 * 1024,
  GITHUB_IMAGE_EXT: { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/webp': 'webp' },
  encodeURIComponent, sha256Hex: async () => 'abc123', blobToBase64: async () => 'QQ==',
  githubSyncRequest: async (url, opts = {}) => { calls.push({ url, method: opts.method || 'GET', body: opts.body }); if (opts.method && ctx.putError) throw new Error(ctx.putError); return ctx.exists && !opts.method ? {} : (opts.method ? {} : null); },
};
vm.createContext(ctx);
vm.runInContext(html.slice(a, b) + '\nthis.up = uploadPublicImage; this.desc = describeImageUploadError;', ctx);
(async () => {
  const blob = { type: 'image/png', size: 10 };
  let url = await ctx.up(blob);
  assert.equal(url, 'https://raw.githubusercontent.com/asp0902/TRPG-Management-Tool/images/images/abc123.png');
  assert.deepEqual(calls.map(c => c.method), ['GET', 'PUT']);
  assert.ok(calls.every(c => c.url.startsWith('https://api.github.com/repos/asp0902/TRPG-Management-Tool/contents/images/abc123.png')));
  assert.equal(JSON.parse(calls[1].body).branch, 'images');
  calls.length = 0; ctx.exists = true;
  url = await ctx.up(blob);
  assert.deepEqual(calls.map(c => c.method), ['GET'], '이미 있으면 PUT 생략');
  await assert.rejects(ctx.up({ type: 'image/svg+xml', size: 1 }), /형식 미지원/);
  await assert.rejects(ctx.up({ type: 'image/png', size: 26 * 1024 * 1024 }), /크기 초과/);
  // images 브랜치가 없으면(422 Branch not found) 자동 생성하지 않고 안내
  ctx.exists = false; ctx.putError = 'GitHub 422: Branch images not found';
  await assert.rejects(ctx.up(blob), /브랜치 없음/);
  ctx.putError = 'GitHub 422: Invalid request. sha was not supplied.';
  assert.match(await ctx.up(blob), /images\/abc123\.png$/, '그 밖의 422 는 이미 있는 것으로 본다');
  ctx.putError = null;
  assert.match(ctx.desc(new Error('이미지 브랜치 없음')), /`images` 브랜치가 없습니다/);
  assert.match(ctx.desc(new Error('GitHub 403: Forbidden')), /asp0902\/TRPG-Management-Tool 저장소 쓰기 권한/);
  assert.match(ctx.desc(new Error('GitHub 토큰이 없습니다.')), /토큰이 없습니다/);
  assert.match(html, /GITHUB_IMAGE_BRANCH === 'main'/);
  console.log('public image upload checks: OK');
})().catch(e => { console.error(e); process.exit(1); });
