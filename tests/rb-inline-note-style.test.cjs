const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13, 10)).join(String.fromCharCode(10));
// #263: 메모 달린 글자는 화면에서만 굵게+기울임(CSS), 저장되는 HTML 에 서식을 넣지 않는다
const at = html.indexOf('\n.rb-inline-note {');
assert.ok(html.slice(at, html.indexOf('\n}', at)).includes('font-weight: bold; font-style: italic;'));
const make = html.slice(html.indexOf('function rbCreateInlineMemoEl'), html.indexOf('function rbNotifyInlineMemoChanged') > html.indexOf('function rbCreateInlineMemoEl') ? html.indexOf('function rbNotifyInlineMemoChanged') : undefined);
assert.ok(!/style\.fontWeight|style\.fontStyle|<b>|<i>|<strong>|<em>/.test(html.slice(html.indexOf('function rbCreateInlineMemoEl'), html.indexOf('function rbCreateInlineMemoEl') + 400)));
console.log('rb inline note style: OK');
