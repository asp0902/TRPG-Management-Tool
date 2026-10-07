const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('TRPG 작업 관리 도구.html', 'utf8');

assert.match(html, /id="tb-list-ul-btn"[^>]+tbOpenBulletMenu\(this\)/);
assert.match(html, /function tbValidBulletSymbol\(value\)/);
assert.match(html, /#format-bar,#cp-panel,\.tb-ctx-menu/);
assert.match(html, /function tbApplyCEBullet\(root, sourceRange, symbol\)/);
assert.doesNotMatch(html, /execCommand\('insertUnorderedList'/, 'Chromium renderer crash path must not return.');
assert.match(html, /list\.style\.listStyleType = marker/);
assert.match(html, /root\.setRangeText\(next, lineStart, stop, 'select'\)/);
assert.match(html, /class="tb-bullet-custom"[\s\S]*?placeholder="기호 직접 입력"/);
assert.match(html, /state\.customBulletSymbols\.push\(symbol\)[\s\S]*?persist\(\)/);
assert.match(html, /\[\.\.\.TB_PRESET_BULLETS, \.\.\.tbGetCustomBulletSymbols\(\)\.filter\(/);
assert.match(html, /\.tb-bullet-preset \{[^}]*padding: 0 6px;/);
assert.doesNotMatch(html, /tb-bullet-default-label/);
assert.match(html, /preset\.append\(symbolEl, linesEl\)/);
assert.ok((html.match(/customBulletSymbols:/g) || []).length >= 6, '사용자 글머리 기호는 state, 저장, 백업, 가져오기에 포함되어야 합니다.');
assert.match(html, /#cp-native \{[\s\S]*?width: 28px; height: 28px;[\s\S]*?box-sizing: border-box/);
assert.match(html, /\.cp-icon-btn \{[\s\S]*?width: 28px; height: 28px; box-sizing: border-box/);

console.log('custom bullet and square color control checks: OK');
