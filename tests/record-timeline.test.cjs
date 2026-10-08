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
assert.match(html, /timelineEvents: existingRecord \? getRecordTimelineEvents\(existingRecord\.id\) : recordTimelineDraft/);
assert.doesNotMatch(html, /record-detail-heading">타임라인/);
assert.match(html, /id="rt-timeline-anchor"/);
assert.match(html, /id="rf-timeline-open"/);

// 기준 사건 여러 개: 입력(배열) 순서대로 배치하고, 각 기준 주변에 소속 사건을 전/후 규칙으로 놓는다.
const multi = [
  { id: 'a1', type: 'anchor', title: '기준1' },
  { id: 'e-a1-after', type: 'event', title: '1후', direction: 'after', offset: 1, anchorId: 'a1' },
  { id: 'a2', type: 'anchor', title: '기준2' },
  { id: 'e-a2-before', type: 'event', title: '2전', direction: 'before', offset: 3, anchorId: 'a2' },
  { id: 'e-a1-before', type: 'event', title: '1전', direction: 'before', offset: 2, anchorId: 'a1' },
  { id: 'n1', type: 'note', title: '보충', parentId: 'e-a1-after' },
  { id: 'a3', type: 'anchor', title: '기준3' },
  { id: 'e-a2-after', type: 'event', title: '2후', direction: 'after', offset: 5, anchorId: 'a2' },
];
assert.deepEqual(
  Array.from(context.sort(multi), item => item.id),
  ['e-a1-before', 'a1', 'e-a1-after', 'n1', 'e-a2-before', 'a2', 'e-a2-after', 'a3'],
);
assert.equal(context.normalize(multi).filter(item => item.type === 'anchor').length, 3, '기준 사건은 여러 개를 유지해야 합니다.');
// 예전 단일 기준 데이터(anchorId 없음)는 그 기준 소속으로 읽는다. 기준 0개 데이터도 오류 없이 정렬한다.
assert.ok(context.normalize(input).filter(item => item.type === 'event').every(item => item.anchorId === 'anchor'));
const noAnchor = [
  { id: 'x1', type: 'event', title: '후 2', direction: 'after', offset: 2 },
  { id: 'x2', type: 'event', title: '전 4', direction: 'before', offset: 4 },
];
assert.deepEqual(Array.from(context.sort(noAnchor), item => item.id), ['x2', 'x1']);
assert.ok(context.normalize(noAnchor).every(item => item.anchorId === ''));
// 복제 시 소속 기준 id 도 새 id 로 바뀐다.
const clonedMulti = context.clone(multi);
const clonedA2 = clonedMulti.find(item => item.title === '기준2');
assert.equal(clonedMulti.find(item => item.title === '2전').anchorId, clonedA2.id);
assert.notEqual(clonedA2.id, 'a2');
// 사라진 기준을 가리키는 사건은 첫 기준 소속으로 읽는다.
assert.equal(context.normalize([{ id: 'k', type: 'anchor', title: 'K' }, { id: 'ev', type: 'event', title: 'E', anchorId: 'gone' }]).find(item => item.id === 'ev').anchorId, 'k');

console.log('record timeline checks: OK');
