const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');

// 글머리 해제(#178): 메뉴 맨 위 항목, CE 해제, textarea 접두어 제거, 같은 프리셋 재클릭 토글
assert.match(html, /<button type="button" class="tb-bullet-clear">[^']*글머리 해제<\/span><\/button><div class="tb-bullet-presets">/);
assert.match(html, /clearBtn\.disabled = !tbCanRemoveBullet\(\)/);
assert.match(html, /function tbRemoveCEBullet\(root, sourceRange\)/);
assert.match(html, /function tbUnwrapCEListItem\(li\)/);
assert.match(html, /tbCEListSymbolMatches\(currentList, symbol\)\) return tbRemoveCEBullet/, '같은 기호를 다시 누르면 해제');

// 접두어 제거(textarea 경로)
const start = html.indexOf('function tbBulletPrefixes()');
const end = html.indexOf('// 메뉴의 「글머리 해제」 활성 여부');
assert.ok(start > 0 && end > start);
const ctx = { TB_DEFAULT_BULLET: '•', tbGetCustomBulletSymbols: () => ['★', '→→'] };
vm.runInNewContext(`${html.slice(start, end)}\nthis.strip = tbStripBulletPrefix;`, ctx);
for (const [input, expected] of [['• 하나', '하나'], ['- 둘', '둘'], ['⛤ 셋', '셋'], ['● 넷', '넷'], ['★ 다섯', '다섯'], ['→→ 여섯', '여섯'], ['그냥', '그냥'], ['-없음', '-없음'], ['•붙음', '•붙음']]) {
  assert.equal(ctx.strip(input), expected, input);
}
console.log('bullet remove checks: OK');
