const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');
// 내보낸 인세인 HTML 의 색·판정치 동기화 스크립트(#229)
assert.match(html, /const standaloneInsaneScript = activeSheet\.templateKey === 'insane'/);
assert.match(html, /<script>\$\{standaloneCocScript\}\$\{standaloneInsaneScript\}/);
for (const token of ["toggle('is-owned'", "toggle('is-fear'", "toggle('is-open'", "addEventListener('change', syncStandaloneInsane)", "addEventListener('input', syncStandaloneInsane)"]) assert.ok(html.includes(token), token);
console.log('insane standalone sync checks: OK');
