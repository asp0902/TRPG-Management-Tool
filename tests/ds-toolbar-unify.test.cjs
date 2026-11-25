const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13, 10)).join(String.fromCharCode(10));
let f = 0; const ok = (c, m) => { if (!c) { f++; console.log('FAIL', m); } else console.log('ok', m); };
const fn = html.slice(html.indexOf('function ds_renderFormatToolbar'), html.indexOf('function ds_textAlignLabel'));
// 데이터 시트 서식 도구는 본문 툴바 클래스 재사용(#385)
ok(['tb-btn', 'tb-sep', 'tb-color-btn', 'tb-color-bar', 'tb-size-stepper', 'tb-size-inp', 'tb-font-trigger', 'tb-font-menu', 'tb-lh-wrap', 'tb-select-lh', 'tb-control-chevron'].every(c => fn.includes(c)), '본문 툴바 클래스 재사용');
const order = ['ds-undo-btn', 'ds-font-trigger', 'ds-size-dec-btn', 'ds-bold-btn', 'ds-italic-btn', 'ds-underline-btn', 'ds-strike-btn', 'ds-clear-format-btn', 'ds-color-btn', 'ds-bg-btn', "picker('halign'", "picker('valign'", "picker('wrap'", 'ds-lh-select', 'ds-ruby-btn', 'ds-header-axis-btn'].map(k => fn.indexOf(k));
ok(order.every((v, i) => v >= 0 && (i === 0 || v > order[i - 1])), '순서: 실행취소|글꼴·크기|B I U S 지우기|색|맞춤·줄바꿈·줄간격|루비|축 전환');
ok(!/ds-color-menu|ds-bg-menu|ds-color-swatches/.test(fn) && fn.includes("ds_openCellColorPanel("), "색 버튼은 색상 패널을 바로 연다(자체 스와치 메뉴 제거)");
ok(/<select id="ds-font-select" hidden/.test(fn) && /function ds_toggleFontMenu/.test(html) && /function ds_chooseFont/.test(html), '글꼴: 숨은 select + 본문식 드롭다운');
ok(/\.ds-format-toolbar \{[^}]*height: 37px;/.test(html) && /\.ds-format-toolbar \{[^}]*padding: 0 10px;/.test(html) && /\.ds-format-toolbar-group \{[^}]*gap: 1px;/.test(html), '바 높이·여백·간격 = 본문 .tb-bar');
ok(!/\.ds-format-btn \{ width: 40px/.test(html) && !/\.ds-format-btn\.active/.test(html), '옛 박스 버튼 스타일 제거(활성색은 .tb-btn.active)');
ok(/\.ds-format-menu \{[^}]*border: 1px solid #bbb;[^}]*border-radius: 4px;/.test(html), '드롭다운 메뉴 테두리·모서리 = 본문 팝업');
ok(['ds-bold-btn', 'ds-italic-btn', 'ds-underline-btn', 'ds-strike-btn', 'ds-color-btn', 'ds-bg-btn', 'ds-size-input', 'ds-lh-select', 'ds-font-select', 'ds-halign-btn', 'ds-valign-btn', 'ds-wrap-btn', 'ds-ruby-btn', 'ds-header-axis-btn', 'ds-undo-btn', 'ds-redo-btn'].every(id => html.includes(id)), '기존 id 유지');
process.exit(f ? 1 : 0);
