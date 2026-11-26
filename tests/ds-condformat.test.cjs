const fs = require('fs'), path = require('path'), vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13, 10)).join(String.fromCharCode(10));
let f = 0; const ok = (c, m) => { if (!c) { f++; console.log('FAIL', m); } else console.log('ok', m); };
let n = 0; const ctx = { mkId: () => 'n' + (++n) }; vm.createContext(ctx);
const cut = (a, b) => html.slice(html.indexOf(a), html.indexOf(b));
vm.runInContext('function ds_isDataRow(r){return !!(r&&!r.isCategory&&!r.isMemo);}' + cut('function ds_parseNumber', 'function ds_sortValue') + cut('var DS_CF_CONDS', 'function ds_cfPaint') + ';this.conds=DS_CF_CONDS', ctx);
const F = ctx;
const cols = [{ id: 'A' }, { id: 'B' }], rows = ['r1', 'r2', 'r3', 'r4'].map(id => ({ id, cells: {} }));

ok(F.ds_cfCondMatch('', { type: 'empty' }) && F.ds_cfCondMatch('x', { type: 'notempty' }), '비어 있음·있음');
ok(F.ds_cfCondMatch('Abc', { type: 'starts', a: 'ab' }) && F.ds_cfCondMatch('Abc', { type: 'ends', a: 'BC' }) && F.ds_cfCondMatch('Abc', { type: 'contains', a: 'b' }) && !F.ds_cfCondMatch('Abc', { type: 'equals', a: 'ab' }) && !F.ds_cfCondMatch('x', { type: 'contains', a: '' }), '텍스트 조건(대소문자 무시, 빈 기준값은 불일치)');
ok(F.ds_cfCondMatch('1,000', { type: 'gt', a: '999' }) && F.ds_cfCondMatch('5', { type: 'between', a: '10', b: '1' }) && F.ds_cfCondMatch('3', { type: 'ne', a: '4' }) && !F.ds_cfCondMatch('글자', { type: 'ne', a: '4' }) && !F.ds_cfCondMatch('', { type: 'lt', a: '4' }), '숫자 조건(쉼표 인식, 글자·빈 칸 제외)');

const norm = F.ds_normCf([
  { id: 'a', rows: ['r1', 'zz', 'r2'], cols: ['A'], kind: 'single', cond: { type: 'gt', a: 1 }, style: { bg: '#FF0000', b: true, color: 'red' } },
  { rows: ['gone'], cols: ['A'], kind: 'single', cond: { type: 'gt' }, style: { b: true } },
  { rows: ['r1'], cols: ['A'], kind: 'single', cond: { type: 'bogus' }, style: { b: true } },
  { rows: ['r1'], cols: ['A'], kind: 'single', cond: { type: 'gt' }, style: {} },
  { rows: ['r1'], cols: ['A'], kind: 'scale', scale: { min: '#ffffff', max: 'x' } },
], rows, cols);
ok(norm.length === 1 && norm[0].rows.join() === 'r1,r2' && norm[0].style.bg === '#ff0000' && !norm[0].style.color && norm[0].cond.a === '1', '정규화: 없는 id·잘못된 조건·색·빈 서식 정리');
ok(F.ds_normBanding([{ rows: ['r1'], cols: ['A'], odd: 'bad', header: '#000000' }], rows, cols)[0].odd === '#ffffff' && F.ds_normBanding([{ rows: ['x'], cols: ['A'] }], rows, cols).length === 0, '교차 색상 정규화');

const span = F.ds_cfSpan({ rows: ['r1', 'r3'], cols: ['A'] }, rows, cols);
ok(span.r1 === 0 && span.r2 === 2, '범위는 처음~끝(사이에 끼운 행 포함)');
ok(F.ds_cfSpan({ rows: ['r1', 'r3'], cols: ['A'] }, rows.slice(1), cols).r1 === 1 && F.ds_cfSpan({ rows: ['r1'], cols: ['A'] }, rows.slice(1), cols) === null, '끝 행을 지우면 줄고, 다 지우면 없음');

ok(F.ds_cfScaleColor(0, 0, 10, { min: '#000000', mid: '', max: '#ffffff' }) === '#000000' && F.ds_cfScaleColor(5, 0, 10, { min: '#000000', mid: '', max: '#ffffff' }) === '#808080' && F.ds_cfScaleColor(5, 0, 10, { min: '#000000', mid: '#ff0000', max: '#ffffff' }) === '#ff0000' && F.ds_cfScaleColor(3, 3, 3, { min: '#112233', max: '#ffffff' }) === '#112233', '색상 스케일 2색·3색·값이 모두 같을 때');

const vals = [['1', ''], ['5', ''], ['9', ''], ['x', '']];
const all = { rows: ['r1', 'r2', 'r3', 'r4'], cols: ['A'] };
const map = F.ds_cfOverlay(rows, cols, [
  Object.assign({ kind: 'single', cond: { type: 'gt', a: '4' }, style: { b: true, bg: '#111111' } }, all),
  Object.assign({ kind: 'scale', scale: { min: '#000000', mid: '', max: '#ffffff' } }, all),
], [Object.assign({ header: '#aaaaaa', footer: '#bbbbbb', odd: '#cccccc', even: '#dddddd' }, all)], (i, j) => vals[i][j]);
ok(map['1:0'].bg === '#111111' && map['2:0'].b === true && map['0:0'].bg === '#000000' && !map['3:0'].bg, '위 규칙이 먼저(처음 맞는 하나만), 안 맞는 숫자는 다음 규칙, 글자는 없음');
ok(map['0:0'].band === '#aaaaaa' && map['1:0'].band === '#cccccc' && map['2:0'].band === '#dddddd' && map['3:0'].band === '#bbbbbb', '머리글·줄무늬·바닥글');
const hid = F.ds_cfOverlay(rows, cols, [], [Object.assign({ header: '', footer: '', odd: '#cccccc', even: '#dddddd' }, all)], () => '', [true, false, true, true]);
ok(!hid['1:0'] && hid['2:0'].band === '#dddddd' && hid['3:0'].band === '#cccccc', '줄무늬는 보이는 행만 셈');
ok(/cf: ds_normCf\(sheet\.cf, rows, columns\)/.test(html) && /banding: ds_normBanding/.test(html) && /ds_cfPaint\(ds\);/.test(html), '시트 저장·정규화·렌더 연결');
ok(/rowIdMap\[id\]/.test(html) && /\['cells', 'cellAligns', 'cellRich', 'cellStyles', 'cellRules', /.test(html), '시트 복제 때 병합·데이터 확인·필터·범위도 새 id 로');
process.exit(f ? 1 : 0);
