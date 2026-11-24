const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('TRPG 작업 관리 도구.html', 'utf8');
const extract = name => html.match(new RegExp(`function ${name}\\([^]*?\\n\\}`))[0];
const insert = extract('tbInsertTable');
const menu = extract('tbOpenTableMenu');

assert.match(html, /id="tb-table-btn"[^>]+title="표 만들기"/);
assert.match(insert, /target\?\.type !== 'ce'/);
assert.match(insert, /root\.closest\('#blocks-container,#rb-blocks-container'\)/);
assert.match(insert, /range\.deleteContents\(\)/);
assert.match(insert, /range\.insertNode\(table\)/);
assert.match(insert, /root\.dispatchEvent\(new Event\('input'/);
assert.match(menu, /row <= 5/);
assert.match(menu, /column <= 5/);
assert.match(menu, /tbCloneFormatTarget\(tbResolveFormatTarget\(\)\)/);
assert.match(html, /\.tb-editor-table td[\s\S]*overflow-wrap: anywhere/);


// #361: 행·열 직접 입력
const vm = require('node:vm');
const clampCtx = {}; vm.createContext(clampCtx);
vm.runInContext(html.slice(html.indexOf('const TB_TABLE_MAX_ROWS'), html.indexOf('function tbOpenTableMenu')) + ';this.f={tbClampTableSize,R:TB_TABLE_MAX_ROWS,C:TB_TABLE_MAX_COLUMNS}', clampCtx);
const { tbClampTableSize: clamp, R, C } = clampCtx.f;
assert.equal(R, 50); assert.equal(C, 20);
assert.deepEqual([0, 999, '', '2.7', 'abc', null, -5, 7, ' 12 ', 50, 51].map(v => clamp(v, R)), [1, 50, 1, 2, 1, 1, 1, 7, 12, 50, 50], '행 보정(0·999·빈 값·소수·문자·음수)');
assert.deepEqual([0, 999, 21, 20, '8'].map(v => clamp(v, C)), [1, 20, 20, 20, 8], '열 보정(최대 20)');
assert.match(menu, /class="tb-table-rows"[^>]*value="3"/);
assert.match(menu, /class="tb-table-columns"[^>]*value="3"/);
assert.match(menu, /tb-table-make/);
assert.match(menu, /event\.key === 'Enter'[\s\S]*make\(\)/, 'Enter 로 만들기');
assert.match(menu, /rowsInput\.value = rows; columnsInput\.value = columns;/, '격자 hover 시 입력칸 동기화');
assert.match(menu, /tbInsertTable\(rows, columns, target\)/, '복제한 삽입 위치(target)에 tbInsertTable 로 삽입');
assert.match(menu, /window\.innerWidth - 244/, '넓어진 메뉴가 화면 밖으로 나가지 않게');
assert.match(menu, /tbInsertTable\(Number\(cell\.dataset\.row\), Number\(cell\.dataset\.column\), target\)/, '격자 클릭 기존 동작 유지');

console.log('editor table checks: OK');
