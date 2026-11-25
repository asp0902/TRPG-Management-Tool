const fs = require('fs'), path = require('path');
const h = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');
const i = h.indexOf('id="rb-delete-btn"'), seg = h.slice(i, h.indexOf('</div>', i));
const d = seg.indexOf('deleteRulebook()'), s = seg.indexOf('saveRulebookModal()'), c = seg.indexOf('closeRulebookModal()');
if (!(d > 0 && s > d && c > s) || !/margin-right:auto/.test(seg)) { console.log('FAIL 룰북 모달 [삭제] … [저장] [취소]'); process.exit(1); }
console.log('ok 룰북 모달 [삭제] … [저장] [취소], 삭제 왼쪽 끝 유지');
