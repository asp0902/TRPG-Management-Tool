const fs = require('fs'), path = require('path'), vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13, 10)).join(String.fromCharCode(10));
let f = 0; const ok = (c, m) => { if (!c) { f++; console.log('FAIL', m); } else console.log('ok', m); };
// 마크업: 콜아웃(루트·중첩)과 분기 내부 콜아웃 머리에 「블록 추가」 ＋(#353)
ok(/<button type="button" class="callout-add-btn" title="블록 추가" aria-label="블록 추가"[^>]*onclick="event\.stopPropagation\(\);calloutAddChildPopup\('\$\{b\.id\}','\$\{cid\}',this\)">＋<\/button>/.test(html), '콜아웃 머리 ＋ 버튼(루트·중첩 콜아웃)');
ok(/branch-inner-callout-head-actions">\s*<button class="branch-inner-block-act" title="블록 추가" aria-label="블록 추가"[^>]*calloutAddChildPopup\('\$\{ib\.id\}','\$\{cid\}',this\)">＋<\/button>/.test(html), '분기 내부 콜아웃 머리 ＋ 버튼');
ok(/\.callout-add-btn \{[^}]*margin-left: auto;[^}]*width: 20px; height: 20px;/.test(html), '＋ 버튼 스타일(우측 끝 20px)');
// 동작: 자식 목록 끝에 넣는 팝업을 연다
const a = html.indexOf('function calloutAddChildPopup'), b = html.indexOf('function insertBlockFromBip');
const calls = []; let ctxReset = null;
const ctx = {
  makeChildBlockTargetKey: (id, cid) => 'children|' + id + '|' + cid,
  getBlockListByTargetKey: key => key === 'children|ok|c' ? { array: [1, 2, 3] } : null,
  openInsertPopupAtPoint: (...args) => calls.push(args),
  _bipChildInsertCtx: { stale: true },
};
vm.createContext(ctx); vm.runInContext(html.slice(a, b) + ';this.f = calloutAddChildPopup;', ctx);
const btn = { getBoundingClientRect: () => ({ left: 100, width: 20, bottom: 50 }) };
ctx.f('ok', 'c', btn);
ok(calls.length === 1 && calls[0].join('|') === '110|54|c|3|children|ok|c', '팝업 위치(버튼 아래)·삽입 위치(자식 수=맨 뒤)·targetKey 전달');
ok(ctx._bipChildInsertCtx === null, '이전 캐럿 기반 삽입 컨텍스트 초기화(맨 뒤 삽입 경로)');
ctx.f('missing', 'c', btn); ok(calls.length === 1, '대상 목록이 없으면 열지 않음');
ctx.f('ok', 'c', null); ok(calls.length === 1, '버튼이 없으면 열지 않음');
process.exit(f ? 1 : 0);
