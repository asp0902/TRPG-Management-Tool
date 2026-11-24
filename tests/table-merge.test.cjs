const fs = require('fs'), path = require('path'), vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13, 10)).join(String.fromCharCode(10));
let f = 0; const ok = (c, m) => { if (!c) { f++; console.log('FAIL', m); } else console.log('ok', m); };
const a = html.indexOf('function tbGridModel'), b = html.indexOf('// ── DOM 연결 ──');
const ctx = {}; vm.createContext(ctx);
vm.runInContext(html.slice(a, b) + ';this.f={tbGridModel,tbExpandRect,tbMergePlan,tbNeighborMergePlan,tbSplitPlan,tbMergedHtml,tbCellRect}', ctx);
const F = ctx.f;
const plain = (r, c) => Array.from({ length: r }, () => Array.from({ length: c }, () => ({ cs: 1, rs: 1 })));
// 격자
let m = F.tbGridModel(plain(3, 3));
ok(m.rows === 3 && m.cols === 3 && m.cells.length === 9 && m.grid[2][2] === 8 && m.cells[4].row === 1 && m.cells[4].col === 1, '3×3 일반 표 격자');
// 합쳐진 셀이 있는 표: 1행 [A(cs2) B], 2행 [C(rs2)... ] → 격자 위치
const sp = [[{ cs: 2, rs: 1 }, { cs: 1, rs: 2 }], [{ cs: 1, rs: 1 }, { cs: 1, rs: 1 }], [{ cs: 1, rs: 1 }, { cs: 1, rs: 1 }, { cs: 1, rs: 1 }]];
m = F.tbGridModel(sp);
ok(m.cols === 3 && m.grid[0].join() === '0,0,1' && m.grid[1].join() === '2,3,1' && m.grid[2].join() === '4,5,6', '가로·세로 합침이 있는 표의 행·열 위치(rowspan 이 다음 행의 칸을 밀어냄)');
ok(m.cells[3].col === 1 && m.cells[2].col === 0, '다음 행 셀은 rowspan 에 가려진 칸을 건너뛰고 배치');
// rowspan 이 표 높이를 넘으면 줄임
ok(F.tbGridModel([[{ cs: 1, rs: 5 }], [{ cs: 1, rs: 1 }]]).cells[0].rs === 2, 'rowspan 은 남은 행 수로 제한');
// 사각형 확장
const m3 = F.tbGridModel(plain(3, 3));
let plan = F.tbMergePlan(m3, { r1: 0, c1: 0, r2: 0, c2: 1 });
ok(plan && plan.keep === 0 && plan.remove.join() === '1' && plan.cs === 2 && plan.rs === 1, '가로 합치기(0,0)-(0,1)');
plan = F.tbMergePlan(m3, { r1: 0, c1: 1, r2: 2, c2: 1 });
ok(plan && plan.ids.join() === '1,4,7' && plan.cs === 1 && plan.rs === 3, '세로 합치기 한 열 3칸');
plan = F.tbMergePlan(m3, { r1: 2, c1: 2, r2: 0, c2: 0 });
ok(plan && plan.cs === 3 && plan.rs === 3 && plan.ids.length === 9 && plan.ids[0] === 0, '사각형(역방향 선택) 3×3 전체, 순서는 왼쪽 위 → 오른쪽 아래');
ok(F.tbMergePlan(m3, { r1: 1, c1: 1, r2: 1, c2: 1 }) === null, '셀 하나뿐이면 합칠 것 없음');
// 일부만 걸친 합쳐진 셀은 다 포함하도록 넓힘
const mm = F.tbGridModel([[{ cs: 2, rs: 1 }, { cs: 1, rs: 1 }], [{ cs: 1, rs: 1 }, { cs: 1, rs: 1 }, { cs: 1, rs: 1 }]]);
const box = F.tbExpandRect(mm, { r1: 0, c1: 1, r2: 1, c2: 2 });
ok(box.c1 === 0 && box.c2 === 2 && box.r1 === 0 && box.r2 === 1, '합쳐진 셀(0,0-1)을 일부만 걸치면 사각형을 넓힘');
plan = F.tbMergePlan(mm, { r1: 0, c1: 1, r2: 1, c2: 2 });
ok(plan && plan.cs === 3 && plan.rs === 2 && plan.ids.length === 5 && plan.ids[0] === 0, '넓힌 범위 전체를 하나로(기존 합침 셀이 keep)');
// 구멍이 있는 격자(행이 짧음)는 합치지 않음
const hole = F.tbGridModel([[{ cs: 1, rs: 1 }, { cs: 1, rs: 1 }], [{ cs: 1, rs: 1 }]]);
ok(F.tbMergePlan(hole, { r1: 0, c1: 0, r2: 1, c2: 1 }) === null, '비어 있는 칸이 있는 범위는 합칠 수 없음');
// 이웃 합치기
ok(F.tbNeighborMergePlan(m3, 0, 'right').remove.join() === '1' && F.tbNeighborMergePlan(m3, 0, 'down').remove.join() === '3', '오른쪽/아래 셀과 합치기');
ok(F.tbNeighborMergePlan(m3, 2, 'right') === null && F.tbNeighborMergePlan(m3, 6, 'down') === null, '대상이 없으면 비활성(맨 오른쪽·맨 아래)');
const tall = F.tbGridModel([[{ cs: 1, rs: 2 }, { cs: 1, rs: 1 }], [{ cs: 1, rs: 1 }]]); // [A(rs2) B / C]
ok(F.tbNeighborMergePlan(tall, 0, 'right') === null && F.tbNeighborMergePlan(tall, 1, 'down').remove.join() === '2', '합친 결과가 사각형이 아니면 비활성(A 와 B: 높이가 다름), B 와 C 는 가능');
const bothTall = F.tbGridModel([[{ cs: 1, rs: 2 }, { cs: 1, rs: 2 }]]); // 높이가 같은 이웃은 가능(표 높이 2로 제한되지 않게 행 추가)
const two = F.tbGridModel([[{ cs: 1, rs: 2 }, { cs: 1, rs: 2 }], []]);
ok(F.tbNeighborMergePlan(two, 0, 'right').cs === 2 && F.tbNeighborMergePlan(two, 0, 'right').rs === 2, '같은 높이의 세로 합침 셀끼리는 오른쪽 합치기 가능(빈 <tr> 이 있는 표)');
// 나누기
const sm = F.tbGridModel([[{ cs: 2, rs: 2 }, { cs: 1, rs: 1 }], [{ cs: 1, rs: 1 }], [{ cs: 1, rs: 1 }, { cs: 1, rs: 1 }, { cs: 1, rs: 1 }]]);
const sp2 = F.tbSplitPlan(sm, 0);
ok(sp2.add.length === 3 && sp2.add.map(x => x.row + ':' + x.col).join() === '0:1,1:0,1:1', '2×2 합친 셀 나누기: 새 칸 (0,1)(1,0)(1,1)');
ok(sp2.add[0].beforeId === 1 && sp2.add[1].beforeId === 2 && sp2.add[2].beforeId === 2, '새 칸은 같은 행에서 열이 더 큰 첫 셀 앞에 삽입(없으면 null)');
ok(F.tbSplitPlan(sm, 1) === null, '합치지 않은 셀은 나눌 수 없음');
// 내용 이어 붙이기
ok(F.tbMergedHtml(['<br>', 'a', '', 'b<br>c', '&nbsp;']) === 'a<br>b<br>c', '빈 셀은 버리고 비어 있지 않은 셀 사이만 <br>');
ok(F.tbMergedHtml(['<br>', '<br>']) === '<br>', '모두 비면 <br> 하나');
// 코드 구조: 공용(SCRIPT·룰북) 메뉴
ok(/function tbGetVariationCtxItems\(e\) \{[^}]*tbGetVariationCtxItemsBase\(e\)[^}]*tbTableCtxItems\(e\)/.test(html), '기존 우클릭 항목(Base) 뒤에 표 항목을 덧붙임(공용)');
ok(/label: '선택한 셀 합치기'/.test(html) && /label: '오른쪽 셀과 합치기'/.test(html) && /label: '아래 셀과 합치기'/.test(html) && /label: '셀 나누기'/.test(html), '메뉴 항목 이름');
process.exit(f ? 1 : 0);
