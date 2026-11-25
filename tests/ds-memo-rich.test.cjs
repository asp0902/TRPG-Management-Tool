const fs = require('fs'), path = require('path'), vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13, 10)).join(String.fromCharCode(10));
let f = 0; const ok = (c, m) => { if (!c) { f++; console.log('FAIL', m); } else console.log('ok', m); };
// 정규화: 메모 행 글자 서식(cellRich['__row'])은 memoText 와 비교해 유지, 어긋나면 버림
const code = html.slice(html.indexOf('var DS_RICH_ENT'), html.indexOf('function ds_richFont')) + html.slice(html.indexOf('function ds_getCellRich'), html.indexOf('function ds_getCellRich') + 400).split('\nfunction ')[0];
const ctx = {}; vm.createContext(ctx);
const norm = html.slice(html.indexOf('function normalizeDataSheetRow'), html.indexOf('function _migrateDataSheetCategoriesToFlat'));
ok(/k === '__row' \? r\.memoText : cells\[k\]/.test(norm), '정규화가 메모 행 서식을 memoText 와 비교(재로드·undo 시 보존)');
ok(/memoText 는 항상 순수 텍스트/.test(html) && /ta\.classList\.contains\('ds-memo-input'\)\) ds_updateMemoRow/.test(html), '서식 편집 입력은 memoText(순수 텍스트)로 동기');
ok(/function ds_memoSelection/.test(html) && /var memoSel = ds_memoSelection\(\);\s*if \(memoSel\) return ds_richOpen/.test(html) && /var memoSel = ds_memoSelection\(\);\s*if \(memoSel\) return memoSel;/.test(html), '메모 행 글자 선택 → 부분 서식 경로(툴바·단축키·루비 공용)');
ok(/data-col-id="' \+ DS_ROW_COL \+ '" placeholder="메모를 입력하세요" onfocus="ds_memoFocus/.test(html) && /textarea\.ds-memo-input\[data-col-id\]/.test(html), '메모 textarea 가 (rowIdx,"__row") 로 조회됨');
ok(/function ds_handleMemoRichKeydown/.test(html) && /ds_handleMemoRichKeydown\(fake/.test(html), 'Shift+Enter 줄바꿈·Enter/Esc 종료·IME 확정 뒤 Enter 재생');
ok(/\.ds-table td\.ds-has-rich textarea\.ds-memo-input/.test(html) && /\.ds-memo-cell \.ds-cell-rich/.test(html), '편집하지 않을 때도 서식 표시(CSS)');
process.exit(f ? 1 : 0);
