const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');
for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) new vm.Script(match[1]);
const extract = name => html.match(new RegExp(`function ${name}\\([^]*?\\n\\}`))[0];

const data = {
  basic: { playerName: 'PL', charName: 'PC', age: '20', gender: '여', occupation: '기자', lpCurrent: '0', lpMax: '8', snCurrent: '4', snMax: '6', merit: '3' },
  specialties: { curiosity: '2.정서', fear: '꿈', modifier: '-2', rootLaw: true, vio2: true, occ10: true },
  abilities: [{ name: '기습', type: '공격', specialty: '꿈', specialtyCategory: 'occ', effect: '효과', future: '보존' }],
  relations: [{ person: '조력자', shelter: true, emotion: '우정' }],
  profile: { catchphrase: '한마디', setting: '설정' },
  flashback: { flashback: '회상' },
  missionSecret: { mission: '사명', secret: '비밀' },
  notes: { notes: '메모' },
  respec: { newWorld: true, session: true, empathy: '2', other: '1' },
  items: { painkiller: '2', weapon: '-1' },
  madnessState: { current: '2', delirium: true },
  madness: [{ name: '망상', trigger: '조건', revealed: true, effect: '효과', future: 1 }],
  futureSection: { keep: true },
};
const context = {
  state: { characters: [{ id: 'character', name: 'fallback', sheets: [{ id: 'sheet', templateKey: 'insane', version: 2, data }] }] },
  SHEET_TEMPLATES: { insane: { version: 2, sections: [{ id: 'items', fields: [
    { id: 'painkiller', label: '진통제' }, { id: 'weapon', label: '무기' },
  ] }] } },
  isSheetCheckboxChecked: value => value === true || value === 1 || value === '1',
  parseCocSheetNumber: value => Number(value) || 0,
};
vm.createContext(context);
vm.runInContext(html.match(/const INSANE_SPECIALTY_COLUMNS = \[[\s\S]*?\n\];/)[0], context);
vm.runInContext([
  'countInsaneTrack', 'getInsaneTrackMax', '_insaneTransferObject', '_insaneTransferText',
  '_insaneTransferNumber', '_cloneInsaneTransferValue', 'findInsaneTransferSkillId',
  'getInsaneSpecialtyFieldId', 'getInsaneOpenGaps', 'generateInsaneSheetTransferJSON',
].map(extract).join('\n'), context);

const result = context.generateInsaneSheetTransferJSON('character', 'sheet');
assert.match(html, /id="ch-sheet-export-btn"[^>]*onclick="openCharacterSheetExportMenu\(event,this\)"[^>]*>내보내기<\/button>/);
assert.doesNotMatch(html, /id="ch-(?:coco|insane-transfer)-btn"/);
assert.equal(result.kind, 'capybara.insane-sheet');
assert.equal(result.version, 1);
assert.equal(result.data.life, 0);
assert.equal(result.data.lifeMax, 8);
assert.equal(result.data.curiosity, 1);
assert.deepEqual(Array.from(result.data.removedGaps), [true, true, false, false, false]);
assert.deepEqual(Array.from(result.data.skills), ['0:0', '5:8']);
assert.equal(result.data.fear, '5:8');
assert.equal(result.data.modifier, -2);
assert.equal(result.data.rootLaw, true);
assert.equal(result.data.abilities[0].target, '꿈');
assert.equal(result.data.abilities[0].extensions.trpgManagement.specialtyCategory, 'occ');
assert.equal(result.data.abilities[0].extensions.trpgManagement.source.future, '보존');
assert.equal(result.data.people[0].shelter, true);
assert.deepEqual(JSON.parse(JSON.stringify(result.data.items)), { 진통제: 2, 무기: 0 });
assert.equal(result.data.madness[0].extensions.trpgManagement.source.future, 1);
assert.equal(result.data.extensions.trpgManagement.sourceData.futureSection.keep, true);
assert.equal(vm.runInContext("findInsaneTransferSkillId('vio2')", context), '0:0');

data.specialties.fear = '사용자 정의 공포심';
const unmapped = context.generateInsaneSheetTransferJSON('character', 'sheet');
assert.equal(unmapped.data.fear, '');
assert.equal(unmapped.data.extensions.trpgManagement.fearText, '사용자 정의 공포심');

let menuItems;
const called = [];
context._openCharacterSheetId = 'character';
context.getActiveCharacterSheet = ch => ch.sheets[0];
context.tbShowCtxMenu = (x, y, items) => { menuItems = items; };
context.exportCharacterSheetHtml = () => called.push('HTML');
context.copyCharacterSheetAPI = () => called.push('API');
context.copyInsaneSheetTransfer = () => called.push('시트 API');
vm.runInContext(extract('openCharacterSheetExportMenu'), context);
context.openCharacterSheetExportMenu({ preventDefault() {}, stopPropagation() {} }, { getBoundingClientRect: () => ({ right: 200, bottom: 100 }) });
assert.deepEqual(Array.from(menuItems, item => item.label), ['HTML', 'API', '시트 API']);
assert.deepEqual(Array.from(menuItems, item => !!item.disabled), [false, false, false]);
menuItems.forEach(item => item.action());
assert.deepEqual(called, ['HTML', 'API', '시트 API']);
context.state.characters[0].sheets[0].templateKey = 'generic';
context.openCharacterSheetExportMenu({ preventDefault() {}, stopPropagation() {} }, { getBoundingClientRect: () => ({ right: 200, bottom: 100 }) });
assert.deepEqual(Array.from(menuItems, item => !!item.disabled), [false, true, true]);

console.log('inSANe sheet transfer checks: OK');
