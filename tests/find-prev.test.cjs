const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');

// 이전 찾기(#182)
assert.match(html, /<button class="fr-btn" onclick="frFind\(-1\)">이전 찾기<\/button>\s*<button class="fr-btn" onclick="frFind\(\)">다음 찾기<\/button>/);
assert.match(html, /if\(event\.key==='Enter'\)frFind\(event\.shiftKey\?-1:1\)/, 'Shift+Enter 는 이전 찾기');
assert.match(html, /function frFind\(dir = 1\)/);
assert.match(html, /\(frFindIndex <= 0 \? count - 1 : frFindIndex - 1\)/, '첫 찾기·첫 결과에서 이전은 마지막 결과');
console.log('find prev checks: OK');
