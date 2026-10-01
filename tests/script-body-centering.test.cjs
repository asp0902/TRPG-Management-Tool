const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');
assert.match(html, /\.panel-inner \{ width: 100%; max-width: 800px; margin: 0 auto; padding: 28px 32px 60px; box-sizing: border-box; \}/);
assert.doesNotMatch(html, /#panel-body\s*>\s*\.panel-inner[^\{]*\{[^}]*padding-right\s*:\s*150px/);
assert.doesNotMatch(html, /#rb-chapter-body\s*\{[^}]*padding-right\s*:\s*150px/);
