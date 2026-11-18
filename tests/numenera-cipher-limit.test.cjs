const fs = require('fs'), path = require('path'), vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13,10)).join(String.fromCharCode(10));
let f = 0; const ok = (c, m) => { if (!c) { f++; console.log('FAIL', m); } else console.log('ok', m); };
const a = html.indexOf("key: 'numenera'"), seg = html.slice(a, html.indexOf("key: 'cypher'", a));
ok(!/id: 'cipherLimit'[^\n]*type: 'number' \},\n      \]\},/.test(seg.split("id: 'pools'")[0]) && !seg.split("id: 'pools'")[0].includes("id: 'cipherLimit'"), '기본 정보에서 사이퍼 한도 제거');
ok(seg.includes("{ id: 'cyphers', label: '사이퍼 CYPHERS', repeatable: true, headerFields: [{ id: 'cipherLimit', label: '한도', ariaLabel: '사이퍼 한도', type: 'number', dataSection: 'basic' }]"), '사이퍼 섹션 headerFields(저장 위치는 기존 basic.cipherLimit)');
['기술 SKILLS', '어빌리티 ABILITIES', '공격/무기 ATTACKS', '사이퍼 CYPHERS', '아티팩트 ARTIFACTS', '오디티 ODDITIES'].forEach(l => ok(seg.includes("label: '" + l + "'"), '섹션 이름 ' + l));
ok(!/label: '[^']*\((Skills|Abilities|Attacks|Cyphers|Artifacts|Oddities)\)'/.test(seg) && !/label: '[^']*\((Tier|XP|Effort|Shins|Armor|Damage Track|Depletion|Connections)\)'/.test(seg), '라벨 괄호 제거');
ok(['수식어 DESCRIPTOR ADJECTIVE', '종족 SPECIES OPTIONAL', '유형 TYPE NOUN', '특징 FOCUS VERB', '티어 TIER', '경험치 XP', '분발 EFFORT', '방어구 수치 ARMOR', '피해 단계 DAMAGE TRACK', '소진 DEPLETION', '관계 CONNECTIONS'].every(t => seg.includes("label: '" + t + "'")), '필드 라벨 새 표기(#321)');
ok(seg.includes("options: ['글레이브 (Glaive)'") && seg.includes("'정상 (Hale)'") && seg.includes("'훈련됨 (Trained)'") && seg.includes("'행동 (Action)'"), 'select 선택지 값은 변경 없음(저장 데이터)');
ok(html.includes("numeneraLabels ? '힘 MIGHT' : '힘 (Might)'") && html.includes("numeneraLabels ? '재능 EDGE' : '엣지 (Edge)'"), '스탯 풀 라벨: 누메네라만 새 표기, 사이퍼(transpose)는 그대로');
const cy = html.indexOf("key: 'cypher'"), ci = html.indexOf("id: 'cyphers', label: '사이퍼 CYPHERS'", cy), c = html.slice(ci, ci + 400);
ok(!c.includes('headerFields'), 'cypher 템플릿은 변경 없음');
// initSheetData: 새 시트도 basic.cipherLimit 준비, 기존 값은 보존
const code = html.slice(html.indexOf('function initSheetData'), html.indexOf('function normalizeArianrhod2eSheetData'));
const ctx = {}; vm.createContext(ctx); vm.runInContext(code + ';this.init=initSheetData', ctx);
const tpl = { sections: [{ id: 'basic', fields: [{ id: 'tier', type: 'number' }] }, { id: 'cyphers', repeatable: true, headerFields: [{ id: 'cipherLimit', dataSection: 'basic' }], fields: [] }] };
const d = ctx.init(tpl, '', '', '');
ok(d.basic.cipherLimit === '' && Array.isArray(d.cyphers), '새 시트: basic.cipherLimit 초기화·표는 배열 그대로');
ok(html.includes("saveSheetField(' + JSON.stringify(chId) + ',' + JSON.stringify(sheetId) + ',' + JSON.stringify(hfSec) + ',' + JSON.stringify(hf.id) + ',this.value)"), '머리 입력칸은 saveSheetField 로 기존 위치에 저장(값 보존)');
ok(!seg.split("id: 'pools'")[0].includes("id: 'shins'"), '기본 정보에 신스 없음(#323)');
ok(seg.includes("{ id: 'equipment', label: '장비/소지품', repeatable: true, pinnedRows: [{ id: 'shins', dataSection: 'basic', name: '쉰 SHINS', valueField: 'qty', type: 'text', descField: 'desc', descId: 'shinsDesc' }]"), '장비/소지품 표 고정 첫 행(저장은 basic.shins)');
ok(html.includes("<tbody>' + pinnedHtml + rowsHtml + '</tbody>") && html.includes('<tr class="sh-pinned-row"') && !html.includes('sh-pinned-row" draggable') , '고정 행은 일반 행 앞·드래그/삭제 컨트롤 없음');
{ const code2 = html.slice(html.indexOf('function initSheetData'), html.indexOf('function normalizeArianrhod2eSheetData')); const c2 = {}; vm.createContext(c2); vm.runInContext(code2 + ';this.init=initSheetData', c2);
  const d2 = c2.init({ sections: [{ id: 'basic', fields: [] }, { id: 'equipment', repeatable: true, pinnedRows: [{ id: 'shins', dataSection: 'basic' }], fields: [] }] }, '', '', '');
  ok(d2.basic.shins === '' && Array.isArray(d2.equipment) && d2.equipment.length === 0, '새 시트: basic.shins 준비·장비 행 배열에는 넣지 않음'); }
