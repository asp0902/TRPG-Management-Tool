const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13, 10)).join(String.fromCharCode(10));
// #260: 메모 팝업 좌우 여백이 scrollbar-gutter 때문에 커지지 않는다
const at = html.indexOf('\n.rb-inline-note-editor {');
const rule = html.slice(at, html.indexOf('\n}', at));
assert.ok(rule.includes('padding: 10px;') && !rule.includes('scrollbar-gutter'));
console.log('rb inline note padding: OK');
