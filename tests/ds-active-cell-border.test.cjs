const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');
// #383: 활성 셀 표시는 오버레이(#ds-active-box)의 2px 진한 파랑 테두리(구글 시트식). 옛 회색 inset 그림자는 쓰지 않는다.
const ok = /#ds-active-box \{[^}]*border: 2px solid #1a73e8/.test(html) && !html.includes('td.ds-active-cell { box-shadow:');
console.log(ok ? 'ok 활성 셀 테두리 2px #1a73e8(오버레이)' : 'FAIL 활성 셀 테두리'); console.log('fails=' + (ok ? 0 : 1)); process.exit(ok ? 0 : 1);
