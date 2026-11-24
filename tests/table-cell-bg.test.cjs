const fs = require('fs'), path = require('path'), vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13, 10)).join(String.fromCharCode(10));
let f = 0; const ok = (c, m) => { if (!c) { f++; console.log('FAIL', m); } else console.log('ok', m); };
// tbSetCellBackground: 지우면 style 속성째 제거
const fn = html.slice(html.indexOf('function tbSetCellBackground'), html.indexOf('function tbCellBackgroundTargets'));
const ctx = {}; vm.createContext(ctx); vm.runInContext(fn + ';this.f=tbSetCellBackground', ctx);
const mk = () => { const attrs = {}, st = { _v: '' }; const td = { style: { backgroundColor: '', removeProperty(p) { this.backgroundColor = ''; } }, getAttribute(n) { return n === 'style' ? (td.style.backgroundColor ? 'background-color:' + td.style.backgroundColor : null) : null; }, removeAttribute(n) { attrs[n] = 'removed'; } }; return { td, attrs }; };
let a = mk(); ctx.f(a.td, '#fde68a'); ok(a.td.style.backgroundColor === '#fde68a' && !a.attrs.style, '색 지정은 style.backgroundColor');
ctx.f(a.td, ''); ok(a.td.style.backgroundColor === '' && a.attrs.style === 'removed', '지우면 속성 제거(style 이 비면 style 속성째)');
ok(!/tbSetCellBackground[\s\S]{0,400}(classList|setAttribute\('data-|dataset)/.test(fn), '클래스·data 속성 미사용');
ok(/label: '셀 배경색…'/.test(html) && /label: '셀 배경색 지우기'/.test(html) && /targets\.some\(td => td\.style\.backgroundColor\)/.test(html), '메뉴 항목, 지우기는 색 있는 셀이 대상일 때만');
ok(/tbCellSel\.table !== table \|\| !tbCellInSel\(elems\[id\]\)\) return \[elems\[id\]\]/.test(html), '범위 안 우클릭이면 선택 전부, 아니면 우클릭한 셀');
ok(/cpTarget = \{ type: 'table-cell', cells: cells\.slice\(\), originals/.test(html), '패널 열기 전에 대상 셀 목록 확정');
ok(/cpTarget\.type === 'table-cell'/.test(html) && /cpTarget\?\.type === 'table-cell' && !apply/.test(html) && /editable\.dispatchEvent\(new Event\('input'/.test(html), '미리보기·취소 복귀·확정 시 input 1회');
const sub = html.slice(html.indexOf('function tbTableEditItems'), html.indexOf('function tbTableCtxItems'));
ok(sub.indexOf('셀 배경색…') > sub.indexOf("label: '열 삭제'") && sub.indexOf('셀 배경색…') < sub.indexOf("label: '표 삭제'"), '배경색 항목은 열 삭제와 표 삭제 사이');
process.exit(f ? 1 : 0);