ok(html.includes("secHeaderHtml.replace('class=\"sh-section-hd\"', 'class=\"sh-section-hd sh-cypher-section-hd\"')") && html.includes('<span class="sh-hd-fields">') && !html.includes('sh-repeat-headfields'), '#326: 사이퍼 한도는 섹션 제목 줄 오른쪽 끝(표 위 줄 없음)');
ok(html.includes('class="sh-hd-field" onclick="event.stopPropagation()"') && html.includes('class="sh-cypher-limit-input"') && html.includes("aria-label=\"' + esc(hf.ariaLabel || hf.label)"), '#326: 제목 줄 클릭과 충돌 방지·사이퍼와 같은 입력 모양·aria-label 사이퍼 한도');
ok(/\.sh-hd-fields \{ margin-left: auto;/.test(html) && /\.sh-hd-field \{[^}]*text-transform: none;/.test(html), '#326: margin-left:auto·대문자 변환 영향 없음');
ok(seg.includes("{ id: 'qty', label: '수량', type: 'text', width: 56 }") && seg.includes("{ id: 'desc', label: '설명', type: 'text', width: '60%' }"), '#327: 누메네라 장비 수량 width 56·설명 60%');
ok(html.includes("typeof f.width === 'number') return '<th style=\"width:'") && html.includes("visibleFields.some(function(f) { return f.width; })"), '#327: 반복 표 필드 width 옵션(th·colgroup)');
ok(!/\{ id: '[a-z]+', label: '[^']*', type: '[a-z]+'[^}]*width:/.test(html.slice(html.indexOf("key: 'cypher'"), html.indexOf("key: 'cypher'") + 12000)) , '#327: 사이퍼 템플릿에는 width 없음');
ok(/\[data-template-key="numenera"\]\[data-section-id="equipment"\] td:nth-child\(2\) \.sh-repeat-input \{ display: block; width: 44px; margin: 0 auto; text-align: center;/.test(html), '#327: 수량 입력 가운데 정렬(고정 행 포함)');
ok(!seg.includes("{ id: 'background', label: '배경', columns: 2"), '#329: 누메네라 「배경」 섹션 제거');
{ const bs = seg.slice(0, seg.indexOf("id: 'pools'"));
  ok(['description', 'background', 'connections', 'notes'].every(id => new RegExp("\{ id: '" + id + "'[^\n]*type: 'textarea', keepGridWidth: true, colSpan: 2, dataSection: 'background' \}").test(bs)) && bs.indexOf("id: 'effort'") < bs.indexOf("id: 'description'"), '#329: 기본 정보 안 티어·경험치·분발 줄 아래에 2열 textarea 4개(저장 위치 background.*)'); }
ok(html.includes('var fieldDataSec = f.dataSection || sec.id;') && html.includes("JSON.stringify(fieldDataSec) + ',' + JSON.stringify(f.id)"), '#329: 일반 필드 dataSection 읽기·쓰기');
{ const code3 = html.slice(html.indexOf('function initSheetData'), html.indexOf('function normalizeArianrhod2eSheetData')); const c3 = {}; vm.createContext(c3); vm.runInContext(code3 + ';this.init=initSheetData', c3);
  const d3 = c3.init({ sections: [{ id: 'basic', fields: [{ id: 'description', type: 'textarea', dataSection: 'background' }, { id: 'tier', type: 'number' }] }] }, '', '', '');
  ok(d3.background && d3.background.description === '' && d3.basic.tier === '' && d3.basic.description === undefined, '#329: 새 시트 초기화는 dataSection 객체에'); }
ok(html.slice(html.indexOf("key: 'cypher'"), html.indexOf("key: 'cypher'") + 14000).includes("{ id: 'background', label: '배경 및 메모', columns: 2"), '#329: 사이퍼 템플릿 배경 섹션 불변');
ok(html.includes("<input class=\"sh-repeat-input sh-pinned-name\" type=\"text\" value=\"' + esc(pr.name) + '\" readonly tabindex=\"-1\"") && !html.includes('<span class="sh-pinned-name">') && !html.includes('.sh-pinned-row { background'), '#330: 쉰 행 이름은 일반 입력칸 모양 readonly·배경 제거');
ok(html.includes("pr.descField && f.id === pr.descField") && html.includes("JSON.stringify(prSec) + ',' + JSON.stringify(pr.descId) + ',this.value)"), '#330: 설명 편집 가능·basic.shinsDesc 저장');
ok(html.includes('.sh-repeat-table[data-template-key="numenera"][data-section-id="equipment"] td { border-bottom: none; }') && !/\.sh-repeat-table td \{[^}]*border-bottom: none/.test(html), '#330: 행 구분선 제거는 누메네라 장비/소지품 표만');
{ const code4 = html.slice(html.indexOf('function initSheetData'), html.indexOf('function normalizeArianrhod2eSheetData')); const c4 = {}; vm.createContext(c4); vm.runInContext(code4 + ';this.init=initSheetData', c4);
  const d4 = c4.init({ sections: [{ id: 'basic', fields: [] }, { id: 'equipment', repeatable: true, pinnedRows: [{ id: 'shins', dataSection: 'basic', descId: 'shinsDesc' }], fields: [] }] }, '', '', '');
  ok(d4.basic.shins === '' && d4.basic.shinsDesc === '', '#330: 새 시트 basic.shinsDesc 초기화'); }
process.exit(f ? 1 : 0);
