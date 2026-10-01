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
