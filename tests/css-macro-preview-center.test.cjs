const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13, 10)).join(String.fromCharCode(10));
// #253: 코코포리아 모양 미리보기 칸을 PREVIEW 상자 가로 가운데로
const a = html.indexOf('.css-macro-preview-body {');
const rule = html.slice(a, html.indexOf('}', a));
assert.ok(/margin-inline:\s*auto/.test(rule));
assert.ok(rule.includes('width: min(calc(var(--ccf-width) + 34px), 100%);') && rule.includes('padding: 0 16px 16px;'));
console.log('css macro preview center checks: OK');
