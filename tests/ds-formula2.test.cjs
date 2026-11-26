const fs = require('fs'), path = require('path'), vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13, 10)).join(String.fromCharCode(10));
let f = 0; const ok = (c, m) => { if (!c) { f++; console.log('FAIL', m); } else console.log('ok', m); };
const ctx = {}; vm.createContext(ctx);
const cut = (a, b) => html.slice(html.indexOf(a), html.indexOf(b));
vm.runInContext(cut('function ds_parseNumber', 'function ds_sortValue') + cut('function ds_isFormula', 'var _dsRefPick') + cut('function ds_colLetters', '// 칸 표시 문자열(수식이면 결과'), ctx);
const A = ctx.ds_refAdjust, S = ctx.ds_refShift, ident = n => Array.from({ length: n }, (_, i) => i);
// 삽입: 2번째 행(번호 1) 앞에 끼움
const ins = [0, 2, 3, 4, 5];
ok(A('=A1+B2*$C$3', ins, ident(5)) === '=A1+B3*$C$4', '행 삽입: 아래 참조가 밀림($ 도 같은 칸을 따라감)');
ok(A('=SUM(A1:A3)', ins, ident(5)) === '=SUM(A1:A4)', '범위 안 삽입 → 범위 늘어남');
const del = [0, -1, 1, 2, 3];
ok(A('=B2+B3', del, ident(5)) === '=#REF!+B2' && A('=SUM(A1:A3)', del, ident(5)) === '=SUM(A1:A2)' && A('=SUM(A2:A2)', del, ident(5)) === '=SUM(#REF!)', '삭제: 지운 칸은 #REF!, 범위는 축소');
ok(A('=A1+C1', ident(5), [0, -1, 1]) === '=A1+B1' && A('=Z99', del, [0]) === '=Z99', '열 삭제·표 밖 참조 유지');
ok(A('=B2&" B2 ""A1"" "&LOG10(B2)', ins, ident(5)) === '=B3&" B2 ""A1"" "&LOG10(B3)', '따옴표 안 글자·함수 이름은 그대로');
ok(A('=A1+A2+A3', [2, 0, 1], ident(3)) === '=A3+A1+A2', '정렬·이동: 연속 참조 모두 따라감');
// 상대 참조
ok(S('=A1+$B1+C$1+$D$1', 2, 1) === '=B3+$B3+D$1+$D$1', '채우기: $ 고정 유지');
ok(S('=A1', -1, 0) === '=#REF!' && S('=SUM(A1:B2)*2', 1, 1) === '=SUM(B2:C3)*2' && S('=A1^2', 0, 2) === '=C1^2', '표 밖 → #REF!, 범위 이동');
const rows = [{ cells: { a: '=B2', b: '1' } }, { cells: { b: '=SUM(B1:B3)' } }, { cells: {} }];
ctx.ds_refFollowCells(rows, [1, 0, 2], [1]);
ok(rows[0].cells.a === '=B1' && rows[1].cells.b === '=SUM(B1:B3)', '범위 정렬: 한 칸 참조만 따라감');
const R = ctx.ds_refInsert;
ok(R('=', 1, 1, 'A1', null).value === '=A1' && R('=A1+', 4, 4, 'B2', null).value === '=A1+B2' && R('=SUM(', 5, 5, 'A1:A3', null).value === '=SUM(A1:A3', '연산자·괄호 뒤에 참조 삽입');
const one = R('=A1+', 4, 4, 'B2', null);
ok(R(one.value, 6, 6, 'C3', one.span).value === '=A1+C3', '방금 넣은 참조는 다른 칸을 누르면 교체');
ok(R('=A1', 3, 3, 'B2', null) === null && R('글자', 2, 2, 'A1', null) === null && R('=12', 3, 3, 'A1', null) === null, '참조 자리가 아니면 끼우지 않음');
// 계산
const env = ctx.ds_formulaEnv([{ cells: { a: '2', b: 'x' } }, { cells: { a: '5', b: 'y' } }, { cells: { a: '9', b: 'x' } }], [{ id: 'a' }, { id: 'b' }]);
const V = s => { const r = ctx.ds_formulaValue(s, env); return r.err || r.v; };
ok(V('=2^3') === 8 && V('=-2^2') === 4 && V('=2*3^2') === 18 && V('=2^3^2') === 64 && V('=A1^A2') === 32 && V('=10^1000') === '#NUM!', '거듭제곱(구글 시트 우선순위)');
ok(V('=INT(-1.5)') === -2 && V('=MOD(7,3)') === 1 && V('=MOD(-1,3)') === 2 && V('=MOD(1,0)') === '#DIV/0!' && /^\d{4}-\d{2}-\d{2}$/.test(V('=TODAY()')), 'INT·MOD·TODAY');
ok(V('=COUNTIF(B1:B3,"x")') === 2 && V('=COUNTIF(A1:A3,">4")') === 2 && V('=SUMIF(B1:B3,"x",A1:A3)') === 11 && V('=SUMIF(A1:A3,">=5")') === 14, 'COUNTIF·SUMIF');
ok(V('=#REF!+1') === '#REF!' && V('=SUM(#REF!)') === '#REF!', '고쳐 쓴 #REF! 는 오류로 표시');
ok((html.match(/ds_refFollow\(ds, [a-zA-Z]+\)/g) || []).length >= 7 && /ds_refFollowCells\(ds\.rows, perm/.test(html) && /ds_refShift\(seq\[i % seq\.length\]/.test(html) && /ds_refPickStart\(e, parseInt\(rowIdx, 10\), colId\)\) return;/.test(html), '삽입·삭제·이동·정렬·채우기·클릭 연결');
process.exit(f ? 1 : 0);
