const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');

// 분기점 내용 블록 항목 아래 대사 하위 블록을 항목 사이로 올릴 수 있다(#189)
assert.match(html, /function promoteIbChildSpeechOut\(info, dir\)/);
assert.match(html, /if \(to < 0 \|\| to >= arr\.length\) \{[\s\S]*?promoteIbChildSpeechOut\(info, dir\);\s*return;/, '맨 앞·뒤에서 이동하면 승격');
const body = html.slice(html.indexOf('function promoteIbChildSpeechOut'), html.indexOf("function moveBlock(id, dir, cid = 'blocks-container')"));
assert.match(body, /innerBlock\.items\.splice\(index, 0, item\)/, '조회로 바뀔 수 있는 배열이 아니라 객체로 바로 고친다');
assert.match(body, /type: 'speech'/);
assert.match(body, /commitBlockTreeChange\(`block:\$\{child\.id\}:move-out`/);
console.log('ib speech move checks: OK');
