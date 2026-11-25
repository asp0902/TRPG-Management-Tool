const fs = require('fs'), path = require('path'), vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13, 10)).join(String.fromCharCode(10));
let f = 0; const ok = (c, m) => { if (!c) { f++; console.log('FAIL', m); } else console.log('ok', m); };
const code = html.slice(html.indexOf('let imeDeferredEditorKey'), html.indexOf("document.addEventListener('keydown', e => {\n  if (isImeComposing(e)) { imeDeferEditorKey(e);"));
const SEL = 'textarea.ds-cell-input.ds-cell-editing, .ds-cell-rich[contenteditable="true"]'; // #375: 서식 편집 칸(contenteditable)까지
(async () => {
  const listeners = [], calls = [];
  const ctx = {
    imeComposing: true, setTimeout, clearTimeout, parseInt,
    document: { addEventListener: (t, fn) => listeners.push([t, fn]), removeEventListener: (t, fn) => { const i = listeners.findIndex(l => l[0] === t && l[1] === fn); if (i >= 0) listeners.splice(i, 1); } },
    ds_handleCellKeydown: (e, r, c) => calls.push({ key: e.key, shift: e.shiftKey, composing: e.isComposing, r, c }),
  };
  vm.createContext(ctx);
  vm.runInContext(code + ';this.defer = imeDeferEditorKey;', ctx);
  const ta = { isConnected: true, dataset: { rowIdx: '1', colId: 'cA' } };
  const mk = (key, o = {}) => { const e = { key, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false, target: { closest: sel => (sel === SEL ? (o.other ? null : ta) : null) }, prevented: false, preventDefault() { this.prevented = true; }, ...o }; return e; };
  const fireEnd = () => listeners.filter(l => l[0] === 'compositionend').forEach(l => l[1]());
  const wait = ms => new Promise(r => setTimeout(r, ms));
  // 조합 중 Enter: 기본 동작(줄바꿈) 차단, 조합 확정 전에는 처리하지 않음, 확정 후 정확히 한 번 처리
  let e = mk('Enter'); ctx.defer(e);
  ok(e.prevented && calls.length === 0, '조합 중 Enter: 줄바꿈 차단, 아직 처리 안 함');
  ctx.defer(mk('Enter')); // 같은 키 반복(IME 이중 keydown)
  fireEnd(); await wait(20);
  ok(calls.length === 1 && calls[0].key === 'Enter' && calls[0].r === 1 && calls[0].c === 'cA' && calls[0].composing === false, '조합 확정 뒤 일반 Enter 로 한 번만 처리(셀 위치 전달)');
  // Tab: 기본 동작 차단 후 확정 뒤 처리
  calls.length = 0; e = mk('Tab', { shiftKey: true }); ctx.defer(e); fireEnd(); await wait(20);
  ok(e.prevented && calls.length === 1 && calls[0].key === 'Tab' && calls[0].shift === true, '조합 중 Tab(Shift 유지): 차단 후 확정 뒤 처리');
  // Escape: 브라우저 조합 취소 동작은 막지 않고 확정/취소 뒤 처리
  calls.length = 0; e = mk('Escape'); ctx.defer(e); fireEnd(); await wait(20);
  ok(!e.prevented && calls.length === 1 && calls[0].key === 'Escape', '조합 중 Esc: 조합 취소 동작 유지, 뒤이어 처리');
  // 셀이 아니거나 다른 키는 무시
  calls.length = 0; e = mk('Enter', { other: true }); ctx.defer(e); ok(!e.prevented && calls.length === 0, '데이터 시트 셀이 아닌 곳은 건드리지 않음');
  e = mk('a'); ctx.defer(e); ok(!e.prevented && calls.length === 0, '일반 글자 키는 건드리지 않음');
  e = mk('Enter', { ctrlKey: true }); ctx.defer(e); ok(!e.prevented, 'Ctrl 조합은 건드리지 않음');
  // compositionend 가 이미 지난 경우(Safari) 는 다음 틱에 처리
  calls.length = 0; ctx.imeComposing = false; e = mk('Enter'); ctx.defer(e); await wait(30);
  ok(e.prevented && calls.length === 1, '조합이 이미 끝났으면 다음 틱에 처리');
  // 안전장치: compositionend 가 오지 않아도 0.4초 안에 처리
  calls.length = 0; ctx.imeComposing = true; e = mk('Enter'); ctx.defer(e); await wait(480);
  ok(calls.length === 1, 'compositionend 가 오지 않아도 안전장치로 처리');
  // 소스 구조
  ok(/if \(isImeComposing\(e\)\) \{ imeDeferEditorKey\(e\); e\.stopImmediatePropagation\(\); \}/.test(html), '전역 keydown 캡처에서 조합 키를 셀 핸들러로 넘긴 뒤 차단');
  ok(/if \(e\.key === 'Enter' && e\.shiftKey && !e\.altKey && !e\.ctrlKey && !e\.metaKey\) \{ \/\/ Shift\+Enter 셀 안 줄바꿈\(#266\)/.test(html), 'Shift+Enter 셀 안 줄바꿈(#266) 유지');
  ok(code.includes(SEL), '편집 중인 셀 textarea 와 서식 편집 칸(contenteditable) 모두 대상(#375)');
  process.exit(f ? 1 : 0);
})();
