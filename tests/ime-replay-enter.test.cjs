const fs = require('fs'), path = require('path'), vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13, 10)).join(String.fromCharCode(10));
let f = 0; const ok = (c, m) => { if (!c) { f++; console.log('FAIL', m); } else console.log('ok', m); };
const code = html.slice(html.indexOf('const IME_REPLAY_SELECTORS'), html.indexOf('function imeDeferEditorKey'));
(async () => {
  const listeners = [], sent = [];
  class KeyboardEvent { constructor(type, init) { this.type = type; Object.assign(this, init); } }
  const ctx = { imeComposing: true, setTimeout, clearTimeout, KeyboardEvent, document: { addEventListener: (t, fn) => listeners.push([t, fn]), removeEventListener: (t, fn) => { const i = listeners.findIndex(l => l[0] === t && l[1] === fn); if (i >= 0) listeners.splice(i, 1); } } };
  vm.createContext(ctx); vm.runInContext(code + ';this.defer = imeDeferReplayKey; this.SEL = IME_REPLAY_SELECTORS;', ctx);
  const el = { isConnected: true, dispatchEvent: ev => sent.push(ev) };
  const mk = (key, o = {}) => ({ key, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false, prevented: false, preventDefault() { this.prevented = true; }, target: { closest: sel => (o.other ? null : (sel === ctx.SEL ? el : null)) }, ...o });
  const fireEnd = () => listeners.filter(l => l[0] === 'compositionend').forEach(l => l[1]());
  const wait = ms => new Promise(r => setTimeout(r, ms));
  // 대상 편집기: 메모 행·타임라인 사건 이름·본문 텍스트 블록·대사·분기 내부 텍스트
  ['textarea.ds-memo-input', 'textarea.record-timeline-text', '.block-text-ce', 'speechCeKeydown', 'handleIbTextCeEnter'].forEach(k => ok(ctx.SEL.includes(k), '대상 선택자 포함: ' + k));
  let e = mk('Enter'); ctx.defer(e);
  ok(e.prevented && sent.length === 0, '조합 중 Enter: 기본 동작(줄바꿈) 차단, 아직 편집기 처리는 안 함');
  ctx.defer(mk('Enter')); fireEnd(); await wait(20);
  ok(sent.length === 1 && sent[0].key === 'Enter' && sent[0].__imeReplay === true && sent[0].bubbles && sent[0].cancelable && sent[0].shiftKey === false, '조합 확정 뒤 그 편집기로 Enter keydown 을 한 번만 다시 전달(__imeReplay 표시)');
  sent.length = 0; e = mk('Enter', { shiftKey: true }); ctx.defer(e); fireEnd(); await wait(20);
  ok(e.prevented && sent.length === 1 && sent[0].shiftKey === true, 'Shift+Enter 도 같은 방식, Shift 유지(편집기의 줄바꿈 처리 유지)');
  sent.length = 0; e = mk('Tab'); ctx.defer(e); e = mk('Escape'); ctx.defer(e); e = mk('Enter', { ctrlKey: true }); ctx.defer(e); e = mk('Enter', { other: true }); ctx.defer(e);
  ok(sent.length === 0 && !e.prevented, 'Tab·Esc·Ctrl+Enter·대상 아닌 곳은 건드리지 않음');
  sent.length = 0; ctx.imeComposing = false; e = mk('Enter'); ctx.defer(e); await wait(30);
  ok(e.prevented && sent.length === 1, '조합이 이미 끝났으면(Safari 등) 다음 틱에 전달');
  sent.length = 0; ctx.imeComposing = true; e = mk('Enter'); ctx.defer(e); await wait(480);
  ok(sent.length === 1, 'compositionend 가 오지 않아도 안전장치로 전달');
  // 전역 keydown 연결
  ok(html.includes('if (e.__imeReplay) { lastTypingAt = Date.now(); return; }') && html.includes('if (isImeComposing(e)) { imeDeferEditorKey(e); e.stopImmediatePropagation(); }') && html.indexOf('if (e.__imeReplay)') < html.indexOf('if (isImeComposing(e)) { imeDeferEditorKey(e)'), '전역 keydown: 다시 전달한 Enter 는 조합 차단을 건너뜀, 조합 키는 지연 처리 후 차단');
  ok(/if \(!ta\) \{ imeDeferReplayKey\(e\); return; \}/.test(html), '데이터 시트 셀이 아니면 다른 편집기 지연 처리로(셀 처리는 그대로)');
  process.exit(f ? 1 : 0);
})();
