const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');
const s = html.indexOf('onclick="saveRecord()">저장</button>'), c = html.indexOf('onclick="closeRecordForm()">취소</button>');
const ok = s > 0 && c > s && c - s < 200;
console.log(ok ? "ok 저장 → 취소 순서" : "FAIL"); if (!ok) process.exit(1);
{ const a = html.indexOf('onclick="applyRecordImagePopup()">적용</button>'), b = html.indexOf('onclick="closeRecordImageUrlPopup()">취소</button>');
  const o2 = a > 0 && b > a && b - a < 250; console.log(o2 ? 'ok 이미지 팝업 적용 → 취소' : 'FAIL 이미지 팝업'); if (!o2) process.exit(1); }
