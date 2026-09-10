const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');

assert.match(html, /btn\.textContent = '저장됨 ✓'; btn\.style\.background = '#2563eb'; btn\.style\.borderColor = '#2563eb';/, 'SCRIPT 저장 완료 버튼은 파랑색이어야 합니다.');
assert.match(html, /<div[^>]+id="i-subtitle"[^>]+contenteditable="true"/, '정보 탭 부제는 서식 가능한 편집기여야 합니다.');
assert.match(html, /<div[^>]+id="body-display-subtitle"[^>]+contenteditable="true"/, '본문 탭 부제는 서식 가능한 편집기여야 합니다.');
assert.match(html, /body-display-subtitle'\)\.innerHTML = normalizeInfoEditableValue/, '본문 탭에서도 저장된 부제 서식을 렌더링해야 합니다.');

const source = html.match(/function syncScriptSubtitle\(source\) \{[\s\S]*?\n\}/)?.[0];
assert.ok(source, '부제 동기화 함수를 찾을 수 없습니다.');
const scenario = { info: { subtitle: '' } };
const controls = {
  'i-subtitle': { id: 'i-subtitle', contentEditable: 'true', innerHTML: '' },
  'body-display-subtitle': { id: 'body-display-subtitle', contentEditable: 'true', innerHTML: '첫 줄<div><span style="font-weight: bold;">둘째 줄</span></div>' },
};
const context = {
  cur: () => scenario,
  document: { getElementById: id => controls[id] },
  normalizeEditableHtml: value => value,
};
vm.runInNewContext(`${source}; syncScriptSubtitle(document.getElementById('body-display-subtitle'));`, context);
assert.equal(scenario.info.subtitle, '첫 줄<div><span style="font-weight: bold;">둘째 줄</span></div>');
assert.equal(controls['i-subtitle'].innerHTML, scenario.info.subtitle);

console.log('script subtitle checks: OK');
