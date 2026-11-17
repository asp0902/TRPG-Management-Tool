const fs = require('fs'), path = require('path'), vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13,10)).join(String.fromCharCode(10));
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok', m); };
const cut = (a, b) => html.slice(html.indexOf(a), html.indexOf(b));
const code = cut('const MULTI_WIN_KEYS', 'function multiPost').replace("typeof BroadcastChannel === 'function' ? new BroadcastChannel('trpg-state') : null", 'null');
const KEYS = ['scenarios','folders','cssMacroFolders','records','catalog','cssMacros','cssPopupDictionary','bookmarks','musicFolders','musicTagCats','musicTracks','rulebooks','dataSheets','characters','characterFolders','customFonts','manualFonts','recentFonts','customBulletSymbols','customBulletImages','findReplaceHistory','sharedMemoOwner'];
const mkWin = id => { const c = { state: {}, characterSheetPopupParams: new URLSearchParams(''), characterSheetInstanceId: id, navigator: {}, location: {} }; vm.createContext(c); vm.runInContext(code + ';this.f={multiDiff,multiApplyOps,multiCapture,multiDiffScenario,multiApplyNodeOps,multiTreeIndex}', c); KEYS.forEach(k => c.state[k] = []); c.state.musicTagCats = null; c.state.sharedMemoOwner = { memos: [] }; return c; };
const clone = x => JSON.parse(JSON.stringify(x));
const base = () => ({ id: 'sc1', title: '시나리오', info: { a: 1 }, blocks: [
  { id: 'b1', type: 'text', content: 'one', children: [] },
  { id: 'b2', type: 'branch', content: '', children: [{ id: 'b2c1', type: 'text', content: 'child1', children: [] }, { id: 'b2c2', type: 'text', content: 'child2', children: [] }], ibs: [{ id: 'ib1', type: 'item', label: 'x', rollResults: [{ id: 'rr1', type: 'success', children: [{ id: 'rr1c', type: 'text', content: 'deep', children: [] }] }] }] },
  { id: 'b3', type: 'text', content: 'three', children: [] },
] });
const A = mkWin('A'), B = mkWin('B');
A.state.scenarios = [base()]; B.state.scenarios = [base()]; A.f.multiCapture(); B.f.multiCapture();
const find = (S, id) => { const out = []; const walk = o => { if (o.id === id) out.push(o); Object.values(o).forEach(v => Array.isArray(v) && v.forEach(c => c && typeof c === 'object' && walk(c))); }; S.scenarios.forEach(walk); return out[0]; };
const send = (from, to) => { const ops = clone(from.f.multiDiff()); const c = to.f.multiApplyOps(ops); return { ops, c }; };
const same = () => JSON.stringify(A.state.scenarios) === JSON.stringify(B.state.scenarios);

