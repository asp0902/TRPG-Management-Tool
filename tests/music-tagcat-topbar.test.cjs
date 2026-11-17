const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13,10)).join(String.fromCharCode(10));
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok', m); };
const b = html.indexOf('id="music-tagcat-btn"'), sv = html.indexOf('id="save-btn"');
ok(b > 0 && sv > b && html.indexOf('id="topbar"') < b && sv - b < 500, '#topbar 안 #save-btn 앞에 버튼');
ok(html.includes("document.getElementById('music-tagcat-btn').style.display = page === 'music' ? '' : 'none'"), 'switchPage 에서 MUSIC 일 때만 표시');
ok(!html.includes('class="music-cat-btn"') && !html.includes('.music-cat-btn {'), '모달의 「분류」 버튼·CSS 제거');
ok(html.includes('class="music-tag-label" onclick="musicToggleTagList()"'), '태그 라벨 클릭 목록 토글 유지');
console.log('fails=' + fails); process.exit(fails ? 1 : 0);
