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
vm.runInContext(['createBlockData', 'getHandoutSideValue', 'getHandoutPreviewHtml', 'renderPreviewBackgroundToggle', 'repairHandoutInlineParagraphs', 'getHandoutBlockHtml'].map(extract).join('\n'), context);
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
assert.match(rendered, /^<div class="handout-header"><input class="handout-title"[^>]*>\s*<button[^>]*class="btn handout-toggle"[^>]*aria-expanded="false"/);
const handoutBodyPadding = html.match(/#blocks-container \.block-handout > \.block-body \{ padding-top: (\d+)px; padding-bottom: (\d+)px; \}/);
const collapsedHandoutPadding = html.match(/#blocks-container \.block-handout:has\(\.handout-toggle\[aria-expanded="false"\]\) > \.block-body \{ padding-bottom: (\d+)px; \}/);
assert.deepEqual(handoutBodyPadding && handoutBodyPadding.slice(1), ['6', '7']);
assert.equal(Number(handoutBodyPadding[2]) - Number(collapsedHandoutPadding[1]), 4);
assert.doesNotMatch(html, /handout-title[^{}]*\{[^{}]*margin-bottom:\s*-1px/);
assert.doesNotMatch(html, /#blocks-container \.toggle-block-head:not\(\.open\) \.toggle-title-inp/);
assert.equal((rendered.match(/data-handout-side=/g) || []).length, 2);
assert.ok(rendered.includes('data-field="secretContent"'));
assert.ok(rendered.includes('data-field="content"'));
assert.equal((rendered.match(/class="handout-macro"/g) || []).length, 2);
assert.equal((rendered.match(/class="handout-preview css-macro-preview-body"/g) || []).length, 2);
assert.ok(rendered.includes('aria-expanded="false"'));
assert.ok(rendered.includes('id="handout-columns-test" hidden'));
assert.equal((rendered.match(/class="handout-info-toggle"/g) || []).length, 2);
assert.ok(extract('bindHandoutBlock').includes("el.querySelector('.handout-columns').hidden = !expanded"));
assert.ok(extract('bindHandoutBlock').includes("el.querySelector('.handout-title').onclick"));
assert.ok(rendered.includes('id="handout-public-test" hidden'));
assert.ok(rendered.includes('id="handout-secret-test" hidden'));
assert.equal((rendered.match(/<details class="handout-fold/g) || []).length, 4);
assert.ok(!rendered.includes('<details class="handout-fold" open>'));
assert.ok(rendered.indexOf('<summary>PREVIEW') < rendered.indexOf('<summary>CSS MACRO'));
assert.equal((rendered.match(/aria-pressed="false"/g) || []).length, 2);
block.publicPreviewDark = true;
const darkRendered = context.getHandoutBlockHtml(block, 'blocks-container');
assert.equal((darkRendered.match(/aria-pressed="true"/g) || []).length, 1);
assert.ok(darkRendered.includes('handout-fold css-macro-preview-wrap dark'));
assert.equal((rendered.match(/class="btn handout-macro-copy"/g) || []).length, 2);
assert.ok(!rendered.includes('data-handout-image-edit'));
assert.ok(!rendered.includes('data-handout-image-delete'));
assert.ok(extract('bindHandoutBlock').includes('btcpAutoResize(macro)'));
console.log('handout block checks: OK');
let replaced = false, removed = false;
const empty = { textContent: '', querySelector: selector => selector === 'span' ? {} : null,
  querySelectorAll: () => [{ tagName: 'SPAN' }], remove: () => { removed = true; } };
const blank = { textContent: '', querySelector: () => ({}), remove: () => { throw Error('Intentional blank line removed'); } };
const span = { querySelector: () => ({}), attributes: [{ name: 'style', value: 'font-style:italic' }], firstChild: null,
  replaceWith: block => { assert.equal(block.style, 'font-style:italic'); replaced = true; } };
const root = { innerHTML: '', querySelectorAll: selector => selector === 'span' ? [span] : [empty, blank] };
let creates = 0;
context.document = { createElement: () => creates++ === 0 ? root : { setAttribute(name, value) { this[name] = value; } } };
context.repairHandoutInlineParagraphs('<span style="font-style:italic"><div>text</div></span>');
assert.ok(replaced && removed);
