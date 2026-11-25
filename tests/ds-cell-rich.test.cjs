const fs = require('fs'), path = require('path'), vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13, 10)).join(String.fromCharCode(10));
let f = 0; const ok = (c, m) => { if (!c) { f++; console.log('FAIL', m); } else console.log('ok', m); };
const code = html.slice(html.indexOf('function ds_normalizeVerticalAlign'), html.indexOf('function _migrateDataSheetCategoriesToFlat'));
const ctx = { mkId: () => 'id1' }; vm.createContext(ctx);
vm.runInContext(code + ';this.f={ds_richParse,ds_richSerialize,ds_richSanitize,ds_richPlain,ds_richFromText,ds_getCellRich,normalizeDataSheetRow,ds_richColor,ds_richFont,ds_richFormatRange}', ctx);
const F = ctx.f;
// 글자 일부 서식: 텍스트는 순수, 서식은 별도
const rich = '대상에게 <b>무기 공격</b>을 한다';
ok(F.ds_richPlain(rich) === '대상에게 무기 공격을 한다', '서식 HTML 에서 순수 텍스트 추출(태그 없음)');
ok(F.ds_richSanitize(rich) === '대상에게 <b>무기 공격</b>을 한다', '허용 태그 b 유지');
ok(F.ds_richSanitize('서식 없음') === '' && F.ds_richSanitize('<span>서식 없음</span>') === '', '서식이 없으면 빈 문자열(cellRich 항목 삭제)');
const two = F.ds_richSanitize('<b>가</b> <i>나</i> <u>다</u> <s>라</s>');
ok(two === '<b>가</b> <i>나</i> <u>다</u> <s>라</s>' && F.ds_richPlain(two) === '가 나 다 라', '한 셀 안 여러 서식(굵게·기울임·밑줄·취소선)');
ok(F.ds_richSanitize('<strong>a</strong><em>b</em><strike>c</strike><del>d</del>') === '<b>a</b><i>b</i><s>cd</s>', 'strong/em/strike/del 정규화(같은 서식은 합침)');
ok(F.ds_richSanitize('<b><i>ab</i></b>') === '<b><i>ab</i></b>' && F.ds_richSanitize('<i><b>ab</b></i>') === '<b><i>ab</i></b>', '중첩 순서 정규화');
// sanitize: 스크립트·이벤트 속성·그 밖의 태그 제거
const evil = F.ds_richSanitize('<b onclick="x()">a</b><script>alert(1)</script><img src=x onerror=y>c<a href="javascript:1">d</a><iframe src=z></iframe>');
ok(evil === '<b>a</b>cd' && F.ds_richPlain(evil) === 'acd', '스크립트·이벤트 속성·img/a/iframe 제거, 글자는 유지: ' + evil);
ok(!/script|onclick|onerror|href|javascript|<img|<a /i.test(evil), '위험 요소 없음');
ok(F.ds_richSanitize('<style>b{color:red}</style><b>x</b>') === '<b>x</b>', 'style 요소 내용 제거');
// 색·배경·크기
ok(F.ds_richSanitize('<span style="color: rgb(255, 0, 0); background-color: #FF0; font-size: 16px; position: fixed">a</span>') === '<span style="color:#ff0000;background-color:#ffff00;font-size:16px;">a</span>', 'span style: 색·배경·크기만 허용(정규화), position 등 제거');
ok(F.ds_richSanitize('<span style="color:url(javascript:1);font-size:200px">a</span>') === '', '잘못된 색·범위 밖 크기는 무시(서식 없음)');
ok(F.ds_richSanitize('<span style="font-weight:bold;font-style:italic;text-decoration:underline">a</span>') === '<b><i><u>a</u></i></b>', 'style 로 들어온 굵게·기울임·밑줄도 인식');
ok(F.ds_richSanitize('<font color="#00f">a</font>') === '<span style="color:#0000ff;">a</span>', 'font color 인식');
ok(F.ds_richColor('rgb(1,2,3)') === '#010203' && F.ds_richColor('#ABC') === '#aabbcc' && F.ds_richColor('red') === '', '색 정규화');
// 줄바꿈 보존
ok(F.ds_richPlain('a<br><b>b</b>') === 'a\nb' && F.ds_richPlain('a<br>') === 'a' && F.ds_richPlain('a<br><br>') === 'a\n', '줄바꿈 보존, 끝의 자리표시자 <br> 하나는 무시');
ok(F.ds_richPlain('<div>a</div><div>b</div>') === 'a\nb', '편집기 div 줄 → 줄바꿈');
ok(F.ds_richFromText('a\nb\n') === 'a<br>b<br><br>' && F.ds_richPlain(F.ds_richFromText('a\nb\n')) === 'a\nb\n', '텍스트 → 편집기 HTML → 텍스트 왕복(끝 줄바꿈 포함)');
const nlRich = F.ds_richSanitize('<b>a<br>b</b>'); ok(nlRich === '<b>a<br>b</b>' && F.ds_richPlain(nlRich) === 'a\nb', '서식 안의 줄바꿈 유지');
// 엔티티·꺾쇠
ok(F.ds_richSerialize([{ text: 'a < b & c', f: { b: true } }]) === '<b>a &lt; b &amp; c</b>' && F.ds_richPlain('<b>a &lt; b &amp; c</b>') === 'a < b & c', '꺾쇠·& 이스케이프 왕복');
ok(F.ds_richPlain('&#44032;&nbsp;&amp;') === '가 &', '숫자·이름 엔티티 해석');
// 텍스트가 어긋나면 서식을 버리고 텍스트 우선
const row = { cells: { c1: '휴린 근력' }, cellRich: { c1: '<b>휴린</b> 근력' } };
ok(F.ds_getCellRich(row, 'c1', '휴린 근력') === '<b>휴린</b> 근력', '텍스트 일치: 서식 유지');
ok(F.ds_getCellRich(row, 'c1', '다른 글자') === '' && F.ds_getCellRich(row, 'x', '휴린') === '' && F.ds_getCellRich({}, 'c1', '') === '', '텍스트 불일치·없음: 서식 무시');
// 저장·재로딩(정규화)
const n1 = F.normalizeDataSheetRow({ id: 'r1', cells: { c1: '휴린 근력', c2: '조회 키' }, cellRich: { c1: '<b onclick=x>휴린</b> 근력', c2: '<b>바뀐텍스트</b>' } }, []);
ok(n1.cells.c1 === '휴린 근력' && n1.cells.c2 === '조회 키', 'cells 는 순수 텍스트 그대로(종족표·스킬 조회 입력 불변)');
ok(n1.cellRich.c1 === '<b>휴린</b> 근력' && n1.cellRich.c2 === undefined, '정규화: 서식 sanitize, 텍스트와 어긋난 서식은 버림');
ok(!/[<>]/.test(Object.values(n1.cells).join('')), 'cells 값에 태그 없음');
// 글꼴(#379): 허용·정규화·주입 차단(#373 셀 글꼴과 같은 규칙)
ok(F.ds_richSanitize('<span style="font-family: Arial">a</span>') === '<span style="font-family:Arial;">a</span>', 'font-family 허용');
ok(F.ds_richSanitize('<span style="font-family: &quot;Noto Sans&quot;, sans-serif">a</span>') === "<span style=\"font-family:'Noto Sans', sans-serif;\">a</span>", '큰따옴표 글꼴은 작은따옴표로 정규화');
ok(F.ds_richSanitize('<span style="font-family: url(javascript:1)">a</span>') === '', 'font-family 괄호(url/expression) 거부');
ok(F.ds_richFont('url(x)') === '' && F.ds_richFont('a{b}') === '' && F.ds_richFont('<b>') === '' && F.ds_richFont('a' + String.fromCharCode(92) + 'b') === '' && F.ds_richFont('x'.repeat(161)) === '' && F.ds_richFont('inherit') === '' && F.ds_richFont('') === '', '글꼴 검증: ( ) { } < > 역슬래시 160자 초과·inherit·빈 값 거부');
ok(F.ds_richFont('"A B", serif') === "'A B', serif", '글꼴 큰따옴표 → 작은따옴표');
const inj = F.ds_richSanitize('<span style="font-family: x&quot;onload=&quot;y; position: fixed">a</span>');
ok(/^<span style="[^"]*">a<\/span>$/.test(inj) && !/position/.test(inj), '따옴표를 이용한 속성 탈출 불가·허용 밖 속성 제거: ' + inj);
ok(F.ds_richPlain(inj) === 'a', '글꼴 서식도 글자(텍스트)는 그대로');
// 범위 서식 적용(순수): 선택한 글자에만
const r1 = F.ds_richFormatRange('hit weapon attack now', 4, 10, { color: '#ff0000' });
ok(r1 === 'hit <span style="color:#ff0000;">weapon</span> attack now' && F.ds_richPlain(r1) === 'hit weapon attack now', '범위 색 적용: 그 단어에만, 텍스트 불변');
const r2 = F.ds_richFormatRange(r1, 4, 10, { font: 'Arial', size: 18 });
ok(r2 === 'hit <span style="color:#ff0000;font-size:18px;font-family:Arial;">weapon</span> attack now', '이미 서식이 있는 글자에 글꼴·크기 추가(나머지 서식 유지)');
const r3 = F.ds_richFormatRange(r2, 4, 10, { color: '', font: '', size: '' });
ok(r3 === '', '서식을 모두 해제하면 빈 문자열(cellRich 삭제)');
const r4 = F.ds_richFormatRange('<b>abc</b>def', 2, 5, { size: 20 });
ok(r4 === '<b>ab</b><span style="font-size:20px;"><b>c</b></span><span style="font-size:20px;">de</span>f' || r4 === '<b>ab</b><span style="font-size:20px;"><b>c</b></span><span style="font-size:20px;">de</span>f', '서식 경계를 가로지르는 범위(굵게 유지, 크기만 추가)');
ok(F.ds_richPlain(r4) === 'abcdef', '경계 범위 적용 후 텍스트 불변');
const r5 = F.ds_richFormatRange('a<br>b', 1, 3, { bg: '#ffff00' });
ok(F.ds_richPlain(r5) === 'a' + String.fromCharCode(10) + 'b' && r5.indexOf('background-color:#ffff00') > 0, '줄바꿈이 낀 범위 적용·텍스트 불변');
// 소스 구조
const ui = html.slice(html.indexOf('function ds_richDivOf'), html.indexOf('function ds_getActiveCellTextarea'));
ok(/ta\.value = text;\s*ds_updateCell\(ta\);/.test(ui) && /delete row\.cellRich\[d\.dataset\.colId\]/.test(ui), '편집 시 cells(순수 텍스트)와 cellRich 를 함께 갱신, 서식 없으면 삭제');
ok(/execCommand\('insertText'/.test(ui) && /getData\('text\/plain'\)/.test(ui), '서식 편집 칸 붙여넣기는 일반 텍스트');
ok(/function ds_toggleCellStyle[\s\S]{0,400}ds_richPartialTarget\(\)/.test(html) && /function ds_applyCellColor[\s\S]{0,500}ds_richPartialTarget\(\)/.test(html) && /function ds_stepCellSize[\s\S]{0,200}ds_richPartialTarget\(\)/.test(html), '툴바: 편집 중 선택이 있으면 선택한 글자에만, 아니면 셀 전체(#373)');
ok(/ds_richDiscard\(rowIdx, colId\)/.test(html) && /if \(options\.replaceText !== undefined\) ds_richDiscard/.test(html), '글자를 바꿔 쓰기 시작하면 서식 폐기');
ok(/textarea\.ds-cell-input\.ds-cell-editing, \.ds-cell-rich\[contenteditable="true"\]/.test(html), '#377 한글 조합 Enter 처리 선택자가 서식 편집 칸까지 확장');
ok(/\.ds-cell-rich\[contenteditable="true"\]'\)\) return true;/.test(html), '서식 편집 칸 Ctrl+Z 는 브라우저 기본 동작');
ok(/dstRow\.cellRich\[dstColId\] = rc/.test(html) && /nr\[colIdMap\[k\] \|\| k\] = r\.cellRich\[k\]/.test(html), '채우기·열 복제 시 cellRich 따라감');
ok(/function ds_applyCellFont[\s\S]{0,300}ds_richSelection\(\)/.test(html) && /function ds_applyCellSize[\s\S]{0,300}ds_richSelection\(\)/.test(html) && /function ds_openCellColorPanel[\s\S]{0,900}ds_richSelection\(\)/.test(html), '글꼴·크기·색상 패널: 편집 중 선택이 있으면 선택 글자에만(선택 없으면 셀 전체)');
ok(/e\.target\.closest\('#ds-format-toolbar'\)\) _dsRichPending = ds_richSaveSelection\(\)/.test(html), '도구 막대를 누르기 직전의 선택을 오프셋으로 저장');
ok(/cpTarget\.partial\.d\.innerHTML = cpTarget\.partial\.orig/.test(html) && /pt\.d\.innerHTML = pt\.orig;/.test(html), '색상 패널: 취소 시 원래 HTML 복귀, 적용 시 한 번 저장');
process.exit(f ? 1 : 0);
