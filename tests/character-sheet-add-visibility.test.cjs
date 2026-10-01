const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');

assert.match(
  html,
  /var tabsWrap = '<div class="sh-tabs-wrap">' \+ addSelect \+ [^;]*'<div class="sh-tabs">' \+ tabsHtml/,
  '시트 추가 컨트롤은 overflow 가능한 탭 목록보다 먼저 배치되어야 합니다.',
);
assert.match(html, /\.sh-tabs-wrap \{[^}]*flex-wrap: wrap;/);
assert.match(html, /\.sh-tabs \{[^}]*min-width: 0;/);
assert.match(html, /\.sh-add-select \{[^}]*flex-shrink: 0;/);

console.log('character sheet add visibility checks: OK');
