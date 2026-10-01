const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');

assert.match(html, /next\.manualTocBlockIds = Array\.isArray\(input\?\.manualTocBlockIds\)/);
assert.match(html, /function setScriptBlockManualToc\(blockId, enabled\)/);
assert.match(html, /label: added \? '목차에서 제거' : '목차에 추가'/);
assert.match(html, /label: '목차에서 제거', action: \(\) => setScriptBlockManualToc\(blockId, false\)/);
assert.match(html, /else label = rbGetTocTitleFromBlock\(b\)/);
assert.match(html, /onclick="tocScrollTo\('\$\{b\.id\}'\)"/);

console.log('script manual toc checks: OK');
