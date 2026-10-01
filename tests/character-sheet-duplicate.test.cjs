const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');
const helper = html.slice(html.indexOf('function duplicateActiveCharacterSheet('), html.indexOf('function removeCharacterSheet('));
const context = {};

vm.runInNewContext(`
  const state = { characters: [{ id: 'ch', activeSheetId: 'sheet-1', sheets: [
    { id: 'sheet-1', templateKey: 'coc7e', templateLabel: 'CoC 7판', data: { basic: { name: '원본' }, rows: [{ value: 7 }] }, source: 'rulebook', sourceRulebookId: 'rb', lockedToRulebook: true, createdAt: 1 },
    { id: 'sheet-2', templateKey: 'generic', data: {} },
  ] }] };
  let saves = 0;
  let renders = 0;
  function mkId() { return 'sheet-copy'; }
  function persist() { saves += 1; }
  function renderCharacterSheet() { renders += 1; }
  function getCharacterSheetImage(ch, sheet) { return typeof sheet.image === 'string' ? sheet.image : (ch.image || ''); }
  ${helper}
  const clone = duplicateActiveCharacterSheet('ch');
  clone.data.basic.name = '복제본';
  clone.data.rows[0].value = 99;
  result = { clone, character: state.characters[0], saves, renders };
`, context);

const result = JSON.parse(JSON.stringify(context.result));
assert.equal(result.clone.id, 'sheet-copy');
assert.equal(result.clone.source, 'manual');
assert.equal(result.clone.sourceRulebookId, null);
assert.equal(result.clone.lockedToRulebook, false);
assert.equal(result.clone.image, '');
assert.equal(result.character.activeSheetId, 'sheet-copy');
assert.deepEqual(result.character.sheets.map(sheet => sheet.id), ['sheet-1', 'sheet-copy', 'sheet-2']);
assert.equal(result.character.sheets[0].data.basic.name, '원본');
assert.equal(result.character.sheets[0].data.rows[0].value, 7);
assert.equal(result.saves, 1);
assert.equal(result.renders, 1);
assert.match(html, /class="sh-tabs-wrap">' \+ addSelect \+ [^;]*duplicateBtn \+ [^;]*'<div class="sh-tabs">/);
assert.match(html, /aria-label="활성 시트 복제"/);

console.log('character sheet duplicate checks: OK');
