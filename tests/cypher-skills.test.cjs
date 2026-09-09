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
assert.match(skills, /label: '기능 SKILLS'/);
assert.match(skills, /id: 'level'[\s\S]*?optionLabels: \['미숙', '연습함', '훈련됨', '전문화됨', '전문가'\], optionPopup: true/);
assert.match(skills, /id: 'pool'[\s\S]*?optionLabels: \['없음', '힘', '속도', '지성'\], optionPopup: true/);
assert.match(skills, /id: 'asset', label: '보조'/);
assert.match(skills, /id: 'proficiency', label: '숙련도'/);
assert.match(skills, /id: 'source', label: '출처'/);
assert.match(skills, /id: 'note', label: '설명'/);

const abilitiesStart = html.indexOf("{ id: 'abilities'", skillsEnd);
const abilitiesEnd = html.indexOf("{ id: 'advancement'", abilitiesStart);
const abilities = html.slice(abilitiesStart, abilitiesEnd);
assert.match(abilities, /label: '어빌리티 ABILITIES'/);
assert.match(abilities, /id: 'cost', label: '비용', type: 'select', options: \['비용 없음 No cost', '고정 비용 Fixed', '가변 비용 Variable'\], optionLabels: \['없음', '고정', '가변'\], optionPopup: true/);
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
assert.match(html, /data-section-id="cyphers"\]\s+thead th \{ text-align: center; \}/);
assert.match(html, /data-section-id="cyphers"\]\s+td:nth-child\(1\) \{ width: 190px; \}/);
assert.match(html, /data-section-id="cyphers"\]\s+td:nth-child\(2\) \{ width: 52px; min-width: 52px; max-width: 52px;/);
assert.match(html, /data-section-id="cyphers"\]\s+td:nth-child\(6\) \{ width: 40px; min-width: 40px; max-width: 40px;/);
assert.match(html, /data-section-id="cyphers"\]\s+td:nth-child\(4\) \{ width: 104px; \}/);
assert.match(html, /function openSheetOptionPopup\(event, title, options\)/);
assert.match(html, /isCompletedCypherRow[\s\S]*?class="is-complete"/);
assert.match(html, /tbody tr\.is-complete \.sh-repeat-input \{ color: #999; text-decoration: line-through; \}/);
assert.match(html, /data-section-id="cyphers"\]\s+tbody td \{ border-bottom: none; \}/);
assert.match(html, /isCypherItems = tpl\.key === 'cypher' && sec\.id === 'cyphers'/);
assert.match(html, /sh-cypher-count[\s\S]*?rows\.length[\s\S]*?aria-label="사이퍼 제한 개수"/);
assert.match(html, /saveSheetField[\s\S]*?"cypherMeta","limit",this\.value/);
assert.match(html, /sh-cypher-status-row \{ display: grid; grid-template-columns: minmax\(320px, 1fr\) minmax\(0, 2fr\);/);
assert.match(html, /tpl\.key === 'cypher' && sec\.id === 'pools'[\s\S]*?renderNumeneraPoolsSection[\s\S]*?renderCypherDamageRecoverySection/);
assert.match(html, /tpl\.key === 'cypher' && sec\.id === 'damageRecovery'\) return ''/);

console.log('cypher skill checks: OK');
