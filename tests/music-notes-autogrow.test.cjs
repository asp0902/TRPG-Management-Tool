const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13,10)).join(String.fromCharCode(10));
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok', m); };
ok(html.includes("'<textarea data-k=\"' + key + '\" oninput=\"musicAutoGrow(this)\""), '메모 칸 입력 시 높이 자동 조절');
ok(html.includes("function musicAutoGrow(el) { el.style.height = 'auto'; el.style.height = (el.scrollHeight + el.offsetHeight - el.clientHeight) + 'px'; }"), '높이 = 글 높이 + 테두리');
ok(html.includes("document.querySelectorAll('#music-modal-backdrop textarea[data-k]').forEach(musicAutoGrow);"), '창을 열 때도 긴 메모에 맞춤');
ok(html.includes('.music-field textarea { min-height: 60px; resize: none; overflow-y: hidden; }'), '스크롤 없이 늘어나는 CSS(최소 60px)');
console.log('fails=' + fails); process.exit(fails ? 1 : 0);
