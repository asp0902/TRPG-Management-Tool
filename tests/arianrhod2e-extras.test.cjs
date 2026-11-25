const fs = require('fs'), path = require('path'), vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13, 10)).join(String.fromCharCode(10));
let f = 0; const ok = (c, m) => { if (!c) { f++; console.log('FAIL', m); } else console.log('ok', m); };
const code = html.slice(html.indexOf('function ar2eInt'), html.indexOf('function _ar2eAbilityMods'));
const ctx = {}; vm.createContext(ctx);
vm.runInContext(code + ';this.f={ar2eFateMax,ar2eBonusTotals,ar2eSlTotals,ar2eSlCap,ar2eCarryTotals,ar2eSkillLine,ar2eItemLine,ar2eMemoLines,ar2eCombatTotals,ar2eDiceExpr}', ctx);
const F = ctx.f;
// 예시 캐릭터: 휴린 워리어/워리어, 보너스 근력2·재주2·감지1, 스킬 올라운드, 아이템 모험자 세트(5)·HP 포션(1)·MP 포션(1)
const sheet = {
  classes: { mainClass: '워리어', supportClass: '워리어' },
  skills: [
    { name: '올라운드', level: '2', slMax: '3', timing: '상시', target: '자신', range: '없음', cost: '-', roll: '', condition: '', critical: '' },
    { name: '무기 공격', level: '2', slMax: '2' }, { name: '화염 베기', level: '2', slMax: '2' }, { name: '방패 들기', level: '1', slMax: '2' },
  ],
  items: [{ name: '모험자 세트', count: '1', weight: '5' }, { name: 'HP 포션', count: '1', weight: '1' }, { name: 'MP 포션', count: '1', weight: '1' }],
  weapons: [{ name: '그레이트 소드', part: '양손', weight: '10' }, { name: '레더 재킷', part: '몸통', weight: '5' }],
};
// 1. 보너스 포인트
let b = F.ar2eBonusTotals([2, 2, 0, 0, 1, 0, 0]);
ok(b.total === 5 && b.max === 5 && !b.over && b.remain === 0, '보너스 5/5(근력2·재주2·감지1)');
b = F.ar2eBonusTotals([2, 2, 0, 0, 0, 0, 0]); ok(b.total === 4 && b.remain === 1 && !b.over, '4/5: 남은 1점, 경고 아님');
b = F.ar2eBonusTotals([3, 3, 0, 0, 0, 0, 0]); ok(b.total === 6 && b.over, '6/5: 초과 경고');
// 2. SL 총합
let sl = F.ar2eSlTotals(sheet);
ok(sl.total === 7 && sl.cap === 8 && !sl.overTotal && sl.overRows.length === 0, 'SL 7/8(기본 상한 8)');
sl = F.ar2eSlTotals({ skills: [{ level: '3', slMax: '2' }, { level: '2', slMax: '2' }], skillMeta: { slCap: '4' } });
ok(sl.total === 5 && sl.cap === 4 && sl.overTotal && sl.overRows.join() === '0', '직접 입력 상한 4 초과·개별 상한(slMax) 초과 행 표시');
ok(F.ar2eSlTotals({ skills: [{ sl: '2' }] }).total === 2 && F.ar2eSlCap({ skillMeta: { slCap: '' } }) === 8, '옛 sl 칸 호환, 빈 상한은 8');
// 3. 페이트
ok(F.ar2eFateMax(sheet) === 6, '워리어/워리어 페이트 6');
ok(F.ar2eFateMax({ classes: { mainClass: '메이지', supportClass: '서머너' } }) === 5 && F.ar2eFateMax({}) === 5, '메이지/서머너 페이트 5, 빈 시트 5');
ok(F.ar2eFateMax({ classes: { mainClass: 'A', supportClass: 'A' }, combat: { fateMax: '8' } }) === 8, '직접 입력한 값 우선(성장 반영)');
// 4. 휴대 중량
let c = F.ar2eCarryTotals(sheet, 12);
ok(c.carry === 7 && c.limit === 12 && !c.overCarry, '휴대 7/12(모험자 세트 5 + HP 포션 1 + MP 포션 1)');
ok(c.weapon === 10 && c.armor === 5 && c.overWeapon === false, '무기 10·방어구 5(근력 12 기준)');
c = F.ar2eCarryTotals(sheet, 5); ok(c.overWeapon && !c.overArmor, '근력 기본치 5 초과 시 무기 중량 경고(합계 10 / 5)');
c = F.ar2eCarryTotals({ items: [{ weight: '3', count: '4' }, { weight: '2' }] }, 10); ok(c.carry === 14 && c.overCarry, '중량×개수 합계, 개수 비면 1, 초과 경고');
const noEq = JSON.parse(JSON.stringify(sheet)); noEq.weapons[0].equipped = false;
ok(F.ar2eCarryTotals(noEq, 12).weapon === 0, '장착 해제한 무기는 중량 합계 제외');
c = F.ar2eCarryTotals({ items: [{ weight: '9' }], modifiers: { carryWeight: '3', carryLimit: '6' } }, 12);
ok(c.carry === 3 && c.limit === 6, '기존 수동 입력(적재 중량·중량 한도)은 값이 사라지지 않고 우선');
// 5. 코코포리아 줄 형식
ok(F.ar2eSkillLine(sheet.skills[0]) === '◆ LV 2/ 올라운드 - (상시 | 자신 | 없음 | -) [판정 : -] [사용 조건 : -] [크리티컬 : -]', '스킬 줄: ◆ LV n/ 이름 - (타이밍 | 대상 | 사거리 | 코스트) [판정] [사용 조건] [크리티컬], 빈 값은 -');
ok(F.ar2eSkillLine({ name: '화염', level: '1', timing: '메이저', target: '단체', range: '5', cost: '3', roll: '2D+{지력}', condition: '무기', critical: '10' }) === '◆ LV 1/ 화염 - (메이저 | 단체 | 5 | 3) [판정 : 2D+{지력}] [사용 조건 : 무기] [크리티컬 : 10]', '스킬 줄: 값이 있으면 그대로');
ok(F.ar2eItemLine(sheet.items[0]) === '□ 모험자 세트 (수량 : 1 | 중량 : 5)' && F.ar2eItemLine({ name: 'x' }) === '□ x (수량 : 1 | 중량 : 0)', '소지품 줄: □ 품명 (수량 : n | 중량 : n)');
const tot = F.ar2eCombatTotals({ weapons: [{ hit: '-1', attack: '11', act: '-3', phyDef: '4', move: '1' }] }, { str: 6, dex: 6, agi: 5, int: 2, sns: 3, spr: 2, luc: 3 });
ok(F.ar2eMemoLines(tot).join('\n') === '행동치:5 | 이동력:12\n물리방어력:4 | 마법방어력:2', '메모: 행동치 | 이동력 / 물리방어력 | 마법방어력');
// 내보내기 구조
const gen = html.slice(html.indexOf('function generateArianrhod2eCocofoliaJSON'), html.indexOf('function countInsaneTrack'));
ok(!/물방\/마방/.test(gen) && /\{ label: 'HP'/.test(gen) && /\{ label: 'MP'/.test(gen) && /\{ label: '페이트'/.test(gen), 'status 는 HP·MP·페이트만');
ok(['2D+{정신} 주가 판정', '2D+{재주} 연금술 판정', '2D+{근력} 도약 판정', '2D+{근력} 등반 판정'].every(l => gen.includes("'" + l + "'")), '주가·연금술·도약·등반 판정 명령');
ok(/ar2eSkillLine\(sk\)/.test(gen) && /ar2eItemLine\(it\)/.test(gen) && /──소지품──/.test(gen) && /var fateMax = ar2eFateMax\(d\)/.test(gen) && /ar2eMemoLines\(tot\)/.test(gen), '스킬 줄·소지품 줄·페이트·메모가 순수 함수 사용');
process.exit(f ? 1 : 0);
