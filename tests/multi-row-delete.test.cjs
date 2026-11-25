const fs = require('fs'), path = require('path'), vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13, 10)).join(String.fromCharCode(10));
let f = 0; const ok = (c, m) => { if (!c) { f++; console.log('FAIL', m); } else console.log('ok', m); };
const cut = (a, b) => html.slice(html.indexOf(a), html.indexOf(b));
const ctx = {}; vm.createContext(ctx);
vm.runInContext(cut('function tbGridModel', 'function tbCellRect') + cut('function tbDeleteRowsPlan', 'function tbNewCell') + cut('function ds_planRowDelete', 'function ds_removeRows') + ';this.f={tbGridModel,tbDeleteRowsPlan,tbDeleteRowPlan,tbDeleteColsPlan,ds_planRowDelete,ds_rowShift}', ctx);
const F = ctx.f, plain = (r, c) => Array.from({ length: r }, () => Array.from({ length: c }, () => ({ cs: 1, rs: 1 })));
// 데이터 시트: 계획·번호 이동
ok(F.ds_planRowDelete(2, [1, 2, 4], null).join() === '1,2,4', '행 머리글 다중 선택 → 선택 행 전부');
ok(F.ds_planRowDelete(3, [1, 2], [3, 4]).join() === '3,4', '선택 밖 행이고 범위 안이면 범위 행');
ok(F.ds_planRowDelete(5, [1, 2], [3, 4]).join() === '5', '둘 다 밖이면 그 행 하나');
ok(F.ds_planRowDelete(1, [1], null).join() === '1', '한 행 선택은 단일');
ok(F.ds_rowShift(5, [1, 2, 4]) === 2 && F.ds_rowShift(2, [1, 2, 4]) === null && F.ds_rowShift(0, [1, 2]) === 0, '삭제 뒤 행 번호 이동');
// 본문 표
const m = F.tbGridModel(plain(4, 3));
let d = F.tbDeleteRowsPlan(m, 1, 2);
ok(d.remove.join() === '3,4,5,6,7,8' && d.shrink.length === 0 && d.r1 === 1 && d.r2 === 2, '2행 삭제: 두 행 셀 6개 제거');
ok(F.tbDeleteRowsPlan(m, 0, 3) === null && F.tbDeleteRowsPlan(m, 2, 1).remove.length === 6, '전체 행이면 null, 뒤집힌 범위도 정규화');
// 세로 합침: A(rs4)·B / C(rs2) / (비움) / E. 1~2행 삭제 → C 제거, A rowspan 4→2
const vm1 = F.tbGridModel([[{ cs: 1, rs: 4 }, { cs: 1, rs: 1 }], [{ cs: 1, rs: 2 }], [], [{ cs: 1, rs: 1 }]]);
d = F.tbDeleteRowsPlan(vm1, 1, 2);
ok(d.remove.join() === '2' && d.shrink.length === 1 && d.shrink[0].id === 0 && d.shrink[0].by === 2 && d.move.length === 0, '걸친 셀 rowspan 4→2, 범위 안 셀 제거, 이동 없음');
// 시작 칸이 범위 안·끝이 밖: A(rs3)·B / C(col1, rs3) / - / D. 0~1행 삭제 → A·C 는 2행으로 열 순서대로 이동
const mv = F.tbGridModel([[{ cs: 1, rs: 3 }, { cs: 1, rs: 1 }], [{ cs: 1, rs: 3 }], [], [{ cs: 1, rs: 1 }]]);
d = F.tbDeleteRowsPlan(mv, 0, 1);
ok(d.remove.join() === '1' && d.shrink.map(x => x.id + ':' + x.by).join() === '0:2,2:1', '합침 셀 rowspan 줄임(3→1, 3→2), B 제거');
ok(d.move.map(x => x.id + '>' + x.toRow + '/' + x.beforeId).join() === '0>2/null,2>2/null', '범위 시작 합침 셀은 범위 다음 행으로 열 순서대로 이동');
// 단일 행은 기존 모양 유지
const one = F.tbDeleteRowPlan(m, 1);
ok(one.row === 1 && one.remove.join() === '3,4,5' && Array.isArray(one.shrink), '단일 행 삭제 래퍼');
// 열
const c = F.tbDeleteColsPlan(m, 0, 1);
ok(c.remove.join() === '0,1,3,4,6,7,9,10' && F.tbDeleteColsPlan(m, 0, 2) === null, '2열 삭제, 전체 열이면 null');
const hm = F.tbGridModel([[{ cs: 3, rs: 1 }], [{ cs: 1, rs: 1 }, { cs: 1, rs: 1 }, { cs: 1, rs: 1 }]]);
const hc = F.tbDeleteColsPlan(hm, 1, 2);
ok(hc.shrink.length === 1 && hc.shrink[0].by === 2 && hc.remove.join() === '2,3', '가로 합침 셀 colspan 3→1');
// 연결
ok(/function ds_removeRow\(rowIdx\) \{ ds_removeRows\(\[rowIdx\]\); \}/.test(html), 'ds_removeRow 는 ds_removeRows 위임');
ok((html.match(/delItem,/g) || []).length === 3 && /선택한 행 ' \+ plan\.length \+ '개 삭제/.test(html), '세 메뉴 모두 「선택한 행 n개 삭제」 항목 사용');
ok(/'행 ' \+ nRow \+ '개 삭제'/.test(html) && /'열 ' \+ nCol \+ '개 삭제'/.test(html), '본문 표 「행 n개 삭제」·「열 n개 삭제」');
ok(/e\.button === 2 && ds_isCellRangeSelected\(findDataSheet\(_dsEditId\), parseInt\(rowIdx\), colId\)\) return;/.test(html), '셀 범위 안 우클릭은 범위를 지우지 않음');
process.exit(f ? 1 : 0);
