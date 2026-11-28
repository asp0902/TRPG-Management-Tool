const fs = require('fs'), path = require('path'), vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13, 10)).join(String.fromCharCode(10));
let f = 0; const ok = (c, m) => { if (!c) { f++; console.log('FAIL', m); } else console.log('ok', m); };
const cut = (a, b) => html.slice(html.indexOf(a), html.indexOf(b));
const store = {}; const localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
let fetchImpl = null, calls = [], confirmAnswer = true, snapshots = [], persisted = 0, replaced = 0;
const state = { musicTracks: [{ id: 'm' }, { id: 'n' }], bookmarks: [], scenarios: [{ id: 's' }], characters: [{ id: 'c' }], musicFolders: [], musicTagCats: [{ id: 'cat' }], sharedMemoOwner: { memos: [1] }, folders: [], cssMacroFolders: [], records: [], catalog: [], cssMacros: [], cssPopupDictionary: [], rulebooks: [], dataSheets: [], characterFolders: [], customFonts: [], manualFonts: [], recentFonts: [], customBulletSymbols: [], customBulletImages: [], findReplaceHistory: [] };
const ctx = {
  localStorage, state, console, setTimeout, clearTimeout, AbortController, Date, JSON, Math, Object, Array, String, Number,
  getGitHubSyncToken: () => 'tok', getGitHubSyncApiUrl: () => 'https://api/x', showToast: m => calls.push('toast:' + m), githubSyncMark: () => {},
  fetch: (url, opt) => fetchImpl(url, opt), makeImportPayloadRaw: d => Object.assign({ scenarios: [], musicTracks: [] }, d),
  confirm: () => confirmAnswer, saveProtectionSnapshot: async (p, reason) => { snapshots.push(reason); return true; }, makeStatePayload: () => ({ x: 1 }), bootMark: () => {},
  importPayloadHasData: () => true, replaceStateWithImportPayload: () => { replaced++; }, normalizeSidebarState: () => {}, persistNow: async () => { persisted++; return { savedAt: 'T' }; },
  rememberGitHubSync: () => {}, refreshAfterImport: () => {}, lastLocalSavedAt: new Date('2026-11-20T00:00:00Z').toISOString(), IMPORT_COLLECTION_KEYS: null, GITHUB_SYNC_BRANCH: 'sync',
  githubSyncRevision: 0, makeImportSnapshot: () => ({ replaced }), restoreImportSnapshot: snapshot => { replaced = snapshot.replaced; },
};
vm.createContext(ctx);
const code = cut('const IMPORT_COLLECTION_KEYS', 'function makeImportPayloadRaw') + cut('const GITHUB_SYNC_TIMEOUT_MS', 'async function getGitHubSyncFileMeta')
  + cut('const GITHUB_SYNC_STALE_MS', 'async function uploadGitHubSyncState') + cut('function replaceStateWithImportPayload', 'function mergeImportPayload');
