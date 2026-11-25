const fs = require('fs'), path = require('path'), vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13, 10)).join(String.fromCharCode(10));
let f = 0; const ok = (c, m) => { if (!c) { f++; console.log('FAIL', m); } else console.log('ok', m); };
// 자동 스크롤 속도 계산(순수)
const fn = html.slice(html.indexOf('function dragAutoScrollDelta'), html.indexOf('var _dsDragAutoScroll'));
const ctx = {}; vm.createContext(ctx); vm.runInContext(fn + ';this.f=dragAutoScrollDelta', ctx);
const d = ctx.f;
ok(d(500, 100, 900, 28) === 0, '가운데에서는 스크롤 안 함');
ok(d(890, 100, 900, 28) > 0 && d(899, 100, 900, 28) > d(880, 100, 900, 28), '아래 가장자리에서 아래로, 가까울수록 빠르게');
ok(d(110, 100, 900, 28) < 0 && d(1000, 100, 900, 28) <= 40 && d(1000, 100, 900, 28) > 0, '위 가장자리는 위로, 화면 밖이어도 최대 40');
// 구조: 편집 중인 셀에서 시작한 드래그는 셀 경계를 넘으면 편집 종료 후 범위 선택
const w = html.slice(html.indexOf('function ds_beginEditDragWatch'), html.indexOf('function dragScrollParent'));
ok(/ds_setActiveCell\(rowIdx, colId, \{ keepEdit: true \}\); ds_beginEditDragWatch\(e, rowIdx, colId\)/.test(html), '편집 중인 같은 셀 mousedown 에서 드래그 감시 시작');
ok(/c\.rowIdx === w\.rowIdx && c\.colId === w\.colId\)\) return;/.test(w), '같은 셀 안에서만 움직이면 글자 선택 유지(전환 안 함)');
ok(/ds_exitCellEditMode\(\);/.test(w) && /started: true/.test(w) && /ds_setSelectedCellRange\(w\.rowIdx, w\.colId, c\.rowIdx, c\.colId\)/.test(w), '셀 경계를 넘으면 편집 확정·종료 후 시작 셀부터 범위 선택');
ok(/whenImeIdle\(startDrag\)/.test(w), '한글 조합 중이면 조합 확정 뒤 전환(#377)');
ok(/ds_beginEditDragWatch\(e, d\.dataset\.rowIdx, d\.dataset\.colId\)/.test(html), '서식 편집 칸(contenteditable)에서도 같은 전환');
// 모양: 범위 외곽 1px·채움, 활성 셀 2px, 원형 핸들, 같은 파랑 하나
ok(/#ds-range-box \{[^}]*border: 1px solid #1a73e8; background: rgba\(26,115,232,0\.12\)/.test(html), '데이터 시트 범위: 외곽 1px 파랑 + 반투명 채움');
ok(/#ds-active-box \{[^}]*border: 2px solid #1a73e8/.test(html), '데이터 시트 활성 셀: 2px 진한 파랑');
ok(/#ds-fill-handle \{[^}]*width: 10px; height: 10px; background: #1a73e8; border: 1px solid #fff;[^}]*border-radius: 50%/.test(html), '채우기 핸들: 파란 원형 점(흰 테두리 1px)');
ok(!/td\.ds-selected-cell \{ background: #e8f0fe/.test(html) && !/td\.ds-active-cell \{ box-shadow/.test(html), '셀별 연한 파란 배경·회색 활성 테두리 제거(오버레이로 통일)');
ok(/border:1px solid #1a73e8;background:rgba\(26,115,232,0\.12\)/.test(html) && /tb-sel-active[^']*border:2px solid #1a73e8/.test(html) && /tb-sel-handle[^']*border-radius:50%;background:#1a73e8/.test(html), '본문 표 범위 오버레이도 같은 모양(외곽 1px·활성 셀 2px·점)');
ok(/tbDragScrollTimer = setInterval/.test(html) && /clearInterval\(tbDragScrollTimer\)/.test(html) && /function ds_startDragAutoScroll/.test(html), '데이터 시트·본문 표 드래그 자동 스크롤');
process.exit(f ? 1 : 0);
