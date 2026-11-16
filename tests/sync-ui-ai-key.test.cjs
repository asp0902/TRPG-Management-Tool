const fs = require('fs'), path = require('path'), vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13,10)).join(String.fromCharCode(10));
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok', m); };
// 문구: 사용자에게 보이는 「GitHub 동기화」 제거(주석 제외), 상태별 버튼 문구
const code = html.split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n');
const left = (code.match(/GitHub 동기화|GitHub 확인|GitHub 연결중|GitHub 업로드 대기/g) || []);
ok(left.length === 0, '화면 문구에 「GitHub 동기화」 없음 (남은 ' + left.length + '건)');
ok(html.includes('onclick="openGitHubSyncModal()">동기화</button>') && html.includes('id="github-sync-heading">동기화</div>'), '버튼·모달 제목 「동기화」');
ok(html.includes("'동기화 확인' : (active ? '동기화 연결중' : '동기화')"), '버튼 상태 문구 동기화 확인/연결중');
ok(html.includes('asp0902/TRPG-Management-Tool-data · sync') && html.includes('토큰 만들기') && html.includes('GitHub에 저장된 데이터는 삭제되지 않습니다.'), 'GitHub 자체 설명은 유지');
ok(html.includes('동기화 설정에서 API 키를 입력하세요'), '키 미설정 안내 문구');
// 키 칸 동작(vm)
const fnCode = html.slice(html.indexOf("const MUSIC_AI_KEY_STORE"), html.indexOf("const MUSIC_AI_NOTICE") > 0 ? html.indexOf("const MUSIC_AI_NOTICE") : html.indexOf("function musicAiGet")) + html.slice(html.indexOf('function musicAiGet'), html.indexOf('function musicAiPresets')) + html.slice(html.indexOf('function musicAiKeyFieldRefresh'), html.indexOf('function musicAiRowHtml'));
const store = {}, toasts = [];
const input = { value: '', placeholder: '' }, clear = { style: { display: 'none' } };
const ctx = { localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } }, showToast: m => toasts.push(m), document: { getElementById: id => ({ 'music-ai-key-input': input, 'music-ai-key-clear': clear })[id] || null } };
vm.createContext(ctx); vm.runInContext(fnCode + ';this.f={musicAiKeyFieldRefresh,musicAiSaveKeyFromInput,musicAiClearKey}', ctx);
const f = ctx.f;
f.musicAiKeyFieldRefresh();
ok(input.placeholder === 'sk-ant-...' && clear.style.display === 'none', '키 없음: 기본 placeholder, 삭제 버튼 숨김');
input.value = '   '; ok(f.musicAiSaveKeyFromInput() === false && !('trpg-music-ai-key' in store), '빈 값은 저장 안 함');
input.value = ' FAKE-TEST-KEY '; ok(f.musicAiSaveKeyFromInput() === true && store['trpg-music-ai-key'] === 'FAKE-TEST-KEY', '값이 있으면 trpg-music-ai-key 에 저장(트림)');
ok(input.value === '' && input.placeholder === '저장됨 (●●●●)' && clear.style.display === '', '저장 후 칸 비움·마스킹 placeholder·삭제 버튼 표시(값 재표시 안 함)');
ok(!JSON.stringify([input, toasts]).includes('FAKE-TEST-KEY'), '키 값이 화면·토스트에 노출되지 않음');
f.musicAiClearKey();
ok(!('trpg-music-ai-key' in store) && input.placeholder === 'sk-ant-...' && clear.style.display === 'none', '키 삭제');
// 저장 함수가 토큰 없이도 AI 키를 저장(독립)
const sv = html.slice(html.indexOf('async function saveGitHubSyncSettings'), html.indexOf('async function pullGitHubSyncNow'));
ok(sv.indexOf('musicAiSaveKeyFromInput()') > 0 && sv.indexOf('musicAiSaveKeyFromInput()') < sv.indexOf('if (!token)') && sv.includes('if (aiKeySaved)'), '토큰 확인보다 먼저 AI 키 저장(독립)');
ok(html.includes('  musicAiKeyFieldRefresh();\n  const lastAt'), '모달 열 때 키 칸 갱신');
console.log('fails=' + fails); process.exit(fails ? 1 : 0);