// replaceStateWithImportPayload 는 state 전체를 건드리므로 별도 실행(위 mock 의 replace 카운터와 충돌하지 않게 이름 변경)
const main = code.replace(/function replaceStateWithImportPayload[^]*$/, '');
vm.runInContext(main + ';this.f={importAbsentKeys,githubSyncRecordFailure,githubSyncClearFailure,githubSyncFailureInfo,githubSyncFailureText,githubSyncRequest,githubSyncPullRisk,applyGitHubSyncRemote,githubSyncTimeoutMs}', ctx);
const fn = ctx.f;
(async () => {
  // A. 키 없는 컬렉션
  const absent = fn.importAbsentKeys({ scenarios: [], records: [], bookmarks: [] });
  ok(absent.includes('musicTracks') && absent.includes('musicFolders') && absent.includes('musicTagCats') && absent.includes('characters') && !absent.includes('scenarios') && !absent.includes('bookmarks'), '키 없는 컬렉션(musicTracks 등)만 absentKeys 로 표시, 빈 배열로 있는 키는 제외');
  ok(fn.importAbsentKeys([{ id: 1 }]).includes('musicTracks') && !fn.importAbsentKeys([{ id: 1 }]).includes('scenarios'), '옛 배열 백업: scenarios 만 있고 나머지는 absent');
  ok(fn.importAbsentKeys({ sharedMemoOwner: { memos: [] } }).includes('sharedMemoOwner') === false, 'sharedMemoOwner 객체가 있으면 absent 아님');
  // replaceStateWithImportPayload: absent 키는 로컬 유지
  const rs = html.slice(html.indexOf('function replaceStateWithImportPayload'), html.indexOf('function mergeImportPayload'));
  const ctx2 = { state: JSON.parse(JSON.stringify(state)) }; vm.createContext(ctx2); vm.runInContext(rs + ';this.f=replaceStateWithImportPayload', ctx2);
  const payload = { scenarios: [{ id: 'new' }], folders: [], cssMacroFolders: [], records: [], catalog: [], cssMacros: [], cssPopupDictionary: [], bookmarks: [], rulebooks: [], characters: [], characterFolders: [], customFonts: [], recentFonts: [], sharedMemoOwner: { memos: [] }, musicTracks: [], musicFolders: [], musicTagCats: null, dataSheets: [], manualFonts: [], customBulletSymbols: [], customBulletImages: [], findReplaceHistory: [] };
  Object.defineProperty(payload, 'absentKeys', { value: ['musicTracks', 'musicFolders', 'musicTagCats', 'characters'], enumerable: false });
  ctx2.f(payload);
  ok(ctx2.state.scenarios[0].id === 'new' && ctx2.state.musicTracks.length === 2 && ctx2.state.musicTagCats.length === 1 && ctx2.state.characters.length === 1, '교체 적용: 있는 키는 교체, 키 없는 musicTracks·musicTagCats·characters 는 로컬 유지');
  const p2 = Object.assign({}, payload); Object.defineProperty(p2, 'absentKeys', { value: [], enumerable: false }); ctx2.f(p2);
  ok(ctx2.state.musicTracks.length === 0, '키가 빈 배열로 있으면(의도된 교체) 그대로 비움');
  // B. 위험 판단
  const risk = fn.githubSyncPullRisk({ musicTracks: [], scenarios: [1], characters: [], absentKeys: ['characters'] }, Date.parse('2026-10-26'), Date.parse('2026-11-20'));
  ok(risk.lost.map(x => x.key).join() === 'musicTracks' && risk.lost[0].count === 2 && risk.stale && risk.staleDays === 25, '위험: 항목 있는 컬렉션이 0개가 됨(키 없는 characters 는 제외)·원격본 25일 오래됨');
  const safe = fn.githubSyncPullRisk({ musicTracks: [1], scenarios: [1], absentKeys: [] }, Date.parse('2026-11-19'), Date.parse('2026-11-20'));
  ok(!safe.lost.length && !safe.stale, '일반 pull(최근·컬렉션 유지)은 위험 아님');
  // C. 자동 pull 차단 / 수동 확인 / 보호 스냅샷
  const staleRemote = { data: { savedAt: '2026-10-26T00:00:00Z', scenarios: [{ id: 'old' }], musicTracks: [] }, sha: 'a', size: 10 };
  let err = null; try { await fn.applyGitHubSyncRemote(staleRemote, false, { automatic: true }); } catch (e) { err = e.message; }
  ok(/위험한 불러오기를 적용하지 않았습니다/.test(err || '') && replaced === 0 && persisted === 0 && snapshots.length === 0, '자동 pull 은 위험하면 적용하지 않고 오류(무변경·스냅샷 없음)');
  confirmAnswer = false; err = null; try { await fn.applyGitHubSyncRemote(staleRemote, false, { manual: true }); } catch (e) { err = e.message; }
  ok(/위험한 불러오기/.test(err || '') && replaced === 0, '수동 pull 에서 확인 창 취소 → 무변경');
  confirmAnswer = true; await fn.applyGitHubSyncRemote(staleRemote, false, { manual: true });
  ok(replaced === 1 && persisted === 1 && snapshots.length === 1 && /GitHub 불러오기 직전: musicTracks/.test(snapshots[0]), '수동 확인 후 적용: 보호 스냅샷을 먼저 남기고 교체');
  // 안전한 pull 은 확인·스냅샷 없이
  snapshots = []; replaced = 0; await fn.applyGitHubSyncRemote({ data: { savedAt: '2026-11-19T00:00:00Z', musicTracks: [{ id: 'z' }], scenarios: [1] }, sha: 'b', size: 10 }, false, { automatic: true });
  ok(replaced === 1 && snapshots.length === 0, '안전한 자동 pull 은 그대로 적용(스냅샷·확인 없음)');
  ctx.persistNow = async () => { throw new Error('IndexedDB 쓰기 실패'); };
  err = null; try { await fn.applyGitHubSyncRemote({ data: { savedAt: '2026-11-19T00:00:00Z', musicTracks: [{ id: 'z' }], scenarios: [1] }, sha: 'c', size: 10 }, false, { automatic: true }); } catch (e) { err = e.message; }
  ok(replaced === 1 && err === 'IndexedDB 쓰기 실패', 'pull 저장 실패 시 교체 전 상태 복구');
  // D. 실패 기록·표시
  fn.githubSyncRecordFailure('GitHub 413: too large', Date.parse('2026-11-10T00:00:00Z')); const r2 = fn.githubSyncRecordFailure('시간 초과', Date.parse('2026-11-14T00:00:00Z'));
  ok(r2.count === 2 && r2.firstAt === '2026-11-10T00:00:00.000Z' && /2회 연속 실패\(4일째\)/.test(fn.githubSyncFailureText(r2, Date.parse('2026-11-14T00:00:00Z'))) && /시간 초과/.test(fn.githubSyncFailureText(r2)), '실패 기록: 횟수·처음 실패 시각·N일째·사유 표시');
  fn.githubSyncClearFailure(); ok(fn.githubSyncFailureInfo() === null && fn.githubSyncFailureText() === '', '성공하면 실패 기록 삭제');
  // E. 시간 제한
  fetchImpl = (url, opt) => new Promise((resolve, reject) => { opt.signal.addEventListener('abort', () => { const e = new Error('aborted'); e.name = 'AbortError'; reject(e); }); });
  err = null; try { await fn.githubSyncRequest('https://x', { timeoutMs: 30 }); } catch (e) { err = e.message; }
  ok(/GitHub 요청 시간 초과/.test(err || ''), '응답이 없으면 시간 제한 후 오류(영원히 「동기화 중」에 머물지 않음)');
  ok(fn.githubSyncTimeoutMs(0) === 60000 && fn.githubSyncTimeoutMs(67 * 1048576) === 60000 + 67 * 1500, '업로드 시간 제한은 본문 크기에 비례(67MB → 160.5초)');
  fetchImpl = async (_url, opt) => ({ ok: true, status: 200, blob: () => new Promise((resolve, reject) => {
    opt.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
  }) });
  err = null; try { await fn.githubSyncRequest('https://x', { timeoutMs: 30 }, response => response.blob()); } catch (e) { err = e.message; }
  ok(/GitHub 요청 시간 초과/.test(err || ''), '헤더를 받은 뒤 본문이 멈춰도 시간 제한 적용');
  ok(/githubSyncClearFailure\(\); return ok;/.test(html) && /githubSyncWarnLongFailure\(fail\)/.test(html) && /동기화 실패: /.test(html), '동기화 성공 시 실패 기록 삭제·3일 이상 실패 경고·버튼 툴팁/모달에 실패 표시');
  process.exit(f ? 1 : 0);
})();
