const fs = require('fs'), path = require('path'), vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13,10)).join(String.fromCharCode(10));
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok', m); };
const cut = (a, b) => html.slice(html.indexOf(a), html.indexOf(b));
ok(html.includes("+ field('tags', '태그') + musicAiRowHtml(track) + musicTagPresetsHtml(track)"), '태그 칸 아래에 예시 삽입');
ok(html.includes('.music-tag-presets { grid-column: 1 / -1;') && html.includes('.music-modal button.music-tag-chip.on {'), 'CSS');
const code = cut('function normalizeCssMacroTags', 'function formatCssMacroTagsText') + cut('const MUSIC_TAG_PRESETS', 'async function openMusicDetail');
const chips = [];
const mkChip = t => ({ dataset: { t }, on: false, classList: { toggle(c, v) { this.owner.on = !!v; }, owner: null } });
const tagInput = { value: '' };
let persisted = 0, rendered = 0;
const ctx = { esc: x => String(x), state: { musicTracks: [{ id: 'm1', tags: ['내태그'] }] }, persist: () => persisted++, renderMusicPage: () => rendered++,
  document: { querySelector: () => tagInput, querySelectorAll: () => chips }, console };
vm.createContext(ctx); vm.runInContext(code + ';this.f={MUSIC_TAG_PRESETS,musicPresetTag,musicTagPresetsHtml,musicToggleTag,normalizeCssMacroTags}', ctx);
const f = ctx.f;
// 프리셋 규모(이슈 본문 기준): 대분류 4, 소분류 10, 칩 49
const all = f.MUSIC_TAG_PRESETS.flatMap(([c, subs]) => subs.flatMap(([s, list]) => list.split(', ').map(i => i.split('|'))));
ok(f.MUSIC_TAG_PRESETS.length === 4 && f.MUSIC_TAG_PRESETS.reduce((n, [, s]) => n + s.length, 0) === 10, '4대분류·10소분류');
ok(all.length === 49 && all.every(([ko, en]) => ko && en), '칩 49개, 한글·영어 모두 있음');
// 공백 포함 태그: 문자열 입력은 공백에서 쪼개지고(원인), 배열 입력은 보존됨 → 저장은 공백 제거 형태
ok(f.normalizeCssMacroTags('#긴장감 있는').length === 2, 'normalizeCssMacroTags(문자열)는 공백에서 쪼갬');
ok(f.musicPresetTag('긴장감 있는') === '긴장감있는' && f.musicPresetTag('공부 및 집중') === '공부및집중', '공백 제거 형태로 저장');
ok(f.normalizeCssMacroTags('#' + f.musicPresetTag('맑고 투명한')).length === 1, '입력칸 왕복해도 한 태그 유지');
// HTML: title=영어, 표시=한글, 붙은 태그는 on
const track = ctx.state.musicTracks[0]; track.tags = ['긴장감있는', '내태그'];
const h = f.musicTagPresetsHtml(track);
ok(h.includes('<details class="music-tag-presets"><summary>태그 예시</summary>') && !h.includes('<details class="music-tag-presets" open'), '접이식 기본 접힘');
ok(h.includes('title="Tense"') && h.includes('>긴장감 있는</button>') && h.includes('data-t="긴장감있는"'), '영어는 title, 한글 표시·저장');
ok(/class="music-tag-chip on" data-t="긴장감있는"/.test(h) && /class="music-tag-chip" data-t="경쾌한"/.test(h), '붙은 태그 칩만 on');
// 토글: 추가 → 입력칸·칩·persist/render, 해제, 사용자 태그 공존
chips.push(...['경쾌한', '긴장감있는', '내태그'].map(t => { const c = mkChip(t); c.classList.owner = c; return c; }));
track.tags = ['내태그'];
f.musicToggleTag('m1', '경쾌한');
ok(JSON.stringify(track.tags) === JSON.stringify(['내태그', '경쾌한']) && tagInput.value === '#내태그 #경쾌한', '칩 클릭 → 태그 추가·입력칸 갱신');
ok(chips.find(c => c.dataset.t === '경쾌한').on === true && chips.find(c => c.dataset.t === '긴장감있는').on === false, '칩 강조 갱신');
ok(persisted === 1 && rendered === 1, 'persist·카드 갱신');
f.musicToggleTag('m1', '경쾌한');
ok(JSON.stringify(track.tags) === JSON.stringify(['내태그']) && tagInput.value === '#내태그', '다시 클릭 → 해제, 사용자 태그 유지');
console.log('fails=' + fails); process.exit(fails ? 1 : 0);
