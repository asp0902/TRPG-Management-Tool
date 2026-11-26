const fs = require('fs'), path = require('path'), vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13, 10)).join(String.fromCharCode(10));
let f = 0; const ok = (c, m) => { if (!c) { f++; console.log('FAIL', m); } else console.log('ok', m); };
const ctx = {}; vm.createContext(ctx);
const cut = (a, b) => html.slice(html.indexOf(a), html.indexOf(b));
vm.runInContext('function ds_richPlain(h){return ds_richParse(h).map(function(s){return s.text;}).join("");}'
  + cut('var DS_RICH_ENT', 'function normalizeDataSheetRow')
  + cut('function ds_linkAt', 'function ds_openInsert') + cut('function ds_richInsertAt', 'function ds_insertPaint'), ctx);
const H = ctx.ds_safeHref;
ok(H('https://a.com/b?x=1&y=2') === 'https://a.com/b?x=1&y=2' && H('mailto:a@b.com') === 'mailto:a@b.com', 'http·https·mailto 허용');
ok(H('javascript:alert(1)') === '' && H(' JAVASCRIPT:alert(1)') === '' && H('data:text/html,x') === '' && H('vbscript:x') === '' && H('file:///c') === '' && H('//evil.com') === '' && H('http://') === '', '위험한 주소·불완전한 주소 거부');
ok(H('https://a.com/"><img onerror=1>') === 'https://a.com/%22%3E%3Cimg%20onerror=1%3E', '따옴표·괄호·공백 인코딩');
ok(ctx.ds_insertLinkInput('a.com/x') === 'https://a.com/x' && ctx.ds_insertLinkInput('me@a.com') === 'mailto:me@a.com' && ctx.ds_insertLinkInput('javascript:1') === '', '주소 입력 보정');
const linked = ctx.ds_richFormatRange('안녕 세계', 3, 5, { href: 'https://a.com/?q=1&r=2' });
ok(linked === '안녕 <a href="https://a.com/?q=1&amp;r=2">세계</a>', '선택 글자에 링크');
ok(ctx.ds_richSanitize(linked) === linked && ctx.ds_linkAt(linked) === 'https://a.com/?q=1&r=2' && ctx.ds_linkAt(linked, 0, 2) === '', '다시 읽어도 유지·범위의 링크 찾기');
ok(ctx.ds_richSanitize('<a href="javascript:alert(1)">x</a><a onclick="1">y</a><b>z</b>') === 'xy<b>z</b>', '허용하지 않는 링크는 글자만');
ok(ctx.ds_richFormatRange(linked, 0, 5, { href: '' }) === '', '링크 해제');
ok(ctx.ds_richSanitize('<a href="https://a.com"><b>굵은 링크</b></a>') === '<a href="https://a.com"><b>굵은 링크</b></a>', '링크 안 글자 서식 유지');
ok(ctx.ds_richInsertAt(linked, 5, '★') === '안녕 <a href="https://a.com/?q=1&amp;r=2">세계</a>★' && ctx.ds_richPlain(ctx.ds_richInsertAt('<b>가나</b>', 1, '★')) === '가★나', '특수문자 끼우기(링크는 늘리지 않음)');
ok(ctx.ds_normCellImg('data:image/png;base64,AAAA') && ctx.ds_normCellImg('https://a.com/i.png') && !ctx.ds_normCellImg('javascript:1') && !ctx.ds_normCellImg('data:text/html;base64,AAAA') && !ctx.ds_normCellImg('data:image/svg+xml,<svg onload=1>'), '이미지 주소 검사');
ok(JSON.stringify(ctx.ds_normCellMap({ a: ' ', b: '메모', c: 3 }, ctx.ds_normNote)) === '{"b":"메모"}', '메모 정규화');
ok(/cellNotes: ds_normCellMap/.test(html) && /cellImg: ds_normCellMap/.test(html) && /'cellRules', 'cellNotes', 'cellImg'\]/.test(html) && /picker\('insert', '삽입'/.test(html) && /ds_insertPaint\(\); \/\/ 셀 메모/.test(html), '저장·복제·메뉴·렌더 연결');
ok(/if \(imgFile\) \{ ds_pasteCellImage\(e, imgFile\); return; \}/.test(html.slice(html.indexOf('function ds_handleDocumentPaste'), html.indexOf('function ds_toggleFormatMenu'))), '글자 없는 이미지 붙여넣기는 칸을 비우지 않고 셀 안 이미지로');
process.exit(f ? 1 : 0);
