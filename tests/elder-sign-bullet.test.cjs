const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');

// 엘더 사인 글머리(#176): SVG 마스크 + currentColor, ul[data-tb-bullet="elder-sign"]
assert.match(html, /ul\[data-tb-bullet="elder-sign"\] > li::before \{[^}]*background: currentColor[^}]*mask: var\(--tb-elder-sign\)/);
assert.match(html, /ul\[data-tb-bullet="elder-sign"\] \{ list-style: none; \}/);
assert.match(html, /const TB_ELDER_SIGN = '<elder-sign>';/);
assert.match(html, /return symbol === TB_DEFAULT_BULLET \? 'disc' : \(symbol === TB_ELDER_SIGN \? 'none'/);
assert.match(html, /elder\.onclick = \(\) => \{ if \(tbInsertBullet\(TB_ELDER_SIGN\)\) tbCloseCtxMenu\(\); \};/);
assert.doesNotMatch(html, /dataset\.tbBullet = symbol === TB_DEFAULT_BULLET/, '글머리 종류는 tbBulletKind 로만 정한다');
assert.match(html, /const allowedAttrs = new Set\(\['data-tb-bullet',/, '미리보기 sanitizer 가 data-tb-bullet 을 지우면 글머리가 사라진다');
console.log('elder sign bullet checks: OK');
