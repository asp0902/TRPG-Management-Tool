const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('TRPG 작업 관리 도구.html', 'utf8');

assert.match(html, /const hasScenarioImage = !!String\(selectedScenario\?\.info\?\.sessionCard \|\| ''\)\.trim\(\)/);
assert.match(html, /row\.style\.display = isCustom \|\| !hasScenarioImage \? 'flex' : 'none'/);
assert.match(html, /customName\.style\.display = isCustom \? '' : 'none'/);
assert.match(html, /scenarioImage: document\.getElementById\('rf-scenario-image'\)\?\.value\.trim\(\) \|\| ''/);
assert.match(html, /scenario\?\.info\?\.sessionCard \|\| record\?\.scenarioImage/,
  'scenario image must keep priority over the record fallback');

console.log('linked scenario record image checks: OK');
