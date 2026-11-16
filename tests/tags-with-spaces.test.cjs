const fs = require('fs'), path = require('path'), vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13,10)).join(String.fromCharCode(10));
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok', m); };
const code = html.slice(html.indexOf('function normalizeCssMacroTags'), html.indexOf('function formatCssMacroTagsText')) + html.slice(html.indexOf('function formatCssMacroTagsText'), html.indexOf('function formatCssMacroTagsText') + 200).split('\n').slice(0, 3).join('\n');
const ctx = {}; vm.createContext(ctx); vm.runInContext(code + ';this.f={normalizeCssMacroTags,formatCssMacroTagsText}', ctx);
const { normalizeCssMacroTags: n, formatCssMacroTagsText: fmt } = ctx.f;
ok(JSON.stringify(n('#긴장감 있는 #슬픈')) === JSON.stringify(['긴장감 있는', '슬픈']), '공백 포함 태그 하나');
ok(JSON.stringify(n('a b, c')) === JSON.stringify(['a', 'b', 'c']), '옛 입력(# 없음) 호환');
ok(fmt(['긴장감 있는', '슬픈']) === '#긴장감 있는 #슬픈' && JSON.stringify(n(fmt(['긴장감 있는', '슬픈']))) === JSON.stringify(['긴장감 있는', '슬픈']), 'CSS 매크로·북마크 표시 문자열 왕복 보존');
ok(JSON.stringify(n('#A b #a  B')) === JSON.stringify(['A b']), '대소문자 무시 중복 제거(안쪽 공백 정리 후)');
ok(JSON.stringify(n('#태그1, #태그2\n#태그3')) === JSON.stringify(['태그1', '태그2', '태그3']), '# 쉼표 줄바꿈 분리');
// 스페이스 키로 태그를 확정·분리하는 입력 UI 없음(기록 세션 태그는 Enter·쉼표만, 북마크·CSS 매크로·MUSIC 은 입력칸 문자열 파싱/prompt)
const rec = html.slice(html.indexOf('function handleRecordSessionTagInputKeydown'), html.indexOf('function handleRecordSessionTagInputKeydown') + 400);
ok(rec.includes("event.key === ',' || event.key === 'Enter'") && !rec.includes("' '"), '태그 입력 UI 중 스페이스 키 분리 없음');
console.log('fails=' + fails); process.exit(fails ? 1 : 0);
