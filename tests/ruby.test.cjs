const fs = require('fs'), path = require('path'), vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13, 10)).join(String.fromCharCode(10));
let f = 0; const ok = (c, m) => { if (!c) { f++; console.log('FAIL', m); } else console.log('ok', m); };
const code = html.slice(html.indexOf('function ds_normalizeVerticalAlign'), html.indexOf('function _migrateDataSheetCategoriesToFlat'));
const ctx = { mkId: () => 'id1' }; vm.createContext(ctx);
vm.runInContext(code + ';this.f={ds_richParse,ds_richSerialize,ds_richSanitize,ds_richPlain,ds_richFormatRange,ds_richRubyAt,ds_getCellRich,rubyHtmlToBaseText,rubyHtmlToInlineText,normalizeDataSheetRow}', ctx);
const F = ctx.f;
// 데이터 시트 글자 서식: ruby 허용·텍스트는 본문만
const r = '<ruby>漢字<rt>かんじ</rt></ruby>를 읽는다';
ok(F.ds_richPlain(r) === '漢字를 읽는다', 'cells 순수 텍스트는 본문 글자만(읽기 제외)');
ok(F.ds_richSanitize(r) === '<ruby>漢字<rt>かんじ</rt></ruby>를 읽는다', 'ruby·rt 허용, 같은 형태로 직렬화');
ok(F.ds_richSanitize('<ruby onclick="x()">漢<rt onmouseover="y()">か</rt></ruby>') === '<ruby>漢<rt>か</rt></ruby>', 'ruby·rt 의 속성(이벤트 포함) 제거');
const evil = F.ds_richSanitize('<ruby>字<rt>a<script>alert(1)</script><img src=x onerror=y>b</rt></ruby>');
ok(!/script|onerror|<img|alert/i.test(evil) && F.ds_richPlain(evil) === '字', 'rt 안의 스크립트·태그 제거: ' + evil);
ok(F.ds_richSanitize('<ruby>字<rp>(</rp><rt>じ</rt><rp>)</rp></ruby>') === '<ruby>字<rt>じ</rt></ruby>', 'rp 는 버리고 rt 만 유지');
ok(F.ds_richSanitize('<ruby>字</ruby>') === '', '읽기가 없는 ruby 는 서식 없음');
ok(F.ds_richSanitize('<ruby>' + '漢'.repeat(3) + '<rt>' + 'x'.repeat(60) + '</rt></ruby>').includes('x'.repeat(40)) && !F.ds_richSanitize('<ruby>漢<rt>' + 'x'.repeat(60) + '</rt></ruby>').includes('x'.repeat(41)), '읽기는 40자까지');
ok(F.ds_richSanitize('<ruby><b>漢</b><rt>か</rt></ruby>') === '<b><ruby>漢<rt>か</rt></ruby></b>', '다른 서식과 함께: 굵게 안쪽에 루비');
// 범위 적용·수정·제거(순수)
let a = F.ds_richFormatRange('漢字を読む', 0, 2, { ruby: 'かんじ' });
ok(a === '<ruby>漢字<rt>かんじ</rt></ruby>を読む' && F.ds_richPlain(a) === '漢字を読む', '범위에 루비 적용: 글자 위 읽기, 텍스트 불변');
ok(F.ds_richRubyAt(a, 0, 2) === 'かんじ' && F.ds_richRubyAt(a, 1, 2) === 'かんじ' && F.ds_richRubyAt(a, 0, 4) === '' && F.ds_richRubyAt(a, 2, 4) === '', '수정 팝업 채우기: 범위 전부 같은 읽기일 때만');
const b = F.ds_richFormatRange(a, 0, 2, { ruby: 'カンジ' }); ok(b === '<ruby>漢字<rt>カンジ</rt></ruby>を読む', '기존 루비 수정');
const c = F.ds_richFormatRange(b, 0, 2, { ruby: '' }); ok(c === '', '루비 제거 → 서식 없음(cellRich 삭제)');
const d = F.ds_richFormatRange('abcdef', 1, 5, { ruby: 'x' }); ok(F.ds_richPlain(d) === 'abcdef' && d.startsWith('a<ruby>bcde<rt>x</rt></ruby>'), '부분 범위만');
const e2 = F.ds_richFormatRange('a\nb', 0, 3, { ruby: 'r' }); ok(F.ds_richPlain(e2) === 'a\nb' && e2 === '<ruby>a<rt>r</rt></ruby><br><ruby>b<rt>r</rt></ruby>', '줄바꿈을 낀 범위는 줄마다 루비(줄바꿈 유지)');
// 정규화(저장·재로딩)
const row = F.normalizeDataSheetRow({ id: 'r', cells: { c1: '漢字を読む' }, cellRich: { c1: '<ruby>漢字<rt>かんじ</rt></ruby>を読む' } }, []);
ok(row.cells.c1 === '漢字を読む' && row.cellRich.c1 === '<ruby>漢字<rt>かんじ</rt></ruby>を読む', '정규화: cells 본문만, cellRich 루비 유지');
const stale = F.normalizeDataSheetRow({ id: 'r', cells: { c1: '다른' }, cellRich: { c1: '<ruby>漢字<rt>かんじ</rt></ruby>' } }, []);
ok(stale.cellRich.c1 === undefined, '텍스트가 어긋나면 루비 서식 폐기');
// 본문(CE) 순수 텍스트 추출·외부 출력 문자열
ok(F.rubyHtmlToBaseText('<ruby>漢字<rp>(</rp><rt>かんじ</rt><rp>)</rp></ruby>를') === '<ruby>漢字</ruby>를'.replace(/<\/?ruby>/g, m => m) && F.rubyHtmlToBaseText('<ruby>漢字<rt>かんじ</rt></ruby>를').replace(/<[^>]*>/g, '') === '漢字를', '순수 텍스트: 읽기(rt/rp) 제외');
ok(F.rubyHtmlToInlineText('<ruby>漢字<rt>かんじ</rt></ruby>를').replace(/<[^>]*>/g, '') === '漢字(かんじ)를', 'HTML 을 못 쓰는 출력: 본문(루비) 형태');
// 소스 구조
ok(/function extractBlockPlainText[\s\S]{0,400}querySelectorAll\('rt, rp'\)\.forEach\(node => node\.remove\(\)\)/.test(html), '목차·검색·제목 순수 텍스트 추출은 루비 읽기 제외(extractBlockPlainText)');
ok(/querySelector\('span,b,i,u,s,strong,em,font,ruby'\)/.test(html), '토글 제목 서식 저장 판정에 ruby 포함, 제목 텍스트는 본문만');
ok(/id="tb-ruby-btn"/.test(html) && /id="ds-ruby-btn"/.test(html), '본문 툴바·데이터 시트 툴바 루비 버튼');
const dlg = html.slice(html.indexOf('id="ruby-insert-dialog"'), html.indexOf('<!-- 링크 삽입 팝업 -->'));
ok(dlg.indexOf('id="ruby-insert-submit"') < dlg.indexOf('id="ruby-insert-cancel"') && dlg.indexOf('id="ruby-insert-remove"') < dlg.indexOf('id="ruby-insert-submit"'), '팝업 버튼 [루비 제거] … [적용] [취소] (#372 순서)');
ok(/function tbOpenRubyDialog\(\) \{[^}]*isCE\(\)/.test(html) && /이 입력칸은 루비 문자를 지원하지 않습니다/.test(html), 'HTML 이 아닌 입력칸(CSS 매크로 textarea·한 줄 input)은 지원하지 않는다고 안내');
ok(/rubyUnwrap/.test(html) && /editable\.dispatchEvent\(new Event\('input', \{ bubbles: true \}\)\); \/\/ 저장·실행 취소 경로/.test(html), '적용·수정·제거는 input 이벤트로 저장·실행 취소 경로');
ok(/ruby > rt \{ font-size: 0\.5em; line-height: 1;/.test(html), 'rt 는 0.5em, 줄 높이를 밀지 않도록');
process.exit(f ? 1 : 0);
