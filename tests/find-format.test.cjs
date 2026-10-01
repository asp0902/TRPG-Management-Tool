const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');

assert.match(html, /id="fr-format-font"[\s\S]*?id="fr-format-size"/);
assert.match(html, /찾아 바꾸기 \(Ctrl\+Shift\+F\)/);
assert.doesNotMatch(html, /찾아 바꾸기 \(Ctrl\+H\)/);
assert.match(html, /onclick="frFindAll\(\)">모두 찾기<\/button>/);
assert.match(html, /function frFindAll\(\)/);
assert.match(html, /function switchTab\(tab, keepFindHighlights = false\)/);
assert.match(html, /: document\.getElementById\('editor'\)/, 'SCRIPT 모두 찾기는 정보와 본문 탭을 함께 검색해야 합니다.');
assert.match(html, /switchTab\('info', true\)[\s\S]*?switchTab\('body', true\)/, '다음 찾기는 다른 SCRIPT 탭의 결과도 표시해야 합니다.');
assert.match(html, /CSS\.highlights\.set\('trpg-find-all', new Highlight/);
assert.match(html, /function frClearFindHighlights\(preserveSelection = false\)/);
assert.match(html, /window\.getSelection\?\.\(\)\?\.removeAllRanges\?\.\(\)/);
assert.match(html, /function frResetStatus\(\) \{[\s\S]*?frClearFindHighlights\(true\)/, '입력 중 IME selection을 제거하면 안 됩니다.');
assert.match(html, /function closeFindReplace\(\) \{[\s\S]*?frClearFindHighlights\(\)/);
assert.doesNotMatch(html, /window\.find\(term/);
assert.match(html, /e\.shiftKey && !e\.altKey && e\.key\.toLowerCase\(\) === 'f'/);
assert.match(html, /\.fr-format-wrap > \.fr-row select, \.fr-format-wrap > \.fr-row input\[type="number"\] \{ height: 30\.6667px; box-sizing: border-box; \}/);
assert.match(html, /#fr-panel #fr-format-font, #fr-panel #fr-format-size \{[\s\S]*?border: 1px solid #e4e4e4; border-radius: 5px;[\s\S]*?text-align: center;/);
assert.match(html, /#fr-panel #fr-format-font \{ padding: 0 26px 0 0; text-align-last: center; text-indent: 13px; \}/);
assert.match(html, /#fr-panel #fr-format-size \{ width: 68px; padding: 0; \}/);
assert.match(html, /#fr-panel \.fr-format-color \{ width: 30\.6667px; height: 30\.6667px; aspect-ratio: 1;/);
assert.match(html, /#fr-panel \.fr-format-color::-webkit-color-swatch-wrapper \{ padding: 0; \}/);
assert.match(html, /id="fr-format-bold"[\s\S]*?id="fr-format-italic"[\s\S]*?id="fr-format-underline"[\s\S]*?id="fr-format-color-enabled"/);
assert.match(html, /onclick="frApplyFormat\(false\)">현재 결과 서식/);
assert.match(html, /onclick="frApplyFormat\(true\)">전체 결과 서식/);
assert.match(html, /span\.appendChild\(match\.range\.extractContents\(\)\)/, '검색 문자열을 바꾸지 않고 기존 내용을 감싸야 합니다.');
assert.match(html, /changed\.forEach\(editable => editable\.dispatchEvent\(new Event\('input'/, '기존 편집 저장 경로를 사용해야 합니다.');

const fn = html.match(/function frApplyFormat\(all = false\) \{[\s\S]*?\n\}/)?.[0];
assert.ok(fn, '서식 적용 함수를 찾을 수 없습니다.');

const calls = [];
const makeMatch = name => ({
  editable: { dispatchEvent: () => calls.push(`input:${name}`) },
  range: {
    extractContents: () => ({ textContent: name }),
    insertNode: span => calls.push(`insert:${span.child.textContent}:${span.style.cssText}`),
  },
});
const matches = [makeMatch('첫 결과'), makeMatch('둘째 결과')];
const context = {
  document: {
    getElementById: id => id === 'fr-find' ? { value: '결과' } : null,
    createElement: () => ({ style: { cssText: '' }, appendChild(child) { this.child = child; } }),
  },
  window: { getSelection: () => null },
  Event: function Event() {},
  frGetFormatStyle: () => 'font-weight:bold;color:#ff0000',
  frCollectFormatMatches: () => matches,
  frGetFormatRoots: () => matches.map(match => match.editable),
  frClearFindHighlights: () => calls.push('clear-highlights'),
  frSetStatus: message => calls.push(`status:${message}`),
  persist: () => calls.push('persist'),
};
vm.createContext(context);
vm.runInContext(`${fn}; this.run = frApplyFormat;`, context);

context.run(false);
assert.deepEqual(calls, [
  'clear-highlights',
  'insert:첫 결과:font-weight:bold;color:#ff0000',
  'input:첫 결과',
  'persist',
  'status:1개 결과에 서식 적용',
]);

calls.length = 0;
context.run(true);
assert.deepEqual(calls, [
  'clear-highlights',
  'insert:둘째 결과:font-weight:bold;color:#ff0000',
  'insert:첫 결과:font-weight:bold;color:#ff0000',
  'input:둘째 결과',
  'input:첫 결과',
  'persist',
  'status:2개 결과에 서식 적용',
]);

console.log('find format tests passed');
