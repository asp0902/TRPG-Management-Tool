const fs = require('fs'), path = require('path'), vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13,10)).join(String.fromCharCode(10));
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok', m); };
const cut = (a, b) => html.slice(html.indexOf(a), html.indexOf(b));
ok(!html.includes('musicTagPresetsHtml') && !html.includes('music-tag-presets') && !html.includes('태그 예시'), '태그 예시(접이식 프리셋 칩) 삭제(#298)');
ok(html.includes("'<div class=\"music-fcol\">' + field('title', '제목') + field('artist', '아티스트') + field('album', '앨범') + '</div><div class=\"music-fcol\">' + field('tags', '태그') + musicRecRowHtml(track) + '</div>'"), '왼쪽: 제목·아티스트·앨범 세로 / 오른쪽: 태그');
ok(html.includes('.music-fcol { display: flex; flex-direction: column;') && html.includes('.music-modal button.music-tag-chip.on {'), 'CSS(세로 열·추천 칩)');
const code = cut('function normalizeCssMacroTags', 'function formatCssMacroTagsText') + cut('const MUSIC_TAG_PRESETS', 'async function openMusicDetail');
const chips = [];
const mkChip = t => ({ dataset: { t }, on: false, classList: { toggle(c, v) { this.owner.on = !!v; }, owner: null } });
const tagInput = { value: '' };
let persisted = 0, rendered = 0;
const ctx = { esc: x => String(x), state: { musicTracks: [{ id: 'm1', tags: ['내태그'] }] }, persist: () => persisted++, renderMusicPage: () => rendered++,
  document: { querySelector: () => tagInput, querySelectorAll: () => chips }, console };
vm.createContext(ctx); vm.runInContext(code + ';this.f={MUSIC_TAG_PRESETS,musicPresetTag,musicTagKey,musicToggleTag,normalizeCssMacroTags}', ctx);
const f = ctx.f;
// 프리셋 규모(이슈 본문 기준): 대분류 4, 소분류 10, 칩 49
const all = f.MUSIC_TAG_PRESETS.flatMap(([c, subs]) => subs.flatMap(([s, list]) => list.split(', ').map(i => i.split('|'))));
ok(f.MUSIC_TAG_PRESETS.length === 4 && f.MUSIC_TAG_PRESETS.reduce((n, [, s]) => n + s.length, 0) === 10, '4대분류·10소분류');
ok(all.length === 49 && all.every(([ko, en]) => ko && en), '칩 49개, 한글·영어 모두 있음');
// 공백 포함 태그(#292): '#' 가 있으면 #·쉼표·줄바꿈으로만 분리, 없으면 옛 입력 호환으로 공백 분리, 왕복 보존
const nt = f.normalizeCssMacroTags;
ok(JSON.stringify(nt('#긴장감 있는 #슬픈')) === JSON.stringify(['긴장감 있는', '슬픈']), "'#긴장감 있는 #슬픈' → 태그 안 공백 허용");
ok(JSON.stringify(nt('a b, c')) === JSON.stringify(['a', 'b', 'c']) && JSON.stringify(nt('a b')) === JSON.stringify(['a', 'b']), "'#' 없는 옛 입력은 공백·쉼표 분리(호환)");
ok(JSON.stringify(nt('#긴장감   있는\n#슬픈,#a  b')) === JSON.stringify(['긴장감 있는', '슬픈', 'a b']), '안쪽 연속 공백은 하나로·줄바꿈·쉼표 분리');
ok(JSON.stringify(nt(nt('#긴장감 있는 #슬픈').map(t => '#' + t).join(' '))) === JSON.stringify(['긴장감 있는', '슬픈']), '표시 문자열을 다시 넣어도 같은 결과(왕복 보존)');
ok(JSON.stringify(nt(['긴장감 있는', ' 슬픈 ', '긴장감  있는'])) === JSON.stringify(['긴장감 있는', '슬픈']), '배열 입력: 공백 정리·중복 제거');
ok(f.musicPresetTag('긴장감 있는') === '긴장감 있는' && f.musicPresetTag('공부 및 집중') === '공부 및 집중', '프리셋은 공백 포함 한글로 저장');
ok(f.musicTagKey('긴장감 있는') === f.musicTagKey('긴장감있는'), '칩 판정은 공백 무시 비교');
// HTML: title=영어, 표시=한글, 붙은 태그는 on
const track = ctx.state.musicTracks[0]; track.tags = ['긴장감있는', '내태그']; // 옛 저장값(공백 없음)
// 토글: 추가 → 입력칸·칩·persist/render, 해제, 사용자 태그 공존
chips.push(...['경쾌한', '긴장감 있는', '내태그'].map(t => { const c = mkChip(t); c.classList.owner = c; return c; }));
track.tags = ['내태그'];
f.musicToggleTag('m1', '경쾌한');
ok(JSON.stringify(track.tags) === JSON.stringify(['내태그', '경쾌한']) && tagInput.value === '#내태그 #경쾌한', '칩 클릭 → 태그 추가·입력칸 갱신');
ok(chips.find(c => c.dataset.t === '경쾌한').on === true && chips.find(c => c.dataset.t === '긴장감 있는').on === false, '칩 강조 갱신');
ok(persisted === 1 && rendered === 1, 'persist·카드 갱신');
f.musicToggleTag('m1', '경쾌한');
ok(JSON.stringify(track.tags) === JSON.stringify(['내태그']) && tagInput.value === '#내태그', '다시 클릭 → 해제, 사용자 태그 유지');
// 공백 포함 태그 토글·옛 저장값 해제
f.musicToggleTag('m1', '긴장감 있는');
ok(JSON.stringify(track.tags) === JSON.stringify(['내태그', '긴장감 있는']) && tagInput.value === '#내태그 #긴장감 있는', '공백 포함 칩 추가 → 공백 포함 형태로 저장, 입력칸 왕복 가능');
ok(JSON.stringify(nt(tagInput.value)) === JSON.stringify(track.tags), '입력칸 값을 다시 읽어도 같은 태그');
track.tags = ['긴장감있는', '긴장감 있는', '내태그'];
f.musicToggleTag('m1', '긴장감 있는');
ok(JSON.stringify(track.tags) === JSON.stringify(['내태그']), '해제 시 공백 유무 둘 다 제거');
console.log('fails=' + fails); process.exit(fails ? 1 : 0);
