const fs = require('fs'), path = require('path'), vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13, 10)).join(String.fromCharCode(10));
let f = 0; const ok = (c, m) => { if (!c) { f++; console.log('FAIL', m); } else console.log('ok', m); };
const code = html.slice(html.indexOf('function ds_normalizeVerticalAlign'), html.indexOf('function _migrateDataSheetCategoriesToFlat'));
const ctx = { mkId: () => 'id1' }; vm.createContext(ctx);
vm.runInContext(code + ';this.f={ds_normalizeCellStyle,ds_hasCellStyle,ds_overflowWidthFor,ds_viewInner,normalizeDataSheetRow}', ctx);
const F = ctx.f, J = o => JSON.stringify(o);
// 데이터 시트 저장 형식: wrap = 'overflow' | 'clip' (줄바꿈이 기본이라 저장 안 함)
ok(F.ds_normalizeCellStyle({ wrap: 'overflow' }).wrap === 'overflow' && F.ds_normalizeCellStyle({ wrap: 'clip' }).wrap === 'clip', 'wrap: overflow·clip 허용');
ok(J(F.ds_normalizeCellStyle({ wrap: 'wrap' })) === '{}' && J(F.ds_normalizeCellStyle({ wrap: 'x' })) === '{}' && J(F.ds_normalizeCellStyle({ wrap: 5 })) === '{}', 'wrap: 기본(wrap)·잘못된 값은 저장하지 않음');
ok(F.ds_hasCellStyle({ wrap: 'clip' }) && !F.ds_hasCellStyle({}), 'ds_hasCellStyle 이 wrap 인식');
const row = F.normalizeDataSheetRow({ id: 'r', cells: { c1: '긴 텍스트', c2: '' }, cellStyles: { c1: { wrap: 'overflow', b: true }, c2: { wrap: 'bogus' } } }, []);
ok(row.cellStyles.c1.wrap === 'overflow' && row.cellStyles.c1.b === true && row.cellStyles.c2 === undefined && row.cells.c1 === '긴 텍스트', '정규화 라운드트립: wrap 유지, 잘못된 값 제거, 셀 텍스트 불변');
// 오버플로우 폭: 오른쪽으로 이어진 빈 셀까지, 내용이 있는 셀에서 멈춤(좌우 여백 16px 제외)
const cols = [{ id: 'a', width: 160 }, { id: 'b', width: 240 }, { id: 'c', width: 160 }];
ok(F.ds_overflowWidthFor(cols, { cells: { a: 'x', b: '', c: '' } }, 0) === 544, '옆 셀이 모두 비면 160+240+160-16');
ok(F.ds_overflowWidthFor(cols, { cells: { a: 'x', b: 'NEIGHBOR' } }, 0) === 144, '옆 셀에 내용이 있으면 자기 폭만(160-16)');
ok(F.ds_overflowWidthFor(cols, { cells: { a: 'x', b: '', c: 'Z' } }, 0) === 384, '빈 셀 다음 내용 있는 셀에서 멈춤(160+240-16)');
ok(F.ds_overflowWidthFor(cols, { cells: {} }, 2) === 144 && F.ds_overflowWidthFor(cols, null, 0) === 544, '마지막 열·행 없음 처리');
ok(F.ds_viewInner('텍스트', 'overflow', 144.4) === '<span class="ds-ov-inner" style="width:144px;">텍스트</span>' && F.ds_viewInner('텍스트', 'clip', 144) === '텍스트', '오버플로우만 폭 지정 span 으로 감쌈');
// 구조: 툴바·렌더·CSS·본문 표
ok(/picker\('wrap'/.test(html) && ['overflow', 'wrap', 'clip'].every(m => html.includes("['" + m + "', '")), '데이터 시트 툴바 드롭다운 3항목');
ok(/function ds_applyCellWrap\(mode\) \{[^}]*cur\.wrap = mode; else delete cur\.wrap/.test(html), '범위 선택 일괄 적용(_dsMutateCellStyles), 줄바꿈은 저장하지 않음');
ok(/\.ds-cell-input\.ds-cell-wrap-clip:not\(\.ds-cell-editing\)[^{]*\{ white-space: pre; overflow: hidden; \}/.test(html), '자르기: 편집 밖에서 한 줄·잘림(편집 중엔 줄바꿈으로 표시)');
ok(/whiteSpace = 'nowrap'/.test(html.slice(html.indexOf('function tbApplyCellWrap'), html.indexOf('function tbTableEditItems'))) && /td\.style\.overflow = 'hidden'/.test(html), '본문 표: nowrap / nowrap+hidden inline style');
ok(/removeProperty\('white-space'\)/.test(html) && /if \(!td\.getAttribute\('style'\)\) td\.removeAttribute\('style'\)/.test(html), '본문 표: 줄바꿈(기본)은 style 제거, 비면 속성째 제거');
ok(/label: '텍스트 줄바꿈', submenu:/.test(html) && /tbCellBackgroundTargets\(table, model, elems, id\)/.test(html), '본문 표: 「표 ▶」 안 텍스트 줄바꿈 하위 메뉴, 셀 범위 선택 대상(#362)');
ok(/\.tb-editor-table td\[style\*="white-space: nowrap"\]:not\(\[style\*="overflow: hidden"\]\) \+ td:not\(:has\(> br:only-child\)\)/.test(html), '오버플로우 셀의 오른쪽 내용 있는 셀이 위에 덮어 잘림');
// 덮개 색(#378): 고정 흰색 대신 표 둘레의 실제 바탕색을 변수로 전달
ok(/position: relative; z-index: 1; background-color: var\(--tb-cover-bg, #fff\)/.test(html) && !/z-index: 1; background-color: #fff;/.test(html), '덮개 배경은 var(--tb-cover-bg, #fff)(셀 자체 배경색 inline 이 우선)');
const cov = html.slice(html.indexOf('function tbCoverBgOf'), html.indexOf('let tbCoverRaf'));
const cctx = { getComputedStyle: el => ({ backgroundColor: el.bg }) }; vm.createContext(cctx); vm.runInContext(cov + ';this.f=tbCoverBgOf', cctx);
const el = (bg, parent) => ({ nodeType: 1, bg, parentElement: parent || null });
const root = el('rgb(255, 255, 255)'), toggle = el('rgb(249, 249, 249)', root), inner = el('rgba(0, 0, 0, 0)', toggle), tr = el('transparent', inner);
ok(cctx.f(tr) === 'rgb(249, 249, 249)' && cctx.f(el('rgba(0, 0, 0, 0)', null)) === '#fff', '표 둘레에서 처음 만나는 투명하지 않은 배경색(없으면 #fff)');
ok(/ce\.style\.setProperty\('--tb-cover-bg', color\)/.test(html) && /new MutationObserver\(function\(\) \{ if \(!tbCoverRaf\)/.test(html), '편집 영역 변수로만 전달(저장 innerHTML 불변), 변경 감시로 갱신');
process.exit(f ? 1 : 0);
