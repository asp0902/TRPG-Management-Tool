const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('TRPG 작업 관리 도구.html', 'utf8');
const extract = name => html.match(new RegExp(`function ${name}\\([^]*?\\n\\}`))[0];
const insert = extract('tbInsertTable');
const menu = extract('tbOpenTableMenu');

assert.match(html, /id="tb-table-btn"[^>]+title="표 만들기"/);
assert.match(insert, /target\?\.type !== 'ce'/);
assert.match(insert, /root\.closest\('#blocks-container,#rb-blocks-container'\)/);
assert.match(insert, /range\.deleteContents\(\)/);
assert.match(insert, /range\.insertNode\(table\)/);
assert.match(insert, /root\.dispatchEvent\(new Event\('input'/);
assert.match(menu, /row <= 5/);
assert.match(menu, /column <= 5/);
assert.match(menu, /tbCloneFormatTarget\(tbResolveFormatTarget\(\)\)/);
assert.match(html, /\.tb-editor-table td[\s\S]*overflow-wrap: anywhere/);

console.log('editor table checks: OK');
