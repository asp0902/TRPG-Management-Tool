const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13, 10)).join(String.fromCharCode(10));

// 「색 나눔 한 줄」(#249, #252에서 인라인 조각 방식으로 변경): 순수 생성 함수를 잘라 실행한다. 글자 폭은 1글자 10px mock.
const a = html.indexOf('function buildColorSplitMacro');
const b = html.indexOf('const colorSplitCanvas');
assert.ok(a > 0 && b > a);
const ctx = {};
vm.runInNewContext(html.slice(a, b) + '\nthis.build = buildColorSplitMacro;', ctx);
const measure = text => [...text].length * 10;
const base = { gap: '　', size: 12, bold: true, italic: true, bg: '#000000' };
const parser = html.slice(html.indexOf('function tryParseCssMacroToken'), html.indexOf('// 코코포리아 채팅(CCFOLIA 1.37.4')) + '\n' + html.slice(html.indexOf('function decodeCssMacroPreviewValue'), html.indexOf('function tryParseCssMacroToken'));
const r20 = html.slice(html.indexOf('function isRoll20Macro'), html.indexOf('function renderRoll20PreviewLine'));
const pctx = { decodeCssMacroPreviewValue: v => v, normalizeCssMacroPreviewStyleText: v => v };
vm.runInNewContext(parser + '\n' + r20 + '\nthis.parse = tryParseCssMacroToken; this.r20 = isRoll20Macro;', pctx);
const readAll = macro => { const out = []; let at = 0; while (at < macro.length) { const t = pctx.parse(macro, at); if (!t) break; out.push(t); at = t.end; } return { out, at }; };

// % 여백 방식(#254): L=(W-글자폭*k)/2/W*100+이동, R=L-2*이동-0.4
let r = ctx.build({ ...base, pieces: [{ text: 'Written by.', color: '#E21111' }, { text: 'hiy', color: '#fafafa' }], gap: ' ' }, measure);
// 글자폭 110+40=150, W=328 → L=27.134→27.1, R=26.734→26.7
assert.equal(r.total, 150); assert.equal(r.left, 27.1); assert.equal(r.right, 26.7);
assert.ok(r.macro.startsWith('[Written by.](#" style=" display:inline; background:#000000; padding:4px 0 4px 27.1%; text-decoration:none; color:#E21111 !important; font-style:italic; font-weight:bold; font-size:12px;)'));
assert.ok(r.macro.endsWith('[ hiy](#" style=" display:inline; background:#000000; padding:4px 26.7% 4px 0; box-shadow:2px 0 0 #000000; text-decoration:none; color:#fafafa !important; font-style:italic; font-weight:bold; font-size:12px;)'));
assert.ok(!/calc\(|8px 0 0/.test(r.macro));

// W·배율·이동값: W=200,k=120 → (200-180)/2/200*100=5 ; 이동 +1 → L=6, R=6-2-0.4=3.6
r = ctx.build({ ...base, pieces: [{ text: 'GM', color: '#E21111' }, { text: '아델리', color: '#fafafa' }, { text: '❋', color: '#E21111' }], gap: '', width: 150, scale: 120, shift: 1 }, measure);
// 글자폭 60*1.2=72 → (150-72)/2/150*100=26 ; L=27, R=27-2-0.4=24.6
assert.equal(r.left, 27); assert.equal(r.right, 24.6);
const read = readAll(r.macro);
assert.equal(read.out.length, 3, '조각 3개로 읽힌다'); assert.equal(read.at, r.macro.length);
assert.deepEqual([...read.out.map(t => t.text)], ['GM', '아델리', '❋']);
assert.ok(read.out[1].style.includes('padding:4px 0 4px 0;') && !read.out[1].style.includes('box-shadow'));
assert.ok(read.out[0].style.includes('padding:4px 0 4px 27%;') && read.out[2].style.includes('padding:4px 24.6% 4px 0;') && read.out[2].style.includes('box-shadow:2px 0 0 #000000'));
assert.equal(pctx.r20(r.macro), false);
assert.ok(!/gradient|background-clip|transparent/.test(r.macro));
// 글자가 칸보다 넓으면 0 으로 고정
r = ctx.build({ ...base, pieces: [{ text: 'a'.repeat(60), color: '#ff0000' }, { text: 'b', color: '#00ff00' }], gap: '' }, measure);
assert.ok(r.macro.includes('padding:4px 0 4px 0%;') && r.macro.includes('padding:4px 0% 4px 0;'));

// 배경 없음: background·padding-block·box-shadow 없이 좌우 padding 만
r = ctx.build({ ...base, bg: '', italic: false, bold: false, pieces: [{ text: '가', color: '#ff0000' }, { text: '나', color: '#00ff00' }], gap: '' }, measure);
assert.ok(!/background|box-shadow|4px/.test(r.macro));
assert.ok(r.macro.includes('padding:0 0 0 47%;') && r.macro.includes('padding:0 46.6% 0 0;') && r.macro.includes('font-style:normal') && r.macro.includes('font-weight:normal'));

// 색 1개: display:block 가운데 정렬(측정 불필요)
r = ctx.build({ ...base, pieces: [{ text: '단색', color: '#112233' }] }, measure);
assert.ok(r.macro.startsWith('[단색](#" style=" display:block; text-align:center; background:#000000; padding:4px 0; text-decoration:none; color:#112233 !important;'));
assert.equal(readAll(r.macro).out.length, 1);

// 매크로 문법을 깨는 글자·잘못된 색은 거부
assert.ok(ctx.build({ ...base, pieces: [{ text: 'A]B', color: '#ff0000' }] }, measure).error);
assert.ok(ctx.build({ ...base, pieces: [{ text: 'A', color: 'red' }] }, measure).error);
assert.ok(ctx.build({ ...base, pieces: [{ text: '', color: '#ff0000' }] }, measure).error);

// UI: 두 입력칸에 버튼, document.fonts.ready 이후 측정, 글꼴은 코코포리아 값, 치우침 안내
assert.equal(html.split('onclick="openColorSplitDialog(this)"').length - 1, 2);
assert.ok(html.includes('await document.fonts.ready;'));
assert.ok(html.includes("+ 'px ' + CCFOLIA_PREVIEW.fontFamily;"));
assert.ok(html.includes('코코포리아에서 줄이 치우치면 배율·위치 보정으로 맞추세요'));
// #254 옵션: 채팅 칸 폭·배율·위치 보정(localStorage), 대화상자 미리보기는 채팅 칸 폭
['mcs-width', 'mcs-scale', 'mcs-shift', 'colorSplitNudge(-0.1)', 'colorSplitNudge(0.1)', "COLOR_SPLIT_STORE_KEY = 'trpg-color-split-opts'", "setProperty('--ccf-width'"].forEach(k => assert.ok(html.includes(k), k));

// PREVIEW(#252): background-clip:text 선언 제거, 완전히 빈 [] 조각은 그리지 않음([ ] 는 그림), 경고 한 줄
assert.ok(html.includes("if (/^(?:-webkit-)?background-clip$/.test(prop) && /\\btext\\b/.test(value)) return false;"));
assert.ok(html.includes("if (token.text === '') {"));
assert.ok(html.includes('코코포리아에서 적용되지 않는 서식이 있습니다: '));
console.log('color split macro checks: OK');
