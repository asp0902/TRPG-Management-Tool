const fs = require('fs'), path = require('path'), vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13,10)).join(String.fromCharCode(10));
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok', m); };
const cut = (a, b) => html.slice(html.indexOf(a), html.indexOf(b));
ok(html.includes('onclick="musicPickFileFromModal()">파일 선택</button>') && !html.includes('PC 파일 선택'), '버튼 문구 「파일 선택」');
const code = cut('function musicParseYoutubeId', 'function musicPlayerHtml') + cut('async function musicAddFiles', '// ── 유튜브 트랙에 PC 음원 파일 첨부(#257)') + 'function musicIsAudioFile(f) { return true; } function normalizeMusicTrack(i) { return { id: "t" + (++n), attached: i.kind === "youtube" && i.attached === true, ...i }; }';
let n = 0; const blobs = {}, picked = [];
const els = { 'music-yt-url': { value: 'https://youtu.be/dQw4w9WgXcQ' }, 'music-yt-title': { value: ' 내 제목 ' }, 'music-yt-artist': { value: '' }, 'music-yt-album': { value: '앨범X' }, 'music-yt-thumb': { hidden: false, dataset: { id: 'dQw4w9WgXcQ' }, getAttribute: () => 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mock.jpg' } };
const ctx = { n: 0, state: { musicTracks: [], musicFolders: [] }, musicView: { folder: 'all' }, MUSIC_AUDIO_EXTS: ['mp3'], showToast() {}, persist() {}, renderMusicPage() {}, musicSyncUploads() {}, URL: { createObjectURL: () => 'blob:x' }, Blob, musicCoverUrls: {}, musicLocalIds: new Set(),
  musicReadTags: async f => ({ title: 'ID3제목', artist: 'ID3아티스트', album: 'ID3앨범', cover: null }), musicAudioDuration: async () => 100, musicBlobPut: async (k, b) => { blobs[k] = b; }, sha256Hex: async () => 'h', Date,
  document: { getElementById: id => els[id] || null, createElement: () => { const i = { click() { picked.push(i); } }; return i; } }, musicCloseModal() { ctx.closed = true; } };
vm.createContext(ctx); vm.runInContext(code.replace('let n = 0;', '') + ';var n = 0;this.f={musicAddFiles,musicPickFileFromModal,musicPickFiles}', ctx);
(async () => {
  const file = name => ({ name, size: 10, type: 'audio/mpeg' });
  // 주소가 입력된 상태에서 파일 선택 → 파일 선택창만 열고 창은 아직 안 닫음(취소하면 그대로)
  ctx.f.musicPickFileFromModal(); ok(picked.length === 1 && !ctx.closed, '파일 선택창을 열되 곡 추가 창은 선택 전까지 유지');
  picked[0].files = [file('a.mp3'), file('b.mp3')]; picked[0].onchange();
  await new Promise(r => setTimeout(r, 50));
  const [t1, t2] = ctx.state.musicTracks;
  ok(ctx.closed, '파일을 고르면 창 닫음');
  ok(t1.kind === 'youtube' && t1.attached === true && t1.youtubeId === 'dQw4w9WgXcQ' && t1.url === 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' && t1.fileName === 'a.mp3', '첫 파일은 입력해 둔 유튜브 정보와 합쳐 「유튜브 + 첨부 파일」 카드');
  ok(t1.title === '내 제목' && t1.artist === 'ID3아티스트' && t1.album === '앨범X' && t1.thumbnail.endsWith('mock.jpg'), '창에 입력한 제목·앨범·썸네일 우선, 빈 칸은 파일 태그로 채움');
  ok(t2.kind === 'file' && t2.title === 'ID3제목' && !t2.youtubeId, '두 번째 파일부터는 일반 파일 카드');
  // 주소가 없으면 기존처럼 파일 기준 카드
  ctx.state.musicTracks.length = 0; els['music-yt-url'].value = ''; picked.length = 0; ctx.closed = false;
  ctx.f.musicPickFileFromModal(); picked[0].files = [file('c.mp3')]; picked[0].onchange(); await new Promise(r => setTimeout(r, 50));
  ok(ctx.state.musicTracks[0].kind === 'file' && ctx.state.musicTracks[0].title === 'ID3제목', '유튜브 주소가 없으면 파일 기준 카드');
  console.log('fails=' + fails); process.exit(fails ? 1 : 0);
})();
