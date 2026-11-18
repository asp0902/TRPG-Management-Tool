const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13,10)).join(String.fromCharCode(10));
let f = 0; const ok = (c, m) => { if (!c) { f++; console.log('FAIL', m); } else console.log('ok', m); };
for (const key of ["key: 'numenera'", "key: 'cypher'"]) {
  const a = html.indexOf(key), seg = html.slice(a, html.indexOf("id: 'pools'", a));
  ok(['descriptor', 'species', 'type', 'focus'].every(id => new RegExp("\{ id: '" + id + "'[^\n]*colSpan: 2 \}").test(seg)) && /id: 'tier'[^\n]*\}/.test(seg) && !/id: 'tier'[^\n]*colSpan/.test(seg), key + ': 수식어·종족·유형·특징 colSpan 2(티어 등은 1칸)');
}
ok(/\.sh-section-hd \{[^}]*font-size: 12px; font-weight: 800;/.test(html), '.sh-section-hd 12px·800');
ok(/\.sh-field-label \{[^}]*overflow-wrap: anywhere;/.test(html), '.sh-field-label 줄바꿈 안전장치');
process.exit(f ? 1 : 0);
