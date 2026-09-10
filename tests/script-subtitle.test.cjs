const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');

assert.match(html, /btn\.textContent = '저장됨 ✓'; btn\.style\.background = '#2563eb'; btn\.style\.borderColor = '#2563eb';/, 'SCRIPT 저장 완료 버튼은 파랑색이어야 합니다.');
assert.match(html, /<textarea[^>]+id="i-subtitle"[^>]+rows="1"/, '정보 탭 부제는 여러 줄 입력이어야 합니다.');
assert.match(html, /<textarea[^>]+id="body-display-subtitle"[^>]+rows="1"/, '본문 탭 부제는 여러 줄 입력이어야 합니다.');

const source = html.match(/function syncScriptSubtitle\(source\) \{[\s\S]*?\n\}/)?.[0];
assert.ok(source, '부제 동기화 함수를 찾을 수 없습니다.');
const scenario = { info: { subtitle: '' } };
const controls = {
  'i-subtitle': { id: 'i-subtitle', value: '' },
  'body-display-subtitle': { id: 'body-display-subtitle', value: '첫 줄\n둘째 줄' },
};
const resized = [];
const context = {
  cur: () => scenario,
  document: { getElementById: id => controls[id] },
  autoResize: el => resized.push(el.id),
};
vm.runInNewContext(`${source}; syncScriptSubtitle(document.getElementById('body-display-subtitle'));`, context);
assert.equal(scenario.info.subtitle, '첫 줄\n둘째 줄');
assert.equal(controls['i-subtitle'].value, '첫 줄\n둘째 줄');
assert.deepEqual(resized, ['body-display-subtitle', 'i-subtitle']);

console.log('script subtitle checks: OK');
