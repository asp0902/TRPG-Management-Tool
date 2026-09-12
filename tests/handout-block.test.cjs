const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');
const extract = name => html.match(new RegExp(`function ${name}\\([^]*?\\n\\}`))[0];
const context = {
  mkId: () => 'test', DEFAULT_SPEECH_COLOR: '#000000',
  isRenderableImageSrc: src => src.startsWith('https://'),
  esc: text => String(text).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;'),
  renderCssMacroPreviewHtml: text => `preview:${text}`,
};
vm.createContext(context);
vm.runInContext(['createBlockData', 'getHandoutPreviewHtml', 'getHandoutBlockHtml'].map(extract).join('\n'), context);
const block = context.createBlockData('handout');
assert.equal(block.secretContent, '');
assert.equal(block.publicImage, '');
assert.equal(block.secretMacro, '');
block.publicMacro = 'PUBLIC';
block.secretMacro = 'SECRET';
block.publicImage = 'https://example.com/public.png';
block.secretImage = 'javascript:alert(1)';
const publicPreview = context.getHandoutPreviewHtml(block, 'public');
const secretPreview = context.getHandoutPreviewHtml(block, 'secret');
assert.ok(publicPreview.includes('public.png') && publicPreview.includes('PUBLIC'));
assert.ok(!publicPreview.includes('SECRET'));
assert.equal(secretPreview, 'preview:SECRET');
const rendered = context.getHandoutBlockHtml(block, 'blocks-container');
assert.equal((rendered.match(/data-handout-side=/g) || []).length, 2);
assert.ok(rendered.includes('data-field="secretContent"'));
assert.ok(rendered.includes('data-field="content"'));
console.log('handout block checks: OK');
