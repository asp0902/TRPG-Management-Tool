const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');

assert.match(
  html,
  /title="링크"[^>]*>[\s\S]*?<\/button>\s*<button[^>]*id="tb-quote-btn"[^>]*title="인용"/,
  '인용 버튼은 링크 버튼 바로 뒤에 있어야 합니다.',
);
assert.match(html, /li\|blockquote\|b/, '정보 탭 저장값은 blockquote를 HTML로 복원해야 합니다.');
assert.match(html, /function tbApplyQuoteBlockType\(root, range, tagName\)/, '인용 내부 문단 유형 적용 경로가 필요합니다.');
assert.match(
  html,
  /!tbApplyQuoteBlockType\(ce, range, val\)\) document\.execCommand\('formatBlock'/,
  '인용 외곽 블록은 formatBlock 교체 대상에서 제외해야 합니다.',
);
assert.match(html, /function makeQuoteChildBlockTargetKey\(/, '인용 전용 하위 블록 저장 경로가 필요합니다.');
assert.match(html, /function hydrateQuoteChildBlocks\(/, '저장된 하위 블록을 인용 안에 렌더해야 합니다.');
assert.match(
  html,
  /class="editor-quote-content">' \+ content \+ '<\/div>/,
  '인용 본문은 하위 블록과 분리된 편집 영역이어야 합니다.',
);
assert.match(html, /caret\.selectNodeContents\(quote\.querySelector\(':scope > \.editor-quote-content'\) \|\| quote\)/, '새 인용의 커서는 본문 안에 놓여야 합니다.');
assert.match(html, /const htmlRoot = quoteContent && root\.contains\(quoteContent\) \? quoteContent : root;/, '인용 본문만 들여쓰기해야 합니다.');
assert.match(
  html,
  /label: '하위 블록 추가',[\s\S]*?action: \(\) => insertQuoteChildBlock/,
  '인용 메뉴에서 하위 블록을 추가할 수 있어야 합니다.',
);
assert.match(
  html,
  /data-quote-id="' \+ quoteId \+ '"/,
  '새 인용에는 하위 블록 연결용 ID가 저장되어야 합니다.',
);
assert.match(
  html,
  /wrap\.querySelectorAll\('\.editor-quote-children'\)\.forEach\(node => node\.remove\(\)\)/,
  '렌더링 UI는 인용 원문 HTML에 저장되면 안 됩니다.',
);

const colorFunction = html.match(/function getQuoteTextColor\(background\) \{[\s\S]*?\n\}/)?.[0];
assert.ok(colorFunction, '인용 글자색 계산 함수를 찾을 수 없습니다.');
const context = {
  EDITOR_QUOTE_DEFAULT_BACKGROUND: '#303238',
  normalizePickerColor: color => color,
};
vm.runInNewContext(`${colorFunction}; result = [getQuoteTextColor('#ffffff'), getQuoteTextColor('#303238')];`, context);
assert.deepEqual(Array.from(context.result), ['#202124', '#f5f5f5']);

console.log('quote block checks: OK');
