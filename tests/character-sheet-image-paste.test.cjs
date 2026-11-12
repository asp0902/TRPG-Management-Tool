const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');
// 캐릭터 시트 이미지 클립보드 붙여넣기(#215)
assert.match(html, /label: '클립보드에서 붙여넣기', action: function\(\) \{\s*pasteCharacterSheetImageFromClipboard\(chId, sheetId\);/);
assert.match(html, /data-sheet-portrait="1" data-ch-id="/);
assert.match(html, /async function pasteCharacterSheetImageFromClipboard\(chId, sheetId\)/);
assert.match(html, /navigator\.clipboard\.read\(\)/);
assert.match(html, /showToast\('클립보드에 이미지가 없습니다\.'\)/);
// 입력칸·편집 영역의 텍스트 붙여넣기는 가로채지 않는다
assert.match(html, /target\?\.closest\?\.\('input, textarea, select, \[contenteditable="true"\]'\)\) return;/);
console.log('character sheet image paste checks: OK');
// #221: 어떤 경로든 dataURL 이면 웹 등록, 기존 dataURL 은 시트를 열 때 백그라운드 등록(세션당 토스트 1회)
assert.ok(html.includes('if (/^data:image' + String.fromCharCode(92) + '//i.test(sheet.image)) {'));
assert.match(html, /async function autoRegisterCharacterImages\(chId\)/);
assert.match(html, /renderCharacterSheet\(id\);\s*autoRegisterCharacterImages\(id\);/);
assert.match(html, /sheetImageAutoToasted/);
console.log('sheet image auto register checks: OK');
