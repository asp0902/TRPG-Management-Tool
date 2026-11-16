const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');
// #258: 사이드바 페이지 드롭다운 순서
const a = html.indexOf('id="page-dropdown"');
const block = html.slice(a, html.indexOf('</div>\n      </div>', a) > 0 ? html.indexOf('</div>\n      </div>', a) : html.indexOf('</div>\r\n      </div>', a));
const order = [...block.matchAll(/data-page="([^"]+)"/g)].map(m => m[1]);
assert.deepEqual(order, ['scenario', 'script', 'record', 'character', 'rulebook', 'music', 'bookmark', 'css-macro']);
console.log('page dropdown order: OK');
