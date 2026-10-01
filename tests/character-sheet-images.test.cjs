const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');
const helper = html.slice(html.indexOf('function getCharacterSheetImage('), html.indexOf('function addCharacterSheet('));
const context = {};

vm.runInNewContext(`
  const state = { characters: [{ id: 'a', image: 'representative.png', sheets: [
    { id: 'legacy' }, { id: 'own', image: 'own.png' }, { id: 'removed', image: '' },
  ] }] };
  let saves = 0;
  let renders = 0;
  function persist() { saves += 1; }
  function renderCharacterSheet() { renders += 1; }
  function esc(value) { return String(value || ''); }
  function tbShowCtxMenu() {}
  function showToast() {}
  function confirm() { return true; }
  function prompt() { return null; }
  class FileReader {}
  ${helper}
  const ch = state.characters[0];
  const fallback = getCharacterSheetImage(ch, ch.sheets[0]);
  const own = getCharacterSheetImage(ch, ch.sheets[1]);
  const removed = getCharacterSheetImage(ch, ch.sheets[2]);
  setCharacterSheetImage('a', 'legacy', 'new.png');
  result = { fallback, own, removed, sheets: ch.sheets, saves, renders };
`, context);

const result = JSON.parse(JSON.stringify(context.result));
assert.equal(result.fallback, 'representative.png');
assert.equal(result.own, 'own.png');
assert.equal(result.removed, '');
assert.equal(result.sheets[0].image, 'new.png');
assert.equal(result.sheets[1].image, 'own.png');
assert.equal(result.sheets[2].image, '');
assert.equal(result.saves, 1);
assert.equal(result.renders, 1);
assert.match(html, /image: typeof s\.image === 'string' \? s\.image : undefined/);
assert.match(html, /clone\.image = getCharacterSheetImage\(ch, ch\.sheets\[index\]\)/);
assert.match(html, /aria-label="시트 이미지 관리"/);
assert.match(html, /characters: state\.characters/);
assert.match(html, /character\.sheets\[index\] = sheet/);

console.log('character sheet image checks: OK');
