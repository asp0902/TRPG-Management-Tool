const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');
const line = html.split('\n').find(l => l.startsWith('#ds-fill-handle {')) || '';
const ok = line.includes('background: #8a8a8a;') && !line.includes('#1a73e8');
console.log(ok ? 'ok 채우기 핸들 #8a8a8a' : 'FAIL 채우기 핸들 색'); console.log('fails=' + (ok ? 0 : 1)); process.exit(ok ? 0 : 1);
