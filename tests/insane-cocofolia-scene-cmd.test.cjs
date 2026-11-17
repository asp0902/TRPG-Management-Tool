const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13,10)).join(String.fromCharCode(10));
const a = html.indexOf('function generateInsaneCocofoliaJSON');
const seg = html.slice(a, a + 2500);
let f = 0; const ok = (c, m) => { if (!c) { f++; console.log('FAIL', m); } else console.log('ok', m); };
ok(seg.includes("var cmd = ['@장면 열기', '@장면 닫기', '', '──특기 판정──'];"), '인세인 팔레트 앞에 장면 열기/닫기');
ok(seg.includes("cmd.push('2D6>=' + targets[fieldId] + ' ' + name)"), '특기 판정 줄 유지');
process.exit(f ? 1 : 0);
