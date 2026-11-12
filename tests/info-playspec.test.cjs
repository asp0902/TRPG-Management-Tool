const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');
// 플레이 사양(#210): 플레이 타임 바로 다음 칸, info.playSpec 으로 기본값·채우기·저장 모두 연결
const time = html.indexOf('id="i-playtime"'), spec = html.indexOf('id="i-playspec"'), players = html.indexOf('id="field-players"');
assert.ok(time > 0 && spec > time && players > spec);
assert.match(html, /<label>플레이 사양<\/label><div class="info-basic-ce" id="i-playspec" contenteditable="true" data-ph="예\) 보이스, 텍스트, 코코포리아" oninput="syncInfo\(\)"/);
assert.match(html, /playtime:'', playSpec:'', players:''/);
assert.match(html, /v\('i-playspec', s\.info\.playSpec, next => \{ s\.info\.playSpec = next; \}\)/);
assert.match(html, /s\.info\.playSpec = g\('i-playspec'\)/);
assert.match(html, /'playtime','playSpec','players'/);
console.log('info playSpec checks: OK');
