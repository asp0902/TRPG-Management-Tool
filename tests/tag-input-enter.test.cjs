const fs = require('fs'), path = require('path'), vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13,10)).join(String.fromCharCode(10));
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok', m); };
ok(html.includes('id="bookmark-tags"') && html.includes('spellcheck="false" oninput="renderBookmarkTagSuggestions()" onkeydown="tagInputEnter(event,this)"'), '북마크 태그 칸 onkeydown');
ok(html.includes("onkeydown=\"tagInputEnter(event,this)\" data-committed=\""), 'MUSIC 태그 칸 onkeydown·초기 committed');
ok(html.includes("dataset.committed = document.getElementById('bookmark-tags').value") && html.includes('input.dataset.committed = input.value;'), '북마크: 열 때·추천 칩 클릭 시 committed 갱신');
const code = html.slice(html.indexOf('function normalizeCssMacroTags'), html.indexOf('function formatCssMacroTagsText')) + html.slice(html.indexOf('// 태그 입력칸에서 Enter'), html.indexOf('function formatCssMacroTagsText'));
const ctx = { Event: class { constructor(t) { this.type = t; } } }; vm.createContext(ctx); vm.runInContext(code + ';this.f={tagInputEnter}', ctx);
const mkEl = (value, committed) => ({ value, dataset: committed === undefined ? {} : { committed }, events: [], dispatchEvent(e) { this.events.push(e.type); } });
const key = (o = {}) => ({ key: 'Enter', isComposing: false, keyCode: 13, prevented: false, preventDefault() { this.prevented = true; }, ...o });
const run = (value, committed, ev) => { const el = mkEl(value, committed), e = ev || key(); ctx.f.tagInputEnter(e, el); return { el, e }; };
let r = run('#자료 #세션 긴장감 있는', '#자료 #세션 ');
ok(r.el.value === '#자료 #세션 #긴장감 있는 ' && r.e.prevented && r.el.dataset.committed === r.el.value, '#자료 #세션  + 긴장감 있는 Enter → 태그 하나(띄어쓰기 허용)·끝 공백·committed 갱신');
ok(r.el.events.join() === 'input,change', 'input·change 발생(북마크 추천 갱신·MUSIC 저장)');
r = run('#자료 #세션 #긴장감 있는 슬픈', r.el.dataset.committed);
ok(r.el.value === '#자료 #세션 #긴장감 있는 #슬픈 ', '이어서 입력해도 앞 태그 유지');
r = run('#자료 #세션 세션', '#자료 #세션 ');
ok(r.el.value === '#자료 #세션 ', '중복 태그 무시');
r = run('#자료 #Session session', '#자료 #Session ');
ok(r.el.value === '#자료 #Session ', '대소문자 무시 중복');
r = run('#자료 #세션 #새 태그, 또다른', '#자료 #세션 ');
ok(r.el.value === '#자료 #세션 #새 태그 #또다른 ', "새 부분에 '#'·쉼표가 있으면 그 규칙으로 분리");
// 앞부분이 바뀌면 전체 정리
r = run('#자료  #수정된 긴장감 있는', '#자료 #세션 ');
ok(r.el.value === '#자료 #수정된 긴장감 있는 ' || r.el.value.startsWith('#자료 '), '앞부분 수정 → normalizeCssMacroTags 로 전체 정리 (' + r.el.value + ')');
// 빈 입력·새 글 없음·조합 중·다른 키는 건드리지 않음
r = run('', ''); ok(!r.e.prevented && r.el.value === '', '빈 칸 Enter 는 기존 동작(막지 않음)');
r = run('#자료 #세션 ', '#자료 #세션 '); ok(!r.e.prevented && r.el.value === '#자료 #세션 ', '새 글 없으면 기존 동작');
r = run('#자료 긴장', '#자료 ', key({ isComposing: true })); ok(!r.e.prevented && r.el.value === '#자료 긴장', '한글 조합 중 Enter 무시(isComposing)');
r = run('#자료 긴장', '#자료 ', key({ keyCode: 229 })); ok(!r.e.prevented && r.el.value === '#자료 긴장', '한글 조합 중 Enter 무시(keyCode 229)');
r = run('#자료 긴장', '#자료 ', key({ key: 'a' })); ok(!r.e.prevented && r.el.value === '#자료 긴장', '다른 키는 무시');
// 처음부터 비어 있던 칸(committed '') 에 띄어쓰기 있는 태그 하나를 입력하고 Enter → 태그 하나
r = run('긴장감 있는', ''); ok(r.el.value === '#긴장감 있는 ' && r.e.prevented, "빈 칸에서 '긴장감 있는' + Enter → 태그 하나(띄어쓰기 허용)");
// committed 가 없으면 전체 정리
r = run('a b #c d', undefined); ok(r.el.value === '#a b #c d ', 'committed 없으면 전체 정리');
console.log('fails=' + fails); process.exit(fails ? 1 : 0);
