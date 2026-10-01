const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');
const extract = name => html.match(new RegExp(`function ${name}\\([^]*?\\n\\}`))[0];
const context = { esc: text => String(text).replaceAll('"', '&quot;') };
vm.createContext(context);
vm.runInContext(html.match(/const EDITOR_DIVIDER_STYLES = \[[\s\S]*?\n\];/)[0] + '\n' + extract('getEditorDividerHtml'), context);
const ids = ['short-thin', 'short-thick', 'stars', 'short-wave', 'hatch', 'dots', 'wave', 'thin', 'thick', 'dash'];
for (const id of ids) {
  const rendered = context.getEditorDividerHtml(id);
  assert.ok(rendered.includes(`data-divider-style="${id}"`));
  assert.ok(rendered.includes('role="separator"'));
}
assert.ok(context.getEditorDividerHtml('unknown').includes('data-divider-style="thin"'));
for (const style of ['short-wave', 'wave']) {
  const wave = context.getEditorDividerHtml(style);
  assert.ok(wave.includes('height:12px'));
  assert.ok(wave.includes('mask:url(&quot;'));
  assert.ok(!wave.includes('underline wavy'));
}
assert.equal((context.getEditorDividerHtml('stars').match(/<span>✻<\/span>/g) || []).length, 3);
assert.ok(html.indexOf('id="tb-quote-btn"') < html.indexOf('id="tb-divider-btn"'));
const menuSource = extract('tbOpenDividerMenu');
assert.ok(menuSource.includes('previewOnly: true'));
assert.ok(menuSource.includes("className: 'tb-divider-menu'"));
assert.ok(!menuSource.includes('<p><br></p>'));
assert.ok(!menuSource.includes("'\\n' + getEditorDividerHtml"));
context.sanitizeImportedEditableHtml = value => value;
context.stripTransientEditableUi = value => value;
vm.runInContext(extract('normalizeEditableHtml'), context);
for (const id of ids) {
  const divider = context.getEditorDividerHtml(id);
  assert.equal(context.normalizeEditableHtml(divider), divider, `${id} must survive saving without text`);
  assert.equal(context.normalizeEditableHtml(context.normalizeEditableHtml(divider)), divider);
}
assert.equal(context.normalizeEditableHtml('<div><br></div>'), '');
assert.ok(extract('sanitizeImportedEditableHtml').includes("node.matches('[data-divider-style][role=\"separator\"]')"));
