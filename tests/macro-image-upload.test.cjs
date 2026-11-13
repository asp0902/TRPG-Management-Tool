const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13, 10)).join(String.fromCharCode(10));
const ua = html.indexOf('function getGitHubImageRawUrl'), ub = html.indexOf('// CSS 매크로 입력칸(.css-macro-textarea');
assert.ok(ua > 0 && ub > ua);
const upCalls = [];
const upCtx = {
  GITHUB_IMAGE_REPO: 'asp0902/TRPG-Management-Tool', GITHUB_IMAGE_BRANCH: 'images', GITHUB_IMAGE_MAX_BYTES: 25 * 1024 * 1024,
  GITHUB_IMAGE_EXT: { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/webp': 'webp' },
  encodeURIComponent, sha256Hex: async () => 'abc123', blobToBase64: async () => 'QQ==',
  githubSyncRequest: async (url, opts = {}) => { upCalls.push({ url, method: opts.method || 'GET', body: opts.body }); if (opts.method && upCtx.putError) throw new Error(upCtx.putError); return upCtx.exists && !opts.method ? {} : (opts.method ? {} : null); },
};
vm.createContext(upCtx);
vm.runInContext(html.slice(ua, ub) + '\nthis.up = uploadPublicImage; this.desc = describeImageUploadError;', upCtx);
(async () => {
  const blob = { type: 'image/png', size: 10 };
  let url = await upCtx.up(blob);
  assert.equal(url, 'https://raw.githubusercontent.com/asp0902/TRPG-Management-Tool/images/images/abc123.png');
  assert.deepEqual(upCalls.map(c => c.method), ['GET', 'PUT']);
  assert.ok(upCalls.every(c => c.url.startsWith('https://api.github.com/repos/asp0902/TRPG-Management-Tool/contents/images/abc123.png')));
  assert.equal(JSON.parse(upCalls[1].body).branch, 'images');
  upCalls.length = 0; upCtx.exists = true;
  url = await upCtx.up(blob);
  assert.deepEqual(upCalls.map(c => c.method), ['GET'], '이미 있으면 PUT 생략');
  await assert.rejects(upCtx.up({ type: 'image/svg+xml', size: 1 }), /형식 미지원/);
  await assert.rejects(upCtx.up({ type: 'image/png', size: 26 * 1024 * 1024 }), /크기 초과/);
  // images 브랜치가 없으면(422 Branch not found) 자동 생성하지 않고 안내
  upCtx.exists = false; upCtx.putError = 'GitHub 422: Branch images not found';
  await assert.rejects(upCtx.up(blob), /브랜치 없음/);
  upCtx.putError = 'GitHub 422: Invalid request. sha was not supplied.';
  assert.match(await upCtx.up(blob), /images\/abc123\.png$/, '그 밖의 422 는 이미 있는 것으로 본다');
  upCtx.putError = null;
  assert.match(upCtx.desc(new Error('이미지 브랜치 없음')), /`images` 브랜치가 없습니다/);
  assert.match(upCtx.desc(new Error('GitHub 401: Bad credentials')), /Contents 쓰기 권한/);
  assert.match(upCtx.desc(new Error('GitHub 403: Forbidden')), /Contents 쓰기 권한/);
  assert.match(upCtx.desc(new Error('GitHub 토큰이 없습니다.')), /토큰이 없습니다/);
  assert.match(html, /GITHUB_IMAGE_BRANCH === 'main'/);
  console.log('public image upload checks: OK');
})().catch(e => { console.error(e); process.exit(1); });
// #243: CSS 매크로·인트로 입력칸 이미지 입력 경로(붙여넣기·드롭·파일 선택 버튼), 시트에서는 업로드 호출 없음
assert.ok(html.includes("const MACRO_IMAGE_TARGET = '.css-macro-textarea, .intro-macro-ta';"));
assert.ok(html.includes("replacement = '[](' + await uploadPublicImage(blob) + ')';"));
assert.equal(html.split('onclick="pickMacroImage(this)"').length - 1, 2, '버튼은 CSS 매크로·인트로 두 곳');
const sheetFn = html.slice(html.indexOf('function setCharacterSheetImage('), html.indexOf('function openCharacterSheetImageMenu'));
assert.ok(!sheetFn.includes('uploadPublicImage'), '시트 이미지는 업로드하지 않는다(#233)');
console.log('macro image input checks: OK');
// #247: 공개 안내 confirm 없이 바로 업로드
const ins = html.slice(html.indexOf('async function insertMacroImage'), html.indexOf('function pickMacroImage'));
assert.ok(!ins.includes('confirm(') && !html.includes('MACRO_IMAGE_NOTICE_KEY'));
console.log('macro image no confirm checks: OK');
// #248: 카드·인트로·페이지 단위 이미지 드롭, Files 일 때만 개입
assert.ok(html.includes("const zone = el?.closest?.('.css-macro-card, .intro-split-wrap');"));
assert.ok(html.includes("macroDropHasFiles = event => [...(event.dataTransfer?.types || [])].includes('Files')"));
assert.ok(html.includes('이미지를 넣을 매크로 카드 위에 놓아 주세요'));
assert.ok(html.includes('for (const file of images) await insertMacroImage(ta, file);'));
assert.ok(html.includes('.css-macro-card.macro-drop-over, .intro-split-wrap.macro-drop-over {'));
console.log('macro image drop zone checks: OK');
