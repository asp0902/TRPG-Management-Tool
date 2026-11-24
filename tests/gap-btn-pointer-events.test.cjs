const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13, 10)).join(String.fromCharCode(10));
let f = 0; const ok = (c, m) => { if (!c) { f++; console.log('FAIL', m); } else console.log('ok', m); };
ok(/\.block-gap:not\(:hover\):not\(\.gap-open\) \.block-gap-btn \{ pointer-events: none; \}/.test(html), 'hover·gap-open 이 아닌 gap 의 ＋ 는 클릭을 가로채지 않음(#354)');
ok(html.indexOf('.block-gap-btn:hover {') < html.indexOf('.block-gap:not(:hover):not(.gap-open) .block-gap-btn'), '기본 ＋ 스타일 뒤에 규칙 배치');
ok(/body\.block-drag-active \.block-gap-btn \{\s*display: none;/.test(html), '드래그 중 ＋ 숨김 규칙 유지');
ok(/\.callout-body > \.block-children-wrap > \.block-gap\.gap-same-type:hover \.block-gap-btn,\s*\.callout-body > \.block-children-wrap > \.block-gap\.gap-same-type\.gap-open \.block-gap-btn \{ pointer-events: auto; \}/.test(html), '콜아웃 같은 종류 gap hover/gap-open 시 ＋ 활성 규칙 유지');
process.exit(f ? 1 : 0);
