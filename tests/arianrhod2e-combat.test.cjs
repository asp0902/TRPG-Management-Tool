const fs = require('fs'), path = require('path'), vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13, 10)).join(String.fromCharCode(10));
let f = 0; const ok = (c, m) => { if (!c) { f++; console.log('FAIL', m); } else console.log('ok', m); };
const code = html.slice(html.indexOf('function ar2eInt'), html.indexOf('function _ar2eAbilityMods'));
const ctx = {}; vm.createContext(ctx);
vm.runInContext(code + ';this.f={ar2eCombatTotals,ar2eDiceExpr,ar2eEquipSum}', ctx);
const F = ctx.f;
// 예시 캐릭터(휴린 워리어/워리어): 최종 수정치 근력6 재주6 민첩5 지력2 감지3 정신2 행운3
const mods = { str: 6, dex: 6, agi: 5, int: 2, sns: 3, spr: 2, luc: 3 };
const sheet = () => ({
  weapons: [
    { name: '그레이트 소드', part: '양손', weight: '10', hit: '-1', attack: '11', act: '-3', range: '지근' },
    { name: '레더 재킷', part: '몸통', weight: '5', phyDef: '4', move: '1' },
  ],
});
let t = F.ar2eCombatTotals(sheet(), mods);
ok(F.ar2eDiceExpr(t.hitDice, t.hit) === '2D+5', '명중 2D+5');
ok(F.ar2eDiceExpr(t.attackDice, t.attack) === '2D+11', '공격력 2D+11');
ok(F.ar2eDiceExpr(t.evasionDice, t.evasion) === '2D+5', '회피 2D+5');
ok(t.phyDef === 4 && t.magDef === 2 && t.initiative === 5 && t.move === 12, '물방 4, 마방 2, 행동치 5, 이동력 12');
// 음수 표기
ok(F.ar2eDiceExpr(0, -1) === '2D-1' && F.ar2eDiceExpr(0, 0) === '2D' && F.ar2eDiceExpr(1, 3) === '3D+3', '음수 2D-1(2D+-1 아님), 0 은 2D, 추가 다이스 3D+3');
let s = sheet(); s.weapons[0].hit = '-8';
t = F.ar2eCombatTotals(s, mods); ok(F.ar2eDiceExpr(t.hitDice, t.hit) === '2D-2', '장비 합계가 음수면 2D-2');
// 장착 해제 행 제외
s = sheet(); s.weapons[0].equipped = false;
t = F.ar2eCombatTotals(s, mods); ok(t.hit === 6 && t.attack === 0 && t.initiative === 8, '장착 해제한 행은 합산 제외');
s = sheet(); s.weapons[0].equipped = true; s.weapons[1].equipped = 'false';
t = F.ar2eCombatTotals(s, mods); ok(t.phyDef === 0 && t.move === 11 && t.attack === 11, '장착 켬은 합산, "false" 문자열은 해제');
ok(F.ar2eCombatTotals(sheet(), mods).attack === 11, '장착 칸이 없는 기존 행은 장착한 것으로 간주');
// 보정·추가 다이스
s = sheet(); s.modifiers = { hitMod: '2', evasionMod: '1', attackPower: '3' }; s.combat = { phyDef: '1', magDef: '2', move: '1', initiative: '1' }; s.combatTotals = { hitDice: '1', attackDice: '2', evasionDice: '' };
t = F.ar2eCombatTotals(s, mods);
ok(F.ar2eDiceExpr(t.hitDice, t.hit) === '3D+7' && F.ar2eDiceExpr(t.attackDice, t.attack) === '4D+14' && F.ar2eDiceExpr(t.evasionDice, t.evasion) === '2D+6', '보정·추가 다이스 합산(3D+7 / 4D+14 / 2D+6)');
ok(t.phyDef === 5 && t.magDef === 4 && t.move === 13 && t.initiative === 6, '방어·행동·이동 보정 합산');
// 기존 수동 값 이전: 기존 combat/modifiers 칸이 그대로 보정으로 쓰여 값이 사라지지 않음
s = { modifiers: { hitMod: '-1', evasionMod: '0', attackPower: '11' }, combat: { phyDef: '4', magDef: '', move: '', initiative: '' } };
t = F.ar2eCombatTotals(s, mods);
ok(t.hit === 5 && t.attack === 11 && t.phyDef === 4, '기존 수동 명중·공격력·물방 값이 보정으로 유지');
ok(F.ar2eCombatTotals({}, mods).move === 11 && F.ar2eCombatTotals(null, null).hit === 0, '빈 시트·널 입력에도 동작(이동력 기본 근력+5)');
// 소스 구조
ok(/ar2eDiceExpr\(tot\.hitDice, tot\.hit\) \+ ' 명중 판정'/.test(html) && /ar2eDiceExpr\(tot\.evasionDice, tot\.evasion\) \+ ' 회피 판정'/.test(html), '코코포리아 명중·회피 명령은 합계 사용');
ok(!/'2D\+' \+ (hitMod|evasionMod|attackPower)/.test(html), '2D+-1 버그 식 제거');
ok(['hit', 'attack', 'evasion', 'phyDef', 'magDef', 'act', 'move', 'range', 'equipped'].every(id => new RegExp("id: '" + id + "', label: '[^']+', type: '(number|text|checkbox)'").test(html)) && /id: 'equipped', label: '장착', type: 'checkbox', defaultChecked: true/.test(html), '장비 표 전투 수치 칸 + 장착(기본 켬)');
process.exit(f ? 1 : 0);
