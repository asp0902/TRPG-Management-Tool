const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');

// 콜아웃 줄 간격(#185): 내용 줄이 자식 텍스트 블록으로 승격돼도 입력 직후와 같은 21.8px 피치
assert.match(html, /--callout-line-height-px: calc\(1\.7 \* 14px - 2px\);/);
assert.match(html, /\.callout-body > \.block-children-wrap > \.block\.block-text\.block-child \{\s*min-height: var\(--callout-line-height-px\);/);
assert.match(html, /\.block-text-ce \{\s*min-height: var\(--callout-line-height-px\);\s*line-height: var\(--callout-line-height-px\);\s*padding: 0 2px 0 0;/);
assert.match(html, /\.callout-body > \.block-children-wrap > \.block-gap\.gap-same-type \{\s*margin-block: -1\.5px;/);
assert.match(html, /gap-same-type \.block-gap-btn \{ pointer-events: none; \}/, '보이지 않는 + 버튼이 촘촘한 줄의 클릭을 가로채면 안 된다');
console.log('callout line pitch checks: OK');
