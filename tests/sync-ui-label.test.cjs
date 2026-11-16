const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13,10)).join(String.fromCharCode(10));
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok', m); };
// 문구: 사용자에게 보이는 「GitHub 동기화」 제거(주석 제외), 상태별 버튼 문구
const code = html.split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n');
const left = (code.match(/GitHub 동기화|GitHub 확인|GitHub 연결중|GitHub 업로드 대기/g) || []);
ok(left.length === 0, '화면 문구에 「GitHub 동기화」 없음 (남은 ' + left.length + '건)');
ok(html.includes('onclick="openGitHubSyncModal()">동기화</button>') && html.includes('id="github-sync-heading">동기화</div>'), '버튼·모달 제목 「동기화」');
ok(html.includes("'동기화 확인' : (active ? '동기화 연결중' : '동기화')"), '버튼 상태 문구 동기화 확인/연결중');
ok(html.includes('asp0902/TRPG-Management-Tool-data · sync') && html.includes('토큰 만들기') && html.includes('GitHub에 저장된 데이터는 삭제되지 않습니다.'), 'GitHub 자체 설명은 유지');
console.log('fails=' + fails); process.exit(fails ? 1 : 0);
