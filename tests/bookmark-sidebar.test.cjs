const fs = require('fs'), path = require('path'), vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13, 10)).join(String.fromCharCode(10));
let f = 0; const ok = (c, m) => { if (!c) { f++; console.log('FAIL', m); } else console.log('ok', m); };
let query = '';
const ctx = { state: { bookmarks: [
  { id: 'a', title: '가', url: '', tags: ['룰'] },
  { id: 'b', title: '나', url: '', tags: [], pinned: true, pinnedAt: 1 },
  { id: 'c', title: '다', url: '', notes: '지도', tags: ['룰'] },
  { id: 'd', title: '라', url: '', tags: [], pinned: true, pinnedAt: 2 },
] }, activeBookmarkTag: 'all', normalizeCssMacroTags: t => t || [], document: { getElementById: () => ({ value: query }) } };
vm.createContext(ctx);
vm.runInContext(html.slice(html.indexOf('function getVisibleBookmarks'), html.indexOf('function renderBookmarkSidebar')), ctx);
const ids = () => ctx.getVisibleBookmarks().map(b => b.id).join('');
ok(ids() === 'dbac', '고정(최근 고정 먼저) → 나머지 원래 순서');
ok(ctx.state.bookmarks.map(b => b.id).join('') === 'abcd', '저장 순서는 그대로');
ctx.activeBookmarkTag = '룰'; ok(ids() === 'ac', '태그 필터');
query = '지도'; ok(ids() === 'c', '태그 + 검색');
query = '없는말'; ok(ids() === '', '결과 없음');
const grid = html.slice(html.indexOf('function renderBookmarkPage'), html.indexOf('function openBookmarkModal'));
const side = html.slice(html.indexOf('function renderBookmarkSidebar'), html.indexOf('function focusBookmarkCard'));
ok(/getVisibleBookmarks\(\)/.test(grid) && /getVisibleBookmarks\(\)/.test(side), '그리드와 왼쪽 목록이 같은 함수 사용');
ok(/currentPage === 'bookmark'\) renderList\(\)/.test(grid) && /renderBookmarkSidebar\(el\)/.test(html), '필터·변경 때 왼쪽 목록도 다시 그림');
const create = html.slice(html.indexOf("function createNew(folderId = '')"), html.indexOf('function delScenario'));
ok(/currentPage === 'bookmark'\) \{\s*openBookmarkModal\(\);\s*return;/.test(create), '＋ 버튼은 북마크 추가 창(시나리오 생성 안 함)');
process.exit(f ? 1 : 0);
