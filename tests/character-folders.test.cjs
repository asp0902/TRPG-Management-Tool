const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');
const helper = html.slice(html.indexOf('function deleteCharacterFolder('), html.indexOf('function moveScenarioToFolder('));
const context = {};

vm.runInNewContext(`
  const state = {
    characterFolders: [{ id: 'party', name: '파티' }],
    characters: [{ id: 'a', folderId: 'party' }, { id: 'b', folderId: '' }],
  };
  let saves = 0;
  function getFolderById(id) { return state.characterFolders.find(item => item.id === id) || null; }
  function confirm() { return true; }
  function persist() { saves += 1; }
  function renderList() {}
  function renderCharacterPage() {}
  function tbShowCtxMenu() {}
  ${helper}
  moveCharacterToFolder('b', 'party');
  deleteCharacterFolder('party');
  result = { folders: state.characterFolders.length, characters: state.characters.length, folderIds: state.characters.map(item => item.folderId), saves };
`, context);

assert.deepEqual({ ...context.result, folderIds: Array.from(context.result.folderIds) }, {
  folders: 0,
  characters: 2,
  folderIds: ['', ''],
  saves: 2,
});
assert.match(html, /folderId: typeof ch\.folderId === 'string' \? ch\.folderId : ''/);
assert.match(html, /characterFolders: state\.characterFolders/);
assert.match(html, /characterFolders: Array\.isArray\(data\.characterFolders\)/);
assert.match(html, /id="ch-folder-select"/);
assert.match(html, /function createCharacterFolderGroup\(/);

console.log('character folder checks: OK');
// #222: 카드 이미지 = 활성 시트 이미지 → 이미지 있는 첫 시트 → ch.image → 🎭
{
  const fs2 = require('node:fs'), path2 = require('node:path'), vm2 = require('node:vm');
  const src = fs2.readFileSync(path2.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');
  const a = src.indexOf('function getCharacterCardImage'), b = src.indexOf('function renderCharacterCard');
  const c = {}; vm2.runInNewContext(src.slice(a, b) + '\nthis.f = getCharacterCardImage;', c);
  const ch = { image: 'L', activeSheetId: 'b', sheets: [{ id: 'a', image: 'A' }, { id: 'b', image: ' B ' }] };
  require('node:assert/strict').equal(c.f(ch), 'B');
  ch.sheets[1].image = ''; require('node:assert/strict').equal(c.f(ch), 'A');
  ch.sheets[0].image = undefined; require('node:assert/strict').equal(c.f(ch), 'L');
  ch.image = ''; require('node:assert/strict').equal(c.f(ch), '');
  require('node:assert/strict').match(src, /loading="lazy" decoding="async" onerror="this\.replaceWith\(document\.createTextNode\('🎭'\)\)"/);
}
