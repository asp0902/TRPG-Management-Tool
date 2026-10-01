const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');
test('record images retain bytes and reject failed downloads', async () => {
  let calls = 0;
  const context = vm.createContext({
    normalizeImageBlockSource: value => value,
    AbortSignal,
    fetch: async () => { calls++; return { ok: true, blob: async () => ({ type: 'image/gif' }) }; },
    FileReader: class { readAsDataURL() { this.result = 'data:image/gif;base64,R0lG'; this.onload(); } },
  });
  vm.runInContext(html.match(/async function retainRecordImage\([^]*?\n\}/)[0], context);
  assert.equal(await context.retainRecordImage(''), '');
  assert.equal(await context.retainRecordImage('data:image/png;base64,abc'), 'data:image/png;base64,abc');
  assert.equal(calls, 0);
  assert.equal(await context.retainRecordImage('https://example.com/image.gif'), 'data:image/gif;base64,R0lG');
  await assert.rejects(context.retainRecordImage('javascript:alert(1)'));
  context.fetch = async () => ({ ok: false });
  await assert.rejects(context.retainRecordImage('https://example.com/missing'));
  context.fetch = async () => ({ ok: true, blob: async () => ({ type: 'text/html' }) });
  await assert.rejects(context.retainRecordImage('https://example.com/page'));
});
