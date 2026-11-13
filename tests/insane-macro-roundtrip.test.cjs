const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13, 10)).join(String.fromCharCode(10));

// 인세인 WYSIWYG 편집기 왕복 변환(#251): 순수 함수(DOM 없음)를 잘라 실행하고, DOM 층이 만드는 트리를 같은 규칙으로 흉내 낸다.
const slice = (from, to) => html.slice(html.indexOf(from), html.indexOf(to));
const parserSrc = slice('function tryParseCssMacroToken', '// 코코포리아 채팅(CCFOLIA 1.37.4') + '\n' + slice('function decodeCssMacroPreviewValue', 'function tryParseCssMacroToken');
const pureSrc = slice('function macroEscapeText', '// ── 인세인 편집기 DOM 층 ──');
assert.ok(parserSrc.length > 100 && pureSrc.length > 100);
const ctx = {};
vm.runInNewContext(parserSrc + '\n' + pureSrc + '\nthis.parse = macroEditorParse; this.ser = macroSerializeNodes; this.toNodes = macroTreeToNodes; this.splitDecls = macroSplitDecls;', ctx);

// DOM 층(macroNodesToFragment)과 같은 규칙으로 노드 → 트리를 만든다.
const textTree = (parent, text) => text.split('\n').forEach((part, i) => { if (i) parent.children.push({ type: 'el', tag: 'BR', css: '', data: {}, children: [] }); if (part) parent.children.push({ type: 'text', text: part }); });
const toTree = (nodes, src) => {
  const root = { type: 'el', tag: 'DIV', css: '', data: {}, children: [] };
  nodes.forEach(node => {
    if (node.t === 'text') { textTree(root, node.s); return; }
    const span = { type: 'el', tag: 'SPAN', css: node.css, data: { macroStyle: node.tail, macroText0: node.text0, macroRaw: node.raw, macroCss0: node.css }, children: [] };
    textTree(span, node.text);
    root.children.push(span);
  });
  if (/\n$/.test(src)) root.children.push({ type: 'el', tag: 'BR', css: '', data: {}, children: [] });
  return root;
};
const roundtrip = src => { const nodes = ctx.parse(src); return nodes ? ctx.ser(ctx.toNodes(toTree(nodes, src))) : null; };

// 1) 왕복이 같아야 하는 원문들
const same = [
  '',
  '서식 없는 글',
  '여러 줄\n둘째 줄\n\n빈 줄 뒤',
  '끝 줄바꿈\n',
  '[순간적으로 위험을 감지하여 피한다.](#"style= font-style:italic;)',
  '[굵게](#"style= font-weight:bold;)와 [기울임](#"style= font-style:italic;)',
  '앞 [가운데](#"style= color:#E21111;) 뒤\n둘째 줄 [색](#"style= color:red;)',
  '공백  두 칸과　전각　공백 [　전각　](#"style= font-style:italic;) 끝 ',
  '[중요](#"style= color:red !important; font-weight:bold;)',
  '[a](#" style=" display:block; text-align:center; padding:0 16px; background:linear-gradient(90deg, #E21111 calc(50% - 15px), #fafafa calc(50% - 15px)); color:transparent !important;)',
  '[두 줄\n라벨](#"style= font-style:italic;)',
  '대괄호 [그냥] 글자와 [](#없는 형태) 그대로',
  '[&#40;괄호&#41;](#"style= font-weight:bold;)',
];
same.forEach(src => assert.equal(roundtrip(src), src, '왕복: ' + JSON.stringify(src)));
assert.ok(ctx.parse('[굵게](#"style= font-weight:bold;)').some(node => node.t === 'macro'));

// 2) 원문 모드로 빠져야 하는 것(null): 링크형·이미지·롤20 명령·닫히지 않은 토큰
['[이미지](https://example.com/a.png)', '[](https://example.com/a.png)', '[링크](https://x.com#" style="color:red;")', '/desc [x](#"style= color:red;)', '&{template:default} {{a=b}}', '[닫히지 않음](#"style= color:red;'].forEach(src =>
  assert.equal(ctx.parse(src), null, '원문 모드: ' + JSON.stringify(src)));

