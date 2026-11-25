const fs = require('fs'), path = require('path'), vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13, 10)).join(String.fromCharCode(10));
let f = 0; const ok = (c, m) => { if (!c) { f++; console.log('FAIL', m); } else console.log('ok', m); };
const code = html.slice(html.indexOf('const TB_TITLE_MACRO_RE'), html.indexOf('function updToggleTitle'));
const ctx = {}; vm.createContext(ctx);
vm.runInContext(code + ';this.f={tbStripTitleMacros,tbToggleTitleHtml}', ctx);
const F = ctx.f;
ok(F.tbStripTitleMacros('[컨스트럭션 절차](#"style= font-size:16px;)') === '컨스트럭션 절차', '옛 매크로 문법 제목은 텍스트만 남김');
ok(F.tbStripTitleMacros('앞 [A](#"style= font-size:16px;) 뒤 [B](#"style= color:red;)') === '앞 A 뒤 B', '여러 조각·앞뒤 글자 보존');
ok(F.tbStripTitleMacros('일반 제목') === '일반 제목' && F.tbStripTitleMacros(null) === '', '일반 텍스트·null');
ok(F.tbToggleTitleHtml({ title: '[절차](#"style= font-size:16px;)' }) === '<span style="font-size:16px;">절차</span>', '옛 매크로 문법은 해당 서식 span 으로 변환');
ok(F.tbToggleTitleHtml({ title: '<b>&' }) === '&lt;b&gt;&amp;', '일반 제목은 HTML 이스케이프(b.title 호환)');
ok(F.tbToggleTitleHtml({ title: '무시', titleHtml: '<span style="font-size:16px;">저장</span>' }) === '<span style="font-size:16px;">저장</span>', '저장된 titleHtml 우선');
ok(F.tbToggleTitleHtml({ title: '[x](#"style=a"onload="x;)' }).indexOf('"onload') < 0 || !/onload="x/.test(F.tbToggleTitleHtml({ title: '[x](#"style=a"onload="x;)' })), 'style 속성 따옴표 주입 차단');
// tbWrap 은 일반 input 에서 아무 일도 하지 않음
ok(/function tbWrap\(css\) \{\n  const ta = lastFocusedTA; if \(!ta\) return;\n  if \(ta\.tagName === 'INPUT'\) return;/.test(html), 'tbWrap: 일반 input 에는 매크로 문법 미삽입');
// 토글 제목은 한 줄 contenteditable, Enter 막기, 붙여넣기 일반 텍스트
ok(/class="toggle-title-inp toggle-title-ce" contenteditable="true"/.test(html) && /event\.key==='Enter'\)\{event\.preventDefault\(\)\}/.test(html) && /onpaste="pasteToggleTitlePlain\(event\)"/.test(html) && /oninput="updToggleTitle\(/.test(html), '토글 제목 contenteditable·Enter 차단·일반 텍스트 붙여넣기');
ok(/upd\(id, 'title', el\.querySelector\('rt,rp'\) \? \(\(\) => \{ const c = el\.cloneNode\(true\); c\.querySelectorAll\('rt,rp'\)\.forEach\(n => n\.remove\(\)\); return c\.textContent; \}\)\(\) : el\.textContent, cid\)/.test(html), 'b.title 은 항상 순수 텍스트(루비 읽기 제외, #382)');
ok(/\.toggle-title-inp \{[^}]*min-height: 22px;[^}]*line-height: 22px;/s.test(html), '토글 제목 기본 스타일 유지');
process.exit(f ? 1 : 0);
