const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('TRPG 작업 관리 도구.html', 'utf8');
const grid = html.match(/<div class="info-grid-3" id="info-possibility-grid">([\s\S]*?)<\/div>\s*<div class="info-grid-2"/)?.[1] || '';

for (const id of ['i-madness', 'i-combat', 'i-lost']) {
  const select = grid.match(new RegExp(`<select id="${id}"[\\s\\S]*?<\\/select>`))?.[0] || '';
  assert.match(select, /<option value="O">○<\/option>/);
  assert.match(select, /<option value="X">✕<\/option>/);
  assert.match(select, /<option value="">—<\/option>/);
  assert.match(select, /<option>낮음<\/option><option>보통<\/option><option>높음<\/option>/);
}

assert.match(html, /v\('i-madness', s\.info\.madness\); v\('i-combat', s\.info\.combat\); v\('i-lost', s\.info\.lost\);/);
assert.match(html, /s\.info\.relations = g\('i-relations'\); s\.info\.madness = g\('i-madness'\);/);

console.log('SCRIPT possibility label checks: OK');
