const fs = require('fs'), path = require('path'), vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13, 10)).join(String.fromCharCode(10));
let f = 0; const ok = (c, m) => { if (!c) { f++; console.log('FAIL', m); } else console.log('ok', m); };
const a = html.indexOf('function imageBlockModalDropBox'), b = html.indexOf('function submitImageBlockModal');
const src = html.slice(a, b);
// 이벤트 등록·핸들러 캡처
const listeners = {};
const mkBox = () => { const cls = new Set(); return { classList: { add: c => cls.add(c), remove: c => cls.delete(c), contains: c => cls.has(c) }, contains: n => n === 'inner', cls }; };
const box = mkBox(); let open = true;
const calls = { file: null, source: null };
const urlEl = { value: '' };
const ctx = {
  document: {
    addEventListener: (t, fn, cap) => { (listeners[t] = listeners[t] || []).push({ fn, cap }); },
    getElementById: id => id === 'image-block-modal-backdrop' ? { classList: { contains: c => c === 'open' && open } } : id === 'image-block-url' ? urlEl : null,
    querySelector: () => box,
  },
  getImageFileFromTransfer: dt => dt.file || null,
  setImageBlockModalFile: file => { calls.file = file; },
  setImageBlockModalSource: s => { calls.source = s; },
  String,
};
vm.createContext(ctx); vm.runInContext(src, ctx);
const ev = (extra) => Object.assign({ target: { closest: sel => sel === '.image-block-modal' ? box : null }, preventDefault() { this.p = true; }, stopPropagation() { this.s = true; }, relatedTarget: null }, extra);
const dtOf = (o) => Object.assign({ files: [], getData: t => (o.data || {})[t] || '' }, o);
ok(['dragenter', 'dragover', 'dragleave', 'drop'].every(t => listeners[t] && listeners[t][0].cap), 'dragenter/dragover/dragleave/drop 캡처 단계 등록');
// dragover
let e = ev({ dataTransfer: dtOf({}) }); listeners.dragover[0].fn(e);
ok(e.p && e.s && box.cls.has('drag-over'), 'dragover: preventDefault·stopPropagation·테두리 강조');
// dragleave 로 모달 밖 → 해제 / 모달 안쪽 이동 → 유지
box.cls.add('drag-over'); listeners.dragleave[0].fn(ev({ relatedTarget: 'inner' })); ok(box.cls.has('drag-over'), '모달 안 자식으로 이동은 강조 유지');
listeners.dragleave[0].fn(ev({ relatedTarget: null })); ok(!box.cls.has('drag-over'), '모달을 벗어나면 강조 해제');
// 이미지 파일
box.cls.add('drag-over'); e = ev({ dataTransfer: dtOf({ file: { type: 'image/png' } }) }); listeners.drop[0].fn(e);
ok(e.p && e.s && !box.cls.has('drag-over') && calls.file && calls.file.type === 'image/png', '이미지 파일 드롭 → setImageBlockModalFile, 강조 해제, 전파 차단');
// URL
calls.source = null; e = ev({ dataTransfer: dtOf({ data: { 'text/uri-list': '# c\nhttps://a.com/p.png' } }) }); listeners.drop[0].fn(e);
ok(urlEl.value === 'https://a.com/p.png' && calls.source === 'https://a.com/p.png', 'uri-list 의 http(s) 주소 → URL 칸 + setImageBlockModalSource');
urlEl.value = ''; calls.source = null; listeners.drop[0].fn(ev({ dataTransfer: dtOf({ data: { 'text/plain': 'https://b.com/q.jpg' } }) }));
ok(urlEl.value === 'https://b.com/q.jpg', 'text/plain 주소도 처리');
// 비이미지 파일·일반 글자 무시
calls.source = null; urlEl.value = 'keep'; calls.file = null; listeners.drop[0].fn(ev({ dataTransfer: dtOf({ files: [{ type: 'text/plain' }], data: { 'text/plain': 'https://c.com/x.png' } }) }));
ok(urlEl.value === 'keep' && calls.source === null && calls.file === null, '이미지가 아닌 파일은 무시(기존 선택 유지)');
listeners.drop[0].fn(ev({ dataTransfer: dtOf({ data: { 'text/plain': '그냥 글자' } }) })); ok(urlEl.value === 'keep' && calls.source === null, 'http(s) 가 아닌 글자는 무시');
// 모달 밖·닫힘
e = ev({ target: { closest: () => null }, dataTransfer: dtOf({}) }); listeners.drop[0].fn(e); ok(!e.p && !e.s, '모달 밖 드롭은 건드리지 않음');
open = false; e = ev({ dataTransfer: dtOf({}) }); listeners.drop[0].fn(e); ok(!e.p && !e.s, '모달이 닫혀 있으면 본문 드롭 동작 불변');
ok(/\.rb-modal\.image-block-modal\.drag-over \{ outline: 2px dashed #111;/.test(html), '드래그 중 테두리 강조 CSS');
ok(!/드롭|끌어/.test(html.slice(html.indexOf('id="image-block-modal-backdrop"'), html.indexOf('<!-- 링크 삽입 팝업 -->'))), '모달 마크업에 안내 문구 추가 없음');
process.exit(f ? 1 : 0);
