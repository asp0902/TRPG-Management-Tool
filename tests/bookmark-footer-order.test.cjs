const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13,10)).join(String.fromCharCode(10));
const i = html.indexOf('<div class="bookmark-modal-footer">');
const seg = html.slice(i, i + 700);
const d = seg.indexOf('bookmark-delete-btn"'), s = seg.indexOf('bookmark-save-btn"'), c = seg.indexOf('bookmark-cancel-btn"');
const ok = i > 0 && d >= 0 && d < s && s < c;
console.log(ok ? 'ok 삭제·저장·취소 순서' : 'FAIL 버튼 순서'); console.log('fails=' + (ok ? 0 : 1)); process.exit(ok ? 0 : 1);
