const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13,10)).join(String.fromCharCode(10));
let f = 0; const ok = (c, m) => { if (!c) { f++; console.log('FAIL', m); } else console.log('ok', m); };
const body = (a, b) => html.slice(html.indexOf(a), html.indexOf(b, html.indexOf(a)));
ok(!body('function tagEditorKey', 'function tagEditorCommit').includes('Backspace'), '공용 태그 입력기에 Backspace 분기 없음');
ok(!body('function handleRecordSessionTagInputKeydown', 'function commitRecordSessionTagInput').includes('Backspace'), '세션 기록 태그 입력기에 Backspace 분기 없음');
ok(!body('function musicCatTagAddKey', 'function musicCatTagAdd(').includes('Backspace'), '태그 관리 입력칸에 Backspace 분기 없음');
ok(!html.includes('마지막 태그 제거'), '관련 주석 정리');
process.exit(f ? 1 : 0);
