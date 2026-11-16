const fs = require('fs'), path = require('path'), vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13,10)).join(String.fromCharCode(10));
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok', m); };
// 배선(정적): 모든 페이지의 태그 입력이 세션 기록과 같은 칩 입력기(#311)
ok(html.includes('id="bookmark-tags" oninput="renderBookmarkTagSuggestions()"') && html.includes('onkeydown="tagEditorKey(event,this)" onblur="tagEditorCommit(this)"'), '북마크 태그 칸이 칩 입력기');
ok(html.includes("tagEditorHtml('data-k=\"tags\" onchange=\"musicEditField('"), 'MUSIC 상세 태그 칸이 칩 입력기');
ok(html.includes("return tagEditorHtml('data-css-macro-id=\"'") && html.includes("wrap.querySelectorAll('.tag-editor').forEach(tagEditorRender)"), 'CSS 매크로 태그가 칩 입력기(렌더 후 칩 그림)');
ok(!html.includes('tagInputEnter') && !html.includes("prompt('추가할 태그를 입력하세요") && !html.includes("prompt('태그를 수정하세요"), '이전 방식(Enter 문자열 변환·prompt) 제거');
ok(html.includes('if((event.key===\'Enter\'||event.key===\',\')&&!event.isComposing&&event.keyCode!==229){event.preventDefault();addRbNewTag();}" onblur="addRbNewTag()"') && html.includes('onblur="addChNewTag()"'), '룰북·캐릭터 새 태그 입력도 Enter·쉼표·벗어날 때 확정');
const code = html.slice(html.indexOf('function normalizeCssMacroTags'), html.indexOf('function formatCssMacroTagsText')) + html.slice(html.indexOf('// 칩 태그 입력기(#311)'), html.indexOf('function formatCssMacroTagsText'));
// 가짜 DOM: editor{valueEl, chips, input}
const mk = (init = '') => {
  const events = [];
  const valueEl = { value: init, dispatchEvent: e => events.push(e.type) }, chips = { innerHTML: '' }, input = { value: '', placeholder: '', closest: () => editor, dataset: {} };
  const editor = { dataset: { placeholder: '자료, 세션' }, querySelector: sel => ({ '.tag-editor-value': valueEl, '.tag-editor-chips': chips, '.tag-editor-input': input })[sel] };
  return { editor, valueEl, chips, input, events };
};
const ctx = { esc: x => String(x), Event: class { constructor(t) { this.type = t; } }, encodeURIComponent, decodeURIComponent, String };
vm.createContext(ctx); vm.runInContext(code + ';this.f={tagEditorAdd,tagEditorKey,tagEditorCommit,tagEditorRemove,tagEditorRender,tagEditorSet,tagEditorOf,tagEditorTags,tagEditorHtml}', ctx);
const f = ctx.f;
const key = (k, o = {}) => ({ key: k, isComposing: false, keyCode: 13, prevented: false, preventDefault() { this.prevented = true; }, ...o });
// Enter: 띄어쓰기 있는 글 → 태그 하나, 입력칸 비움, 입력 이벤트 발송
let t = mk('#자료 #세션'); t.input.value = '긴장감 있는'; let e = key('Enter'); f.tagEditorKey(e, t.input);
ok(e.prevented && t.valueEl.value === '#자료 #세션 #긴장감 있는' && t.input.value === '' && t.events.join() === 'input,change', 'Enter: 띄어쓰기 있는 글을 태그 하나로 확정·입력칸 비움·input/change 발송');
ok(t.chips.innerHTML.includes('긴장감 있는') && t.chips.innerHTML.includes('tagEditorRemove(this)'), '칩 그림(× 제거 버튼 포함)');
// 쉼표: 앞 글을 태그로(쉼표는 입력되지 않음)
t = mk(''); t.input.value = '슬픈'; e = key(',', { keyCode: 188 }); f.tagEditorKey(e, t.input); ok(e.prevented && t.valueEl.value === '#슬픈', '쉼표로 확정');
// 입력에 '#'·쉼표가 있으면 여러 태그
t = mk(''); t.input.value = '새 태그, 또다른'; f.tagEditorKey(key('Enter'), t.input); ok(t.valueEl.value === '#새 태그 #또다른', '쉼표로 여러 태그(각각 띄어쓰기 허용)');
t = mk(''); t.input.value = '#a b #c'; f.tagEditorKey(key('Enter'), t.input); ok(t.valueEl.value === '#a b #c', "'#' 로 나눔");
// 중복(대소문자·공백 정리) 무시
t = mk('#Jazz'); t.input.value = 'jazz'; f.tagEditorKey(key('Enter'), t.input); ok(t.valueEl.value === '#Jazz', '중복 태그 무시(대소문자 무시)');
// 빈 칸 Enter: 기존 동작 유지(막지 않음)
t = mk('#a'); e = key('Enter'); f.tagEditorKey(e, t.input); ok(!e.prevented && t.events.length === 0, '빈 칸 Enter 는 막지 않음');
// 한글 조합 중 무시
t = mk(''); t.input.value = '조합'; e = key('Enter', { isComposing: true }); f.tagEditorKey(e, t.input); ok(!e.prevented && t.valueEl.value === '', '조합 중 Enter 무시(isComposing)');
e = key('Enter', { keyCode: 229 }); f.tagEditorKey(e, t.input); ok(!e.prevented && t.valueEl.value === '', '조합 중 Enter 무시(keyCode 229)');
// Backspace: 빈 칸에서 마지막 태그 제거 / 글이 있으면 일반 지우기
t = mk('#a #b c'); e = key('Backspace', { keyCode: 8 }); f.tagEditorKey(e, t.input); ok(e.prevented && t.valueEl.value === '#a', '빈 칸 Backspace: 마지막 태그(b c) 하나 제거 (' + t.valueEl.value + ')');
t = mk('#a'); t.input.value = 'x'; e = key('Backspace', { keyCode: 8 }); f.tagEditorKey(e, t.input); ok(!e.prevented && t.valueEl.value === '#a', '입력 중 Backspace 는 일반 지우기');
// 벗어날 때 확정
t = mk('#a'); t.input.value = '남은 글'; f.tagEditorCommit(t.input); ok(t.valueEl.value === '#a #남은 글' && t.input.value === '', '입력칸을 벗어나면 남은 글을 태그로 확정');
t = mk('#a'); f.tagEditorCommit(t.input); ok(t.events.length === 0, '빈 칸은 확정하지 않음');
// × 제거
t = mk('#a #b c #d'); f.tagEditorRemove({ dataset: { tag: encodeURIComponent('b c') }, closest: () => t.editor }); ok(t.valueEl.value === '#a #d', '칩 ×로 제거(공백 포함 태그)');
// placeholder: 태그가 없을 때만
t = mk(''); f.tagEditorRender(t.editor); ok(t.input.placeholder === '자료, 세션', '태그 없으면 placeholder'); t.valueEl.value = '#a'; f.tagEditorRender(t.editor); ok(t.input.placeholder === '자료, 세션', '입력칸이 따로 있으므로 태그가 있어도 placeholder 유지(#319)');
// 마크업: 값 속성(저장 코드용)과 칩 입력기 클래스
const h = f.tagEditorHtml('data-k="tags"', ['긴장감 있는', 'a'], '자료');
ok(h.includes('type="hidden" class="tag-editor-value" data-k="tags" value="#긴장감 있는 #a"') && h.indexOf('class="tag-editor-input"') < h.indexOf('tag-editor-chips'), '숨김 값 입력칸(#태그 문자열), 입력칸이 먼저·만들어진 태그 칩은 입력칸 바깥 아래(#319)');
console.log('fails=' + fails); process.exit(fails ? 1 : 0);
