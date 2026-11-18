const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13,10)).join(String.fromCharCode(10));
let f = 0; const ok = (c, m) => { if (!c) { f++; console.log('FAIL', m); } else console.log('ok', m); };
ok(html.includes('.record-timeline-editor .record-timeline-icon-btn { box-sizing: border-box; display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; padding: 0; flex: 0 0 22px; font-size: 11px; }'), '수정·삭제 버튼 22×22·flex 22px·아이콘 11px');
ok(/\.record-timeline-actions \{ display: flex; gap: 3px; align-self: center; \}/.test(html), '버튼 묶음은 가운데 정렬(행 높이를 늘리지 않음)');
ok(html.includes('grid-template-columns: 84px minmax(0, 1fr) 48px; gap: 6px; align-items: start; }') && html.includes('.record-timeline-note-add { display: grid; grid-template-columns: 84px minmax(0, 1fr) 48px;') && html.includes('.record-timeline-editor .record-inline-add-btn { box-sizing: border-box; width: 48px; min-width: 48px;'), '3열 48px(행·보충사항 추가·추가 버튼 폭 일치)');
ok(html.includes("return `타임라인 · ${getRecordPlainTitle(record?.scenarioName) || '이름 없는 기록'}`;") && !html.includes("'이름 없는 기록'} · 타임라인"), '탭 이름 「타임라인 · 제목」');
process.exit(f ? 1 : 0);
