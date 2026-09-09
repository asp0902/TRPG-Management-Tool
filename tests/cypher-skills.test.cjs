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
assert.match(cyphers, /id: 'form', label: '형태', type: 'select', options: \['미지정 Unspecified', '사이퍼 Cypher', '발현 Manifest'\]/);
assert.match(cyphers, /id: 'active', label: '활성화', type: 'checkbox'/);

console.log('cypher skill checks: OK');
