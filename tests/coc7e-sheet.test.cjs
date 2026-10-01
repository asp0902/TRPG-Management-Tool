const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');
const stats = html.slice(html.indexOf('function renderCoc7eStatsSection'), html.indexOf('// CoC 7판 기능 프리셋'));
const exportedHtml = process.env.COC7E_EXPORTED_HTML ? fs.readFileSync(process.env.COC7E_EXPORTED_HTML, 'utf8') : html;
const exported = exportedHtml.slice(exportedHtml.indexOf('function normalizeStandaloneCocEra'), exportedHtml.indexOf('function saveStandaloneCharacterSheet'));

assert.match(stats, /sh-coc-stats-main[\s\S]*?attrsHtml[\s\S]*?miscRow[\s\S]*?sh-coc-derived-section/);
assert.match(html, /sh-coc-stats-main \.sh-coc-misc-row \{ grid-template-columns: repeat\(4, minmax\(0, 1fr\)\); margin-top: 16px; \}/);
assert.match(exported, /sum\('\.sk-job'\)[\s\S]*?sum\('\.sk-interest'\)[\s\S]*?sum\('\.sk-growth'\)/);
assert.match(exported, /set\('\.sk-job-used'[\s\S]*?set\('\.sk-interest-used'[\s\S]*?set\('\.sk-growth-used'[\s\S]*?set\('\.sk-total'/);
assert.match(html, /document\.addEventListener\('input'[\s\S]*?updateStandaloneCocSkills\(\)/);
assert.match(html, /if \(tpl\.key === 'coc7e'\)[\s\S]*?skillsSection\.after\(financeSection\)/);
assert.match(html, /\.sh-coc-skills-table \.sk-name-input\.is-emphasis \{ font-style: italic; \}/);
assert.match(html, /target\.closest\('#ch-sheet-body'\)\) return true/);
assert.match(html, /id: 'eraType', label: '시대 유형', type: 'select', options: \['1920년대', '현대', '기타'\]/);
assert.match(html, /data-coc-era-select="1"/);
assert.match(html, /body\[data-coc-era="1920년대"\][\s\S]*?body\[data-coc-era="현대"\][\s\S]*?body\[data-coc-era="기타"\]/);
assert.match(html, /function updateStandaloneCocEraTheme\(value\)[\s\S]*?document\.body\.dataset\.cocEra = era/);
assert.match(stats, /sh-coc-wealth-title">현금과 자산/);
assert.match(stats, /data-coc-ledger-field=/);
assert.match(stats, /data-coc-ledger-total=/);
assert.doesNotMatch(stats, /sh-coc-balance-add/);
assert.match(exported, /data-coc-ledger-field[\s\S]*?updateStandaloneCocLedgerTotals/);
assert.match(html, /new Array\(hasStoredRows \? 1 : 3\)\.fill/);
assert.match(stats, /title="클릭하여 특성치 전체 굴리기"/);
assert.doesNotMatch(stats, /sh-roll-hint/);
assert.match(html, /\.sh-sheet-content > \.sh-coc-misc-section \{ border-top: none; padding-top: 0; margin-top: 0; \}/);
assert.match(html, /\.sh-coc-wealth-title \{ min-height: 33px; padding: 4px 12px; justify-content: center;/);
assert.match(html, /\.sh-coc-balance-title \{ min-height: 33px; padding: 4px 12px;/);
assert.match(html, /\.sh-coc-misc-select option \{ text-align: center; \}/);
assert.match(html, /\.sh-coc-wealth-currency-cell \{[^}]*grid-template-columns: 1\.25em minmax\(0, 1fr\);[^}]*gap: 6px;/);
assert.match(html, /\.sh-coc-wealth-currency-value \{[^}]*display: inline-flex;[^}]*justify-content: center;[^}]*max-width: 100%;[^}]*white-space: nowrap;/);
assert.match(html, /\.sh-coc-wealth-value-cell \{[^}]*padding-inline: 4px;/);
assert.match(stats, /function wealthValueCell\(value, extraCls\)[\s\S]*?buildCoc7eWealthValueHtml\(value\)/);
assert.match(html, /function setWealthValue\(selector, value\)[\s\S]*?el\.innerHTML = buildCoc7eWealthValueHtml\(value\)/);
assert.match(html, /setWealthValue\('\.sh-coc-wealth-spending-usd', derived\.wealth\.spendingLevel\.usd\)/);
assert.match(html, /data-section-id="weapons"\]\s*\{ table-layout: fixed; \}/);
assert.match(html, /data-section-id="weapons"\]\s+thead th \{ text-align: center; \}/);
assert.match(html, /data-section-id="weapons"\]\s*> \.sh-section-hd \{ text-align: center; \}/);
assert.match(html, /data-section-id="weapons"\]\s+tbody td \{ border-bottom: none; \}/);
assert.match(html, /\.ch-sheet-modal\.sheet-wide-coc7e \{ overflow-x: auto; \}/);
assert.match(html, /\.ch-sheet-modal\.sheet-wide-coc7e \.ch-sheet-body \{ width: 1220px; min-width: 1220px; max-width: 1220px;/);
assert.match(html, /\.ch-sheet-modal\.sheet-wide-coc7e \.sh-section-hd,[\s\S]*?font-size: 14px; font-weight: 800; text-align: center;/);
assert.match(html, /\.sh-coc-skills-table \.sk-row\.is-growth-selected > td \{ background: #ececec; \}/);
assert.match(html, /\.sk-chk \{ display: block; margin: 0 auto; cursor: pointer; \}/);
assert.match(html, /classList\.toggle\(\\"is-growth-selected\\",this\.checked\)/);
assert.match(html, /tpl\.key === 'numenera' \|\| tpl\.key === 'cypher' \|\| tpl\.key === 'coc7e'/);
assert.match(html, /\.sh-coc-attrs-grid \{[^}]*repeat\(3, minmax\(0, 1fr\)\)/);
assert.match(html, /\.sh-coc-skills-table \.is-negative \{ color: #dc2626 !important; \}/);
assert.match(html, /function openCocSkillMemoMenu\(event, chId, sheetId, sectionId, fieldId, skillName\)/);
assert.match(html, /--coc-skill-name-width:' \+ Math\.max\(18, getCoc7eSkillNameColumnWidth\(sectionData\)\) \+ 'ch/);
assert.match(html, /name: '비무장'[^\n]*era: ''/);

const ledgerAmountFunctions = html.slice(html.indexOf('function normalizeCocWealthLedgerAmount'), html.indexOf('function buildCoc7eWealthCurrencyRow'));
const ledgerAmountContext = {};
vm.runInNewContext(`${ledgerAmountFunctions}\nresult = { formatted: formatCocWealthLedgerAmount('1234567.50'), totals: getCocWealthLedgerTotals([{ income: '1,200', expense: '200', balance: '1000' }, { income: '300.5', expense: '50.5', balance: '250' }]) };`, ledgerAmountContext);
assert.equal(ledgerAmountContext.result.formatted, '1,234,567.50');
assert.deepEqual({ ...ledgerAmountContext.result.totals }, { income: 1500.5, expense: 250.5, balance: 1250 });
assert.match(stats, /type="text" inputmode="decimal"[\s\S]*?onblur="this\.value=formatCocWealthLedgerAmount\(this\.value\)"/);

const ledgerRowsFunction = html.slice(html.indexOf('function normalizeCocWealthLedgerRows'), html.indexOf('function normalizeCocOccupationType'));
const ledgerCurrencyFunction = html.match(/function normalizeCocWealthLedgerCurrency\(value\) \{[\s\S]*?\n\}/)?.[0];
const ledgerCrudFunctions = html.slice(html.indexOf('function saveCocWealthLedgerCell'), html.indexOf('// 반복 섹션 셀 저장'));
const ledgerContext = {
  state: { characters: [{ id: 'ch', sheets: [{ id: 'sheet', data: { stats: { wealthLedger: [
    { usage: 'A', income: '', expense: '', balance: '' },
    { usage: 'B', income: '', expense: '', balance: '' },
  ] } } }] }] },
  persistCalls: 0,
  renderCalls: 0,
  setTimeout() {},
};
ledgerContext.persist = () => { ledgerContext.persistCalls += 1; };
ledgerContext.renderCharacterSheet = () => { ledgerContext.renderCalls += 1; };
vm.runInNewContext(`${ledgerRowsFunction}\n${ledgerCurrencyFunction}\n${ledgerCrudFunctions}`, ledgerContext);
assert.equal(ledgerContext.normalizeCocWealthLedgerRows(undefined).length, 3);
assert.equal(ledgerContext.normalizeCocWealthLedgerRows([]).length, 1);
ledgerContext.insertCocWealthLedgerRow('ch', 'sheet', 'stats', 1);
assert.deepEqual(Array.from(ledgerContext.state.characters[0].sheets[0].data.stats.wealthLedger, row => row.usage), ['A', '', 'B']);
ledgerContext.setCocWealthLedgerCurrency('ch', 'sheet', 'stats', 'usd');
assert.equal(ledgerContext.state.characters[0].sheets[0].data.stats.wealthLedgerCurrency, 'usd');
ledgerContext.deleteCocWealthLedgerRow('ch', 'sheet', 'stats', 0);
assert.deepEqual(Array.from(ledgerContext.state.characters[0].sheets[0].data.stats.wealthLedger, row => row.usage), ['', 'B']);
assert.equal(ledgerContext.persistCalls, 3);
assert.equal(ledgerContext.renderCalls, 3);

const currencyFormatter = html.match(/function formatCoc7eCurrencyAmount\(amount, symbol, suffix\) \{[\s\S]*?\n\}/)?.[0];
const currencyContext = {};
vm.runInNewContext(`${currencyFormatter}\nresult = formatCoc7eCurrencyAmount(1500, '$', '');`, currencyContext);
assert.equal(currencyContext.result, '$\u00a0\u00a01,500');
const wealthValueBuilder = html.match(/function buildCoc7eWealthValueHtml\(value\) \{[\s\S]*?\n\}/)?.[0];
const wealthValueContext = { esc: value => String(value) };
vm.runInNewContext(`${wealthValueBuilder}\nresult = buildCoc7eWealthValueHtml('$ 200');`, wealthValueContext);
assert.match(wealthValueContext.result, /sh-coc-wealth-currency-symbol">\$<[\s\S]*?sh-coc-wealth-currency-amount">200</);

const wealthLevelFunctions = html.slice(html.indexOf('function getCoc7eWealthTier'), html.indexOf('function calcCoc7eWealthInfo'));
const wealthLevelContext = {};
vm.runInNewContext(`function parseCocSheetNumber(value) { return Number(value) || 0; }\n${wealthLevelFunctions}\nresult = [0, 1, 9, 10, 49, 50, 89, 90, 98, 99].map(value => getCoc7eWealthLevelLabel(getCoc7eWealthTier(value)));`, wealthLevelContext);
assert.deepEqual(Array.from(wealthLevelContext.result), ['무일푼', '가난', '가난', '보통', '보통', '부유', '부유', '자산가', '자산가', '갑부']);
assert.match(wealthLevelFunctions, /average: '하루 3끼, 간간이 호사, 적당히 안락\.'/);
assert.match(stats, /sh-coc-wealth-desc-sub/);
assert.match(html, /\.sh-coc-wealth-desc-sub \{[^}]*font-weight: 400;/);
assert.match(stats, /data-coc-ledger-currency=/);
assert.match(stats, /sh-coc-balance-unit/);
assert.match(stats, /openCocWealthLedgerRowMenu/);
assert.match(stats, /openCocWealthLedgerCurrencyMenu/);
assert.match(html, /function normalizeCocWealthLedgerCurrency\(value\)[\s\S]*?return \['krw', 'usd', 'jpy'\]\.includes\(value\) \? value : 'krw'/);
assert.match(html, /label: '원화 \(₩\)'[\s\S]*?label: '달러 \(\$\)'[\s\S]*?label: '엔화 \(¥\)'/);
assert.match(html, /label: '위에 삽입'[\s\S]*?label: '아래에 삽입'[\s\S]*?label: '행 삭제'/);

const skillsPreset = html.match(/const _COC7E_SKILLS_PRESET = \[[\s\S]*?\n\];/)?.[0];
assert.ok(skillsPreset, 'CoC 7판 기능 프리셋을 찾을 수 없습니다.');
const skillsContext = {};
vm.runInNewContext(`${skillsPreset}\nresult = _COC7E_SKILLS_PRESET;`, skillsContext);
assert.equal(Array.from(skillsContext.result).find(skill => skill.id === 'sleight').name, '말재주');
assert.match(html, /sk\.id === 'creditRating' \|\| sk\.id === 'cthulhuMythos'/);

const supportSection = html.slice(html.indexOf('function renderCoc7eGearRelationsSection'), html.indexOf('// ── D&D 5판 캐릭터 빌더'));
assert.match(supportSection, /listId === 'possessions' && rightFieldId === 'effect'/);
assert.match(supportSection, /<textarea class="sh-coc-support-input sh-coc-support-textarea sh-field-textarea"[\s\S]*?data-auto-grow="1"[\s\S]*?autoResizeSheetTextarea\(this\)/);
assert.match(supportSection, /openCocSupportRowMenu/);
assert.match(supportSection, /oncontextmenu=/);
assert.doesNotMatch(supportSection, /class="sh-coc-support-add"/);
assert.doesNotMatch(supportSection, /class="sh-coc-support-del"/);
assert.match(html, /\.sh-coc-support-input\.sh-coc-support-textarea \{[^}]*min-height: 31px;[^}]*overflow: hidden;/);
assert.match(html, /customType: 'coc7e-gear-relations', rowCount: 3/);

const backstoryTemplate = html.slice(html.indexOf("{ id: 'backstory'"), html.indexOf("  sw25:"));
['appearance', 'injuriesScars', 'traits', 'phobiasObsessions', 'ideology', 'mythBooksSpellsArtifacts', 'importantPeople', 'encounters', 'meaningfulPlaces', 'strangeExperiences', 'treasuredPossessions', 'other'].forEach(fieldId => {
  assert.match(backstoryTemplate, new RegExp("id: '" + fieldId + "'[^\\n]*autoGrow: true"), `${fieldId} 입력칸은 자동으로 높이가 늘어나야 합니다.`);
});
assert.match(html, /tpl\.key === 'coc7e' && sec\.id === 'backstory' \? ' sh-coc-backstory-grid'/);
assert.match(html, /\.sh-coc-backstory-grid \{ row-gap: 18px; align-items: stretch; \}/);
assert.match(html, /\.sh-coc-backstory-grid \.sh-field-textarea \{ flex: 1 1 auto; \}/);

assert.match(html, /const title = ch\.name \|\| '캐릭터';/);
assert.match(html, /function addStandaloneCocSkill\(button\)/);
assert.match(html, /function openStandaloneCocLedgerRowMenu\(event, row\)/);
assert.match(html, /function openStandaloneCocSupportRowMenu\(event, row\)/);
assert.match(html, /function openStandaloneCocLedgerCurrencyMenu\(event, button\)/);
assert.doesNotMatch(html, /function addStandaloneCocLedgerRow\(button\)/);
assert.doesNotMatch(html, /function addStandaloneCocSupportRow\(button\)/);
assert.match(html, /\.sh-coc-skills-wrap table \{ table-layout:fixed; \}/);
assert.match(html, /\.sk-add-btn'\)\.forEach\(el => el\.setAttribute\('onclick', 'addStandaloneCocSkill\(this\)'\)\)/);
assert.match(html, /\.sh-coc-balance-table tbody tr'\)\.forEach\(el => el\.setAttribute\('oncontextmenu', 'return openStandaloneCocLedgerRowMenu\(event,this\)'\)\)/);
assert.match(html, /\.sh-coc-support-table tbody tr'\)\.forEach\(el => el\.setAttribute\('oncontextmenu', 'return openStandaloneCocSupportRowMenu\(event,this\)'\)\)/);

const eraNormalizer = html.match(/function normalizeCoc7eEraType\(value\) \{[\s\S]*?\n\}/)?.[0];
assert.ok(eraNormalizer, 'CoC 시대 유형 정규화 함수를 찾을 수 없습니다.');
const eraContext = {};
vm.runInNewContext(`${eraNormalizer}\nresult = ['', '1920년대', '현대', '기타', '1890년대'].map(normalizeCoc7eEraType);`, eraContext);
assert.deepEqual(Array.from(eraContext.result), ['1920년대', '1920년대', '현대', '기타', '기타']);

const backstoryTables = html.match(/const _COC7E_BACKSTORY_TABLES = \{[\s\S]*?\n\};/)?.[0];
const randomBackstory = html.slice(html.indexOf('function getRandomCoc7eBackstoryText'), html.indexOf('function parseCocSheetNumber'));
assert.ok(backstoryTables && randomBackstory, 'CoC 7판 백스토리 굴림 코드를 찾을 수 없습니다.');
const deterministicMath = Object.create(Math);
deterministicMath.random = () => 0;
const randomContext = { Math: deterministicMath };
vm.runInNewContext(`${backstoryTables}\n${randomBackstory}\nresult = {
  traits: getRandomCoc7eBackstoryText('traits'),
  ideology: getRandomCoc7eBackstoryText('ideology'),
  importantPeople: getRandomCoc7eBackstoryText('importantPeople')
};`, randomContext);
assert.equal(randomContext.result.traits, '긍정적이고 낙천적임');
assert.ok(!randomContext.result.ideology.startsWith('당신의 사상/신념은 무엇인가요?'));
assert.equal(randomContext.result.importantPeople, '나 자신(!)\n\n갚을 은혜가 있습니다');

const makeInput = (value, selector = '') => ({ value: String(value), matches: query => query.split(',').includes(selector) });
const makeCell = () => ({ textContent: '' });
const makeRow = (base, job, interest, growth, editableBase = false) => {
  const fields = {
    '.sk-base-input': editableBase ? makeInput(base) : null,
    '.sk-job': makeInput(job, '.sk-job'),
    '.sk-interest': makeInput(interest, '.sk-interest'),
    '.sk-growth': makeInput(growth, '.sk-growth'),
    '.sk-final-cell': makeCell(),
    '.sk-half-cell': makeCell(),
    '.sk-fifth-cell': makeCell(),
  };
  return { dataset: { base: String(base) }, querySelector: selector => fields[selector] || null, fields };
};
const rows = [makeRow(5, 12, 3, 0), makeRow(1, 8, 4, 2, true)];
const totals = {
  '.sk-job-max': makeInput(100), '.sk-interest-max': makeInput(50), '.sk-growth-max': makeInput(10),
  '.sk-job-used': makeCell(), '.sk-job-remain': makeCell(), '.sk-interest-used': makeCell(), '.sk-interest-remain': makeCell(),
  '.sk-growth-used': makeCell(), '.sk-growth-remain': makeCell(), '.sk-grand-max': makeCell(), '.sk-total': makeCell(), '.sk-remain': makeCell(),
};
const section = {
  querySelector: selector => totals[selector] || null,
  querySelectorAll: selector => selector === '.sk-row' ? rows : rows.map(row => row.fields[selector]).filter(Boolean),
};
let inputHandler;
const context = {
  document: {
    querySelector: () => ({ closest: () => section }),
    querySelectorAll: () => [],
    addEventListener: (type, handler) => { if (type === 'input') inputHandler = handler; },
    body: { dataset: {} },
  },
};
vm.runInNewContext(exported, context);
rows[0].fields['.sk-job'].value = '20';
inputHandler({ target: rows[0].fields['.sk-job'] });
assert.equal(totals['.sk-job-used'].textContent, 28);
assert.equal(totals['.sk-interest-used'].textContent, 7);
assert.equal(totals['.sk-growth-used'].textContent, 2);
assert.equal(totals['.sk-total'].textContent, 37);
assert.equal(totals['.sk-remain'].textContent, 123);
assert.equal(rows[0].fields['.sk-final-cell'].textContent, 28);

const supportFunctions = html.slice(html.indexOf('function getCoc7eSupportLegacyLines'), html.indexOf('function handleCocSupportCellKeydown'));
const supportContext = {
  state: { characters: [{ id: 'ch', sheets: [{
    id: 'sheet', templateKey: 'coc7e', data: { gearRelations: {
      equipment: [{ name: 'A', effect: '1' }, { name: 'B', effect: '2' }, { name: 'C', effect: '3' }],
    } },
  }] }] },
  SHEET_TEMPLATES: { coc7e: { sections: [{ id: 'gearRelations', rowCount: 3 }] } },
  persistCalls: 0,
  renderCalls: 0,
  setTimeout() {},
};
supportContext.persist = () => { supportContext.persistCalls += 1; };
supportContext.renderCharacterSheet = () => { supportContext.renderCalls += 1; };
vm.runInNewContext(supportFunctions, supportContext);
supportContext.insertCocSupportRow('ch', 'sheet', 'gearRelations', 'equipment', 1, 'name');
assert.deepEqual(Array.from(supportContext.state.characters[0].sheets[0].data.gearRelations.equipment, row => row.name), ['A', '', 'B', 'C']);
supportContext.deleteCocSupportRow('ch', 'sheet', 'gearRelations', 'equipment', 2);
assert.deepEqual(Array.from(supportContext.state.characters[0].sheets[0].data.gearRelations.equipment, row => row.name), ['A', '', 'C']);
assert.equal(supportContext.persistCalls, 2);
assert.equal(supportContext.renderCalls, 2);

console.log('CoC 7e sheet checks: OK');
