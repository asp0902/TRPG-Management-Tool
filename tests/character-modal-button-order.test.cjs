const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');
const d = html.indexOf('id="ch-delete-btn"'), s = html.indexOf('onclick="saveCharacterModal()">저장</button>'), c = html.indexOf('onclick="closeCharacterModal()">취소</button>');
const ok = d > 0 && s > d && c > s && c - s < 200 && html.includes('id="ch-delete-btn" style="display:none;margin-right:auto;color:#ef4444;border-color:#fca5a5;" onclick="deleteCharacter()">삭제</button>');
console.log(ok ? 'ok 삭제 … 저장 → 취소 순서(삭제 그대로)' : 'FAIL'); process.exit(ok ? 0 : 1);
