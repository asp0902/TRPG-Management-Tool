const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split('\r\n').join('\n');
// BOOTH 링크 라벨·아이콘(#242)
assert.ok(html.includes("const CATALOG_LINK_BOOTH_LABEL_VALUE = 'BOOTH';"));
assert.ok(html.includes("'https://booth.pm/static-images/pwa/icon_size_180.png'"));
assert.ok(html.includes("{ value: CATALOG_LINK_BOOTH_LABEL_VALUE, text: 'BOOTH', image: CATALOG_LINK_LABEL_BOOTH_ICON_URL }"));
assert.ok(html.includes("if (is('booth.pm')) return CATALOG_LINK_BOOTH_LABEL_VALUE;"));
console.log('catalog link booth checks: OK');
