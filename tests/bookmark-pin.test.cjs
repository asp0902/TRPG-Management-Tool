const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split('\r\n').join('\n');
// 북마크 상단 고정(#244): 정규화가 필드를 버리지 않고, 표시할 때만 정렬한다
const norm = html.slice(html.indexOf('function normalizeBookmarkRecord'), html.indexOf('// opts.promoteLegacyContent'));
assert.ok(norm.includes('pinned: input?.pinned === true') && norm.includes('pinnedAt:'));
assert.ok(html.includes('pinned: false, pinnedAt: 0, // 상단 고정(#244)'));
assert.ok(html.includes("const pinnedFirst = [...visible.filter(b => b.pinned).sort((a, b) => (b.pinnedAt || 0) - (a.pinnedAt || 0)), ...visible.filter(b => !b.pinned)];"));
assert.ok(html.includes('grid.innerHTML = pinnedFirst.map('));
assert.ok(html.includes("onclick=\"event.stopPropagation();toggleBookmarkPin('${bookmark.id}')\""));
assert.ok(html.includes('aria-pressed="${bookmark.pinned'));
console.log('bookmark pin checks: OK');
