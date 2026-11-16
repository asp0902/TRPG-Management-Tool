const fs = require('fs'), path = require('path'), vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13,10)).join(String.fromCharCode(10));
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok', m); };
const cut = (a, b) => html.slice(html.indexOf(a), html.indexOf(b));
ok(html.includes('onclick="musicPickFileFromModal()">파일 선택</button>') && !html.includes('PC 파일 선택'), '버튼 문구 「파일 선택」');
ok(html.includes('#music-card-menu { min-width: 0; width: max-content; }'), '우클릭 메뉴 가로 크기 축소');
const code = cut('function musicParseYoutubeId', 'function musicPlayerHtml') + cut('async function musicAddFiles', '// ── 유튜브 트랙에 PC 음원 파일 첨부(#257)') + cut('function musicAddYoutube', '// 페이지에 파일 끌어 놓기') + 'function musicIsAudioFile(f) { return /\.mp3$/i.test(f.name); } function normalizeMusicTrack(i) { return { id: "t" + (++n), attached: i.kind === "youtube" && i.attached === true, ...i }; }';
let n = 0; const blobs = {}, picked = [];
const mkEl = (v = '') => ({ value: v, hidden: false, textContent: '', dataset: {}, getAttribute: () => '' });
const els = {};
const reset = () => { Object.keys(els).forEach(k => delete els[k]); Object.assign(els, { 'music-yt-url': mkEl(), 'music-yt-title': mkEl(), 'music-yt-artist': mkEl(), 'music-yt-album': mkEl(), 'music-yt-error': mkEl(), 'music-yt-thumb': Object.assign(mkEl(), { hidden: true }), 'music-add-file': Object.assign(mkEl(), { hidden: true }), 'music-add-file-name': mkEl() }); };
reset();
const ctx = { state: { musicTracks: [], musicFolders: [] }, musicView: { folder: 'all' }, MUSIC_AUDIO_EXTS: ['mp3'], showToast() {}, persist() {}, renderMusicPage() {}, musicSyncUploads() {}, URL: { createObjectURL: () => 'blob:x' }, Blob, musicCoverUrls: {}, musicLocalIds: new Set(), musicYtThumbFor: () => '', closed: 0,
  musicReadTags: async f => ({ title: 'ID3제목', artist: 'ID3아티스트', album: 'ID3앨범', cover: null }), musicAudioDuration: async () => 100, musicBlobPut: async (k, b) => { blobs[k] = b; }, sha256Hex: async () => 'h', Date,
  document: { getElementById: id => els[id] || null, createElement: () => { const i = { click() { picked.push(i); } }; return i; } }, musicCloseModal() { ctx.closed++; } };
vm.createContext(ctx); vm.runInContext(code + ';var n = 0;this.f={musicAddFiles,musicPickFileFromModal,musicAddSetFiles,musicAddYoutube,musicAddClearFile,get pending(){return musicAddPending}}', ctx);
const file = (name, size = 3145728) => ({ name, size, type: 'audio/mpeg' });
const tick = () => new Promise(r => setTimeout(r, 30));
(async () => {
  // 파일을 고르면 곧바로 등록되지 않고 창에 담김(이름·크기 표시, 빈 칸은 파일 태그로 채움)
  ctx.f.musicPickFileFromModal(); picked[0].files = [file('a.mp3'), file('b.mp3')]; picked[0].onchange(); await tick();
  ok(ctx.state.musicTracks.length === 0 && ctx.closed === 0, '파일 선택만으로는 등록되지 않고 창도 닫히지 않음');
  ok(els['music-add-file'].hidden === false && els['music-add-file-name'].textContent === 'a.mp3 (3.0 MB) 외 1개', '선택한 파일 이름·크기 표시: ' + els['music-add-file-name'].textContent);
  ok(els['music-yt-title'].value === 'ID3제목' && els['music-yt-artist'].value === 'ID3아티스트' && els['music-yt-album'].value === 'ID3앨범', '빈 제목·아티스트·앨범은 파일 태그로 채움');
  // 「추가」를 눌러야 등록: 입력한 유튜브 주소가 있으면 「유튜브 + 첨부 파일」
  els['music-yt-url'].value = 'https://youtu.be/dQw4w9WgXcQ'; els['music-yt-title'].value = '내 제목';
  ctx.f.musicAddYoutube(); await tick();
  const [t1, t2] = ctx.state.musicTracks;
  ok(ctx.closed === 1 && ctx.f.pending.length === 0, '「추가」로 등록하고 창 닫음');
  ok(t1.kind === 'youtube' && t1.attached === true && t1.youtubeId === 'dQw4w9WgXcQ' && t1.fileName === 'a.mp3' && t1.title === '내 제목' && t1.artist === 'ID3아티스트', '첫 파일: 주소+입력값과 합쳐 「유튜브 + 첨부 파일」 카드');
  ok(t2.kind === 'file' && t2.title === 'ID3제목' && !t2.youtubeId, '두 번째 파일부터는 일반 파일 카드');
  // 주소 없이 파일만 → 파일 기준 카드(창에서 수정한 제목 반영)
  ctx.state.musicTracks.length = 0; reset(); picked.length = 0; ctx.closed = 0;
  ctx.f.musicPickFileFromModal(); picked[0].files = [file('c.mp3')]; picked[0].onchange(); await tick();
  els['music-yt-title'].value = '수정한 제목'; ctx.f.musicAddYoutube(); await tick();
  ok(ctx.state.musicTracks[0].kind === 'file' && ctx.state.musicTracks[0].title === '수정한 제목' && ctx.state.musicTracks[0].fileName === 'c.mp3', '주소 없이 파일만: 파일 카드(창에서 고친 제목 반영)');
  // 제거 → 담긴 파일 없음 → 기존 유튜브 주소 방식(주소 필수)
  reset(); ctx.f.musicPickFileFromModal(); picked[picked.length - 1].files = [file('d.mp3')]; picked[picked.length - 1].onchange(); await tick();
  ctx.f.musicAddClearFile(); ok(ctx.f.pending.length === 0 && els['music-add-file'].hidden === true, '제거하면 담긴 파일 비움');
  const before = ctx.state.musicTracks.length; ctx.f.musicAddYoutube(); ok(ctx.state.musicTracks.length === before && els['music-yt-error'].textContent.includes('알아볼 수 없습니다'), '파일도 주소도 없으면 등록하지 않음(오류 문구)');
  // 지원하지 않는 파일
  reset(); ctx.f.musicAddSetFiles([file('x.pdf')]); await tick(); ok(ctx.f.pending.length === 0 && els['music-yt-error'].textContent.includes('지원하는 음원 파일'), '지원하지 않는 파일은 담지 않고 안내');
  // 주소가 잘못되면 파일이 있어도 등록하지 않음
  reset(); ctx.f.musicAddSetFiles([file('e.mp3')]); await tick(); els['music-yt-url'].value = 'nope'; const n0 = ctx.state.musicTracks.length; ctx.f.musicAddYoutube();
  ok(ctx.state.musicTracks.length === n0 && els['music-yt-error'].textContent.includes('알아볼 수 없습니다'), '입력한 주소가 올바르지 않으면 오류');
  console.log('fails=' + fails); process.exit(fails ? 1 : 0);
})();
