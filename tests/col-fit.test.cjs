const fs = require('fs'), path = require('path'), vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13, 10)).join(String.fromCharCode(10));
let f = 0; const ok = (c, m) => { if (!c) { f++; console.log('FAIL', m); } else console.log('ok', m); };
const cut = (a, b) => html.slice(html.indexOf(a), html.indexOf(b));
const ctx = {}; vm.createContext(ctx);
vm.runInContext(cut('function tbRound2', 'function tbEvenWidths') + cut('function tbEvenWidths', 'function tbResizeColWidths') + cut('function tbFitWidths', 'let tbResizeSel') + cut('function ds_fitTargetCols', 'function _dsMeasureHtmlWidth') + ';this.f={tbEvenWidths,tbFitWidths,tbFitTargetCols,ds_fitTargetCols,ds_fitWidth}', ctx);
const F = ctx.f, sum = a => Math.round(a.reduce((x, y) => x + y, 0) * 100) / 100;
// 데이터 시트: 대상 열·폭 계산
ok(F.ds_fitTargetCols('b', ['a', 'b', 'c']).join() === 'a,b,c', '선택된 열 중 하나의 경계 → 선택 전부');
ok(F.ds_fitTargetCols('x', ['a', 'b']).join() === 'x' && F.ds_fitTargetCols('b', []).join() === 'b', '선택 밖·선택 없음 → 그 열만');
const o = { min: 16, max: 400, pad: 18, def: 160 };
ok(F.ds_fitWidth(100.2, o) === 119 && F.ds_fitWidth(0, o) === 160 && F.ds_fitWidth(5, o) === 23, '내용+여백(올림), 빈 열은 기본 너비');
ok(F.ds_fitWidth(900, o) === 400 && F.ds_fitWidth(1, { min: 40, max: 400, pad: 4, def: 160 }) === 40, '최대·최소 제한');
// 본문 표: 대상 열
ok(F.tbFitTargetCols({ r1: 0, c1: 0, r2: 1, c2: 2 }, 1).join() === '0,1,2' && F.tbFitTargetCols({ r1: 0, c1: 0, r2: 1, c2: 2 }, 5).join() === '5' && F.tbFitTargetCols(null, 1).join() === '1' && F.tbFitTargetCols({ r1: 0, c1: 1, r2: 3, c2: 1 }, 1).join() === '1', '범위가 덮은 여러 열이면 전부, 아니면 그 열만');
// 본문 표: 폭 재분배(다른 열 유지, 오른쪽 이웃이 받음)
let w = F.tbFitWidths([30, 40, 30], [1], [25], 5);
ok(w.join() === '30,25,45' && sum(w) === 100, '가운데 열만 줄이면 왼쪽 열 그대로, 오른쪽 이웃이 받음');
w = F.tbFitWidths([30, 40, 30], [1], [50], 5);
ok(w.join() === '30,50,20', '늘리면 오른쪽 이웃이 줌');
w = F.tbFitWidths([30, 40, 30], [2], [20], 5);
ok(w.join() === '30,50,20', '마지막 열은 왼쪽 이웃이 받음(오른쪽 없음)');
w = F.tbFitWidths([30, 40, 30], [1], [90], 5);
ok(w[2] >= 5 - 0.01 && sum(w) === 100 && w[0] === 30 && w[1] < 90, '이웃 최소 폭 보장(모자라면 비례 축소)');
w = F.tbFitWidths([25, 25, 25, 25], [0, 1], [10, 10], 5);
ok(w.join() === '10,10,40,40'.replace('40,40', '40,40') || (w[0] === 10 && w[1] === 10 && sum(w) === 100 && w[3] === 25 && w[2] === 55), '여러 열: 가장 가까운 비대상 열(2열 오른쪽)이 받음');
w = F.tbFitWidths([50, 50], [0, 1], [10, 30], 5);
ok(sum(w) === 100 && w[0] === 25 && w[1] === 75, '모든 열이 대상이면 비례 조정(합 100)');
// 연결
ok(/tbFitColumns\(table, hit\.index - 1\)/.test(html) && !/tbWriteColWidths\(table, null\); else \{ const tr/.test(html), '본문 표 더블클릭: 균등 분배 대신 그 열 맞춤');
ok(/cell\.col !== c \|\| cell\.cs !== 1/.test(html), '병합 셀(cs>1)은 측정 제외');
ok(/ds_fitTargetCols\(colId, _dsSelectedColIds\)/.test(html) && /_dsSelectedRowIdxs\.length > 1 && _dsSelectedRowIdxs\.indexOf\(rowIdx\) >= 0/.test(html), '데이터 시트: 선택 열·선택 행 전부 적용');
process.exit(f ? 1 : 0);
