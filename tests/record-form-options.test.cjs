const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');

assert.match(html, /<select class="record-form-select" id="rf-rule"><\/select>/, 'RECORD 룰은 select여야 합니다.');
assert.doesNotMatch(html, /시나리오명 \(직접 입력\)|직접 입력 ▼/, '직접 입력의 불필요한 라벨과 화살표 문자가 없어야 합니다.');
assert.match(html, /scenarios\.map\(sc => `<option[\s\S]*?getScenarioListTitle\(sc\)/, '시나리오 옵션은 공용 plain-text 제목을 써야 합니다.');
assert.match(html, /ruleInput\.innerHTML = catalogRuleOptionsHtml\(recordRule\)/, 'RECORD 룰은 카탈로그 룰 옵션 source를 써야 합니다.');
assert.match(html, /#rf-custom-name-row\s*\{\s*justify-content:\s*flex-end;/, '시나리오 직접 입력 행은 선택 필드 하단에 맞춰야 합니다.');
assert.match(html, /\.record-custom-scenario-fields\s*\{[^}]*align-items:\s*flex-end;/, '직접 입력과 대표 이미지 버튼은 하단 정렬해야 합니다.');

const titleStart = html.indexOf('function titlePlainText(str)');
const titleEnd = html.indexOf('\nfunction focusInfoTitleInput()', titleStart);
const titleContext = {};
vm.createContext(titleContext);
vm.runInContext(`${html.slice(titleStart, titleEnd)}\nthis.titlePlainText = titlePlainText;`, titleContext);
assert.equal(titleContext.titlePlainText('[거울위](https://example.com)'), '거울위');
assert.equal(titleContext.titlePlainText('[투파크](#"style= color:red;)'), '투파크');
assert.equal(titleContext.titlePlainText('![대표 이미지](https://example.com/a.png)'), '대표 이미지');

const rulesStart = html.indexOf('const CATALOG_RULES = [');
const rulesEnd = html.indexOf('\nconst CATALOG_LINK_LABEL_ICON_URL', rulesStart);
const rulesContext = { esc: value => String(value) };
vm.createContext(rulesContext);
vm.runInContext(`${html.slice(rulesStart, rulesEnd)}\nthis.render = catalogRuleOptionsHtml;`, rulesContext);
const standard = rulesContext.render('CoC 7판');
assert.match(standard, /value="CoC 7판" selected>CoC 7th<\/option>/);
const legacy = rulesContext.render('기존 사용자 룰');
assert.match(legacy, /value="기존 사용자 룰" selected hidden disabled>기존 사용자 룰<\/option>/, '기존 저장 룰을 표시해야 합니다.');

console.log('record form option checks: OK');
