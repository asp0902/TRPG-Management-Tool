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
assert.deepEqual([...markup.matchAll(/aria-label="([^"]+) 환산 비율"/g)].map(match => match[1]), [
  '동화(Copper)', '은화(Silver)', '호박금화(Electrum)', '금화(Gold)', '백금화(Platinum)',
]);
assert.equal([...markup.matchAll(/type="number" min="0" step="1"/g)].length, 5);
assert.match(markup, />재화\(Piece\)</);
assert.equal(sheet.data.currency, undefined);
assert.equal([...markup.matchAll(/popovertarget="dnd-currency-rates-sheet"/g)].length, 7);
const exchangeRates = [...markup.matchAll(/<tr><th scope="row">1 ([A-Z]{2})<\/th>((?:<td>[^<]+<\/td>)+)<\/tr>/g)]
  .map(([, unit, row]) => [unit, ...[...row.matchAll(/<td>([^<]+)<\/td>/g)].map(match => match[1])]);
assert.deepEqual(exchangeRates, [
  ['CP', '1', '1/10', '1/50', '1/100', '1/1,000'],
  ['SP', '10', '1', '1/5', '1/10', '1/100'],
  ['EP', '50', '5', '1', '1/2', '1/20'],
  ['GP', '100', '10', '2', '1', '1/10'],
  ['PP', '1,000', '100', '20', '10', '1'],
]);

context.saveSheetField('character', 'sheet', 'currency', 'gold', '17');
context.saveSheetField('character', 'sheet', 'currency', 'electrum', '0');
assert.equal(sheet.data.equipment, equipment);
assert.equal(sheet.data.equipment[0].name, '모험가 배낭');
const restored = context.renderDnd5eCurrency(sheet.data.currency, 'character', 'sheet');
assert.match(restored, /aria-label="금화\(Gold\)" value="17"/);
assert.match(restored, /aria-label="호박금화\(Electrum\)" value="0"/);

console.log('D&D 5e currency checks: OK');
