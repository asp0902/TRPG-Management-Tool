const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('TRPG 작업 관리 도구.html', 'utf8');
const rule = html.match(/#blocks-container \[contenteditable="true"\]::selection,[\s\S]*?\n\}/)?.[0] || '';

assert.match(rule, /#blocks-container \[contenteditable="true"\] \*::selection/);
assert.match(rule, /#rb-blocks-container \[contenteditable="true"\]::selection/);
assert.match(rule, /#rb-blocks-container \[contenteditable="true"\] \*::selection/);
assert.match(rule, /background: Highlight;/);
assert.match(rule, /color: HighlightText;/);
assert.match(rule, /-webkit-text-fill-color: HighlightText;/);
assert.match(rule, /-webkit-text-stroke-color: transparent;/);
assert.match(rule, /text-shadow: none;/);
assert.doesNotMatch(rule, /font-family|style\.fontFamily/);

console.log('editor selection contrast checks: OK');
