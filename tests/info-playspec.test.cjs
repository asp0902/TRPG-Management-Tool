const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');
// 플레이 사양(#210): 트리거 요소 다음(기본 정보 마지막) 칸, info.playSpec 으로 기본값·채우기·저장 모두 연결
const trig = html.indexOf('id="i-triggers"'), spec = html.indexOf('id="i-playspec"'), end = html.indexOf('<div class="section-heading">가능성</div>');
assert.ok(trig > 0 && spec > trig && end > spec);
assert.match(html, /<label>플레이 사양<\/label><div class="info-basic-ce" id="i-playspec" contenteditable="true" data-ph="예\) 보이스, 텍스트, 코코포리아" oninput="syncInfo\(\)"/);
assert.match(html, /playtime:'', playSpec:'', players:''/);
assert.match(html, /v\('i-playspec', s\.info\.playSpec, next => \{ s\.info\.playSpec = next; \}\)/);
assert.match(html, /s\.info\.playSpec = g\('i-playspec'\)/);
assert.match(html, /'playtime','playSpec','players'/);
console.log('info playSpec checks: OK');
