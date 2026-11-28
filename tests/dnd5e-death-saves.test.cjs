const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');
const cut = (start, end) => html.slice(html.indexOf(start), html.indexOf(end));
const combat = { hpCur: '' };
const sheet = { id: 'sheet', templateKey: 'dnd5e', data: { combat } };
const output = { textContent: '' };
const hpInput = { value: '' };
const marks = [];
const buttons = { roll: {}, stabilize: {}, reset: {} };
const panel = {
  dataset: { chId: 'character', sheetId: 'sheet' },
  querySelectorAll: () => marks,
  querySelector: selector => selector === 'output' ? output : buttons[selector.split('"')[1]],
  closest: () => ({ querySelector: () => hpInput }),
};
for (const button of Object.values(buttons)) button.closest = () => panel;
for (const key of ['successes', 'failures']) {
  for (const value of [1, 2, 3]) marks.push({ dataset: { deathMark: key }, value, closest: () => panel });
}
const rolls = [];
const context = vm.createContext({
  state: { characters: [{ id: 'character', sheets: [sheet] }] },
  document: { querySelector: () => panel }, SHEET_TEMPLATES: {}, persist: () => {},
  esc: value => String(value).replaceAll('"', '&quot;'),
  evalDiceFormula: formula => { assert.equal(formula, '1d20'); return rolls.shift(); },
});
vm.runInContext(cut('function getDnd5eDeathSaves', 'function autoResizeDnd5ePersonalityTextarea')
  + cut('function saveSheetField', 'function saveArianrhod2eVitalField'), context);

const action = name => context.updateDnd5eDeathSaves('character', 'sheet', name, buttons[name]);
const roll = value => { rolls.push(value); action('roll'); assert.equal(rolls.length, 0); };
const hp = value => context.saveSheetField('character', 'sheet', 'combat', 'hpCur', value);
const marksChecked = () => marks.map(mark => mark.checked);
const markup = context.renderDnd5eDeathSaves('character', 'sheet');
assert.equal([...markup.matchAll(/type="checkbox"/g)].length, 6);
assert.match(markup, />죽음 내성</);
context.refreshDnd5eDeathSaves(panel, combat);
assert.equal(buttons.roll.disabled, true);
hp('0');
assert.equal(buttons.roll.disabled, false);
roll(1);
assert.match(output.textContent, /실패 2회/);
assert.deepEqual(marksChecked(), [false, false, false, true, true, false]);
roll(9);
assert.match(output.textContent, /사망/);
assert.equal(buttons.roll.disabled, true);
assert.equal(marks[0].disabled, true);
action('reset');
for (const value of [10, 14, 19]) roll(value);
assert.equal(combat.deathSaves.stable, true);
assert.deepEqual(marksChecked(), Array(6).fill(false));
assert.equal(buttons.roll.disabled, true);

marks[3].checked = true;
context.updateDnd5eDeathSaves('character', 'sheet', 'failures', marks[3]);
assert.equal(combat.deathSaves.stable, false);
assert.equal(combat.deathSaves.failures, 1);
action('stabilize');
assert.equal(combat.deathSaves.stable, true);
assert.deepEqual(marksChecked(), Array(6).fill(false));
hp('6');
assert.equal(combat.deathSaves, undefined);
hp('0');
roll(1);
roll(20);
assert.equal(combat.hpCur, '1');
assert.equal(hpInput.value, '1');
assert.equal(combat.deathSaves, undefined);
assert.match(output.textContent, /HP 1 회복/);
assert.equal(buttons.roll.disabled, true);

console.log('D&D 5e death saving throw checks: OK');
