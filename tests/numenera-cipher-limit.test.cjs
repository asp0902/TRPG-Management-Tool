const fs = require('fs'), path = require('path'), vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13,10)).join(String.fromCharCode(10));
let f = 0; const ok = (c, m) => { if (!c) { f++; console.log('FAIL', m); } else console.log('ok', m); };
const a = html.indexOf("key: 'numenera'"), seg = html.slice(a, html.indexOf("key: 'cypher'", a));
ok(!/id: 'cipherLimit'[^\n]*type: 'number' \},\n      \]\},/.test(seg.split("id: 'pools'")[0]) && !seg.split("id: 'pools'")[0].includes("id: 'cipherLimit'"), '기본 정보에서 사이퍼 한도 제거');
ok(seg.includes("{ id: 'cyphers', label: '사이퍼 Cyphers', repeatable: true, headerFields: [{ id: 'cipherLimit', label: '사이퍼 한도', type: 'number', dataSection: 'basic' }]"), '사이퍼 섹션 headerFields(저장 위치는 기존 basic.cipherLimit)');
['기술 Skills', '어빌리티 Abilities', '공격/무기 Attacks', '사이퍼 Cyphers', '아티팩트 Artifacts', '오디티 Oddities'].forEach(l => ok(seg.includes("label: '" + l + "'"), '섹션 이름 ' + l));
ok(!/label: '[^']*\((Skills|Abilities|Attacks|Cyphers|Artifacts|Oddities)\)'/.test(seg), '섹션 이름 괄호 제거');
ok(seg.includes("label: '티어 (Tier)'") && seg.includes("label: '소진 (Depletion)'"), '필드 라벨은 그대로');
const c = html.slice(html.indexOf("id: 'cyphers', label: '사이퍼 CYPHERS'"), html.indexOf("id: 'cyphers', label: '사이퍼 CYPHERS'") + 400);
ok(!c.includes('headerFields'), 'cypher 템플릿은 변경 없음');
// initSheetData: 새 시트도 basic.cipherLimit 준비, 기존 값은 보존
const code = html.slice(html.indexOf('function initSheetData'), html.indexOf('function normalizeArianrhod2eSheetData'));
const ctx = {}; vm.createContext(ctx); vm.runInContext(code + ';this.init=initSheetData', ctx);
const tpl = { sections: [{ id: 'basic', fields: [{ id: 'tier', type: 'number' }] }, { id: 'cyphers', repeatable: true, headerFields: [{ id: 'cipherLimit', dataSection: 'basic' }], fields: [] }] };
const d = ctx.init(tpl, '', '', '');
ok(d.basic.cipherLimit === '' && Array.isArray(d.cyphers), '새 시트: basic.cipherLimit 초기화·표는 배열 그대로');
ok(html.includes("saveSheetField(' + JSON.stringify(chId) + ',' + JSON.stringify(sheetId) + ',' + JSON.stringify(hfSec) + ',' + JSON.stringify(hf.id) + ',this.value)"), '머리 입력칸은 saveSheetField 로 기존 위치에 저장(값 보존)');
process.exit(f ? 1 : 0);
