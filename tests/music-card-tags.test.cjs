const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13,10)).join(String.fromCharCode(10));
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok', m); };
ok(html.includes("'<div class=\"music-card-tags collapsed\">' + track.tags.map(tag => '<span class=\"music-card-tag\" style=\"' + esc(musicTagChipStyle(tag))"), '카드에 분류 색 태그 칩');
ok(html.includes('.music-card-tags {') && html.includes('.music-card-tag {'), '카드 태그 CSS');
const i = html.indexOf('function musicRefreshTagColors');
ok(html.slice(i, i + 120).includes('renderMusicPage();'), '분류 변경 시 카드 갱신');
console.log('fails=' + fails); process.exit(fails ? 1 : 0);
