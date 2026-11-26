const fs = require('fs'), path = require('path'), vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13, 10)).join(String.fromCharCode(10));
let f = 0; const ok = (c, m) => { if (!c) { f++; console.log('FAIL', m); } else console.log('ok', m); };
let n = 0; const ctx = { mkId: () => 'n' + (++n), DS_CSV_MAX_ROWS: 5000, DS_CSV_MAX_COLS: 100,
  ds_normalizeCellStyle: s => s || {}, ds_hasCellStyle: s => Object.keys(s).length > 0, ds_formulaEnv: () => ({}),
  ds_formulaValue: raw => raw === '=1+1' ? { v: 2 } : { err: '#ERROR!' },
  ds_colLetters: i => String.fromCharCode(65 + i), ds_colFromLetters: l => l.charCodeAt(0) - 65,
  ds_mergeMap: (rows, cols, merges) => ({ anchors: merges.length ? { '0:0': { rs: 1, cs: 2 } } : {} }) };
vm.createContext(ctx);
const cut = (a, b) => html.slice(html.indexOf(a), html.indexOf(b));
vm.runInContext(cut('function ds_parseNumber', 'function ds_sortValue') + cut('function ds_xmlEsc', 'function ds_xlsxToSheet'), ctx);
const J = JSON.stringify;
const x = ctx.ds_xmlParse('<?xml version="1.0"?><x:a xmlns:x="u"><x:b r:id="rId1" n="1 &amp; 2"/><t xml:space="preserve"> 글 &lt;자&gt; </t><![CDATA[<c>]]></x:a>');
ok(x.kids[0].name === 'a' && x.kids[0].kids[0].attrs.id === 'rId1' && x.kids[0].kids[0].attrs.n === '1 & 2' && x.kids[0].kids[1].text === ' 글 <자> ' && x.kids[0].text === '<c>', 'XML: 접두사 제거·속성·엔티티·CDATA');
ok(ctx.ds_xlsxSerial('2026-11-26') === 46352 && ctx.ds_xlsxDate(46352) === '2026-11-26' && ctx.ds_xlsxSerial('x') === null, '날짜 일련번호 왕복');
const used = {};
ok(ctx.ds_xlsxSheetName('a/b:c', used) === 'a b c' && ctx.ds_xlsxSheetName('A B C', used) === 'A B C 2' && ctx.ds_xlsxSheetName('가'.repeat(40), used).length === 31, '시트 이름 금지 글자·중복·31자');
const sheet = { name: '시트<1>', columns: [{ id: 'a', name: '이름', width: 145 }, { id: 'b', name: '값', width: 75, hidden: true }], merges: [{}],
  rows: [
    { cells: { a: '합친 칸' } },
    { cells: { a: '007', b: '=1+1' }, cellStyles: { a: { b: true, i: true, color: '#ff0000', bg: '#00ff00' } }, cellAligns: { a: 'center' } },
    { cells: { a: '10%', b: '2026-11-26' }, cellStyles: { a: { nf: { t: 'pct', d: 1 } }, b: { nf: { t: 'date' } } }, hidden: true },
    { cells: { a: '<&"\u0001>', b: '1234.5' }, cellStyles: { b: { nf: { t: 'cur', c: '₩', d: 0 } } } },
    { isMemo: true, memoText: '메모' },
  ] };
const files = ctx.ds_xlsxBuild([sheet, { name: '둘', columns: [{ id: 'c', name: '' }], rows: [{ cells: { c: '-3.5' } }], hidden: true }]);
const map = new Map(files.map(v => [v.name, v.text]));
ok(['[Content_Types].xml', '_rels/.rels', 'xl/workbook.xml', 'xl/_rels/workbook.xml.rels', 'xl/styles.xml', 'xl/worksheets/sheet1.xml', 'xl/worksheets/sheet2.xml'].every(k => map.has(k)), '필수 파일 구성');
ok(files.every(v => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v.text)) && /<mergeCell ref="A2:B2"\/>/.test(map.get('xl/worksheets/sheet1.xml')), '제어 문자 제거·병합(머리글 한 줄 보정)');
const back = ctx.ds_xlsxRead(map, true);
ok(back.length === 2 && back[0].name === '시트<1>' && back[1].name === '둘' && back[1].hidden === true, '여러 시트·이름·숨김 시트');
const s1 = back[0];
ok(J(s1.columns.map(c => [c.name, c.width, c.hidden])) === J([['이름', 145, false], ['값', 75, true]]), '열 이름·너비·숨김');
ok(J(s1.rows.map(r => r.cells)) === J([['합친 칸'], ['007', '2'], ['0.1', '2026-11-26'], ['<&">', '1234.5'], ['메모']]), '값: 앞자리 0 은 글자, 수식은 결과, 백분율·날짜·특수 글자');
ok(s1.rows[1].styles[0].b && s1.rows[1].styles[0].i && s1.rows[1].styles[0].color === '#ff0000' && s1.rows[1].styles[0].bg === '#00ff00' && s1.rows[1].aligns[0] === 'center', '글자·배경·정렬 서식 왕복');
ok(s1.rows[2].styles[0].nf.t === 'pct' && s1.rows[2].styles[0].nf.d === 1 && s1.rows[2].styles[1].nf.t === 'date' && s1.rows[3].styles[1].nf.t === 'cur' && s1.rows[3].styles[1].nf.c === '₩' && s1.rows[2].hidden, '숫자 형식·숨긴 행');
ok(J(s1.merges) === '[[0,0,0,1]]' && back[1].rows.length === 0, '병합 왕복·머리글 사용 시 첫 행 제외');
ok(J(ctx.ds_xlsxRead(map, false)[1].rows[0].cells) === '["-3.5"]', '머리글 미사용');
const external = new Map([
  ['xl/workbook.xml', '<workbook><sheets><sheet name="S" sheetId="1" r:id="rId9"/></sheets></workbook>'],
  ['xl/_rels/workbook.xml.rels', '<Relationships><Relationship Id="rId9" Target="/xl/worksheets/s.xml"/></Relationships>'],
  ['xl/sharedStrings.xml', '<sst><si><t>공유</t></si><si><r><t>조각</t></r><r><t> 합침</t></r><rPh><t>후리</t></rPh></si></sst>'],
  ['xl/worksheets/s.xml', '<worksheet><sheetData><row><c t="s"><v>0</v></c><c r="C1" t="s"><v>1</v></c><c t="b"><v>1</v></c><c><f>A1</f></c></row></sheetData></worksheet>'],
]);
ok(J(Array.from(ctx.ds_xlsxRead(external, false)[0].rows[0].cells, v => v || '')) === J(['공유', '', '조각 합침', 'TRUE', '=A1']), '다른 프로그램 형식: 공유 문자열·절대 경로·참조 없는 칸·계산값 없는 수식');
let threw = false; try { ctx.ds_xlsxRead(new Map(), false); } catch (e) { threw = true; } ok(threw, 'xlsx 가 아니면 오류');
ok(/label: '엑셀\(xlsx\) 내보내기 · 모든 시트'/.test(html) && /accept="\.csv,\.tsv,\.txt,\.xlsx/.test(html) && /buildZipBlob\(entries\)/.test(html) && /readZipEntries\(file\)/.test(html), '메뉴·가져오기 창·ZIP 연결');
process.exit(f ? 1 : 0);
