const fs = require('fs'), path = require('path'), vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13, 10)).join(String.fromCharCode(10));
let f = 0; const ok = (c, m) => { if (!c) { f++; console.log('FAIL', m); } else console.log('ok', m); };
const code = html.slice(html.indexOf('function ds_normalizeVerticalAlign'), html.indexOf('function _migrateDataSheetCategoriesToFlat'));
const ctx = { mkId: () => 'id1' }; vm.createContext(ctx);
vm.runInContext(code + ';this.f={ds_normalizeTextAlign,ds_normalizeCellStyle,ds_hasCellStyle,ds_cellStyleCss,normalizeDataSheetRow}', ctx);
const F = ctx.f, J = o => JSON.stringify(o);
// 정규화·검증
ok(F.ds_normalizeTextAlign('justify') === 'justify' && F.ds_normalizeTextAlign('x') === 'left', '양쪽 맞춤 허용, 그 밖은 left');
let st = F.ds_normalizeCellStyle({ b: 1, font: "'Pretendard', sans-serif", size: 16, bg: '#FEF08A', lh: 1.6, color: '#111' });
ok(st.b === true && st.font === "'Pretendard', sans-serif" && st.size === 16 && st.bg === '#fef08a' && st.lh === 1.6 && st.color === '#111', '새 필드(font·size·bg·lh) 정상값 유지');
ok(J(F.ds_normalizeCellStyle({ size: 7 })) === '{}' && J(F.ds_normalizeCellStyle({ size: 73 })) === '{}' && J(F.ds_normalizeCellStyle({ size: '' })) === '{}' && F.ds_normalizeCellStyle({ size: '13.4' }).size === 13, '글자 크기 8~72 범위·빈 값·반올림');
ok(J(F.ds_normalizeCellStyle({ lh: 0.5 })) === '{}' && J(F.ds_normalizeCellStyle({ lh: 3.5 })) === '{}' && F.ds_normalizeCellStyle({ lh: 3 }).lh === 3 && J(F.ds_normalizeCellStyle({ lh: null })) === '{}', '줄간격 1~3 범위');
ok(J(F.ds_normalizeCellStyle({ bg: 'red' })) === '{}' && J(F.ds_normalizeCellStyle({ bg: 'url(x)' })) === '{}' && F.ds_normalizeCellStyle({ bg: '#abc' }).bg === '#abc', '배경색은 #hex 만');
ok(J(F.ds_normalizeCellStyle({ font: 'a;b' })) === '{}' && J(F.ds_normalizeCellStyle({ font: 'x"y' })) === '{}' && J(F.ds_normalizeCellStyle({ font: 'url(x)' })) === '{}' && J(F.ds_normalizeCellStyle({ font: '<b>' })) === '{}', '글꼴 값의 ; " ( ) < > 주입 차단');
ok(F.ds_hasCellStyle({ size: 12 }) && F.ds_hasCellStyle({ bg: '#fff' }) && F.ds_hasCellStyle({ font: 'Arial' }) && F.ds_hasCellStyle({ lh: 1.2 }) && !F.ds_hasCellStyle({}), 'ds_hasCellStyle 이 새 필드를 인식');
ok(F.ds_cellStyleCss({ color: '#111111', font: 'Arial', size: 16, lh: 1.6, bg: '#fff' }) === 'color:#111111;font-family:Arial;font-size:16px;line-height:1.6', 'textarea inline style 은 색·글꼴·크기·줄간격(배경색은 td)');
// 기존 데이터 그대로, 셀 텍스트는 불변
const row = F.normalizeDataSheetRow({ id: 'r1', cells: { c1: '휴린', c2: '근력 +1' }, cellAligns: { c1: 'justify' }, cellStyles: { c1: { b: true, size: 16, bg: '#fef08a' }, c2: { b: true } } }, []);
ok(row.cells.c1 === '휴린' && row.cells.c2 === '근력 +1', '셀 값은 순수 텍스트 그대로(종족표 등 조회 입력 불변)');
ok(row.cellAligns.c1 === 'justify' && row.cellStyles.c1.size === 16 && row.cellStyles.c1.bg === '#fef08a' && row.cellStyles.c2.b === true, '저장·재로딩 후 새 서식 유지, 기존 서식 그대로 읽힘');
// 서식 변경 코드가 셀 값(cells)을 건드리지 않는다
const block = html.slice(html.indexOf('function _dsApplyCellStyleToDom'), html.indexOf('function ds_toggleHeaderEditMode'));
ok(!/\.cells\[[^\]]+\]\s*=/.test(block) && !/\.cells\s*=/.test(block), '서식 적용 함수는 row.cells 를 쓰지 않음');
// 구조
ok(/function ds_clearCellFormat/.test(block) && /delete cell\.row\.cellStyles\[cell\.colId\]/.test(block) && /delete cell\.row\.cellAligns\[cell\.colId\]/.test(block), '서식 지우기: cellStyles·cellAligns 제거');
ok(/cpTarget = \{ type: 'ds-cell'/.test(block) && /cpTarget\.type === 'ds-cell'/.test(html) && /cpTarget\?\.type === 'ds-cell' && !apply/.test(html), '본문 색상 패널 연동(미리보기·취소 복귀)');
ok(/ds_autosizeCell\(ta\)/.test(block), '글자 크기·줄간격 변경 시 높이 재계산');
ok(['ds-font-select', 'ds-size-input', 'ds-lh-select'].every(id => html.includes('id="' + id + '"')) && ['ds-bg-btn', 'ds-clear-format-btn'].every(id => html.includes("'" + id + "'")) && /\['justify', '양쪽'\]/.test(html), '툴바: 글꼴·크기·배경·줄간격·서식 지우기·양쪽');
process.exit(f ? 1 : 0);
