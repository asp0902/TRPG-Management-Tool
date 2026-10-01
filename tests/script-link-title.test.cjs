const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');
assert.match(html, /function getScriptLinkTitleText\(value\) \{[\s\S]*?container\.innerHTML = titlePlainText[\s\S]*?container\.innerText \|\| container\.textContent[\s\S]*?replace\(\/\\s\+\/g, ' '\)/);
assert.match(html, /function buildScriptLinkMenu[\s\S]*?getScriptLinkTitleText\(s\.title\)/);
const menuSource = html.slice(html.indexOf('function buildScriptLinkMenu'), html.indexOf('function onScriptLinkClick'));
assert.doesNotMatch(menuSource, /s\.title\s*=/);

console.log('script link title checks: OK');
