const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('TRPG 작업 관리 도구.html', 'utf8');
const start = html.indexOf('const TB_BULLET_BLOCK_SELECTOR');
const end = html.indexOf('function tbInsertBullet', start);
const source = html.slice(start, end);

assert.ok(source, 'contenteditable 글머리 DOM 변환 코드가 있어야 합니다.');
assert.match(source, /function tbExpandCEBulletRange/);
assert.match(source, /range\.setStartBefore\(startBlock\)/);
assert.match(source, /range\.setEndAfter\(endBlock\)/);
assert.match(source, /function tbBulletFragmentLines/);
assert.match(source, /node\.nodeName === 'BR'/);
assert.match(source, /function tbBuildCEBulletFragment/);
assert.match(source, /lines\.forEach\(line =>/);
assert.match(source, /const item = document\.createElement\('li'\)/);
assert.match(source, /if \(!tbBulletLineHasContent\(line\)\)/, '빈 줄에 글머리를 만들면 안 됩니다.');
assert.match(source, /currentList\.style\.listStyleType = marker/, '기존 목록 재적용은 중첩 없이 기호만 바꿔야 합니다.');
assert.match(html, /const TB_DEFAULT_BULLET = '•'/, '기본 글머리는 큰 채운 원이어야 합니다.');
assert.match(source, /const marker = symbol === TB_DEFAULT_BULLET \? 'disc' : tbBulletMarker\(symbol\)/, '기본 목록은 브라우저 중첩 기본값에 의존하지 않아야 합니다.');
assert.match(html, /\[contenteditable\] li \+ li \{\s*margin-top: 4px;/, '목록 항목 간격은 편집기 문단 간격과 같아야 합니다.');
assert.doesNotMatch(html, /\[contenteditable\] ul ul \{ list-style-type: circle; \}/, '중첩 단계로 기본 글머리 모양을 바꾸지 않아야 합니다.');
assert.doesNotMatch(html, /tbNormalizeLegacyBullet|tbNormalizeDefaultBulletLists|TB_LEGACY_DEFAULT_BULLET/, '기존 저장 내용을 자동 변환하면 안 됩니다.');
assert.doesNotMatch(html, /execCommand\('insertUnorderedList'/);

console.log('editor bullet range checks: OK');