// 1) 서로 다른 블록 동시 수정: 둘 다 보존
find(A.state, 'b1').content = 'A-edit'; find(B.state, 'b3').content = 'B-edit';
let r1 = send(A, B), r2 = send(B, A);
ok(r1.ops.length === 1 && r1.ops[0].type === 'scenario-nodes' && r1.ops[0].ops.length === 1 && r1.ops[0].ops[0].id === 'b1', '패치는 바뀐 블록 하나만(시나리오 전체 아님)');
ok(r1.c === 0 && r2.c === 0 && find(A.state, 'b3').content === 'B-edit' && find(B.state, 'b1').content === 'A-edit' && same(), '서로 다른 블록 동시 수정 → 둘 다 보존(충돌 0)');
ok(A.f.multiDiff().length === 0 && B.f.multiDiff().length === 0, '적용 뒤 다시 보낼 변경 없음');
// 2) 같은 블록: 아직 안 보낸 내 편집 우선
find(A.state, 'b1').content = 'A-2'; find(B.state, 'b1').content = 'B-2';
const a2 = clone(A.f.multiDiff()); const c2 = B.f.multiApplyOps(a2);
ok(c2 >= 1 && find(B.state, 'b1').content === 'B-2', '같은 블록 동시 수정: 받는 쪽 미전파 편집 유지(충돌 토스트 대상)');
const b2 = clone(B.f.multiDiff()); A.f.multiApplyOps(b2);
ok(b2.length === 1 && find(A.state, 'b1').content === 'B-2' && same(), '유지된 편집이 다시 전파되어 두 창이 일치(블록 단위 마지막 쓰기 우선)');
// 3) 중첩 블록(분기 자식·판정 결과 자식): 추가·수정
find(A.state, 'rr1c').content = 'deep-A'; find(A.state, 'b2').children.push({ id: 'b2c3', type: 'text', content: 'new', children: [] });
const r3 = send(A, B);
ok(r3.c === 0 && find(B.state, 'rr1c').content === 'deep-A' && find(B.state, 'b2c3') && same(), '중첩(분기 자식·판정 결과 자식) 추가·수정 전파');
// 4) 순서 변경 + 수정
const bl = A.state.scenarios[0].blocks; bl.splice(0, 0, bl.splice(2, 1)[0]); find(A.state, 'b2c1').content = 'moved-edit';
const r4 = send(A, B);
ok(B.state.scenarios[0].blocks.map(b => b.id).join() === 'b3,b1,b2' && find(B.state, 'b2c1').content === 'moved-edit' && same(), '순서 변경 + 수정 동시 반영');
// 5) 삭제
A.state.scenarios[0].blocks = A.state.scenarios[0].blocks.filter(b => b.id !== 'b3'); const r5 = send(A, B);
ok(!find(B.state, 'b3') && r5.c === 0 && same(), '블록 삭제 전파');
// 6) 부모 삭제 vs 자식 수정: 자식 패치는 버림
find(A.state, 'b2c2').content = 'A-child-edit'; B.state.scenarios[0].blocks = B.state.scenarios[0].blocks.filter(b => b.id !== 'b2');
const a6 = clone(A.f.multiDiff()); const c6 = B.f.multiApplyOps(a6);
ok(c6 >= 1 && !find(B.state, 'b2') && !find(B.state, 'b2c2'), '부모가 지워진 창에서는 자식 패치를 버림(충돌 알림)');
// 7) 블록 밖 필드(제목)는 루트 노드 단위로
A.f.multiCapture(); B.f.multiCapture(); B.state.scenarios = clone(A.state.scenarios);
A.state.scenarios[0].title = '새 제목'; const r7 = send(A, B);
ok(B.state.scenarios[0].title === '새 제목' && r7.ops[0].ops.length === 1 && r7.ops[0].ops[0].id === 'sc1', '블록 밖 필드는 루트 노드 패치');
// 8) 폴백: 같은 id 가 두 번 나오는 시나리오 → 시나리오 전체 패치
const D = mkWin('D'); D.state.scenarios = [base()]; D.f.multiCapture();
D.state.scenarios[0].blocks.push({ id: 'b1', type: 'text', content: 'dupe', children: [] });
const r8 = clone(D.f.multiDiff());
ok(r8.length === 1 && r8[0].type === 'items' && r8[0].set.length === 1 && r8[0].set[0].id === 'sc1', '블록 id 중복 → 시나리오 전체 패치로 폴백');
// 9) 새 시나리오·시나리오 삭제는 항목 단위 그대로
D.state.scenarios.push({ id: 'sc2', title: 'new', blocks: [] }); const r9 = clone(D.f.multiDiff());
ok(r9.some(o => o.type === 'items' && o.set.some(x => x.id === 'sc2')), '새 시나리오는 항목 단위 패치');
ok(html.includes("scenarioHistory.delete(state.currentId); // 다른 창의 변경은 실행취소 기록에 넣지 않는다"), '원격 패치는 실행취소 기록에 넣지 않음');
console.log('fails=' + fails); process.exit(fails ? 1 : 0);
