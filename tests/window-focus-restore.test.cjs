const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13,10)).join(String.fromCharCode(10));
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok', m); };
const i = html.indexOf("window.addEventListener('blur', e => { if (e.target === window) winFocusSnap");
ok(i > 0, 'window blur 에서 기억');
const seg = html.slice(i, i + 700);
ok(seg.includes('githubSyncCaptureFocus()'), '#267 기억 함수 재사용');
ok(seg.includes('}, 150);') && seg.includes('lastPointerAt < since') && seg.includes('githubSyncRestoreFocus(snap)'), '150ms 뒤 클릭 없을 때 복구 함수 호출');
console.log('fails=' + fails); process.exit(fails ? 1 : 0);
