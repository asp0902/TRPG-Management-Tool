const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');
assert.ok(html.indexOf('id="format-toc-toggle"') > html.indexOf('onclick="openFindReplace()"'));
assert.match(html, /id="format-toc-toggle"[^>]+title="목차 패널 표시\/숨김"[^>]+aria-label="목차 패널 표시\/숨김"[^>]*><i class="fa-solid fa-book-open"><\/i>/);
assert.match(html, /id="tb-list-ul-btn"[^>]*><i class="fa-solid fa-list-ul"><\/i>/);
assert.match(html, /#format-toc-toggle i, #format-memo-toggle i \{[\s\S]*?font-size: 15px; line-height: 1;/);

const button = {
  hidden: false,
  classList: { active: false, toggle(_name, value) { this.active = value; } },
  setAttribute(name, value) { this[name] = value; },
};
const panel = { classList: { contains: () => false } };
const context = vm.createContext({
  isScriptBodyTabActive: () => true,
  document: { getElementById: id => id === 'format-toc-toggle' ? button : panel },
});
vm.runInContext(html.match(/function syncFormatTocButton\([^]*?\n\}/)[0], context);
context.syncFormatTocButton();
assert.equal(button.hidden, false);
assert.equal(button.classList.active, true);
assert.equal(button['aria-pressed'], 'true');
context.isScriptBodyTabActive = () => false;
context.syncFormatTocButton();
assert.equal(button.hidden, true);
assert.equal(button['aria-pressed'], 'false');
