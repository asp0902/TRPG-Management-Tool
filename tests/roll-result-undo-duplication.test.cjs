const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');

assert.match(html, /if \(opts\.expandTextLines !== false\) block\.children = expandGenericTextChildLines\(block\.children\)/);
assert.match(html, /if \(block\.type === 'roll'\) normalizeRollBlock\(block, opts\)/);
assert.match(html, /function normalizeRollResult\(result, opts = \{\}\)[\s\S]*?if \(opts\.expandTextLines !== false\) next\.blocks = expandGenericTextChildLines\(next\.blocks\);[\s\S]*?normalizeBlockTree\(next\.blocks, opts\)/);
assert.match(html, /function normalizeRollBlock\(block, opts = \{\}\)[\s\S]*?map\(result => normalizeRollResult\(result, opts\)\)/);
assert.match(html, /function getRootBlockListByCid[\s\S]*?normalizeBlockTree\(ch\.blocks, \{ expandTextLines: false \}\)[\s\S]*?normalizeBlockTree\(s\.blocks, \{ expandTextLines: false \}\)/);
assert.match(html, /function normalizeIbItems\(ib, opts = \{\}\)[\s\S]*?if \(opts\.expandTextLines !== false\) item\.children = expandGenericTextChildLines\(item\.children\)/);
assert.match(html, /function normalizeEmbeddedRollBlock\(block, opts = \{\}\)[\s\S]*?normalizeBlockTree\(Array\.isArray\(result\?\.children\) \? result\.children : \[\], opts\)/);

// Live lookup must not split the edited DOM value before upd() writes it back.
const child = { id: 'child', type: 'text', content: '첫 줄<br>둘째 줄', children: [] };
const result = { id: 'result', type: 'success', blocks: [child] };
const splitAtRenderBoundary = blocks => blocks.flatMap(block =>
  block.content.includes('<br>')
    ? block.content.split('<br>').map((content, index) => ({ ...block, id: index ? `child-${index}` : block.id, content }))
    : [block]
);

const liveLookup = result.blocks.find(block => block.id === 'child');
liveLookup.content = '첫 줄<br>둘째 줄';
assert.equal(result.blocks.length, 1);
assert.equal(result.blocks[0].content, '첫 줄<br>둘째 줄');

const rendered = splitAtRenderBoundary(result.blocks);
assert.deepEqual(rendered.map(block => block.content), ['첫 줄', '둘째 줄']);
assert.equal(new Set(rendered.map(block => block.id)).size, 2);

console.log('roll result undo duplication checks: OK');
