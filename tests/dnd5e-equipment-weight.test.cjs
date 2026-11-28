const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');
const cut = (start, end) => html.slice(html.indexOf(start), html.indexOf(end));
const equipment = [{ name: '배낭', qty: '2', weight: '2.5' }, { name: '화살', weight: '0.25' }, { name: '기존 장비', qty: '4' }];
const sheet = { id: 'sheet', templateKey: 'dnd5e', data: { equipment, currency: { gold: '50' } } };
const subtotal = { textContent: '' };
const total = {
  dataset: { chId: 'character', sheetId: 'sheet' }, textContent: '',
  closest: () => ({ querySelector: selector => selector === '[data-dnd-row-weight="0"]' ? subtotal : null }),
};
const context = vm.createContext({
  state: { characters: [{ id: 'character', sheets: [sheet] }] },
  document: { querySelector: () => total }, persist: () => {},
});
vm.runInContext(cut('function getDnd5eEquipmentRowWeight', 'function renderDnd5eCurrency')
  + cut('function saveSheetRepeatCell', '// 반복 섹션 행 추가'), context);

assert.equal(context.formatDnd5eEquipmentRowWeight(equipment[0]), '5');
assert.equal(context.formatDnd5eEquipmentRowWeight(equipment[1]), '0.25');
assert.equal(context.formatDnd5eEquipmentRowWeight(equipment[2]), '—');
assert.equal(context.formatDnd5eEquipmentRowWeight({ qty: '0', weight: '6' }), '0');
assert.equal(context.getDnd5eEquipmentRowWeight({ qty: '-2', weight: '4' }), 0);
assert.equal(context.formatDnd5eEquipmentTotalWeight(equipment), '5.25 lb');
assert.equal(context.formatDnd5eEquipmentTotalWeight([{ qty: '3', weight: '0.1' }]), '0.3 lb');

context.saveSheetRepeatCell('character', 'sheet', 'equipment', 0, 'qty', '3');
assert.equal(subtotal.textContent, '7.5');
assert.equal(total.textContent, '7.75 lb');
context.saveSheetRepeatCell('character', 'sheet', 'equipment', 0, 'weight', '1.2');
assert.equal(subtotal.textContent, '3.6');
assert.equal(total.textContent, '3.85 lb');
assert.deepEqual(sheet.data.currency, { gold: '50' });
assert.equal(Object.hasOwn(equipment[0], 'totalWeight'), false);

console.log('D&D 5e equipment weight checks: OK');
