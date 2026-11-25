const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');
const line = html.split('\n').find(l => l.startsWith('#ds-fill-handle {')) || '';
// #383: 채우기 핸들은 범위 모서리의 파란 원형 점(지름 10px, 흰 테두리 1px)
const ok = line.includes('background: #1a73e8;') && line.includes('border-radius: 50%') && line.includes('width: 10px; height: 10px;');
console.log(ok ? 'ok 채우기 핸들 #1a73e8 원형' : 'FAIL 채우기 핸들 모양'); console.log('fails=' + (ok ? 0 : 1)); process.exit(ok ? 0 : 1);
