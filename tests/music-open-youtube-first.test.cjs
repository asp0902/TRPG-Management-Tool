const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13,10)).join(String.fromCharCode(10));
const ok = html.includes("const src = track.kind === 'file' ? 'file' : (source || 'youtube');") && !html.includes("(source || (blob ? 'file' : 'youtube'))");
console.log(ok ? 'ok 유튜브 카드는 첨부 파일이 있어도 열면 유튜브가 기본(전환 버튼으로 파일 재생)' : 'FAIL 기본 소스'); console.log('fails=' + (ok ? 0 : 1)); process.exit(ok ? 0 : 1);
