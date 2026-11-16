const fs = require('fs'), path = require('path'), vm = require('vm'), crypto = require('crypto');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13,10)).join(String.fromCharCode(10));
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok', m); };
const cut = (a, b) => html.slice(html.indexOf(a), html.indexOf(b));
const sha = buf => crypto.createHash('sha256').update(buf).digest('hex');
const sha256Hex = async blob => sha(Buffer.from(await blob.arrayBuffer()));

// 정적 확인
ok(html.includes('id="gdrive-client-id"') && html.includes('onclick="gdriveConnectClicked()" style="white-space:nowrap;flex:none">Drive 연결</button>') && html.includes('id="gdrive-disconnect"'), '동기화 모달에 Drive 클라이언트 ID·연결·해제');
// UI 배치(#297 후속): 상태 줄은 입력칸 바로 아래·버튼 위, 버튼 글자는 한 줄
{ const i = html.indexOf('id="gdrive-client-id"'), st = html.indexOf('id="gdrive-status"', i), btn = html.indexOf('>Drive 연결</button>', i);
  ok(i > 0 && st > i && st < btn, '상태 줄이 입력칸 바로 아래(버튼보다 위)');
  const seg = html.slice(btn - 200, btn + 400);
  ok(/Drive 연결<\/button>/.test(seg) && (html.slice(btn - 160, btn).includes('white-space:nowrap')) && html.slice(html.indexOf('id="gdrive-disconnect"'), html.indexOf('id="gdrive-disconnect"') + 200).includes('white-space:nowrap'), 'Drive 연결·연결 해제 버튼은 줄바꿈 없이 한 줄(nowrap)'); }