// 3) 편집 시나리오: 바뀌지 않은 조각은 원문 그대로, 바뀐 곳만 다시 직렬화
const italic = '[순간적으로 위험을 감지하여 피한다.](#"style= font-style:italic;)';
const tree = toTree(ctx.parse(italic), italic);
// (a) 기울임 문장 중간에 글자를 넣으면 같은 조각 안에 들어간다
tree.children[0].children[0].text = '순간적으로 정말 위험을 감지하여 피한다.';
assert.equal(ctx.ser(ctx.toNodes(tree)), '[순간적으로 정말 위험을 감지하여 피한다.](#"style= font-style:italic;)');
// (b) 일반 글 일부를 굵게(<b>) → 새 조각 [..](#"style= font-weight:bold;), 나머지는 일반 글
const plain = { type: 'el', tag: 'DIV', css: '', data: {}, children: [{ type: 'el', tag: 'B', css: '', data: {}, children: [{ type: 'text', text: '안녕' }] }, { type: 'text', text: ' 세계' }] };
assert.equal(ctx.ser(ctx.toNodes(plain)), '[안녕](#"style= font-weight:bold;) 세계');
// (c) 기울임 조각 안 일부만 굵게 → 기울임은 원문 꼬리 그대로, 굵은 부분만 두 속성
const nested = toTree(ctx.parse('[가나다](#"style= font-style:italic;)'), '[가나다](#"style= font-style:italic;)');
nested.children[0].children = [{ type: 'text', text: '가' }, { type: 'el', tag: 'B', css: '', data: {}, children: [{ type: 'text', text: '나' }] }, { type: 'text', text: '다' }];
assert.equal(ctx.ser(ctx.toNodes(nested)), '[가](#"style= font-style:italic;)[나](#"style= font-style:italic; font-weight:bold;)[다](#"style= font-style:italic;)');
// (d) execCommand 가 만드는 i / u / 색 span 도 매크로 style 로
const mixed = { type: 'el', tag: 'DIV', css: '', data: {}, children: [{ type: 'el', tag: 'I', css: '', data: {}, children: [{ type: 'text', text: 'a' }] }, { type: 'el', tag: 'SPAN', css: 'color: rgb(255, 0, 0);', data: {}, children: [{ type: 'text', text: 'b' }] }, { type: 'el', tag: 'U', css: '', data: {}, children: [{ type: 'text', text: 'c' }] }] };
assert.equal(ctx.ser(ctx.toNodes(mixed)), '[a](#"style= font-style:italic;)[b](#"style= color:rgb(255, 0, 0);)[c](#"style= text-decoration:underline;)');
// (e) 브라우저가 Enter 로 만드는 div 줄바꿈
const blocks = { type: 'el', tag: 'DIV', css: '', data: {}, children: [{ type: 'text', text: '첫 줄' }, { type: 'el', tag: 'DIV', css: '', data: {}, children: [{ type: 'text', text: '둘째' }] }, { type: 'el', tag: 'DIV', css: '', data: {}, children: [{ type: 'el', tag: 'BR', css: '', data: {}, children: [] }] }, { type: 'el', tag: 'DIV', css: '', data: {}, children: [{ type: 'text', text: '넷째' }] }] };
assert.equal(ctx.ser(ctx.toNodes(blocks)), '첫 줄\n둘째\n\n넷째');
// (f) 라벨에 ] 를 입력하면 문법이 깨지지 않게 전각으로
const bracket = toTree(ctx.parse('[가](#"style= font-style:italic;)'), '[가](#"style= font-style:italic;)');
bracket.children[0].children[0].text = '가]나';
assert.equal(ctx.ser(ctx.toNodes(bracket)), '[가］나](#"style= font-style:italic;)');
assert.equal(JSON.stringify(ctx.splitDecls('background:url(data:image/png;base64,AA); color:red;')), JSON.stringify([['background', 'url(data:image/png;base64,AA)'], ['color', 'red']]));

// 4) 연결: 숨겨진 textarea 가 원천, 불러올 때 왕복 검사, 붙여넣기는 일반 텍스트, 도구모음은 isCE 경로
assert.ok(html.includes("if (!nodes || macroEditorValue(editor) !== src) {"));
assert.ok(html.includes("ta.dataset.macroFallback = '1';"));
assert.ok(html.includes("event.clipboardData?.getData('text/plain')"));
assert.ok(html.includes("editor.addEventListener('focus', () => { lastFocusedTA = editor; });"));
assert.ok(html.includes("textarea[data-macro-fallback=\"1\"]"));
console.log('insane macro roundtrip checks: OK');
