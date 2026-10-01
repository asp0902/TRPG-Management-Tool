const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');
const openHelper = html.slice(html.indexOf('function openCharacterSheetPopup('), html.indexOf('function moveActiveCharacterSheet('));
const syncHelper = html.slice(html.indexOf('function handleCharacterSheetSync('), html.indexOf('if (characterSheetSyncChannel)'));
const context = { URL };

vm.runInNewContext(`
  const state = { characters: [
    { id: 'a', activeSheetId: 'a1', sheets: [{ id: 'a1', data: { value: 'old' } }] },
    { id: 'b', activeSheetId: 'b1', sheets: [{ id: 'b1', data: { value: 'keep' } }] },
  ] };
  const characterSheetPopupWindows = new Map();
  const characterSheetInstanceId = 'self';
  const screen = { availWidth: 1440, availHeight: 1000 };
  const location = { origin: 'http://127.0.0.1:8765', pathname: '/tool.html' };
  let opened = null;
  let toast = '';
  let renderCount = 0;
  let persistOptions = null;
  let blocked = false;
  const window = {
    open(url, name, features) { opened = { url, name, features, closed: false, focus() {} }; return blocked ? null : opened; },
  };
  const document = { activeElement: null, hasFocus() { return false; } };
  let _openCharacterSheetId = 'a';
  function showToast(message) { toast = message; }
  function getActiveCharacterSheet(ch) { return ch.sheets.find(sheet => sheet.id === ch.activeSheetId); }
  function renderCharacterSheet() { renderCount += 1; }
  function persist(options) { persistOptions = options; }
  function isCharacterSheetPopupMode() { return false; }
  ${openHelper}
  ${syncHelper}
  const popup = openCharacterSheetPopup('a', 'a1');
  blocked = true;
  const blockedPopup = openCharacterSheetPopup('b', 'b1');
  handleCharacterSheetSync({ data: { sender: 'popup', characterId: 'a', sheetId: 'a1', sheet: { id: 'a1', data: { value: 'new' } } } });
  result = { popup, blockedPopup, toast, state, renderCount, persistOptions };
`, context);

const result = JSON.parse(JSON.stringify(context.result));
assert.match(result.popup.url, /characterPopup=a/);
assert.match(result.popup.url, /sheet=a1/);
assert.match(result.popup.features, /width=1200/);
assert.equal(result.blockedPopup, null);
assert.match(result.toast, /팝업이 차단/);
assert.equal(result.state.characters[0].sheets[0].data.value, 'new');
assert.equal(result.state.characters[1].sheets[0].data.value, 'keep');
assert.equal(result.renderCount, 1);
assert.equal(result.persistOptions.skipCharacterSheetSync, true);
assert.match(html, /aria-label="활성 시트를 새 창에서 열기"/);
assert.match(html, /character\.sheets\[index\] = sheet/);
assert.match(html, /\.character-sheet-popup \.sh-tabs-wrap/);

console.log('character sheet popup checks: OK');
