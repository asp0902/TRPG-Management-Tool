const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');
const helper = html.slice(html.indexOf('function moveActiveCharacterSheet('), html.indexOf('function removeCharacterSheet('));
const context = {};

vm.runInNewContext(`
  const state = { characters: [
    { id: 'a', activeSheetId: 'a2', sheets: [{ id: 'a1', data: { value: 1 } }, { id: 'a2', data: { value: 2 } }, { id: 'a3', data: { value: 3 } }] },
    { id: 'b', activeSheetId: 'b1', sheets: [{ id: 'b1' }, { id: 'b2' }] },
  ] };
  let saves = 0;
  let savedOrder = [];
  let renders = 0;
  function persist() { saves += 1; savedOrder = state.characters[0].sheets.map(sheet => sheet.id); }
  function renderCharacterSheet() { renders += 1; }
  ${helper}
  const movedLeft = moveActiveCharacterSheet('a', -1);
  const blockedAtStart = moveActiveCharacterSheet('a', -1);
  const movedRight = moveActiveCharacterSheet('a', 1);
  const dragged = reorderCharacterSheet('a', 'a3', 'a1', false);
  result = { state, movedLeft, blockedAtStart, movedRight, dragged, saves, savedOrder, renders };
`, context);

const result = JSON.parse(JSON.stringify(context.result));
assert.equal(result.movedLeft, true);
assert.equal(result.blockedAtStart, false);
assert.equal(result.movedRight, true);
assert.equal(result.dragged, true);
assert.deepEqual(result.state.characters[0].sheets.map(sheet => sheet.id), ['a3', 'a1', 'a2']);
assert.deepEqual(result.state.characters[0].sheets.map(sheet => sheet.data.value), [3, 1, 2]);
assert.equal(result.state.characters[0].activeSheetId, 'a2');
assert.deepEqual(result.state.characters[1].sheets.map(sheet => sheet.id), ['b1', 'b2']);
assert.deepEqual(result.savedOrder, ['a3', 'a1', 'a2']);
assert.equal(result.saves, 3);
assert.equal(result.renders, 3);
assert.match(html, /aria-label="활성 시트 왼쪽 이동"/);
assert.match(html, /aria-label="활성 시트 오른쪽 이동"/);
assert.match(html, /class="sh-tab-drag-handle" draggable="true"/);
assert.match(html, /characters: state\.characters/);
assert.match(html, /characters: Array\.isArray\(data\.characters\) \? data\.characters\.map\(normalizeCharacterEntry\)/);
assert.doesNotMatch(html, /sheetOrder/);

console.log('character sheet order checks: OK');
