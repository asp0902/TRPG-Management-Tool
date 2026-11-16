const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13,10)).join(String.fromCharCode(10));
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok', m); };
ok(html.includes("document.addEventListener('dragenter', event => { if (hasFiles(event)) document.body.classList.add('file-dragging'); }, true);") && html.includes('body.file-dragging iframe { pointer-events: none; }'), '파일을 끄는 동안 iframe(유튜브 플레이어)이 드롭을 가로채지 못하게 함');
ok(html.includes("document.addEventListener('drop', event => { if (hasFiles(event) && !event.defaultPrevented) event.preventDefault(); });") && html.includes("document.addEventListener('dragover', event => { if (hasFiles(event) && !event.defaultPrevented) event.preventDefault(); });"), '처리되지 않은 파일 드롭·드래그오버는 기본 동작(새 탭 열기) 차단');
ok(html.includes("box.addEventListener('drop', event => musicCardDrop(event, id));") && html.includes("track.kind === 'youtube'"), '유튜브 곡 상세 창 어디에 놓아도 그 곡에 첨부');
ok(html.includes('또는 이 창·카드 위로 음원 파일을 끌어 놓기'), '안내 문구 갱신');
console.log('fails=' + fails); process.exit(fails ? 1 : 0);
