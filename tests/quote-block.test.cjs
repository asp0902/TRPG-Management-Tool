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

const colorFunction = html.match(/function getQuoteTextColor\(background\) \{[\s\S]*?\n\}/)?.[0];
assert.ok(colorFunction, '인용 글자색 계산 함수를 찾을 수 없습니다.');
const context = {
  EDITOR_QUOTE_DEFAULT_BACKGROUND: '#303238',
  normalizePickerColor: color => color,
};
vm.runInNewContext(`${colorFunction}; result = [getQuoteTextColor('#ffffff'), getQuoteTextColor('#303238')];`, context);
assert.deepEqual(Array.from(context.result), ['#202124', '#f5f5f5']);

console.log('quote block checks: OK');
