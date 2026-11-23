const fs = require('fs'), path = require('path'), vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13, 10)).join(String.fromCharCode(10));
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok', m); };
const a = html.indexOf('const TAG_SUGGEST_MAX'), b = html.indexOf('let tagSuggest = null');
const ctx = {
  getAllBookmarkTags: () => ['북마크A', '북마크B'], normalizeCssMacroTags: t => (Array.isArray(t) ? t : []), musicTagKey: t => String(t).replace(/\s+/g, '').toLowerCase(),
  musicTagChipStyle: t => 'color:red', musicTagLabel: (cat, key) => cat.labels[key] || key,
  state: { musicTracks: [{ tags: ['재즈', 'Lo Fi'] }], musicTagCats: [{ tags: ['슬픔', 'lofi'], labels: { 슬픔: '슬픔', lofi: 'lofi' } }], cssMacros: [{ tags: ['매크로1', '재즈'] }, { tags: ['매크로2'] }] },
};
vm.createContext(ctx); vm.runInContext(html.slice(a, b) + ';this.f={tagSuggestFind,tagSuggestRank,tagSuggestCandidates,tagSuggestKey}', ctx);
const f = ctx.f, labels = list => list.map(x => x.label).join('|');
ok(labels(f.tagSuggestRank(['가나', '나가', '다가나', '가가'], '가', [], 8)) === '가가|가나|나가|다가나', '앞글자 일치 → 중간 일치, 같은 순위는 가나다순');
ok(labels(f.tagSuggestRank(['Lo Fi', 'LOFI2', '로파이'], ' lo f', [], 8)) === 'Lo Fi'.concat('|', 'LOFI2').split('|').sort((x, y) => x.localeCompare(y, 'ko')).join('|'), '공백·대소문자 무시');
ok(labels(f.tagSuggestRank(['재즈', '재즈힙합'], '재', ['재 즈'], 8)) === '재즈힙합', '이미 붙은 태그 제외(공백 무시)');
ok(f.tagSuggestRank(['a1', 'a1', 'A 1'], 'a', [], 8).length === 1, '중복 후보 제거');
ok(f.tagSuggestRank(Array.from({ length: 20 }, (_, i) => 'x' + String(i).padStart(2, '0')), 'x', [], 8).length === 8, '최대 8개');
ok(f.tagSuggestRank(['abc'], '', [], 8).length === 0 && f.tagSuggestRank(['abc'], 'zzz', [], 8).length === 0, '빈 입력·불일치는 후보 없음');
// 초성 검색(#341)
const L = (list, q) => labels(f.tagSuggestRank(list, q, [], 8));
ok(L(['바다', '하늘', '바람'], 'ㅂ') === '바다|바람', '초성 ㅂ → 바다·바람');
ok(L(['바다', '바람', '보도'], 'ㅂㄷ') === '바다|보도', '초성 ㅂㄷ → 바다·보도');
ok(L(['바다', '바람', '보도'], '바ㄷ') === '바다', '혼합 바ㄷ → 바다');
ok(L(['바다', '하늘'], 'ㄷ') === '바다', '중간 일치 ㄷ → 바다');
ok(L(['다리', '바다'], 'ㄷ') === '다리|바다', '앞글자 일치(다리)가 중간 일치(바다)보다 먼저');
ok(L(['꽃', '곳', '꿈'], 'ㄲ') === '꽃|꿈', '쌍자음 ㄲ → 꽃·꿈(ㄱ 아님)');
ok(L(['Jazz', 'lo fi', '재즈'], 'ㅈㅈ') === '재즈' && L(['Jazz', 'LoFi 2'], 'lofi2') === 'LoFi 2', '영문·숫자 태그는 그대로 비교, 초성은 한글만');
ok(L(['바다'], 'ㅅ') === '' && L(['바다'], '바ㄹ') === '', '초성 불일치');
ok(f.tagSuggestFind('바다', 'ㅂㄷ') === 0 && f.tagSuggestFind('푸른바다', 'ㅂㄷ') === 2 && f.tagSuggestFind('ab', 'abc') === -1, 'tagSuggestFind 위치');
const ed = (cls, extra) => ({ dataset: extra.music ? { musicTags: '1' } : {}, querySelector: () => ({ id: extra.id || '', dataset: extra.macro ? { cssMacroId: 'm' } : {} }) });
const music = f.tagSuggestCandidates(ed('', { music: true })).map(x => x.label);
ok(music.includes('재즈') && music.includes('Lo Fi') && music.includes('슬픔') && !music.includes('북마크A') && !music.includes('매크로1'), 'MUSIC: 곡 태그 + 등록 태그만');
ok(f.tagSuggestCandidates(ed('', { music: true }))[0].style === 'color:red', 'MUSIC: 분류 색 스타일 전달');
ok(f.tagSuggestCandidates(ed('', { id: 'bookmark-tags' })).join() === '북마크A,북마크B', '북마크: getAllBookmarkTags');
ok(f.tagSuggestCandidates(ed('', { macro: true })).join() === '매크로1,재즈,매크로2', 'CSS 매크로: 매크로 태그만');
ok(f.tagSuggestCandidates(ed('', {})).length === 0, '그 밖의 입력칸은 후보 없음');
const src = html.slice(b, html.indexOf('function isCssMacroFieldColorValue'));
ok(src.includes('stopImmediatePropagation') && src.includes("event.key === 'Enter' && s.active >= 0") && src.includes('event.isComposing || event.keyCode === 229'), '조합 중 키 무시·선택 있을 때만 Enter 가로챔');
ok(src.includes('event.preventDefault();\n      const opt') && src.includes("tagEditorAdd(editor, item.label)"), '후보 클릭 mousedown preventDefault·저장은 tagEditorAdd 경로');
ok(src.includes("setAttribute('role', 'listbox')") && src.includes('role="option"') && src.includes('aria-activedescendant'), 'listbox/option/aria-activedescendant');
ok(/\.tag-suggest-panel \{[^}]*position: fixed[^}]*z-index: 100500/.test(html) && src.includes('document.body.appendChild(panel)'), 'body 의 fixed 패널(모달 위 z-index)');
process.exit(fails ? 1 : 0);
