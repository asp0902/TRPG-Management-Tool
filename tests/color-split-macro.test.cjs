const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13, 10)).join(String.fromCharCode(10));

// 「색 나눔 한 줄」(#249): 순수 생성 함수를 잘라 실행한다. 글자 폭은 고정 폭 mock 으로 잰다(전각 공백 = 문자 폭 13).
const a = html.indexOf('function buildColorSplitMacro');
const b = html.indexOf('const colorSplitCanvas');
assert.ok(a > 0 && b > a);
const ctx = {};
vm.runInNewContext(html.slice(a, b) + '\nthis.build = buildColorSplitMacro;', ctx);
const measure = text => [...text].length * 10; // 1글자 10px
const base = { gap: '　', size: 13, bold: true, italic: false, bg: '#000000', pad: 16 };

// 5조각 + 전각 공백: 경계는 간격 한가운데
let r = ctx.build({ ...base, pieces: [{ text: 'GM', color: '#E21111' }, { text: '아델리', color: '#fafafa' }, { text: '❋', color: '#E21111' }] }, measure);
// 폭: 20 + 30 + 10 + 간격 10*2 = 80, 중심 40. 경계1 = 20 + 5 = 25 → -15, 경계2 = 20+10+30+5 = 65 → +25
assert.equal(r.total, 80);
assert.ok(r.macro.startsWith('[GM　아델리　❋](#" style=" display:block; text-align:center; padding:0 16px;'));
assert.ok(r.macro.includes('linear-gradient(90deg, #E21111 calc(50% - 15px), #fafafa calc(50% - 15px) calc(50% + 25px), #E21111 calc(50% + 25px)), linear-gradient(#000000, #000000)'));
assert.ok(r.macro.includes('-webkit-background-clip:text, border-box; background-clip:text, border-box; color:transparent !important; -webkit-text-fill-color:transparent;)'));
assert.ok(/font-weight:bold; font-size:13px;/.test(r.macro) && !/font-weight:\s*800|text-stroke/.test(r.macro));

// 간격 없음·배경 없음·기울임: 경계는 조각 끝, 레이어 하나
r = ctx.build({ ...base, gap: '', bg: '', italic: true, pieces: [{ text: '가나', color: '#ff0000' }, { text: '다', color: '#00ff00' }] }, measure);
assert.ok(r.macro.includes('linear-gradient(90deg, #ff0000 calc(50% + 5px), #00ff00 calc(50% + 5px))'));
assert.ok(/-webkit-background-clip:text; background-clip:text;/.test(r.macro) && !r.macro.includes('border-box') && r.macro.includes('font-style:italic'));

// 색 1개: 그라데이션 없이 color
r = ctx.build({ ...base, bg: '', pieces: [{ text: '단색', color: '#112233' }] }, measure);
assert.ok(r.macro.includes(' color:#112233;') && !r.macro.includes('gradient'));

// 매크로 문법을 깨는 글자·잘못된 색은 거부
assert.ok(ctx.build({ ...base, pieces: [{ text: 'A]B', color: '#ff0000' }] }, measure).error);
assert.ok(ctx.build({ ...base, pieces: [{ text: 'A', color: 'red' }] }, measure).error);
assert.ok(ctx.build({ ...base, pieces: [{ text: '', color: '#ff0000' }] }, measure).error);

// 생성 결과가 파서에서 한 토큰, 롤20 아님: 실제 앱 함수로 확인
const p0 = html.indexOf('function tryParseCssMacroToken');
const p1 = html.indexOf('// 코코포리아 채팅(CCFOLIA 1.37.4');
const q0 = html.indexOf('function isRoll20Macro');
const q1 = html.indexOf('function renderRoll20PreviewLine');
const pctx = { decodeCssMacroPreviewValue: v => v, normalizeCssMacroPreviewStyleText: v => v };
vm.runInNewContext(html.slice(p0, p1) + '\n' + html.slice(q0, q1) + '\nthis.parse = tryParseCssMacroToken; this.r20 = isRoll20Macro;', pctx);
r = ctx.build({ ...base, pieces: [{ text: 'GM', color: '#E21111' }, { text: '아델리', color: '#fafafa' }] }, measure);
const tok = pctx.parse(r.macro, 0);
assert.ok(tok && tok.end === r.macro.length && tok.text === 'GM　아델리' && tok.style.includes('linear-gradient'));
assert.equal(pctx.r20(r.macro), false);

// UI: 두 입력칸에 버튼, document.fonts.ready 이후 측정, 글꼴은 코코포리아 값
assert.equal(html.split('onclick="openColorSplitDialog(this)"').length - 1, 2);
assert.ok(html.includes('await document.fonts.ready;'));
assert.ok(html.includes("+ 'px ' + CCFOLIA_PREVIEW.fontFamily;"));
console.log('color split macro checks: OK');
