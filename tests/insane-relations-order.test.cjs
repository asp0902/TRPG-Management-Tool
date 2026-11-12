const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13) + String.fromCharCode(10)).join(String.fromCharCode(10));
// 인세인 관계 목록 열 순서: 인물 | 감정 | 거처(#216). 행 데이터는 id 키라 변환이 필요 없다.
assert.match(html, /id: 'relations', label: '관계 목록', repeatable: true, fields: \[\n\s*\{ id: 'person', label: '인물', type: 'text' \},\n\s*\{ id: 'emotion', label: '감정', type: 'text' \},\n\s*\{ id: 'shelter', label: '거처', type: 'checkbox' \},/);
console.log('insane relations order checks: OK');
