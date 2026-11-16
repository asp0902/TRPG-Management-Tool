const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13, 10)).join(String.fromCharCode(10));
// #259: 앱 전체 전각 괄호 여백 제거(halt), 코코포리아·롤20 PREVIEW 는 제외(normal)
const body = html.slice(html.indexOf('\nbody {'), html.indexOf('\n}', html.indexOf('\nbody {')));
assert.ok(body.includes('font-feature-settings: "halt";'));
const at = html.indexOf('\n.css-macro-preview-body {');
assert.ok(html.slice(at, html.indexOf('\n}', at)).includes('font-feature-settings: normal;'));
assert.ok(html.includes('textarea, input, select, button { font-feature-settings: inherit; }'));
console.log('fullwidth bracket halt: OK');
