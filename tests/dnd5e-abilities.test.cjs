const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');
const cut = (start, end) => html.slice(html.indexOf(start), html.indexOf(end));
const legacy = { str: '15', str_bonus: '2.5', dex: '12', con: '8', con_bonus: '-1' };
const sheet = { id: 'sheet', templateKey: 'dnd5e', data: { abilities: { ...legacy } } };
const state = { characters: [{ id: 'character', sheets: [sheet] }] };
let saves = 0;
const context = vm.createContext({ state, document: { querySelectorAll: () => [] }, persist: () => { saves += 1; }, esc: value => String(value).replaceAll('"', '&quot;') });
vm.runInContext(cut('const _DND5E_ABILITIES', 'function autoResizeDnd5ePersonalityTextarea')
  + cut('function saveDnd5eAbilityField', 'function saveCocWealthLedgerCell'), context);

const read = key => {
  const parts = context.getDnd5eAbilityParts(sheet.data.abilities, key);
  return [parts.base, parts.adjustment, context.getDnd5eAbilityTotal(parts.base, parts.adjustment)];
};
assert.deepEqual(read('str'), ['10', '5', '15']);
assert.deepEqual(read('dex'), ['12', '', '12']);
assert.deepEqual(read('con'), ['10', '-2', '8']);
assert.deepEqual(read('wis'), ['10', '', '10']);
assert.deepEqual(sheet.data.abilities, legacy);

const markup = context.renderDnd5eAbilitiesSection({ label: '능력치' }, sheet.data.abilities, 'character', 'sheet');
for (const label of ['기본 수치', '보정 수치', '최종 수치']) {
  assert.equal([...markup.matchAll(new RegExp(`>${label}<`, 'g'))].length, 6);
}
assert.equal([...markup.matchAll(/readonly tabindex="-1" data-dnd-final=/g)].length, 6);

const finalInput = { value: '' };
const field = value => ({ value, closest: () => ({ querySelector: () => finalInput }) });
context.saveDnd5eAbilityField('character', 'sheet', 'str', 'base', field('14'));
assert.deepEqual(read('str'), ['14', '5', '19']);
assert.equal(finalInput.value, '19');
context.saveDnd5eAbilityField('character', 'sheet', 'str', 'adjustment', field('-1'));
assert.deepEqual(read('str'), ['14', '-1', '13']);
assert.equal(finalInput.value, '13');
assert.equal(sheet.data.abilities.str, '13');
assert.equal(sheet.data.abilities.str_bonus, '1.5');
context.saveDnd5eAbilityField('character', 'sheet', 'str', 'base', field(''));
assert.deepEqual(read('str'), ['', '-1', '']);
assert.equal(finalInput.value, '');
assert.deepEqual(read('dex'), ['12', '', '12']);
assert.equal(saves, 3);

console.log('D&D 5e ability score checks: OK');
