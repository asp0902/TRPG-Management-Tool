const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('TRPG 작업 관리 도구.html', 'utf8');

assert.match(html, /\.tb-block-type-wrap \{[\s\S]*?width: var\(--tb-block-type-w\); height: 24px; flex: 0 0 var\(--tb-block-type-w\);/);
assert.match(html, /\.tb-block-type-trigger \{[\s\S]*?justify-content: flex-start;[\s\S]*?width: var\(--tb-block-type-w\); height: 24px;/);
assert.match(html, /\.tb-block-type-trigger \.tb-control-chevron \{ position: absolute; right: 6px;/);
assert.match(html, /\.tb-block-type-menu \{[\s\S]*?width: var\(--tb-block-type-w\);/);
assert.match(html, /\.tb-block-type-option \{[\s\S]*?justify-content: center;[\s\S]*?height: 26px;[\s\S]*?font-size: 11px;[\s\S]*?text-align: center;/);
assert.match(html, /id="tb-block-type-label">단락<\/span><i class="fa-solid fa-chevron-down tb-control-chevron"/);
assert.match(html, /\.tb-size-inp \{[\s\S]*?width: 32px;[\s\S]*?padding: 0;[\s\S]*?text-align: center;/);
assert.match(html, /\.tb-font-trigger \{[\s\S]*?grid-template-columns: minmax\(0, 1fr\) 18px;/);
assert.match(html, /class="tb-lh-wrap">[\s\S]*?id="tb-lh"[\s\S]*?fa-chevron-down tb-control-chevron/);
assert.match(html, /#format-bar \.tb-select-lh \{[\s\S]*?padding: 0 18px 0 8px;[\s\S]*?background-image: none;/);
assert.match(html, /<select id="tb-block-type" hidden aria-hidden="true" tabindex="-1">/);
assert.match(html, /id="tb-block-type-trigger"[\s\S]*?aria-haspopup="listbox"[\s\S]*?onkeydown="tbBlockTypeTriggerKeydown\(event\)"/);
assert.match(html, /id="tb-block-type-menu" role="listbox"[\s\S]*?hidden/);
assert.match(html, /function tbBlockTypeMenuKeydown\(event\)/);

console.log('block type select layout checks: OK');
