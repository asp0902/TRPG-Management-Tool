const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('TRPG 작업 관리 도구.html', 'utf8');
const source = html.slice(
  html.indexOf('function normalizeRecordTimelineEvents'),
  html.indexOf('function recordPlainTextToHtml'),
);
let nextId = 0;
const context = { mkId: () => `new-${++nextId}`, Map, Set, Number, String, Math };
vm.createContext(context);
vm.runInContext(`${source};this.normalize=normalizeRecordTimelineEvents;this.sort=sortRecordTimelineEvents;this.clone=cloneRecordTimelineEvents;`, context);

const input = [
  { id: 'after-5', type: 'event', title: '후 5', direction: 'after', offset: 5 },
  { id: 'before-2-a', type: 'event', title: '전 2 A', direction: 'before', offset: 2 },
  { id: 'anchor', type: 'anchor', title: '기준' },
  { id: 'before-10', type: 'event', title: '전 10', direction: 'before', offset: 10 },
  { id: 'note', type: 'note', title: '보충', parentId: 'before-10' },
  { id: 'after-1', type: 'event', title: '후 1', direction: 'after', offset: 1 },
  { id: 'before-2-b', type: 'event', title: '전 2 B', direction: 'before', offset: 2 },
];
assert.deepEqual(
  Array.from(context.sort(input), item => item.id),
  ['before-10', 'note', 'before-2-a', 'before-2-b', 'anchor', 'after-1', 'after-5'],
);

const cloned = context.clone(input);
assert.equal(cloned.length, input.length);
assert.notEqual(cloned.find(item => item.title === '전 10').id, 'before-10');
assert.equal(
  cloned.find(item => item.type === 'note').parentId,
  cloned.find(item => item.title === '전 10').id,
);
assert.deepEqual(Array.from(context.normalize(undefined)), []);

assert.match(html, /timelineEvents: normalizeRecordTimelineEvents\(input\?\.timelineEvents\)/);
assert.match(html, /timelineEvents: recordTimelineDraft/);
assert.match(html, /record-detail-heading">타임라인/);
assert.match(html, /id="rf-timeline-anchor"/);

console.log('record timeline checks: OK');