ok(html.includes("interactive ? 180000 : 20000"), '로그인 창 대기 시간 연장(대화형 3분)');
ok(html.includes("GDRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file'"), '범위는 drive.file(앱이 만든 파일만)');
ok(html.includes('  gdriveFieldRefresh();\n  const lastAt'), '모달 열 때 Drive 칸 갱신');
ok(html.includes('musicSyncUploads(); // 음원 업로드(#296·#297)') && html.includes("setTimeout(() => musicSyncUploads(), 4000)"), '곡 추가·첨부·시작 시 음원 업로드 호출');
const block = cut('// ── Google Drive 음원 저장(#297)', 'async function openMusicDetail');
ok(!/console\.(log|info|warn)/.test(block) && !/localStorage\.setItem\(['"]?[^)]*gdriveToken/.test(block), '접근 토큰은 로그·저장소에 쓰지 않음(메모리만)');
ok(!/deleteMusicTrack[\s\S]{0,700}gdrive/.test(cut('async function deleteMusicTrack', '// ── 폴더 ──')), '곡 삭제 시 Drive 파일은 지우지 않음');

// ── 단위: 모든 외부 호출은 mock (실제 Google API·계정 사용 없음) ──
const mk = (opts = {}) => {
  const c = { store: {}, calls: [], files: {}, folder: null, tokenResp: { access_token: 'FAKE-DRIVE-TOKEN', expires_in: 3600 }, prompts: [], toasts: [], blobs: {}, puts: [], statusPuts: [], uploads: [], persisted: 0, uploadChunks: [], respond401: false };
  const fakeRes = (status, body, headers = {}) => ({ ok: status >= 200 && status < 300, status, headers: { get: k => headers[k] || null }, json: async () => body, blob: async () => body });
  const ctx = {
    localStorage: { getItem: k => (k in c.store ? c.store[k] : null), setItem: (k, v) => { c.store[k] = String(v); }, removeItem: k => { delete c.store[k]; } },
    window: { google: { accounts: { oauth2: { initTokenClient: cfg => ({ requestAccessToken: o => { c.prompts.push(o.prompt); if (c.tokenResp) cfg.callback(c.tokenResp); else cfg.error_callback({}); } }), revoke: () => {} } } } },
    document: { getElementById: () => null }, Blob, encodeURIComponent, setTimeout, clearTimeout, Date, Math, Number, String, Promise, console: { error() {} },
    state: { musicTracks: [] }, attachDoneSet: new Set(), musicLocalIds: new Set(), musicCoverUrls: {}, URL: { createObjectURL: () => 'blob:x' },
    persist: () => c.persisted++, showToast: m => c.toasts.push(m), sha256Hex,
    getGitHubSyncToken: () => (opts.githubToken ? 'FAKE-GH-TOKEN' : ''), isGitHubSyncEnabled: () => !!opts.githubToken,
    uploadAttachmentToGitHub: async (shaHex) => { c.uploads.push(['github', shaHex]); }, fetchAttachmentFromGitHub: async () => new Blob([opts.githubBytes || 'x']),
    musicBlobGet: async k => c.blobs[k] || null, musicBlobPut: async (k, b) => { c.blobs[k] = b; c.puts.push(k); },
    attachTx: async store => { c.statusPuts.push(store); }, musicReadTags: async () => ({ cover: null }),
    fetch: async (url, init = {}) => {
      url = String(url); c.calls.push([init.method || 'GET', url, init.headers || {}]);
      if (c.respond401) return fakeRes(401, {});
      if (url.includes('/upload/drive/v3/files?uploadType=resumable')) return fakeRes(200, {}, { Location: 'https://upload.example/session1' });
      if (url.startsWith('https://upload.example/session1')) { c.uploadChunks.push(init.headers['Content-Range']); const m = /bytes (\d+)-(\d+)\/(\d+)/.exec(init.headers['Content-Range']); return fakeRes(m && Number(m[2]) + 1 < Number(m[3]) ? 308 : 200, {}); }
      if (url.includes('alt=media')) { const id = url.split('/files/')[1].split('?')[0]; return fakeRes(200, c.fileBlobs[id]); }
      if (url.includes('/drive/v3/files?') && (init.method || 'GET') === 'GET') {
        const q = decodeURIComponent(url.split('q=')[1]);
        if (q.includes("mimeType='application/vnd.google-apps.folder'")) return fakeRes(200, { files: c.folder ? [{ id: c.folder }] : [] });
        const name = /name='([^']+)'/.exec(q)[1]; return fakeRes(200, { files: c.files[name] ? [{ id: c.files[name] }] : [] });
      }
      if (url.includes('/drive/v3/files?fields=id') && init.method === 'POST') { c.folder = 'FOLDER1'; return fakeRes(200, { id: 'FOLDER1' }); }
      return fakeRes(404, {});
    },
  };
  c.fileBlobs = {};
  vm.createContext(ctx); vm.runInContext(block + ';this.f={gdriveEnsureToken,gdriveFolderId,gdriveFindFile,gdriveUpload,gdriveDownload,gdriveConfigured,gdriveConnectClicked,gdriveDisconnect,musicSyncUploads,musicDownloadTrack,musicCanDownload,get tok(){return gdriveToken}}', ctx);
  return { c, ctx };
};
(async () => {
  // 토큰: 클라이언트 ID 없음 → 시도 안 함 / 있음 → 백그라운드는 prompt 'none', 사용자 클릭은 '' , 캐시 재사용, 실패 시 ''
  let { c, ctx } = mk();
  ok(await ctx.f.gdriveEnsureToken(true) === '' && c.prompts.length === 0, '클라이언트 ID 없으면 로그인 시도 안 함');
  c.store['trpg-gdrive-client-id'] = 'CLIENT.apps.googleusercontent.com';
  ok(await ctx.f.gdriveEnsureToken(false) === 'FAKE-DRIVE-TOKEN' && c.prompts[0] === 'none', '백그라운드: 창 없이(prompt none) 조용히 토큰 요청');
  await ctx.f.gdriveEnsureToken(true); ok(c.prompts.length === 1, '유효한 토큰은 재사용(재요청 없음)');
  ({ c, ctx } = mk()); c.store['trpg-gdrive-client-id'] = 'X'; await ctx.f.gdriveEnsureToken(true); ok(c.prompts[0] === '', '사용자 클릭: 필요할 때만 창(prompt 빈 값)');
  ({ c, ctx } = mk()); c.store['trpg-gdrive-client-id'] = 'X'; c.tokenResp = null; ok(await ctx.f.gdriveEnsureToken(false) === '', '조용한 갱신 실패 → 빈 토큰(연결 필요로 처리)');

  // 폴더·조회·업로드(8MB 조각)·중복 건너뜀
  ({ c, ctx } = mk()); c.store['trpg-gdrive-client-id'] = 'X'; await ctx.f.gdriveEnsureToken(true);
  ok(await ctx.f.gdriveFolderId() === 'FOLDER1' && c.store['trpg-gdrive-folder-id'] === 'FOLDER1', '「TRPG-Music」 폴더 없으면 만들고 id 저장');
  const calls0 = c.calls.length; await ctx.f.gdriveFolderId(); ok(c.calls.length === calls0, '저장된 폴더 id 재사용');
  const big = Buffer.alloc(17 * 1024 * 1024, 3), shaBig = sha(big);
  await ctx.f.gdriveUpload(shaBig, new Blob([big], { type: 'audio/mpeg' }));
  const init = c.calls.find(x => x[1].includes('uploadType=resumable'));
  ok(init && init[2].Authorization === 'Bearer FAKE-DRIVE-TOKEN' && init[2]['X-Upload-Content-Type'] === 'audio/mpeg' && init[2]['X-Upload-Content-Length'] === String(big.length), '이어 올리기 시작: 인증 헤더·형식·크기');
  ok(JSON.stringify(c.uploadChunks) === JSON.stringify(['bytes 0-8388607/17825792', 'bytes 8388608-16777215/17825792', 'bytes 16777216-17825791/17825792']), '17MB → 8MB 조각 3개로 Content-Range 전송');
  c.files[shaBig] = 'F1'; const before = c.calls.length; await ctx.f.gdriveUpload(shaBig, new Blob([big]));
  ok(c.calls.filter(x => x[1].includes('uploadType=resumable')).length === 1 && c.calls.length > before, '이미 Drive 에 있으면 다시 올리지 않음(조회만)');
  const small = Buffer.from('small-audio'); c.uploadChunks.length = 0; await ctx.f.gdriveUpload(sha(small), new Blob([small]));
  ok(c.uploadChunks.length === 1 && c.uploadChunks[0] === 'bytes 0-10/11', '작은 파일은 한 번에');
  // 인증 만료(401) → 토큰 폐기
  c.respond401 = true; let err = ''; try { await ctx.f.gdriveFindFile('abc'); } catch (e) { err = e.message; } ok(/만료/.test(err) && ctx.f.tok === '', '401 → 토큰 폐기·오류');

  // 다운로드
  ({ c, ctx } = mk()); c.store['trpg-gdrive-client-id'] = 'X'; c.store['trpg-gdrive-folder-id'] = 'FOLDER1'; await ctx.f.gdriveEnsureToken(true);
  const bytes = Buffer.from('remote-audio'); c.files[sha(bytes)] = 'F9'; c.fileBlobs.F9 = new Blob([bytes]);
  const tr = { id: 'r1', kind: 'file', sha256: sha(bytes), mime: 'audio/mpeg' };
  const blob = await ctx.f.musicDownloadTrack(tr);
  ok(blob && blob.type === 'audio/mpeg' && c.puts[0] === 'r1' && ctx.musicLocalIds.has('r1') && ctx.attachDoneSet.has('gdrive:' + tr.sha256), 'Drive 에서 받아 해시 검증 → MUSIC_DB 저장·mime 복원·완료 표시');
  c.fileBlobs.F9 = new Blob([Buffer.from('tampered')]); c.puts.length = 0;
  ok(await ctx.f.musicDownloadTrack({ id: 'r2', kind: 'file', sha256: sha(bytes) }) === null && c.puts.length === 0 && c.toasts.some(t => /해시/.test(t)), '변조된 파일은 해시 불일치로 거부·저장 안 함');
  ok(await ctx.f.musicDownloadTrack({ id: 'r3', kind: 'file', sha256: sha(Buffer.from('none')) }) === null && c.toasts.some(t => /찾지 못했습니다/.test(t)), 'Drive 에 없으면 안내 토스트');
  c.toasts.length = 0; c.tokenResp = null; ctx.f.tok; const t2 = mk(); t2.c.store['trpg-gdrive-client-id'] = 'X'; t2.c.tokenResp = null;
  ok(await t2.ctx.f.musicDownloadTrack({ id: 'r4', kind: 'file', sha256: 'abc' }) === null && t2.c.toasts.some(t => /Drive 연결이 필요/.test(t)), '토큰을 못 받으면 「Drive 연결이 필요합니다」 안내(GitHub 미사용 시)');
  // Drive 에 없고 GitHub 동기화가 켜져 있으면 GitHub 로 폴백(#296 이전 업로드분)
  const g = mk({ githubToken: true, githubBytes: 'from-github' }); g.c.store['trpg-gdrive-client-id'] = 'X'; g.c.store['trpg-gdrive-folder-id'] = 'FOLDER1';
  const gb = await g.ctx.f.musicDownloadTrack({ id: 'r5', kind: 'file', sha256: 'zzz', mime: '' });
  ok(gb && g.ctx.attachDoneSet.has('zzz'), 'Drive 에 없으면 GitHub(#296) 로 폴백');

  // 업로드 동기화: Drive 모드(키 gdrive:), 이미 올라간 곡 건너뜀, 연결 필요 시 업로드 안 함, GitHub 모드는 기존 그대로
  ({ c, ctx } = mk()); c.store['trpg-gdrive-client-id'] = 'X'; c.store['trpg-gdrive-folder-id'] = 'FOLDER1';
  c.blobs.a = new Blob([Buffer.from('aaa')], { type: 'audio/mpeg' }); c.blobs.b = new Blob([Buffer.from('bbb')]);
  ctx.attachDoneSet.add('gdrive:' + sha(Buffer.from('bbb'))); ctx.attachDoneSet.add(sha(Buffer.from('aaa'))); // GitHub 업로드 기록은 Drive 완료가 아님
  ctx.state.musicTracks.push({ id: 'a', kind: 'file', sha256: '', mime: '' }, { id: 'b', kind: 'youtube', attached: true, sha256: sha(Buffer.from('bbb')) }, { id: 'y', kind: 'youtube', attached: false });
  await ctx.f.musicSyncUploads();
  ok(ctx.state.musicTracks[0].sha256 === sha(Buffer.from('aaa')), '옛 곡 해시 등록');
  ok(c.calls.filter(x => x[1].includes('uploadType=resumable')).length === 1 && ctx.attachDoneSet.has('gdrive:' + sha(Buffer.from('aaa'))) && c.statusPuts.length === 1, 'Drive 로 새 곡만 업로드·gdrive: 키로 기록(이미 올라간 곡 건너뜀)');
  ({ c, ctx } = mk()); c.store['trpg-gdrive-client-id'] = 'X'; c.tokenResp = null; c.blobs.a = new Blob(['aaa']); ctx.state.musicTracks.push({ id: 'a', kind: 'file', sha256: '' });
  await ctx.f.musicSyncUploads(); ok(c.calls.length === 0 && ctx.state.musicTracks[0].sha256 === '', '토큰을 못 받으면(연결 필요) 업로드·해시 등록 안 함');
  ({ c, ctx } = mk({ githubToken: true })); c.blobs.a = new Blob(['aaa']); ctx.state.musicTracks.push({ id: 'a', kind: 'file', sha256: '' });
  await ctx.f.musicSyncUploads(); ok(c.uploads.length === 1 && c.uploads[0][0] === 'github' && c.calls.length === 0, 'Drive 설정이 없으면 기존 GitHub 업로드(#296)');
  ({ c, ctx } = mk()); c.blobs.a = new Blob(['aaa']); ctx.state.musicTracks.push({ id: 'a', kind: 'file', sha256: '' });
  await ctx.f.musicSyncUploads(); ok(c.uploads.length === 0 && c.calls.length === 0, '아무 저장소도 설정 안 되면 동작 안 함');
  // 연결 해제: 클라이언트 ID·폴더 id 삭제(Drive 파일은 그대로)
  ({ c, ctx } = mk()); c.store['trpg-gdrive-client-id'] = 'X'; c.store['trpg-gdrive-folder-id'] = 'F'; ctx.f.gdriveDisconnect();
  ok(!('trpg-gdrive-client-id' in c.store) && !('trpg-gdrive-folder-id' in c.store) && !ctx.f.gdriveConfigured(), '연결 해제 → 클라이언트 ID·폴더 id 삭제');
  // 연결 실패 사유가 상태 줄에 표시됨
  ({ c, ctx } = mk()); c.store['trpg-gdrive-client-id'] = 'X'; c.tokenResp = null;
  const els = { 'gdrive-client-id': { value: 'X' }, 'gdrive-status': { textContent: '' }, 'gdrive-disconnect': { style: {} } };
  ctx.document.getElementById = id => els[id] || null;
  await ctx.f.gdriveConnectClicked();
  ok(/^연결하지 못했습니다 \((unknown|popup_closed)\)/.test(els['gdrive-status'].textContent), '연결 실패 시 사유가 상태 줄에 표시: ' + els['gdrive-status'].textContent);
  console.log('fails=' + fails); process.exit(fails ? 1 : 0);
})();
