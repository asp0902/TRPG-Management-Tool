const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');
const stats = html.slice(html.indexOf('function renderCoc7eStatsSection'), html.indexOf('// CoC 7판 기능 프리셋'));
const exportedHtml = process.env.COC7E_EXPORTED_HTML ? fs.readFileSync(process.env.COC7E_EXPORTED_HTML, 'utf8') : html;
const exported = exportedHtml.slice(exportedHtml.indexOf('function updateStandaloneCocSkills'), exportedHtml.indexOf('function saveStandaloneCharacterSheet'));

assert.match(stats, /sh-coc-stats-main[\s\S]*?attrsHtml[\s\S]*?miscRow[\s\S]*?sh-coc-derived-section/);
assert.match(html, /sh-coc-stats-main \.sh-coc-misc-row \{ grid-template-columns: repeat\(4, minmax\(0, 1fr\)\); margin-top: 16px; \}/);
assert.match(exported, /sum\('\.sk-job'\)[\s\S]*?sum\('\.sk-interest'\)[\s\S]*?sum\('\.sk-growth'\)/);
assert.match(exported, /set\('\.sk-job-used'[\s\S]*?set\('\.sk-interest-used'[\s\S]*?set\('\.sk-growth-used'[\s\S]*?set\('\.sk-total'/);
assert.match(html, /document\.addEventListener\('input'[\s\S]*?updateStandaloneCocSkills\(\)/);
assert.match(html, /if \(tpl\.key === 'coc7e'\)[\s\S]*?skillsSection\.after\(financeSection\)/);
assert.match(html, /\.sh-coc-skills-table \.sk-name-input\.is-emphasis \{ font-style: italic; \}/);
assert.match(html, /target\.closest\('#ch-sheet-body'\)\) return true/);

const ledgerAmountFunctions = html.slice(html.indexOf('function normalizeCocWealthLedgerAmount'), html.indexOf('function buildCoc7eWealthCurrencyRow'));
const ledgerAmountContext = {};
vm.runInNewContext(`${ledgerAmountFunctions}\nresult = formatCocWealthLedgerAmount('1234567.50');`, ledgerAmountContext);
assert.equal(ledgerAmountContext.result, '1,234,567.50');
assert.match(stats, /type="text" inputmode="decimal"[\s\S]*?onblur="this\.value=formatCocWealthLedgerAmount\(this\.value\)"/);

const skillsPreset = html.match(/const _COC7E_SKILLS_PRESET = \[[\s\S]*?\n\];/)?.[0];
assert.ok(skillsPreset, 'CoC 7판 기능 프리셋을 찾을 수 없습니다.');
const skillsContext = {};
vm.runInNewContext(`${skillsPreset}\nresult = _COC7E_SKILLS_PRESET;`, skillsContext);
assert.equal(Array.from(skillsContext.result).find(skill => skill.id === 'sleight').name, '말재주');
assert.match(html, /sk\.id === 'creditRating' \|\| sk\.id === 'cthulhuMythos'/);

const backstoryTemplate = html.slice(html.indexOf("{ id: 'backstory'"), html.indexOf("  sw25:"));
['appearance', 'injuriesScars', 'traits', 'phobiasObsessions', 'ideology', 'mythBooksSpellsArtifacts', 'importantPeople', 'encounters', 'meaningfulPlaces', 'strangeExperiences', 'treasuredPossessions', 'other'].forEach(fieldId => {
  assert.match(backstoryTemplate, new RegExp("id: '" + fieldId + "'[^\\n]*autoGrow: true"), `${fieldId} 입력칸은 자동으로 높이가 늘어나야 합니다.`);
});

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
    addEventListener: (type, handler) => { if (type === 'input') inputHandler = handler; },
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

console.log('CoC 7e sheet checks: OK');
