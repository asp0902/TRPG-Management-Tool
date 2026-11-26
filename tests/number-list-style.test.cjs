const fs = require('fs'), path = require('path'), vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13, 10)).join(String.fromCharCode(10));
let f = 0; const ok = (c, m) => { if (!c) { f++; console.log('FAIL', m); } else console.log('ok', m); };
let stored = null; const ctx = { localStorage: { getItem: () => stored } }; vm.createContext(ctx);
vm.runInContext(html.slice(html.indexOf('const TB_NUM_PRESETS'), html.indexOf('function tbNumberContext')) + ';this.P=TB_NUM_PRESETS', ctx);
ok(ctx.P.map(p => p[0]).join() === 'decimal,paren,outline,upper,roman,zero' && ctx.P.every(p => p[2].length === 3), '프리셋 6종(3단계 미리보기)');
ok(ctx.tbValidNumPreset('zero') === 'zero' && ctx.tbValidNumPreset('x"><script>') === 'decimal' && ctx.tbValidNumPreset(null) === 'decimal', '잘못된 값은 decimal');
ok(ctx.tbLastNumPreset() === 'decimal' && (stored = 'roman', ctx.tbLastNumPreset() === 'roman'), '마지막으로 쓴 스타일(처음에는 1. a. i.)');
const el = (tag, parent) => ({ nodeType: 1, tagName: tag, parentElement: parent });
const root = el('DIV', null), o1 = el('OL', root), li = el('LI', o1), o2 = el('OL', li), li2 = el('LI', o2);
ok(ctx.tbOuterOrderedList(li2, root) === o1 && ctx.tbOuterOrderedList({ nodeType: 3, parentElement: li }, root) === o1 && ctx.tbOuterOrderedList(el('P', root), root) === null && ctx.tbOuterOrderedList(li2, el('DIV', null)) === null, '가장 바깥 ol 찾기(편집 영역 밖은 제외)');
ok(['decimal', 'paren', 'outline', 'upper', 'roman', 'zero'].every(id => html.includes('ol[data-tb-num="' + id + '"]')), '프리셋마다 CSS');
ok(html.includes('--tb-n2: counter(tbl0, decimal) "." counter(tbl1, decimal) "." counter(tbl2, decimal) ". ";') && html.includes('--tb-n0: counter(tbl0, decimal) ") ";') && html.includes('decimal-leading-zero'), '괄호·개요·0 채움 표시 규칙');
ok(html.includes('ol[data-tb-num] > li[data-list-indent="1"]::marker') && html.includes('ol[data-tb-num] > li > ol > li:not([data-list-indent])::marker'), '들여쓰기(data-list-indent)와 중첩 ol 모두 단계 표시');
ok((html.match(/\[contenteditable\] ol ol ol \{ list-style-type: lower-roman; \}/g) || []).length === 1, '중복 규칙 정리(속성 없는 목록은 기존 모양)');
ok(!/^\[contenteditable\].*data-tb-num/m.test(html), '번호 스타일은 편집기 밖에서도 적용');
ok(/'data-tb-bullet-img', 'data-tb-num',/.test(html) && /id="tb-list-ol-caret"/.test(html), '정리(sanitizer) 허용·분할 버튼');
// 본체 버튼: 새 목록에는 data-tb-num(처음에는 decimal), 합쳐진 기존 목록은 그대로
const press = merged => { const attrs = {}, list = { hasAttribute: n => n in attrs, setAttribute: (n, v) => { attrs[n] = v; } };
  const c = { isCE: () => true, tbLastNumPreset: () => 'decimal', tbNumberContext: () => ({ root: { querySelectorAll: () => merged ? [list] : [], dispatchEvent() {} } }), tbOuterOrderedList: () => list, Event: class {},
    document: { queryCommandState: () => false, execCommand() {} }, window: { getSelection: () => ({ rangeCount: 1, getRangeAt: () => ({}) }) } };
  vm.createContext(c); const from = html.indexOf('function tbInsertNumbered'); vm.runInContext(html.slice(from, html.indexOf('const ta = lastFocusedTA', from)) + '}', c); c.tbInsertNumbered(); return attrs['data-tb-num']; };
ok(press(false) === 'decimal' && press(true) === undefined, '본체 버튼 생성 → data-tb-num="decimal", 기존 목록 불변');
ok(html.includes("const current = ctx?.list?.hasAttribute('data-tb-num') ?"), '속성 없는 기존 목록은 카드 강조 없음');
process.exit(f ? 1 : 0);
