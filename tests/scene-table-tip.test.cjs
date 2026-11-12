const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13) + String.fromCharCode(10)).join(String.fromCharCode(10));
// 장면표 라벨 호버 안내(#214)
assert.match(html, /<label class="scene-table-label">장면표<span class="scene-table-tip" role="tooltip">\/roll-table\n커맨드 이름\n커맨드 다이스\(1D3\)\n1: 커맨드 항목\n2: 커맨드 항목\n3: 커맨드 항목<\/span><\/label>/);
assert.match(html, /\.scene-table-label \{[^}]*cursor: help;/);
assert.match(html, /\.scene-table-tip \{[^}]*display: none;[^}]*white-space: pre;[^}]*pointer-events: none;/);
assert.match(html, /\.scene-table-label:hover \.scene-table-tip \{ display: block; \}/);
console.log('scene table tip checks: OK');
