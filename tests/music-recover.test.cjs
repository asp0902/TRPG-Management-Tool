const fs = require('fs'), path = require('path'), vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13, 10)).join(String.fromCharCode(10));
let f = 0; const ok = (c, m) => { if (!c) { f++; console.log('FAIL', m); } else console.log('ok', m); };
const a = html.indexOf('let musicRecoverCands'), b = html.indexOf('function musicPickFiles');
const src = html.slice(a, b);
const mkBlob = (size, type, name) => ({ slice() {}, size, type, name });
const blobs = { 'a-notag': mkBlob(10, 'audio/mpeg', 'x.mp3'), 'b-id3': mkBlob(20, 'audio/mpeg', ''), 'c-cover': mkBlob(30, 'audio/wav', ''), 'old': mkBlob(40, 'audio/wav', ''), 'cover:c-cover': mkBlob(5, 'image/png', ''), 'cover:ghost': mkBlob(5, 'image/png', ''), 'junk': {} };
let keysFail = false, shaFail = false, persisted = 0, toasts = [], closed = 0, rendered = 0, modalHtml = '';
const ctx = {
  state: { musicTracks: [{ id: 'old', title: '기존' }] },
  musicBlobKeys: async () => { if (keysFail) throw new Error('IDB'); return Object.keys(blobs); },
  musicBlobGet: async key => blobs[key],
  musicReadTags: async blob => (blob === blobs['b-id3'] ? { title: '제목B', artist: '가수B', album: '앨범B' } : { title: '', artist: '', album: '' }),
  musicAudioDuration: async blob => (blob === blobs['c-cover'] ? 12.5 : 0),
  normalizeMusicTrack: x => Object.assign({ tags: [], folderId: '' }, x),
  sha256Hex: async () => { if (shaFail) throw new Error('hash'); return 'f'.repeat(64); },
  showToast: m => toasts.push(m), persist: () => { persisted++; },
  musicOpenModal: h => { modalHtml = h; }, musicCloseModal: () => { closed++; }, musicLoadLocal: async () => {}, renderMusicPage: () => { rendered++; },
  musicFmtTime: s => String(s), formatAttachmentSize: n => n + 'B', esc: s => String(s), currentPage: 'music',
  document: { querySelectorAll: () => ctx.__checks, getElementById: () => null },
  Date, Number, Set, Object, String, Array,
};
vm.createContext(ctx); vm.runInContext(src + ';this.f={musicRecoverScan,musicRecoverBuildTrack,musicRecoverOpen,musicRecoverApply,getC:()=>musicRecoverCands}', ctx);
(async () => {
  const fn = ctx.f;
  const cands = await fn.musicRecoverScan();
  ok(cands.map(c => c.id).join() === 'a-notag,b-id3,c-cover', '후보: 현재 목록(old)·cover:키·Blob 아닌 값 제외, 원래 id 유지(고아 cover 키 무시)');
  ok(cands[0].title === '복구된 곡 1' && cands[2].title === '복구된 곡 2' && cands[1].title === '제목B' && cands[1].artist === '가수B' && cands[1].album === '앨범B', 'ID3 제목·아티스트·앨범, 없으면 「복구된 곡 N」');
  ok(cands[2].duration === 12.5 && cands[2].hasCover && !cands[1].hasCover && cands[0].size === 10 && cands[0].mime === 'audio/mpeg', '길이·표지(cover:<id>)·크기·형식');
  const t = fn.musicRecoverBuildTrack(cands[1], 'abc');
  ok(t.id === 'b-id3' && t.kind === 'file' && t.sha256 === 'abc' && t.mime === 'audio/mpeg' && t.size === 20 && t.addedAt > 0 && t.tags.length === 0 && t.folderId === '', '트랙: 원래 id·file·sha256·태그/폴더 비움');
  // 스캔 오류 → 무변경
  keysFail = true; const before = JSON.stringify(ctx.state.musicTracks); toasts.length = 0; await fn.musicRecoverOpen(); keysFail = false;
  ok(JSON.stringify(ctx.state.musicTracks) === before && persisted === 0 && toasts.some(m => /읽지 못/.test(m)) && modalHtml === '', '스캔 오류 시 무변경·메시지만');
  // 확인 창 열기: 체크박스 기본 선택, 자동 추가 없음
  await fn.musicRecoverOpen();
  ok(/music-recover-check" data-i="0" checked/.test(modalHtml) && (modalHtml.match(/ checked>/g) || []).length === 3 && ctx.state.musicTracks.length === 1 && persisted === 0, '창에 후보 3개 전체 선택, 열기만으로는 추가·저장 없음');
  // 일부만 체크
  ctx.__checks = [{ checked: true, dataset: { i: '0' } }, { checked: false, dataset: { i: '1' } }, { checked: true, dataset: { i: '2' } }];
  await fn.musicRecoverApply();
  ok(ctx.state.musicTracks.map(x => x.id).join() === 'old,a-notag,c-cover' && persisted === 1 && closed >= 1 && rendered === 1, '체크한 곡만 추가(체크 해제 제외), 기존 곡 유지, persist 1회');
  ok(ctx.state.musicTracks[0].title === '기존' && ctx.state.musicTracks[2].sha256.length === 64, '기존 곡 불변·해시 계산');
  // 같은 id 재복구 방지·모두 해제
  ctx.__checks = [{ checked: true, dataset: { i: '0' } }]; const n = ctx.state.musicTracks.length; await fn.musicRecoverApply(); ok(ctx.state.musicTracks.length === n, '이미 목록에 생긴 id 는 다시 추가하지 않음');
  ctx.__checks = [{ checked: false, dataset: { i: '0' } }]; await fn.musicRecoverApply(); ok(ctx.state.musicTracks.length === n && persisted === 2, '아무것도 체크하지 않으면 무변경');
  // 해시 실패는 곡 추가를 막지 않음(sha 빈 값)
  ctx.state.musicTracks = [{ id: 'old' }]; shaFail = true; ctx.__checks = [{ checked: true, dataset: { i: '1' } }]; await fn.musicRecoverApply(); shaFail = false;
  ok(ctx.state.musicTracks.length === 2 && ctx.state.musicTracks[1].sha256 === '', '해시 계산 실패해도 복구는 진행(sha256 비움)');
  ok(/id="music-recover-btn"/.test(html) && /musicRecoverOpen\(\)/.test(html) && /music-recover-link/.test(html), '진입점: 상단 바 버튼·빈 화면 안내');
  process.exit(f ? 1 : 0);
})();
