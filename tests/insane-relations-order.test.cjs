const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13) + String.fromCharCode(10)).join(String.fromCharCode(10));
// 인세인 관계 목록 열 순서: 인물 | 감정 | 거처(#216). 행 데이터는 id 키라 변환이 필요 없다.
assert.match(html, /id: 'relations', label: '관계 목록', repeatable: true, fields: \[\n\s*\{ id: 'person', label: '인물', type: 'text' \},\n\s*\{ id: 'emotion', label: '감정', type: 'text' \},\n\s*\{ id: 'shelter', label: '거처', type: 'checkbox' \},/);
console.log('insane relations order checks: OK');
// #220: 새 시트의 관계 목록 기본 행은 3개(필드 순서는 인물·감정·거처). 기존 시트 행은 건드리지 않는다.
const rel = html.slice(html.indexOf("id: 'relations', label: '관계 목록'"), html.indexOf("id: 'profile', label: '캐릭터 설정'"));
assert.equal((rel.match(/\{ person: '', emotion: '', shelter: false \}/g) || []).length, 3);
assert.doesNotMatch(rel, /shelter: false, emotion/);
console.log('insane relations default rows checks: OK');
// #224: 효과·메모 펼침 입력창은 토글 폭 변수로 윗줄 입력칸 왼쪽 끝과 맞춘다
assert.match(html, /--is-toggle-w: 13px; --is-toggle-gap: 5px; --is-cell-pad: 4px;/);
assert.match(html, /\.sh-sheet-insane \.is-ability-effect > td \{[^}]*padding-left: calc\(var\(--is-cell-pad\) \+ var\(--is-toggle-w\) \+ var\(--is-toggle-gap\)\)/);
assert.match(html, /width: var\(--is-toggle-w\); height: var\(--is-toggle-w\);/);
console.log('insane effect row alignment checks: OK');
