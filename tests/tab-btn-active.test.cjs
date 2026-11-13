const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split('\r\n').join('\n');
// 정보/본문 활성 표시는 인덱스가 아니라 data-tab 으로(#237): 폴더 버튼이 앞에 있어도 밀리지 않는다
assert.ok(html.includes(`<button class="tab-btn active" data-tab="info" onclick="switchTab('info')">`));
assert.ok(html.includes(`<button class="tab-btn" data-tab="body" onclick="switchTab('body')">`));
assert.ok(html.includes(`querySelectorAll('.tab-btn[data-tab]').forEach(b => b.classList.toggle('active', b.dataset.tab === tab))`));
console.log('tab btn active checks: OK');
