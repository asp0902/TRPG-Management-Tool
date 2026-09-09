const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');
const cypherStart = html.indexOf("  cypher: {");
const skillsStart = html.indexOf("{ id: 'skills'", cypherStart);
const skillsEnd = html.indexOf("{ id: 'abilities'", skillsStart);
const skills = html.slice(skillsStart, skillsEnd);
const optionSource = skills.match(/id: 'level'[\s\S]*?options: \[([^\]]+)\]/)?.[1] || '';
const options = Array.from(optionSource.matchAll(/'([^']+)'/g), match => match[1]);

assert.deepEqual(options, [
  '미숙 INABILITY',
  '연습함 PRACTICED',
  '훈련됨 TRAINED',
  '전문화됨 SPECIALIZED',
  '전문가 EXPERT',
]);
assert.match(html, /'무능 \(Inability\)': '미숙 INABILITY'/);
assert.match(html, /'전문화 \(Specialized\)': '전문화됨 SPECIALIZED'/);

const cyphersStart = html.indexOf("{ id: 'cyphers'", cypherStart);
const cyphersEnd = html.indexOf("{ id: 'artifacts'", cyphersStart);
const cyphers = html.slice(cyphersStart, cyphersEnd);
assert.match(cyphers, /id: 'cyphers', label: '사이퍼 CYPHERS'/);
assert.match(cyphers, /id: 'form', label: '형태', type: 'select', options: \['미지정 Unspecified', '사이퍼 Cypher', '발현 Manifest'\]/);
assert.match(cyphers, /id: 'powerTier', label: '등급', type: 'select', options: \['등급 없음 NO POWER TIER', '하급 LOW', '중급 MEDIUM', '상급 HIGH', '고급 ADVANCED', '최상급 ULTRA', '규격 외 NONSTANDARD'\]/);
assert.match(cyphers, /optionLabels: \['미지정', '사이퍼', '발현'\], optionPopup: true/);
assert.match(cyphers, /optionLabels: \['등급 없음', '하급', '중급', '상급', '고급', '최상급', '규격 외'\], optionPopup: true/);
assert.match(cyphers, /id: 'active', label: '활성화', type: 'checkbox'/);
assert.match(cyphers, /id: 'completed', label: '완료', type: 'checkbox'/);
assert.match(cyphers, /id: 'effect', label: '효과', type: 'textarea', autoGrow: true/);
assert.match(html, /data-section-id="cyphers"\]\s+th:nth-child\(2\)[\s\S]*?td:nth-child\(6\) \{ width: 52px; min-width: 52px; max-width: 52px;/);
assert.match(html, /data-section-id="cyphers"\]\s+td:nth-child\(4\) \{ width: 104px; \}/);
assert.match(html, /function openSheetOptionPopup\(event, title, options\)/);
assert.match(html, /isCompletedCypherRow[\s\S]*?class="is-complete"/);
assert.match(html, /tbody tr\.is-complete \.sh-repeat-input \{ color: #999; text-decoration: line-through; \}/);
assert.match(html, /data-section-id="cyphers"\]\s+tbody td \{ border-bottom: none; \}/);
assert.match(html, /isCypherItems = tpl\.key === 'cypher' && sec\.id === 'cyphers'/);
assert.match(html, /sh-cypher-count[\s\S]*?rows\.length[\s\S]*?aria-label="사이퍼 제한 개수"/);
assert.match(html, /saveSheetField[\s\S]*?"cypherMeta","limit",this\.value/);

console.log('cypher skill checks: OK');
