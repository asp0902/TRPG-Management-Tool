const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');
const BS = String.fromCharCode(92);
const extract = name => html.match(new RegExp('function ' + name + BS + '(' + '[^]*?' + BS + 'n' + BS + '}'))[0];
const basic = { charName: 'PC', lpCurrent: '5', lpMax: '8', snCurrent: '3', snMax: '6' };
const items = { painkiller: '2', weapon: '1', other: '9' };
const context = {
  isSheetCheckboxChecked: v => v === true,
  parseCocSheetNumber: v => Number(v) || 0,
  state: { characters: [{ id: 'c', name: 'PC', sheets: [{ id: 's', templateKey: 'insane', data: { basic, items } }] }] },
  SHEET_TEMPLATES: { insane: { sections: [{ id: 'items', fields: [{ id: 'painkiller', label: '진통제' }, { id: 'weapon', label: '무기' }, { id: 'other', label: '보상 및 기타' }] }] } },
  INSANE_SPECIALTY_COLUMNS: [], calcInsaneSpecialtyTargets: () => ({}),
  normalizeCharacterTokenSize: () => 6, normalizeCharacterColor: () => '#888888',
};
vm.createContext(context);
vm.runInContext(['countInsaneTrack', 'getInsaneTrackMax', 'isInsaneSanityMaxManual', 'getInsaneSanityMax', 'getCharacterSheetImage', 'getSheetApiIconUrl', 'generateInsaneCocofoliaJSON'].map(extract).join('\n'), context);
const result = context.generateInsaneCocofoliaJSON('c', 's');
const labels = result.data.status.map(s => s.label);
assert.ok(!labels.includes('보상 및 기타'), '기본형 status 에 「보상 및 기타」 없음');
assert.deepEqual(JSON.parse(JSON.stringify(result.data.status.slice(-2))), [{ label: '진통제', value: 2, max: 2 }, { label: '무기', value: 1, max: 1 }], '다른 아이템 순서·값 유지');
assert.equal(result.data.status[0].value, 5, '생명력 불변');
assert.ok(result.data.commands.startsWith('@장면 열기'), 'commands 불변');
assert.equal(context.state.characters[0].sheets[0].data.items.other, '9', '저장 데이터는 그대로');
console.log('ok 인세인 기본형 코코포리아: 「보상 및 기타」 status 제외');
