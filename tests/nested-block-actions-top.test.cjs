const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13, 10)).join(String.fromCharCode(10));
let f = 0; const ok = (c, m) => { if (!c) { f++; console.log('FAIL', m); } else console.log('ok', m); };
const m = html.match(/:is\(\.callout-body, \.nested-callout, \.bib-item\) > \.block-children-wrap > \.block:not\(\.block-roll\) > \.block-actions \{[^}]*\}/);
ok(!!m, '안쪽 블록 메뉴 규칙: roll 제외(:not(.block-roll))');
ok(m && /top: auto;/.test(m[0]) && /bottom: 100%;/.test(m[0]) && /right: 4px;/.test(m[0]) && /left: auto;/.test(m[0]), '블록 위쪽(bottom:100%), 우측 4px, 틈 없음(#343)');
ok(/\.block\.block-roll \.block-actions \{\s*top: 4px; left: auto; right: 4px; bottom: auto;/.test(html), 'roll 블록은 기존 안쪽 배치 유지');
process.exit(f ? 1 : 0);
