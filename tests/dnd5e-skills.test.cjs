const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');
const cut = (start, end) => html.slice(html.indexOf(start), html.indexOf(end));
const data = {
  abilities: { str: '15', dex: '9', int: '16', wis: '12', cha: '7' },
  basic: { profBonus: '3' },
  features: { features: 'D&D 5E 2014 빌더 적용\n배경: 군인 - 운동, 위협, 군 계급' },
};
const sheet = { id: 'sheet', templateKey: 'dnd5e', data };
const context = vm.createContext({
  state: { characters: [{ id: 'character', sheets: [sheet] }] },
  esc: value => String(value).replaceAll('"', '&quot;'),
  evalDiceFormula: formula => { assert.equal(formula, '1d20'); return 13; },
});
vm.runInContext(cut('function getDnd5eModifier', 'function getDnd5eBuilderDerived')
  + cut('const _DND5E_ABILITIES', 'function autoResizeDnd5ePersonalityTextarea')
  + '\nthis.skills = _DND5E_SKILLS;', context);

const byAbility = Object.fromEntries(['str', 'dex', 'int', 'wis', 'cha'].map(ability => [ability, context.skills.filter(skill => skill.ability === ability).map(skill => skill.key)]));
assert.equal(context.skills.length, 18);
assert.deepEqual(JSON.parse(JSON.stringify(byAbility)), {
  str: ['athletics'], dex: ['acrobatics', 'sleightOfHand', 'stealth'],
  int: ['arcana', 'history', 'investigation', 'nature', 'religion'],
  wis: ['animalHandling', 'insight', 'medicine', 'perception', 'survival'],
  cha: ['deception', 'intimidation', 'performance', 'persuasion'],
});
const read = key => {
  const { proficient, bonus } = context.getDnd5eRollCheck(data, context.skills.find(skill => skill.key === key));
  return [proficient, bonus];
};
assert.deepEqual(read('athletics'), [true, 5]);
assert.deepEqual(read('intimidation'), [true, 1]);
assert.deepEqual(read('stealth'), [false, -1]);
data.skills = { athletics: false, arcana: true, background: ['perception'] };
assert.deepEqual(read('athletics'), [false, 2]);
assert.deepEqual(read('intimidation'), [false, -2]);
assert.deepEqual(read('arcana'), [true, 6]);
assert.deepEqual(read('perception'), [true, 4]);

const markup = context.renderDnd5eChecksSection({ id: 'skills', label: '기술' }, data, 'character', 'sheet');
assert.equal([...markup.matchAll(/aria-label="[^\"]+ 기술 숙련"/g)].length, 18);
assert.match(markup, /운동 \(STR\)/);
assert.match(markup, /aria-label="지각 판정 \+4"/);
const output = { textContent: '' };
const button = { dataset: { dndCheck: 'stealth' }, closest: () => ({ dataset: { sectionId: 'skills' }, querySelector: () => output }) };
context.rollDnd5eCheck('character', 'sheet', button);
assert.equal(output.textContent, '은신 판정 · d20 13 -1 = 12');

console.log('D&D 5e skill checks: OK');
