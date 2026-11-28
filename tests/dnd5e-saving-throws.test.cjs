const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');
const cut = (start, end) => html.slice(html.indexOf(start), html.indexOf(end));
const data = {
  basic: { profBonus: '3' },
  abilities: { str_base: '14', str_adjustment: '1', dex: '9', con_bonus: '1.5' },
  features: { features: 'D&D 5E 2014 빌더 적용\n내성 숙련: STR, CON\n배경: 군인' },
};
const sheet = { id: 'sheet', templateKey: 'dnd5e', data };
const context = vm.createContext({
  state: { characters: [{ id: 'character', sheets: [sheet] }] },
  esc: value => String(value).replaceAll('"', '&quot;'),
  document: { querySelectorAll: () => [] }, SHEET_TEMPLATES: {}, persist: () => {},
});
vm.runInContext(cut('function getDnd5eModifier', 'function getDnd5eBuilderDerived')
  + cut('const _DND5E_ABILITIES', 'function autoResizeDnd5ePersonalityTextarea')
  + cut('function saveSheetField', 'function saveArianrhod2eVitalField'), context);

const read = (key, candidate = data) => {
  const { proficient, bonus } = context.getDnd5eSavingThrow(candidate, key);
  return [proficient, bonus];
};
assert.deepEqual(read('str'), [true, 5]);
assert.deepEqual(read('dex'), [false, -1]);
assert.deepEqual(read('con'), [true, 4]);
assert.deepEqual(read('wis'), [false, 0]);
assert.deepEqual(read('str', { ...data, basic: {}, combat: { profBonus: 2 } }), [true, 4]);
data.savingThrows = { str: false, dex: true };
assert.deepEqual(read('str'), [false, 2]);
assert.deepEqual(read('dex'), [true, 2]);
assert.deepEqual(read('con'), [true, 4]);

const cards = context.renderDnd5eChecksSection({ id: 'savingThrows', label: '내성 굴림' }, data, 'character', 'sheet');
assert.equal([...cards.matchAll(/type="checkbox"/g)].length, 6);
assert.equal([...cards.matchAll(/data-dnd-save-number=/g)].length, 6);
assert.doesNotMatch(cards, /<button/);
assert.match(cards, /sh-dnd-abilities sh-dnd-score-grid/);
assert.match(cards, /aria-label="STR 근력 내성 숙련" onchange=/);
assert.match(cards, /aria-label="DEX 민첩 내성 숙련" checked/);
assert.match(cards, /data-dnd-save-number="str"[^>]+placeholder="\+2" value=""/);

context.saveSheetField('character', 'sheet', 'savingThrows', 'str_bonus', '0');
context.saveSheetField('character', 'sheet', 'savingThrows', 'dex_bonus', '-3');
const overrides = context.renderDnd5eChecksSection({ id: 'savingThrows', label: '내성 굴림' }, data, 'character', 'sheet');
assert.match(overrides, /data-dnd-save-number="str"[^>]+placeholder="\+2" value="0"/);
assert.match(overrides, /data-dnd-save-number="dex"[^>]+placeholder="\+2" value="-3"/);
context.saveSheetField('character', 'sheet', 'savingThrows', 'str_bonus', '');
assert.equal(data.savingThrows.str_bonus, '');
assert.equal(data.savingThrows.dex, true);

console.log('D&D 5e saving throw checks: OK');
