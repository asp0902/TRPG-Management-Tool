const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');
const ok = html.includes('.ds-table tbody td.ds-active-cell { box-shadow: inset 0 0 0 2px #8a8a8a; }') && !html.includes('td.ds-active-cell { box-shadow: inset 0 0 0 3px #111; }');
console.log(ok ? 'ok 활성 셀 테두리 2px #8a8a8a' : 'FAIL 활성 셀 테두리'); console.log('fails=' + (ok ? 0 : 1)); process.exit(ok ? 0 : 1);
