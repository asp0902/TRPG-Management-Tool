const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');
const context = vm.createContext({});
for (const name of ['decodeCssMacroPreviewValue', 'normalizeCssMacroPreviewStyleText', 'tryParseCssMacroToken', 'normalizeCssMacroStyle', 'cssMacroPreviewSpanStyle']) {
  vm.runInContext(html.match(new RegExp(`function ${name}\\([^]*?\\n\\}`))[0], context);
}
vm.runInContext(html.match(new RegExp('const CCFOLIA_PREVIEW = [{][^]*?'+String.fromCharCode(10)+'[}];'))[0], context);
const url = 'https://i.imgur.com/95RxNez.gif';
const source = `[Intro]\\(<#" style="background-image: url('[${url}](${url})'); display: block; margin: -10px -15px -10px -15px; height: 0px; padding: 59.5% 0 0;>) @intro`;
const token = context.tryParseCssMacroToken(source, 0);
assert.ok(token);
assert.ok(token.style.includes(`url('${url}')`));
assert.ok(token.style.includes('padding: 59.5% 0 0;'));
assert.ok(!token.style.includes('>'));
assert.equal(source.slice(token.end), ' @intro');
assert.equal(context.tryParseCssMacroToken('[old](#" style="color: red;)', 0).style, 'color: red;');
context.esc = value => value;
vm.runInContext(html.match(/function replaceCssMacroPreviewTokens\([^]*?\n\}/)[0], context);
const preview = context.replaceCssMacroPreviewTokens(source).html;
assert.ok(!preview.includes('@intro'));
assert.ok(preview.includes(url));
assert.ok(context.replaceCssMacroPreviewTokens('[a@b](#" style="color: red;) @hidden\nNext').html.endsWith('\nNext'));
assert.ok(context.replaceCssMacroPreviewTokens('[a@b](#" style="color: red;) @hidden').html.includes('a@b'));
