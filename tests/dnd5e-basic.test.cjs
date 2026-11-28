const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');
const cut = (start, end) => html.slice(html.indexOf(start), html.indexOf(end));
const legacy = { id: 'legacy', templateKey: 'dnd5e', data: { basic: { class: '파이터 Lv.7', passivePerceptionText: '감지(청각)', passivePerception: 13 }, combat: { profBonus: 3 } } };
const ambiguous = { id: 'multiclass', templateKey: 'dnd5e', data: { basic: { class: '파이터 Lv.5 / 로그 Lv.2' } } };
const character = { id: 'character', name: '이름', sheets: [legacy, ambiguous] };
const context = vm.createContext({ state: { characters: [character] }, persist: () => {}, renderCharacterSheetPortrait: () => '',
  esc: value => String(value).replaceAll('"', '&quot;'),
});
const fieldOrder = [
  'charName', 'playerName', 'level', 'xp', 'class', 'race', 'inspiration', 'profBonus', 'background', 'alignment', 'passivePerceptionText', 'passivePerception',
];
const sectionMarkup = html.slice(html.indexOf("customType: 'dnd5e-basic'"), html.indexOf("customType: 'dnd5e-abilities'"));
const fields = [...sectionMarkup.matchAll(/\{ id: '([^']+)', label: '([^']+)', type: '([^']+)'(?:, syncTarget: '([^']+)')?/g)]
  .map(([, id, label, type, syncTarget]) => ({ id, label, type, syncTarget }));
assert.deepEqual(fields.map(field => field.id), fieldOrder);
const basic = { id: 'basic', label: '기본 정보', fields };
context.SHEET_TEMPLATES = { dnd5e: { sections: [basic] } };
vm.runInContext(cut('function getDnd5eBasicClassAndLevel', 'const _DND5E_ABILITIES')
  + cut('function saveSheetField', 'function saveArianrhod2eVitalField'), context);

const result = value => JSON.parse(JSON.stringify(context.getDnd5eBasicClassAndLevel(value)));
assert.deepEqual(result(legacy.data.basic), { className: '파이터', level: '7' });
assert.deepEqual(result({ class: '클레릭 3레벨' }), { className: '클레릭', level: '3' });
assert.deepEqual(result({ class: '위저드 12' }), { className: '위저드', level: '12' });
assert.deepEqual(result(ambiguous.data.basic), { className: '파이터 Lv.5 / 로그 Lv.2', level: '' });
const rendered = context.renderDnd5eBasicSection(basic, legacy.data.basic, legacy.data, character.id, legacy.id);
assert.match(rendered, /aria-label="레벨" value="7"/);
assert.match(rendered, /aria-label="숙련 보너스" value="3"/);
assert.match(rendered, /aria-label="상시 감지 텍스트" value="감지\(청각\)"/);
assert.match(rendered, /aria-label="상시 감지 수치" value="13"/);
assert.equal(legacy.data.basic.class, '파이터 Lv.7');
assert.equal(legacy.data.basic.level, undefined);

context.saveSheetField(character.id, legacy.id, 'basic', 'class', '팔라딘');
assert.deepEqual(result(legacy.data.basic), { className: '팔라딘', level: '7' });
context.saveSheetField(character.id, legacy.id, 'basic', 'level', '');
assert.deepEqual(result(legacy.data.basic), { className: '팔라딘', level: '' });
context.saveSheetField(character.id, ambiguous.id, 'basic', 'level', '7');
assert.deepEqual(result(ambiguous.data.basic), { className: '파이터 Lv.5 / 로그 Lv.2', level: '7' });
context.saveSheetField(character.id, legacy.id, 'basic', 'charName', '변경');
assert.equal(character.name, '변경');

console.log('D&D 5e basic sheet checks: OK');
