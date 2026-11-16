const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13,10)).join(String.fromCharCode(10));
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok', m); };
ok(html.includes('.record-session-tag-chip .record-session-tag-chip-remove { border: 0; border-radius: 0; background: none; box-shadow: none; padding: 0;'), '삭제 버튼: 외곽선·배경·그림자·여백 제거(.music-modal button 등 전역 버튼 스타일보다 우선)');
const hover = '@media (hover: hover) {' + String.fromCharCode(10) + '  .record-session-tag-chip:not(:hover) .record-session-tag-chip-remove { display: none; }';
ok(html.includes(hover), '삭제 버튼은 호버 전에는 자리를 차지하지 않고(칩 폭이 글자 수에 맞음) 해당 태그에 호버하면 나타남, 터치 기기는 항상 보임');
console.log('fails=' + fails); process.exit(fails ? 1 : 0);
