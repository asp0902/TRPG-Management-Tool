const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');
const s = html.indexOf('onclick="saveRecord()">저장</button>'), c = html.indexOf('onclick="closeRecordForm()">취소</button>');
const ok = s > 0 && c > s && c - s < 200;
console.log(ok ? 'ok 저장 → 취소 순서' : 'FAIL'); process.exit(ok ? 0 : 1);
