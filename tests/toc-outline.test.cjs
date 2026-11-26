const fs = require('fs'), path = require('path'), vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13, 10)).join(String.fromCharCode(10));
let f = 0; const ok = (c, m) => { if (!c) { f++; console.log('FAIL', m); } else console.log('ok', m); };
const ctx = {}; vm.createContext(ctx);
vm.runInContext(html.slice(html.indexOf('function tocHeadingsInHtml'), html.indexOf('var _tocHeadings')), ctx);
const J = v => JSON.stringify(v);
const H = ctx.tocHeadingsInHtml('<p class="tb-title">큰 <b>제목</b></p><h1>하나 &amp; &#44228;</h1><p>일반</p><h4>부제목</h4><h2><br></h2><h2><ruby>漢<rt>한</rt></ruby>&nbsp;둘</h2><div><h3 style="color:red">셋</h3></div>');
ok(J(H) === J([{ level: 1, text: '큰 제목' }, { level: 1, text: '하나 & 계' }, { level: 2, text: '漢 둘' }, { level: 3, text: '셋' }]), '제목·제목 1~3 만(부제목·일반·빈 제목 제외): ' + J(H));
ok(ctx.tocHeadingsInHtml('plain').length === 0 && ctx.tocHeadingsInHtml(null).length === 0, '글 아님');
const blocks = [
  { id: 'a', type: 'text', content: '<h1>앞</h1>' },
  { id: 'b', type: 'callout', children: [{ id: 'c', type: 'text', content: '<h2>같음</h2>' }], title: '<h1>머리</h1>', content: '<h2>같음</h2>', memo: '<h1>메모</h1>' },
  { id: 'd', type: 'toggle', content: '', quoteChildren: { q: [{ id: 'e', content: '<h3>인용 안</h3>' }] } },
];
const out = ctx.tocBlockOutline(blocks, new Set(['b', 'e']));
ok(out.map(r => r.id ? '[' + r.id + ']' : r.text + '@' + r.owner + '#' + r.nth).join() === '앞@null#0,[b],머리@b#0,같음@b#0,같음@b#1,[e],인용 안@e#0', '문서 순서·소속 블록·같은 제목 순번: ' + out.map(r => r.id || r.text).join());
ok(out[4].top === 'b' && out[6].top === 'd', '최상위 블록 기억');
ok(ctx.tocBlockOutline([{ id: 'x', content: 'no heading' }], new Set(['x'])).length === 1, '제목 없는 블록은 항목만');
ok(/addEventListener\('input'[\s\S]{0,600}?}, 300\);/.test(html) && /headingsHtml\(c, depth\)/.test(html), '300ms 갱신·룰북 목차 연결');
process.exit(f ? 1 : 0);
