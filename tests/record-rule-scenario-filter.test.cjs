const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('TRPG 작업 관리 도구.html', 'utf8');
assert.match(html, /ruleInput\.addEventListener\('change', updateRecordScenarioOptions\)/);
assert.match(html, /'<option value="">직접 입력<\/option>'/);
assert.match(html, /renderRecordScenarioOptions\(recordRule, sourceRecord\?\.scenarioId \|\| '', true\)/);

const normalizeFn = html.match(/function normalizeRecordRuleKey\(value\) \{[\s\S]*?\n\}/)?.[0];
const matchFn = html.match(/function recordScenarioMatchesRule\(scenario, rule\) \{[\s\S]*?\n\}/)?.[0];
assert.ok(normalizeFn && matchFn);
const context = {};
vm.createContext(context);
vm.runInContext(`${normalizeFn};${matchFn};this.matches=recordScenarioMatchesRule;`, context);

assert.equal(context.matches({ info: { rule: 'Call of Cthulhu 7th Edition' } }, 'CoC 7판'), true);
assert.equal(context.matches({ info: { rule: 'inSANe' } }, '인세인'), true);
assert.equal(context.matches({ info: { rule: '언성 듀엣' } }, 'CoC 7판'), false);
assert.equal(context.matches({ info: { rule: '언성 듀엣' } }, ''), true);

console.log('record rule scenario filter checks: OK');
