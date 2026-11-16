const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13,10)).join(String.fromCharCode(10));
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok', m); };
const generic = html.indexOf('.music-card-missing button, .music-modal button {');
const fix = html.indexOf('.music-modal button.music-primary { background: #111; color: #fff; border-color: #111; }');
ok(generic > 0 && fix > generic, '규칙이 일반 .music-modal button 뒤에 있음');
// 우선순위: .music-modal button = (0,1,1) < .music-modal button.music-primary = (0,2,1)
const spec = sel => { const c = (sel.match(/\.[\w-]+/g) || []).length, t = (sel.replace(/\.[\w-]+/g, '').match(/\b[a-z]+\b/g) || []).length; return [0, c, t]; };
const a = spec('.music-modal button'), b = spec('.music-modal button.music-primary');
ok(b[1] > a[1], '구체성 (0,2,1) > (0,1,1): ' + a + ' < ' + b);
// 모달 안 .music-primary 버튼이 실제로 있음
ok(html.includes('class="music-primary" onclick="musicCloseModal(); musicPickFiles();">PC 파일 선택') && html.includes('class="music-primary" onclick="musicAddYoutube()">추가'), '모달 안 primary 버튼');
console.log('fails=' + fails); process.exit(fails ? 1 : 0);
