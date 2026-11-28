const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');
const cut = (start, end) => html.slice(html.indexOf(start), html.indexOf(end));
const equipment = [{ name: '모험가 배낭', qty: '1', desc: '여행 장비' }];
const sheet = { id: 'sheet', templateKey: 'dnd5e', data: { equipment } };
const context = vm.createContext({
  state: { characters: [{ id: 'character', sheets: [sheet] }] },
  SHEET_TEMPLATES: {}, persist: () => {},
  esc: value => String(value).replaceAll('"', '&quot;'),
});
vm.runInContext(cut('function renderDnd5eCurrency', 'function autoResizeDnd5ePersonalityTextarea')
  + cut('function saveSheetField', 'function saveArianrhod2eVitalField'), context);

const markup = context.renderDnd5eCurrency(undefined, 'character', 'sheet');
assert.deepEqual([...markup.matchAll(/<span class="sh-field-label">([^<]+)</g)].map(match => match[1]), [
  '동화(Copper)', '은화(Silver)', '호박금화(Electrum)', '금화(Gold)', '백금화(Platinum)',
]);
assert.equal([...markup.matchAll(/type="number" min="0" step="1"/g)].length, 5);
assert.match(markup, />재화\(Piece\)</);
assert.equal(sheet.data.currency, undefined);

context.saveSheetField('character', 'sheet', 'currency', 'gold', '17');
context.saveSheetField('character', 'sheet', 'currency', 'electrum', '0');
assert.equal(sheet.data.equipment, equipment);
assert.equal(sheet.data.equipment[0].name, '모험가 배낭');
const restored = context.renderDnd5eCurrency(sheet.data.currency, 'character', 'sheet');
assert.match(restored, /금화\(Gold\)<\/span><input[^>]+value="17"/);
assert.match(restored, /호박금화\(Electrum\)<\/span><input[^>]+value="0"/);

console.log('D&D 5e currency checks: OK');
