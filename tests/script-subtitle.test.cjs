const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');

assert.match(html, /btn\.textContent = '저장됨 ✓'; btn\.style\.background = '#2563eb'; btn\.style\.borderColor = '#2563eb';/, 'SCRIPT 저장 완료 버튼은 파랑색이어야 합니다.');
assert.match(html, /<div[^>]+id="i-subtitle"[^>]+contenteditable="true"/, '정보 탭 부제는 서식 가능한 편집기여야 합니다.');
assert.match(html, /<div[^>]+id="body-display-subtitle"[^>]+contenteditable="true"/, '본문 탭 부제는 서식 가능한 편집기여야 합니다.');
assert.match(html, /body-display-subtitle'\)\.innerHTML = normalizeInfoEditableValue/, '본문 탭에서도 저장된 부제 서식을 렌더링해야 합니다.');
assert.match(html, /class="body-title-block" id="body-title-block" onfocusin="handleBodyTitleFocusIn\(\)" onfocusout="handleBodyTitleFocusOut\(\)"/, '본문 제목과 소제목은 공통 포커스 상태를 추적해야 합니다.');
assert.match(html, /\.body-title-block\.subtitle-empty:not\(\.title-editing\) \{ justify-content: center; \}/, '빈 소제목이고 편집 중이 아닐 때 제목을 세로 가운데 정렬해야 합니다.');
assert.match(html, /\.body-title-block\.subtitle-empty:not\(\.title-editing\) \.body-display-subtitle \{ display: none; \}/, '편집 중이 아닐 때 빈 소제목 자리표시자를 숨겨야 합니다.');
assert.match(html, /function updateBodyTitleAlignment\(\) \{[\s\S]*?hasNestedTextLineMeaningfulContent\(subtitle\.innerHTML\)/, 'br, 공백, nbsp만 있는 소제목도 기존 의미 콘텐츠 판정으로 비어 있어야 합니다.');
assert.match(html, /oninput="syncScriptSubtitle\(this\)" onblur="updateBodyTitleAlignment\(\)"/, '입력과 포커스 이탈 시 제목 정렬을 갱신해야 합니다.');
assert.match(html, /function handleBodyTitleFocusOut\(\) \{\s*setTimeout\(updateBodyTitleAlignment, 0\);/, 'focusout 완료 후 실제 activeElement로 제목 상태를 다시 계산해야 합니다.');
assert.match(html, /id="i-overview"[^>]+contenteditable="true"[^>]+oncontextmenu="return openInfoEditableContextMenu\(event\)"/, '개요에서 서식 우클릭 메뉴를 열 수 있어야 합니다.');

const contextMenuFunction = html.match(/function openInfoEditableContextMenu\(event\) \{[\s\S]*?\n\}/)?.[0];
assert.ok(contextMenuFunction, '정보 편집기 메뉴 함수를 찾을 수 없습니다.');
const menuCalls = [];
const menuContext = {
  tbGetVariationCtxItems: () => [{ label: '개변 추가' }],
  tbShowCtxMenu: (x, y, items) => menuCalls.push({ x, y, label: items[0].label }),
};
vm.runInNewContext(`${contextMenuFunction}; openInfoEditableContextMenu(event);`, {
  ...menuContext,
  event: { clientX: 10, clientY: 20, preventDefault: () => menuCalls.push('prevented'), stopPropagation: () => menuCalls.push('stopped') },
});
assert.deepEqual(menuCalls, ['prevented', 'stopped', { x: 10, y: 20, label: '개변 추가' }]);

const variationHostFunction = html.match(/function tbGetVariationHost\(root\) \{[\s\S]*?\n\}/)?.[0];
assert.ok(variationHostFunction, '개변 편집 패널 호스트 탐색 함수를 찾을 수 없습니다.');
const infoField = {};
const infoEditable = { closest: selector => selector === '.field' ? infoField : null };
assert.equal(vm.runInNewContext(`${variationHostFunction}; tbGetVariationHost(root);`, { root: infoEditable }), infoField, '정보 입력 필드에도 개변 편집 패널이 열려야 합니다.');

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
  updateBodyTitleAlignment: () => {},
};
vm.runInNewContext(`${source}; syncScriptSubtitle(document.getElementById('body-display-subtitle'));`, context);
assert.equal(scenario.info.subtitle, '첫 줄<div><span style="font-weight: bold;">둘째 줄</span></div>');
assert.equal(controls['i-subtitle'].innerHTML, scenario.info.subtitle);

console.log('script subtitle checks: OK');
