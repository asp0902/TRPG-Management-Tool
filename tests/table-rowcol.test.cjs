const fs = require('fs'), path = require('path'), vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13, 10)).join(String.fromCharCode(10));
let f = 0; const ok = (c, m) => { if (!c) { f++; console.log('FAIL', m); } else console.log('ok', m); };
const grid = html.slice(html.indexOf('function tbGridModel'), html.indexOf('// ── DOM 연결 ──'));
const edit = html.slice(html.indexOf('function tbInsertRowPlan'), html.indexOf('function tbNewCell'));
const ctx = {}; vm.createContext(ctx);
vm.runInContext(grid + edit + ';this.f={tbGridModel,tbInsertRowPlan,tbInsertColPlan,tbDeleteRowPlan,tbDeleteColPlan}', ctx);
const F = ctx.f;
const plain = (r, c) => Array.from({ length: r }, () => Array.from({ length: c }, () => ({ cs: 1, rs: 1 })));
const m3 = F.tbGridModel(plain(3, 3));
// 일반 표 행 추가
let p = F.tbInsertRowPlan(m3, 0);
ok(p.at === 0 && p.extend.length === 0 && p.newCols.join() === '0,1,2', '위에 행 추가(맨 위): 모든 열에 새 셀');
p = F.tbInsertRowPlan(m3, 3); ok(p.extend.length === 0 && p.newCols.length === 3, '아래에 행 추가(맨 아래)');
p = F.tbInsertRowPlan(m3, 1); ok(p.newCols.length === 3 && p.extend.length === 0, '가운데 행 추가');
// 세로 합침(첫 열 3칸)이 걸친 위치: 새 셀 대신 rowspan 증가
const vm1 = F.tbGridModel([[{ cs: 1, rs: 3 }, { cs: 1, rs: 1 }], [{ cs: 1, rs: 1 }], [{ cs: 1, rs: 1 }]]);
p = F.tbInsertRowPlan(vm1, 1);
ok(p.extend.join() === '0' && p.newCols.join() === '1', '세로 합침 셀을 가로지르면 rowspan 증가 + 나머지 열만 새 셀');
p = F.tbInsertRowPlan(vm1, 3); ok(p.extend.length === 0 && p.newCols.join() === '0,1', '합침 셀의 아래 경계(표 끝)에는 새 셀을 끼움');
p = F.tbInsertRowPlan(vm1, 0); ok(p.extend.length === 0 && p.newCols.join() === '0,1', '합침 셀의 위 경계는 가로지르지 않음');
// 가로 합침(첫 행 3칸 합침) 열 추가
const hm = F.tbGridModel([[{ cs: 3, rs: 1 }], [{ cs: 1, rs: 1 }, { cs: 1, rs: 1 }, { cs: 1, rs: 1 }]]);
let q = F.tbInsertColPlan(hm, 1);
ok(q.extend.join() === '0' && q.newRows.map(x => x.row).join() === '1', '가로 합침 셀을 가로지르면 colspan 증가 + 나머지 행만 새 셀');
ok(q.newRows[0].beforeId === 2, '새 셀은 그 행에서 col>=at 인 첫 셀(id 2) 앞');
q = F.tbInsertColPlan(hm, 3); ok(q.extend.length === 0 && q.newRows.length === 2 && q.newRows[0].beforeId === null, '오른쪽 끝 열 추가: 두 행 모두 끝에 추가');
q = F.tbInsertColPlan(m3, 0); ok(q.newRows.map(x => x.beforeId).join() === '0,3,6', '맨 왼쪽 열 추가: 각 행 첫 셀 앞');
// 세로 합침 셀 왼쪽/오른쪽에 열 추가 시 행마다 새 셀(위 셀이 아래 행 칸을 차지해도 어긋나지 않음)
q = F.tbInsertColPlan(vm1, 1); ok(q.extend.length === 0 && q.newRows.map(x => x.row).join() === '0,1,2', '세로 합침 셀 오른쪽 열 추가: 행 3곳에 새 셀');
ok(q.newRows.map(x => x.beforeId).join() === '1,2,3', '각 행의 col>=1 첫 셀(B·C·D) 앞에 삽입, 합침 셀(A)은 첫 행 소속이라 밀리지 않음');
// 행 삭제
ok(F.tbDeleteRowPlan(F.tbGridModel(plain(1, 3)), 0) === null, '마지막 1행은 삭제 불가');
let d = F.tbDeleteRowPlan(m3, 1); ok(d.remove.join() === '3,4,5' && d.shrink.length === 0 && d.move.length === 0, '일반 행 삭제: 그 행 셀 3개 제거');
d = F.tbDeleteRowPlan(vm1, 1); ok(d.remove.join() === '2' && d.shrink.join() === '0' && d.move.length === 0, '합침 셀이 걸친 행 삭제: rowspan 감소(3→2), 그 행 셀만 제거');
d = F.tbDeleteRowPlan(vm1, 0); ok(d.shrink.join() === '0' && d.remove.join() === '1' && d.move.length === 1 && d.move[0].toRow === 1 && d.move[0].beforeId === 2, '합침 셀의 시작 칸이 있는 행 삭제: 셀을 다음 행으로 옮김(그 행의 col>0 인 첫 셀 앞)');
const vm2 = F.tbGridModel([[{ cs: 1, rs: 2 }, { cs: 1, rs: 1 }], [{ cs: 1, rs: 1 }]]);
d = F.tbDeleteRowPlan(vm2, 1); ok(d.shrink.join() === '0' && d.remove.join() === '2', '2행 합침 셀의 둘째 행 삭제: rowspan 1(속성 제거 대상)');
// 열 삭제
ok(F.tbDeleteColPlan(F.tbGridModel(plain(3, 1)), 0) === null, '마지막 1열은 삭제 불가');
let e = F.tbDeleteColPlan(m3, 2); ok(e.remove.join() === '2,5,8' && e.shrink.length === 0, '일반 열 삭제');
e = F.tbDeleteColPlan(hm, 1); ok(e.shrink.join() === '0' && e.remove.join() === '2', '가로 합침 셀이 걸친 열 삭제: colspan 감소');
e = F.tbDeleteColPlan(hm, 0); ok(e.shrink.join() === '0' && e.remove.join() === '1', '합침 셀의 시작 열 삭제: colspan 만 줄고 셀은 그대로, 그 열의 다른 셀 제거');
ok(F.tbDeleteRowPlan(m3, 5) === null && F.tbDeleteColPlan(m3, -1) === null, '범위 밖은 null');
// 메뉴 구조
ok(['위에 행 추가', '아래에 행 추가', '왼쪽에 열 추가', '오른쪽에 열 추가', '표 삭제'].every(l => html.includes("label: '" + l + "'")) && html.includes("'행 삭제'") && html.includes("'열 삭제'"), '메뉴 항목 7개');
ok(/items\.push\(\{ sep: true \}, \.\.\.tbTableEditItems\(table, model, elems, id\)\)/.test(html), '합치기 항목 뒤에 구분선으로 묶어 같은 메뉴에 추가');
ok(/disabled: !delRow/.test(html) && /disabled: !delCol/.test(html), '마지막 1행·1열 삭제 비활성');
ok(/return \[\{ icon: '▦', label: '표', submenu: items \}\]/.test(html), '본 메뉴에는 「표 ▶」 한 줄만, 항목은 하위 메뉴(#365)');
ok(/label: '표 삭제', danger: true/.test(html), '표 삭제는 danger 표시');
process.exit(f ? 1 : 0);
