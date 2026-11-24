const fs = require('fs'), path = require('path'), vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13,10)).join(String.fromCharCode(10));
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok', m); };
const cut = (a, b) => html.slice(html.indexOf(a), html.indexOf(b));
// 정적: 비주 창 저장 금지·주 창 승계·분리 창 보호
ok(html.includes("if (multiNonLeader()) { multiSchedulePatch(); return; }") && html.includes("if (multiNonLeader()) { multiPost({ kind: 'full'"), '비주 창은 persist/persistNow 에서 IndexedDB 에 직접 쓰지 않음');
ok(html.includes("navigator.locks.request('trpg-state-writer', { ifAvailable: true }") && html.includes('multiPromote(); await new Promise(release => { multiWin.releaseLock = release; })'), '리더 락·승계');
ok(html.includes("if (multiNonLeader()) { if (!options.automatic) showToast('동기화는 주 창에서만 실행됩니다.'); return Promise.resolve(false); }"), '비주 창은 원격 동기화 금지');
ok(html.includes("if (multiWin.detachedPage && page !== multiWin.detachedPage) return;") && html.includes('|| multiWin.detachedPage) return; // 분리 창은 주 창의 열린 탭 목록을 건드리지 않는다'), '분리 창: 다른 페이지 전환·열린 탭 저장 금지');
ok(html.includes("window.open(url, 'trpg-detached-' + page") && html.includes("data-act") === html.includes("data-act") && html.includes('새 창으로 분리') && html.includes("multiDragEndOutside(e)) detachAppPage"), '탭 우클릭 메뉴·창 밖 끌어 놓기로 분리');
// 동적: 패치 생성/적용/충돌
const code = cut('const MULTI_WIN_KEYS', 'function multiPost');
const ctx = { state: {}, characterSheetPopupParams: new URLSearchParams(''), characterSheetInstanceId: 'me', BroadcastChannel: undefined, navigator: {}, location: {} };
vm.createContext(ctx);
vm.runInContext(code.replace("typeof BroadcastChannel === 'function' ? new BroadcastChannel('trpg-state') : null", 'null') + ';this.f={multiDiff,multiApplyOps,multiCapture,multiWin,multiDescribe}', ctx);
const f = ctx.f, S = ctx.state;
const reset = () => { MULTI = ['scenarios','folders','cssMacroFolders','records','catalog','cssMacros','cssPopupDictionary','bookmarks','musicFolders','musicTagCats','musicTracks','rulebooks','dataSheets','characters','characterFolders','customFonts','manualFonts','recentFonts','customBulletSymbols','customBulletImages','findReplaceHistory','sharedMemoOwner']; MULTI.forEach(k => S[k] = []); S.musicTagCats = null; S.sharedMemoOwner = { memos: [] }; f.multiCapture(); };
let MULTI;
reset();
ok(f.multiDiff().length === 0, '변경 없으면 패치 없음');
S.bookmarks.push({ id: 's1', title: 'A' }); S.bookmarks.push({ id: 's2', title: 'B' });
let ops = f.multiDiff(); const sc = ops.find(o => o.key === 'bookmarks');
ok(ops.length === 1 && sc.set.map(i => i.id).join() === 's1,s2' && sc.del.length === 0 && sc.order.join() === 's1,s2', '추가: 항목 단위 set + 순서');
S.bookmarks[0].title = 'A2'; ops = f.multiDiff();
ok(ops.length === 1 && ops[0].set.length === 1 && ops[0].set[0].id === 's1' && ops[0].set[0].title === 'A2', '수정: 바뀐 항목만');
S.bookmarks.splice(1, 1); ops = f.multiDiff();
ok(ops[0].del.join() === 's2' && ops[0].set.length === 0, '삭제: id 만');
S.bookmarks.unshift({ id: 's3', title: 'C' }); ops = f.multiDiff(); S.bookmarks.reverse(); ops = f.multiDiff();
ok(ops.length === 1 && ops[0].set.length === 0 && ops[0].order.join() === 's1,s3', '순서만 바뀜');
S.customFonts = ['a']; S.sharedMemoOwner = { memos: [{ id: 'm' }] }; ops = f.multiDiff();
ok(ops.map(o => o.key).sort().join() === 'customFonts,sharedMemoOwner' && ops.every(o => o.type === 'value' || o.type === 'items'), '컬렉션이 아닌 설정은 키 단위');
// 두 창 시뮬레이션: A(patch 생성) → B(적용)
const B = { state: {} }; const ctxB = vm.createContext({ state: B.state, characterSheetPopupParams: new URLSearchParams(''), characterSheetInstanceId: 'b', navigator: {}, location: {} });
vm.runInContext(code.replace("typeof BroadcastChannel === 'function' ? new BroadcastChannel('trpg-state') : null", 'null') + ';this.f={multiDiff,multiApplyOps,multiCapture}', ctxB);
const fb = ctxB.f; MULTI.forEach(k => B.state[k] = JSON.parse(JSON.stringify(S[k]))); fb.multiCapture(); f.multiCapture();
S.bookmarks.push({ id: 's9', title: 'new' }); S.bookmarks[0].title = 'edited';
const sent = JSON.parse(JSON.stringify(f.multiDiff()));
const conflicts = fb.multiApplyOps(sent);
ok(conflicts === 0 && JSON.stringify(B.state.bookmarks) === JSON.stringify(S.bookmarks), '패치 적용 결과가 원본 창과 동일');
ok(fb.multiDiff().length === 0, '받은 패치를 적용한 뒤에는 다시 보낼 변경이 없음(핑퐁 방지)');
// 충돌: B 가 s1 을 보내기 전에 편집, A 도 s1 편집 → B 는 자기 것 유지
B.state.bookmarks.find(i => i.id === 's1').title = 'B-local';
S.bookmarks.find(i => i.id === 's1').title = 'A-new'; const sent2 = JSON.parse(JSON.stringify(f.multiDiff()));
const c2 = fb.multiApplyOps(sent2);
ok(c2 === 1 && B.state.bookmarks.find(i => i.id === 's1').title === 'B-local', '같은 항목 동시 편집: 아직 안 보낸 내 편집 우선·충돌 1건');
const back = fb.multiDiff();
ok(back.length === 1 && back[0].set[0].title === 'B-local', '내 편집은 다음 diff 에서 다시 전파됨');
// 삭제 vs 편집
B.state.bookmarks.find(i => i.id === 's9').title = 'B-edit'; S.bookmarks = S.bookmarks.filter(i => i.id !== 's9'); const sent3 = JSON.parse(JSON.stringify(f.multiDiff()));
ok(fb.multiApplyOps(sent3) === 1 && B.state.bookmarks.some(i => i.id === 's9'), '삭제와 편집이 겹치면 편집한 쪽 유지');
ok(html.includes("function multiEditingNow()") && html.includes("document.addEventListener('focusout', () => { if (multiWin.pending.length) setTimeout(multiApplyPending, 0); });") && html.includes("다른 창의 변경과 겹쳐 이 창의 내용으로 저장했습니다."), '입력 중 패치 보류·포커스 빠질 때 적용·충돌 토스트');
ok(html.includes("multiFlushPatch(); // 닫히기 직전 변경도 다른 창에 전달(#279)") && html.includes("if (multiNonLeader() && multiWin.outbox.length) { event.preventDefault()"), '닫히기 직전 변경 전파·미전달 편집 경고');
ok(html.includes('function startLeaderDuties()') && html.includes('multiIsLeader()) startLeaderDuties();') && html.includes('  startLeaderDuties();'), '원격 동기화·백업은 주 창(승계 포함)만 시작');
console.log('fails=' + fails); process.exit(fails ? 1 : 0);
