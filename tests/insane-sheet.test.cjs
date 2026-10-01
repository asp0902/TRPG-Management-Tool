const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');
for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) new vm.Script(match[1]);
const extract = name => html.match(new RegExp(`function ${name}\\([^]*?\\n\\}`))[0];
const effectRow = { hidden: true, classList: { contains: () => true }, querySelector: () => ({ value: 'preserved effect' }) };
const effectButton = { closest: () => ({ nextElementSibling: effectRow }), setAttribute(name, value) { this[name] = value; } };
let resizeCount = 0;
const effectContext = { autoResizeSheetTextarea: () => resizeCount++ };
vm.runInNewContext(extract('toggleInsaneAbilityEffect'), effectContext);
effectContext.toggleInsaneAbilityEffect(effectButton);
assert.equal(effectRow.hidden, false);
assert.equal(effectButton['aria-expanded'], 'true');
assert.equal(resizeCount, 1);
assert.equal(effectButton.checked, true);
effectContext.toggleInsaneAbilityEffect(effectButton);
assert.equal(effectRow.hidden, true);
assert.equal(effectButton['aria-expanded'], 'false');
assert.equal(effectButton.checked, false);
effectButton.dataset = { detailLabel: '메모' };
effectContext.toggleInsaneAbilityEffect(effectButton);
assert.equal(effectButton['aria-label'], '메모 접기');
effectContext.toggleInsaneAbilityEffect(effectButton);
assert.equal(resizeCount, 2);
const basic = { lp1: true, lp2: true, sn1: true };
const items = { painkiller: '2', weapon: '', charm: '0', net: null };
const abilityContext = {};
vm.runInNewContext(extract('ensureInsaneDefaultAbilities'), abilityContext);
const abilityData = { abilities: [{ name: '기본 공격', effect: '기존 효과' }, { name: '사용자 항목' }] };
abilityContext.ensureInsaneDefaultAbilities(abilityData);
assert.equal(abilityData.abilities.length, 3);
assert.equal(abilityData.abilities[0].effect, '기존 효과');
abilityData.abilities.pop();
abilityContext.ensureInsaneDefaultAbilities(abilityData);
assert.equal(abilityData.abilities.length, 2);
const context = {
  isSheetCheckboxChecked: value => value === true,
  parseCocSheetNumber: value => Number(value) || 0,
  state: { characters: [{ id: 'character', sheets: [{ id: 'sheet', templateKey: 'insane', data: { basic, items } }] }] },
  SHEET_TEMPLATES: { insane: { sections: [{ id: 'items', fields: [
    { id: 'painkiller', label: '진통제' }, { id: 'weapon', label: '무기' },
    { id: 'charm', label: '부적' }, { id: 'net', label: '그물망 발사기' },
  ] }] } },
  INSANE_SPECIALTY_COLUMNS: [], calcInsaneSpecialtyTargets: () => ({}),
  normalizeCharacterTokenSize: () => 6, normalizeCharacterColor: () => '#888888',
};
vm.createContext(context);
vm.runInContext(extract('getInsaneOpenGaps'), context);
assert.deepEqual(Array.from(context.getInsaneOpenGaps('2.정서')), [0, 1]);
assert.deepEqual(Array.from(context.getInsaneOpenGaps('1.폭력')), [0]);
assert.deepEqual(Array.from(context.getInsaneOpenGaps('6.괴이')), [4]);
assert.equal(context.getInsaneOpenGaps('').size, 0);
assert.match(extract('renderInsaneSpecialtiesSection'), /\[0, 1, 2, 3, 4\]\.map/);
vm.runInContext(['countInsaneTrack', 'getInsaneTrackMax', 'generateInsaneCocofoliaJSON'].map(extract).join('\n'), context);
assert.equal(context.countInsaneTrack(basic, 'lp'), 2);
assert.equal(context.getInsaneTrackMax(basic, 'sn'), 6);
Object.assign(basic, { lpCurrent: '5', lpMax: '8', snCurrent: '0', snMax: '5' });
const result = context.generateInsaneCocofoliaJSON('character', 'sheet');
assert.equal(result.data.status[0].value, 5);
assert.equal(result.data.status[0].max, 8);
assert.equal(result.data.status[1].value, 0);
assert.equal(result.data.status[1].max, 5);
assert.deepEqual(JSON.parse(JSON.stringify(result.data.status.slice(3))), [
  { label: '진통제', value: 2, max: 2 },
  { label: '부적', value: 0, max: 0 },
]);
assert.equal('params' in result.data, false);
vm.runInContext(html.match(/const INSANE_SPECIALTY_COLUMNS = \[[\s\S]*?\n\];/)[0] + '\n' + extract('renderInsaneAbilitySpecialty'), context);
context.esc = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const specialtyHtml = context.renderInsaneAbilitySpecialty({ specialty: '꿈' }, 'character', 'sheet', 0);
assert.match(specialtyHtml, /value="occ" selected/);
assert.match(specialtyHtml, /value="꿈" selected/);
assert.doesNotMatch(specialtyHtml, /value="소각"/);
assert.match(context.renderInsaneAbilitySpecialty({ specialty: '<기존 값>' }, 'character', 'sheet', 0), /&lt;기존 값&gt;/);
assert.match(context.renderInsaneAbilitySpecialty({}, 'character', 'sheet', 0), /aria-label="지정특기" disabled/);
assert.match(extract('renderInsaneSpecialtiesSection'), /refreshInsaneFear\(this\)/);
assert.match(html, /sh-sheet-insane > \[data-section-id="madnessState"\]/);
assert.match(html, /sh-sheet-insane > \[data-section-id="madness"\]/);
const listeners = {};
let down;
const body = { scrollTop: 20 }, modal = { scrollLeft: 10 };
const page = { querySelector: selector => selector === '.ch-sheet-body' ? body : modal };
vm.runInNewContext(html.match(/document\.addEventListener\('pointerdown', function\(event\) \{[\s\S]*?\n\}\);/)[0], {
  document: { addEventListener: (_, handler) => { down = handler; } },
  window: {
    addEventListener: (name, handler) => { listeners[name] = handler; },
    removeEventListener: name => { delete listeners[name]; },
  },
});
const event = {
  button: 0, pointerType: 'mouse', clientX: 100, clientY: 100,
  target: { closest: selector => selector === '#ch-sheet-backdrop.open' ? page : null },
  preventDefault() {},
};
down(event);
listeners.pointermove({ clientX: 70, clientY: 50 });
assert.equal(modal.scrollLeft, 40);
assert.equal(body.scrollTop, 70);
listeners.pointerup();
assert.deepEqual(listeners, {});
down({ ...event, target: { closest: () => page } });
assert.deepEqual(listeners, {});
down({ ...event, pointerType: 'touch' });
assert.deepEqual(listeners, {});
console.log('inSANe sheet checks: OK');
