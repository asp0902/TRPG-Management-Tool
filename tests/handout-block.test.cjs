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
vm.runInContext(['createBlockData', 'getHandoutSideValue', 'getHandoutPreviewHtml', 'getHandoutBlockHtml'].map(extract).join('\n'), context);
const block = context.createBlockData('handout');
assert.equal(block.secretContent, '');
assert.equal(block.handoutImage, '');
assert.equal(block.handoutMacro, '');
block.handoutMacro = 'SHARED';
block.handoutImage = 'https://example.com/shared.png';
assert.ok(context.getHandoutPreviewHtml(block, 'public').includes('shared.png'));
block.handoutImage = 'javascript:alert(1)';
assert.equal(context.getHandoutPreviewHtml(block, 'public'), 'preview:SHARED');
const legacy = { publicMacro: 'PUBLIC', secretMacro: 'SECRET', secretImage: 'https://example.com/old.png' };
assert.equal(context.getHandoutSideValue(legacy, 'public', 'Macro'), 'PUBLIC');
assert.equal(context.getHandoutSideValue(legacy, 'secret', 'Macro'), 'SECRET');
assert.equal(context.getHandoutSideValue(legacy, 'public', 'Image'), '', 'Secret image must not leak into public preview');
assert.equal(context.getHandoutSideValue(legacy, 'secret', 'Image'), legacy.secretImage);
block.publicMacro = '';
block.secretMacro = 'SECRET';
assert.equal(context.getHandoutPreviewHtml(block, 'public'), 'preview:', 'Clearing public input must not restore shared text');
assert.equal(context.getHandoutPreviewHtml(block, 'secret'), 'preview:SECRET');
const rendered = context.getHandoutBlockHtml(block, 'blocks-container');
assert.equal((rendered.match(/data-handout-side=/g) || []).length, 2);
assert.ok(rendered.includes('data-field="secretContent"'));
assert.ok(rendered.includes('data-field="content"'));
assert.equal((rendered.match(/class="handout-macro"/g) || []).length, 2);
assert.equal((rendered.match(/class="handout-preview css-macro-preview-body"/g) || []).length, 2);
assert.ok(rendered.includes('aria-expanded="false"'));
assert.ok(rendered.includes('id="handout-public-test" hidden'));
assert.ok(rendered.includes('id="handout-secret-test" hidden'));
assert.equal((rendered.match(/<details class="handout-fold">/g) || []).length, 4);
assert.ok(!rendered.includes('<details class="handout-fold" open>'));
assert.ok(rendered.indexOf('<summary>PREVIEW</summary>') < rendered.indexOf('<summary>CSS MACRO'));
assert.equal((rendered.match(/class="btn handout-macro-copy"/g) || []).length, 2);
assert.ok(!rendered.includes('data-handout-image-edit'));
assert.ok(!rendered.includes('data-handout-image-delete'));
assert.ok(extract('bindHandoutBlock').includes('btcpAutoResize(macro)'));
console.log('handout block checks: OK');
