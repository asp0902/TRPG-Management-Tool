const fs = require('fs'), path = require('path'), vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13,10)).join(String.fromCharCode(10));
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok', m); };
const cut = (a, b) => html.slice(html.indexOf(a), html.indexOf(b));
// 저장·동기화 연결(musicFolders 와 같은 지점)
const n = (html.match(/musicTagCats/g) || []).length;
ok(n >= 30, '태그 분류(musicTagCats)가 상태·저장·가져오기·합치기·스냅샷에 연결됨 (' + n + '곳)');
ok(html.includes("state.musicTagCats = Array.isArray(raw.musicTagCats) ? raw.musicTagCats : null;") && html.includes('musicTagCats: Array.isArray(data.musicTagCats) ? data.musicTagCats.map(normalizeMusicTagCat) : null'), '불러오기·가져오기: 없으면 null → 기본 분류');
ok(html.includes("'bookmarks','musicFolders','musicTagCats','musicTracks'"), '가져오기 취소 스냅샷에 포함');
ok(html.includes('data-music-tags="1"') && html.includes('oncontextmenu="musicTagContext(event,this)"'), 'MUSIC 태그 칩만 분류 색·우클릭');
ok(html.includes('id="music-tagcat-btn"') && html.includes('onclick="openMusicTagCatManager()" title="태그 분류 이름·색 관리"') && html.includes('분류 관리…'), '분류 관리(이름 수정·추가·삭제) 진입: 상단 바 버튼·우클릭 메뉴');

const code = cut('function musicTagKey', 'function musicToggleTag') .replace(/^[\s\S]*?(function musicTagKey)/, '$1') + cut('function musicTagCatDefaults', 'function musicExistingTagsInner');
let persisted = 0, refreshed = 0, id = 0;
const ctx = { bump() { refreshed++; }, state: { musicTagCats: null, musicTracks: [] }, mkId: () => 'id' + (++id), persist() { persisted++; }, musicRefreshTagColors() { refreshed++; }, String, parseInt, Math, document: { getElementById: () => null }, window: {}, esc: x => x };
vm.createContext(ctx);
// musicRefreshTagColors 는 코드 안에 정의돼 있으므로 덮어쓰기용 접미
vm.runInContext(code + ';musicRefreshTagColors = () => { bump(); };this.f={musicTagCatDefaults,normalizeMusicTagCat,musicTagCatsEnsure,musicTagCatOf,musicShade,musicTagChipStyle,musicTagCatSet,musicTagCatEdit,musicTagCatAdd,musicTagCatDelete}', ctx);
const f = ctx.f;
const defs = f.musicTagCatDefaults();
ok(defs.map(c => c.name).join() === '상황,분위기,감정,시간대,계절,템포' && defs.every(c => /^#[0-9a-f]{6}$/.test(c.color)) && new Set(defs.map(c => c.color)).size === 6, '기본 분류 6개(상황·분위기·감정·시간대·계절·템포), 서로 다른 파스텔 색');
const light = defs.every(c => { const v = parseInt(c.color.slice(1), 16); return ((v >> 16) & 255) > 210 && ((v >> 8) & 255) > 210 && (v & 255) > 190; });
ok(light, '모두 옅은 파스텔톤(밝은 색)');
ok(f.musicTagCatsEnsure().length === 6 && ctx.state.musicTagCats[0].id === 'cat-situation', 'null 이면 기본 분류로 채움(고정 id → 기기 간 합치기 시 어긋나지 않음)');
ctx.state.musicTagCats = []; ok(f.musicTagCatsEnsure().length === 0, '비어 있는 배열은 사용자가 모두 지운 상태로 존중(다시 채우지 않음)');
ctx.state.musicTagCats = null; f.musicTagCatsEnsure();
f.musicTagCatSet('카페', 'cat-situation'); ok(ctx.state.musicTagCats[0].tags.join() === '카페' && f.musicTagCatOf('카페').name === '상황', '태그에 분류 지정');
f.musicTagCatSet('카 페', 'cat-emotion'); ok(ctx.state.musicTagCats[0].tags.length === 0 && ctx.state.musicTagCats[2].tags.join() === '카페' && f.musicTagCatOf('카페').name === '감정', '한 태그는 한 분류에만(공백 무시 비교로 이동)');
f.musicTagCatSet('카페', ''); ok(f.musicTagCatOf('카페') === null && f.musicTagChipStyle('카페') === '', '분류 없음 → 회색(스타일 없음)');
f.musicTagCatSet('카페', 'cat-mood'); ok(/background:#e8e0f7/.test(f.musicTagChipStyle('카페')) && /color:#3a3a3a/.test(f.musicTagChipStyle('카페')), '분류 색이 칩 배경으로');
f.musicTagCatEdit('cat-mood', 'name', '분위기A'); f.musicTagCatEdit('cat-mood', 'color', '#CCFFCC');
ok(ctx.state.musicTagCats[1].name === '분위기A' && ctx.state.musicTagCats[1].color === '#ccffcc' && persisted > 0 && refreshed > 0, '분류 이름·색 수정(저장·칩 갱신)');
f.musicTagCatEdit('cat-mood', 'color', 'red'); ok(ctx.state.musicTagCats[1].color === '#ccffcc', '잘못된 색 값은 무시');
const before = ctx.state.musicTagCats.length; f.musicTagCatAdd(); const added = ctx.state.musicTagCats[before];
ok(ctx.state.musicTagCats.length === before + 1 && added.name === '새 분류' && /^#[0-9a-f]{6}$/.test(added.color) && added.tags.length === 0, '분류 추가');
ctx.confirm = () => true; f.musicTagCatDelete('cat-mood'); ok(!ctx.state.musicTagCats.some(c => c.id === 'cat-mood') && f.musicTagCatOf('카페') === null, '분류 삭제 → 그 태그는 회색으로(태그 자체는 유지)');
ok(f.normalizeMusicTagCat({ id: 'x', name: 'a'.repeat(40), color: 'nope', tags: ['a', 'a', 3, ''] }).tags.length === 1 && f.normalizeMusicTagCat({ name: 'a'.repeat(40) }).name.length === 20 && f.normalizeMusicTagCat({}).color === '#e8e8e8', '정규화: 이름 20자 제한·잘못된 색 기본값·태그 중복 제거');
console.log('fails=' + fails); process.exit(fails ? 1 : 0);
