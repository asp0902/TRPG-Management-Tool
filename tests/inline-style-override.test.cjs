const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');

// 글자색·형광펜 덮어쓰기(#179): 조각 하위의 같은 속성 제거 → 조상 span 분할 → 빈/무속성 span 정리·병합
assert.match(html, /function tbStripStyleProp\(root, prop\)/);
assert.match(html, /function tbSplitStylePropAncestors\(span, prop, root\)/);
assert.match(html, /function tbCleanInlineSpans\(root\)/);
assert.match(html, /tbStripStyleProp\(fragment, prop\);\s*span\.appendChild\(fragment\);\s*freshRange\.insertNode\(span\);\s*tbSplitStylePropAncestors\(span, prop, ta\);/);
assert.match(html, /tbRangeFromTextOffsets\(ta, offsets\)/, '정리 뒤에도 선택을 글자 위치로 복원한다');
console.log('inline style override checks: OK');
