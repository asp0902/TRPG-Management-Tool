const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13,10)).join(String.fromCharCode(10));
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok', m); };
ok(html.includes('.record-session-tag-chip .record-session-tag-chip-remove { border: 0; border-radius: 0; background: none; box-shadow: none; padding: 0;'), '삭제 버튼: 외곽선·배경·그림자·여백 제거(.music-modal button 등 전역 버튼 스타일보다 우선)');
ok(html.includes('@media (hover: hover) {\n  .record-session-tag-chip .record-session-tag-chip-remove { opacity: 0; }\n  .record-session-tag-chip:hover .record-session-tag-chip-remove, .record-session-tag-chip .record-session-tag-chip-remove:focus-visible { opacity: 1; }'), '해당 태그에 호버(또는 키보드 포커스)했을 때만 보임, 터치 기기는 항상 보임');
console.log('fails=' + fails); process.exit(fails ? 1 : 0);
