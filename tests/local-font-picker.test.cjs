const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');
const normalizeFunction = html.match(/function normalizeFontNameForCompare\(name\) \{[\s\S]*?\n\}/)?.[0];
const fontValueFunction = html.match(/function fontValueFromName\(name\) \{[\s\S]*?\n\}/)?.[0];
const uniqueFunction = html.match(/function uniqueFontNames\(list\) \{[\s\S]*?\n\}/)?.[0];
const localFontHelpers = html.slice(html.indexOf('let localFontFamilies ='), html.indexOf('function loadCustomFonts'));
const removeFontFunction = html.slice(html.indexOf('function removeCustomFont'), html.indexOf('\nconst TEMPLATES'));

assert.ok(normalizeFunction && fontValueFunction && uniqueFunction && localFontHelpers, '로컬 글꼴 함수를 찾을 수 없습니다.');
assert.match(html, /function openFontPicker\(\)[\s\S]*?loadLocalFontFamilies\(\);\s*\}/, '모달을 열 때마다 로컬 글꼴을 조회해야 합니다.');
assert.doesNotMatch(html, /setTimeout\(\(\) => \{[\s\S]*?tbFontFamily\(value\);\s*\}, 50\)/, '로컬 글꼴 적용을 timeout으로 추정하면 안 됩니다.');
assert.match(html, /styleTarget\.style\.setProperty\('font-family', fontFamily, 'important'\)/, '블록의 !important 상속 규칙보다 선택 글꼴이 우선해야 합니다.');
assert.match(html, /async function toggleFontInPicker\(name\)[\s\S]*?await applyPickedFont\(name, target\);[\s\S]*?persist\(\);/, '글꼴 적용 완료 후 저장과 UI 갱신이 실행되어야 합니다.');
assert.doesNotMatch(html, /function toggleFontInPicker\(name\)[\s\S]*?state\.customFonts\.splice\(idx, 1\)/, '이미 추가된 글꼴 재클릭은 제거가 아니라 적용이어야 합니다.');
assert.match(html, /Local font registration failed:[\s\S]*?postscriptName/, 'local() 실패 진단에 PostScript 이름이 포함되어야 합니다.');
assert.match(html, /id="font-manual-name"[\s\S]*?onclick="addFontByName\(\)"/, '폰트명 직접 추가 입력과 버튼이 필요합니다.');
assert.match(html, /async function addFontByName\(\)[\s\S]*?\.trim\(\)[\s\S]*?await applyPickedFont\(name, target, true\)[\s\S]*?persist\(\);/, '직접 추가 글꼴은 이름만 저장하고 즉시 직접 적용해야 합니다.');
assert.match(html, /uniqueFontNames\(\[\.\.\.FONT_POOL, \.\.\.localFontFamilies, \.\.\.customFonts\]\)/, '직접 추가 글꼴도 검색 목록에 포함되어야 합니다.');
assert.match(html, /localFontQuerySnapshot = \(fonts \|\| \[\]\)\.map\(font => \(\{[\s\S]*?fullName[\s\S]*?postscriptName[\s\S]*?style/, 'Local Font Access 원본 메타데이터를 가공 전에 보존해야 합니다.');
assert.match(html, /class="font-picker-delete" title="추가한 폰트 삭제" aria-label="추가한 폰트 삭제" onclick="removeCustomFont\(event,/, '직접 추가 글꼴에만 접근 가능한 삭제 버튼이 필요합니다.');
assert.match(html, /function removeCustomFont\(event, name\)[\s\S]*?stopPropagation[\s\S]*?state\.customFonts = [\s\S]*?state\.manualFonts = [\s\S]*?state\.recentFonts = [\s\S]*?persist\(\);[\s\S]*?renderFontPickerList\(\);/, '삭제는 이벤트를 차단하고 글꼴 목록과 최근 사용 목록만 갱신해야 합니다.');
assert.match(html, /const unavailable = manual && !canUseLocalFontDirectly\(f\)/, '직접 추가했지만 렌더링되지 않는 글꼴은 사용할 수 없음으로 표시해야 합니다.');

{
  const removal = {
    state: { customFonts: ['Manual Font', 'Keep Font'], manualFonts: ['Manual Font'], recentFonts: ['Manual Font'] },
    select: { value: "'Manual Font'" },
    stopped: false,
    persisted: 0,
    rendered: 0,
    updated: 0,
    loaded: 0,
    document: { getElementById: () => removal.select },
    persist() { removal.persisted += 1; },
    renderFontPickerList() { removal.rendered += 1; },
    updateFontDropdown() { removal.updated += 1; },
    loadCustomFonts() { removal.loaded += 1; },
    tbSyncFontDropdownLabel() {},
  };
  vm.runInNewContext(`${normalizeFunction};${removeFontFunction};removeCustomFont({stopPropagation(){stopped=true}}, 'manual font')`, removal);
  assert.deepEqual(Array.from(removal.state.customFonts), ['Keep Font']);
  assert.deepEqual(Array.from(removal.state.manualFonts), []);
  assert.deepEqual(Array.from(removal.state.recentFonts), []);
  assert.equal(removal.select.value, '');
  assert.equal(removal.stopped, true);
  assert.deepEqual([removal.persisted, removal.rendered, removal.updated, removal.loaded], [1, 1, 1, 1]);
}

(async () => {
  const context = {
    FONT_POOL: ['Web Font', 'Shared Font', 'Vertigon'],
    document: {
      fonts: { added: [], add(face) { this.added.push(face); }, check: () => true },
      getElementById: id => id === 'tb-font-family' ? context.select : { classList: { contains: () => true } },
      createElement: () => ({ getContext: () => ({ font: '', measureText(text) { return { width: context.directFamilies.some(name => this.font.includes(name)) ? 200 : 100 }; } }) }),
    },
    select: { value: '' },
    renders: 0,
    applied: [],
    warnings: 0,
    blobCalls: 0,
    directFamilies: [],
    renderFontPickerList() { context.renders += 1; },
    tbFontFamily(value) { context.applied.push({ value, target: context.savedFormatTarget }); },
    console: { info() {}, warn() { context.warnings += 1; } },
  };
  context.FontFace = class FontFace {
    constructor(family, source, descriptors) { this.family = family; this.source = source; this.descriptors = descriptors; context.createdFaces.push(this); }
    async load() { return this; }
  };
  context.createdFaces = [];
  context.savedFormatTarget = null;
  const fontData = (family, style, fail = false, postscriptName = '') => ({
    family,
    style,
    postscriptName,
    async blob() {
      context.blobCalls += 1;
      if (fail) throw new Error('blob failed');
      return { arrayBuffer: async () => new ArrayBuffer(1) };
    },
  });
  context.window = {
    queryLocalFonts: async () => [
      fontData('Local Font', 'Regular', false, 'LocalFont-Regular'),
      fontData(' local font ', 'Bold Italic', false, 'LocalFont-BoldItalic'),
      fontData('Shared Font', 'Regular', false, 'SharedFont-Regular'),
      fontData('Virtual Font', 'Regular', true, 'VirtualFont-Regular'),
      fontData('Broken Font', 'Regular', true),
    ],
  };

  await vm.runInNewContext(`
    ${normalizeFunction}
    ${fontValueFunction}
    ${uniqueFunction}
    ${localFontHelpers}
    var savedFormatTarget = null;
    result = (async () => {
      const first = await loadLocalFontFamilies();
      const web = getGoogleFontNames(['Web Font', 'Local Font', 'Shared Font', 'Unknown Font']);
      const target = { type: 'text', ta: { isConnected: true }, start: 2, end: 5 };
      await Promise.all([applyPickedFont('Local Font', target), registerLocalFontFamily('Local Font')]);
      directFamilies.push('Virtual Font');
      await applyPickedFont('Virtual Font', target);
      await applyPickedFont('Broken Font', target);
      const failedRetry = await registerLocalFontFamily('Broken Font');
      const registered = { blobCalls, added: document.fonts.added.length, families: createdFaces.map(face => face.family), sources: createdFaces.map(face => face.source), descriptors: createdFaces.map(face => face.descriptors), applied: applied.slice(), selected: select.value, failedRetry, warnings };
      window.queryLocalFonts = async () => [{ family: 'New Font' }];
      const refreshed = await loadLocalFontFamilies();
      window.queryLocalFonts = undefined;
      const unsupported = await loadLocalFontFamilies();
      let deniedCalls = 0;
      window.queryLocalFonts = async () => { deniedCalls += 1; throw Object.assign(new Error(), { name: 'NotAllowedError' }); };
      await loadLocalFontFamilies();
      await loadLocalFontFamilies();
      return { first, web, registered, refreshed, unsupported, deniedCalls };
    })();
  `, context);

  const result = await context.result;
  assert.deepEqual(Array.from(result.first), ['Broken Font', 'Local Font', 'Shared Font', 'Virtual Font']);
  assert.deepEqual(Array.from(result.web), ['Web Font']);
  assert.equal(result.registered.blobCalls, 2);
  assert.equal(result.registered.added, 2);
  assert.equal(result.registered.families[0], result.registered.families[1]);
  assert.match(result.registered.families[0], /^__trpg_local_/);
  assert.deepEqual(Array.from(result.registered.sources), ['local("LocalFont-Regular")', 'local("LocalFont-BoldItalic")']);
  assert.deepEqual(Array.from(result.registered.descriptors, item => ({ ...item })), [{ weight: '400' }, { style: 'italic', weight: '700' }]);
  assert.equal(result.registered.applied.length, 3);
  assert.match(result.registered.applied[0].value, /^'__trpg_local_[^']+', 'Local Font'$/);
  assert.equal(result.registered.applied[1].value, "'Virtual Font'");
  assert.deepEqual({ ...result.registered.applied[0].target }, { type: 'text', ta: result.registered.applied[0].target.ta, start: 2, end: 5 });
  assert.equal(result.registered.selected, "'Broken Font'");
  assert.equal(result.registered.failedRetry, false);
  assert.equal(result.registered.warnings, 1);
  assert.deepEqual(Array.from(result.refreshed), ['New Font']);
  assert.deepEqual(Array.from(result.unsupported), ['New Font']);
  assert.equal(result.deniedCalls, 1);
  assert.equal(context.renders, 2);

  console.log('local font picker checks: OK');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
