const fs = require('fs'), path = require('path'), vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13, 10)).join(String.fromCharCode(10));
let f = 0; const ok = (c, m) => { if (!c) { f++; console.log('FAIL', m); } else console.log('ok', m); };
const esc = v => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ctx = { ds_formulaEnv: () => ({}), ds_cfOverlay: () => ({ '1:0': { bg: '#eeeeee', b: true } }), ds_mergeMap: () => ({ anchors: { '2:0': { rs: 1, cs: 2 } }, covered: { '2:1': true } }),
  ds_getCellRich: () => '', ds_richFromText: v => esc(v).replace(/\n/g, '<br>'), ds_normalizeCellStyle: s => s || {}, ds_cellDisplay: () => null, ds_cellStyleCss: () => '', ds_borderCss: () => 'border-top:2px solid #000', ds_xmlEsc: esc };
vm.createContext(ctx);
vm.runInContext(html.slice(html.indexOf('var DS_PRINT_WIDTH'), html.indexOf('function ds_openPrintDialog')), ctx);
ok(ctx.ds_printScale(500, 'portrait', true) === 1 && ctx.ds_printScale(1436, 'portrait', true) === 0.5 && ctx.ds_printScale(1436, 'portrait', false) === 1 && ctx.ds_printScale(1046, 'landscape', true) === 1, '너비에 맞춤 배율');
const sheet = { frozenRows: 1, columns: [{ id: 'a', name: '<이름>', width: 100 }, { id: 'b', name: '', width: 200 }, { id: 'c', name: '숨김', width: 90, hidden: true }],
  rows: [{ cells: { a: '고정 행' } }, { cells: { a: '<script>alert(1)</script>', b: '둘' }, cellStyles: { b: { i: true, u: true, bd: {} } }, cellAligns: { b: 'right' } }, { cells: { a: '합침' } }, { cells: { a: '숨긴 행' }, hidden: true }, { cells: { a: '필터 행' } }, { isCategory: true, categoryName: '분류' }] };
const o = { title: '제목 <x>', orientation: 'landscape', fit: true, grid: false, rows: [0, 1, 2, 3, 4, 5], cols: [0, 1, 2], visible: [true, true, true, true, false, true] };
const out = ctx.ds_printHtml(sheet, o);
ok(/@page\{size:A4 landscape/.test(out) && /border:0 solid transparent/.test(out) && /width:300px;zoom:1\}/.test(out), '용지 방향·격자선 끔·표 너비(숨긴 열 제외)');
ok(!/<script>alert/.test(out) && /&lt;script&gt;/.test(out) && /&lt;이름&gt;/.test(out) && /<title>제목 &lt;x&gt;<\/title>/.test(out), '글자 이스케이프');
ok(!/숨김|숨긴 행|필터 행/.test(out), '숨긴 열·행·필터로 가린 행 제외');
const head = out.slice(out.indexOf('<thead>'), out.indexOf('</thead>')), body = out.slice(out.indexOf('<tbody>'));
ok(/고정 행/.test(head) && !/고정 행/.test(body) && /thead\{display:table-header-group\}/.test(out), '열 이름·고정 행은 반복 머리글');
ok(/background-color:#eeeeee/.test(out) && /font-weight:700/.test(out) && /font-style:italic;text-decoration:underline;text-align:right/.test(out) && /colspan="2"/.test(out) && /<td class="cat" colspan="2">분류/.test(out), '서식·조건부/교차 색상·정렬·병합·카테고리 행');
const part = ctx.ds_printHtml(sheet, Object.assign({}, o, { rows: [1], cols: [1], grid: true, orientation: 'portrait' }));
ok(/둘/.test(part) && !/합침|고정 행/.test(part) && /1px solid #cfcfcf/.test(part) && /A4 portrait/.test(part), '선택 범위만');
const scoped = ctx.ds_printHtml(sheet, Object.assign({}, o, { scope: '#ds-print-root' }));
ok(typeof scoped === 'object' && /#ds-print-root td,#ds-print-root th\{/.test(scoped.css) && !/(^|\})td/.test(scoped.css) && /^<h1>/.test(scoped.body), '앱 화면에 넣을 때는 CSS 를 인쇄 영역으로 한정');
ok(/body\.ds-printing>\*:not\(#ds-print-root\)\{display:none!important\}/.test(html) && /afterprint', ds_printCleanup/.test(html) && /'ds-print-btn', 'ds_openPrintDialog\(\)'/.test(html) && /id="ds-print-dialog"/.test(html), '인쇄 때만 인쇄 영역 표시·끝나면 정리·버튼·팝업');
process.exit(f ? 1 : 0);
