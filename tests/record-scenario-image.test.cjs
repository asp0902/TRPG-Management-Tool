const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');

assert.match(html, /id="rf-scenario-image-thumb"[^>]*onclick="openRecordImageUrlPopup\(this\)"/);
assert.match(html, /id="rf-scenario-image"/);
assert.match(html, /onpaste="onRecordImagePaste\(event\)"/);
assert.match(html, /targetType = host\.id === 'rf-gm-card' \? 'gm' : \(host\.id === 'rf-custom-scenario-fields' \? 'scenario' : 'player'\)/);
assert.match(html, /scenarioCard = String\(scenario\?\.info\?\.sessionCard \|\| record\?\.scenarioImage \|\| ''\)/);
assert.match(html, /scenarioImage: document\.getElementById\('rf-scenario-image'\)\?\.value\.trim\(\) \|\| ''/);

const source = html.slice(html.indexOf('function mkRecordEntry'), html.indexOf('function normalizeRecordEntry'));
const context = {
  mkId: () => 'record-id',
  normalizeRecordPlayersData: () => [],
  mkRecordGm: () => ({ gmName: '', gmPcName: '', gmImage: '' }),
  normalizeRecordSessionTags: () => [],
  normalizeEditableHtml: value => value,
  recordPlainTextToHtml: value => value,
  extractBlockPlainText: value => value,
  normalizeRecordDateValue: value => value,
  formatRecordSessionTags: () => '',
  normalizeRecordTimelineEvents: value => Array.isArray(value) ? value : [],
  result: null,
};
vm.runInNewContext(`${source}\nresult = mkRecordEntry({ scenarioName: '직접 시나리오', scenarioImage: 'data:image/png;base64,AA==' });`, context);
assert.equal(context.result.scenarioImage, 'data:image/png;base64,AA==');

const hidden = { value: 'https://example.com/old.png' };
const thumb = { innerHTML: '' };
const host = {
  id: 'rf-custom-scenario-fields',
  dataset: {},
  isConnected: true,
  querySelector: () => hidden,
};
const backdrop = { dataset: {}, style: {} };
const input = { value: '', focus() {} };
const popupContext = {
  document: {
    getElementById(id) {
      return {
        'rf-custom-scenario-fields': host,
        'rf-scenario-image': hidden,
        'rf-scenario-image-thumb': thumb,
        'record-image-url-popup-backdrop': backdrop,
        'record-image-url-popup-input': input,
      }[id] || null;
    },
    querySelector: () => null,
  },
  CSS: { escape: value => value },
  esc: value => String(value),
  setTimeout: fn => fn(),
  syncRecordGmCard() {},
  syncRecordPlayerRow() {},
  FileReader: class {
    readAsDataURL(file) { this.onload({ target: { result: file.result } }); }
  },
};
const popupFunctions = html.slice(html.indexOf('function syncRecordScenarioImageCard'), html.indexOf('function focusRecordSessionTagInput'))
  + html.slice(html.indexOf('function openRecordImageUrlPopup'), html.indexOf('function collectRecordPlayersData'));
vm.runInNewContext(popupFunctions, popupContext);
const button = { closest: () => host };

popupContext.openRecordImageUrlPopup(button);
assert.equal(backdrop.dataset.targetType, 'scenario');
input.value = 'https://example.com/url.png';
popupContext.saveRecordImageUrlPopup();
assert.equal(hidden.value, 'https://example.com/url.png');
assert.match(thumb.innerHTML, /url\.png/);

popupContext.openRecordImageUrlPopup(button);
const fileEvent = { target: { files: [{ type: 'image/png', result: 'data:image/png;base64,FILE' }], value: 'selected' } };
popupContext.onRecordImageFile(fileEvent);
assert.equal(fileEvent.target.value, '');
assert.equal(hidden.value, 'data:image/png;base64,FILE');

popupContext.openRecordImageUrlPopup(button);
let pastePrevented = false;
popupContext.onRecordImagePaste({
  clipboardData: {
    items: [{ type: 'image/png', getAsFile: () => ({ type: 'image/png', result: 'data:image/png;base64,PASTE' }) }],
    getData: () => '',
  },
  preventDefault: () => { pastePrevented = true; },
});
assert.equal(pastePrevented, true);
assert.equal(hidden.value, 'data:image/png;base64,PASTE');

console.log('record scenario image checks: OK');
