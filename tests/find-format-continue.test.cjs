const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');

// 「현재 결과 서식」 뒤에도 다음 찾기가 이어진다(#181)
assert.match(html, /function frRestoreFindAfterFormat\(term, appliedSpan, wasAllActive\)/);
assert.match(html, /if \(!all && appliedSpan\?\.isConnected\) frRestoreFindAfterFormat\(term, appliedSpan, wasAllActive\);/, '전체 서식은 기존 동작(초기화) 유지');
assert.match(html, /frFindIndex = index;\s*const highlights/);
const body = html.slice(html.indexOf('function frRestoreFindAfterFormat'), html.indexOf('let frFindMatches = [];'));
assert.doesNotMatch(body, /scrollIntoView/, '서식 적용 뒤 스크롤하지 않는다');
console.log('find format continue checks: OK');
