const fs = require('fs'), path = require('path'), vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13, 10)).join(String.fromCharCode(10));
const a = html.indexOf('function generateInsaneCocofoliaJSON');
const b = html.indexOf('\nfunction ', a + 10);
let f = 0; const ok = (c, m) => { if (!c) { f++; console.log('FAIL', m); } else console.log('ok', m); };
const make = abilities => {
  const ctx = {
    INSANE_SPECIALTY_COLUMNS: [{ names: ['오락', '미술'] }, { names: ['도박'] }],
    getInsaneSpecialtyFieldId: (c, r) => 'f' + c + r,
    calcInsaneSpecialtyTargets: () => ({ f00: 5, f01: 6, f10: 7 }),
    SHEET_TEMPLATES: { insane: { sections: [] } },
    state: { characters: [{ id: 'c', sheets: [{ id: 's', templateKey: 'insane', data: { abilities } }] }] },
    normalizeCharacterTokenSize: x => x, normalizeCharacterColor: x => x, parseCocSheetNumber: x => Number(x) || 0,
    countInsaneTrack: () => 0, getInsaneTrackMax: () => 0, getInsaneSanityMax: () => 0, getSheetApiIconUrl: () => '',
  };
  vm.runInNewContext(html.slice(a, b), ctx);
  return ctx.generateInsaneCocofoliaJSON('c', 's').data.commands;
};
const head = '@장면 열기\n@장면 닫기\n';
const spec = '──특기 판정──\n2D6>=5 오락\n2D6>=6 미술\n2D6>=7 도박';
let c = make([{ name: '화염', specialty: '미술', effect: '피해 1\n추가' }]);
ok(c === head + '\n──어빌리티──\n2D6>=6 【화염】《미술》 피해 1 추가\n\n' + spec, '지정특기 있음 + 줄바꿈 공백');
c = make([{ name: '맨손', specialty: '없는특기', effect: '효과' }, { name: '무효과', specialty: '' }]);
ok(c.includes('──어빌리티──\n【맨손】 효과\n【무효과】\n\n'), '지정특기 없음/목록 밖 → 텍스트만, 효과 없으면 공백 없음');
c = make([{ name: '  ', specialty: '오락', effect: 'x' }, { name: '', effect: 'y' }]);
ok(c === head + '\n' + spec && !c.includes('어빌리티'), '빈 이름 행 제외 → 0개면 구역 생략');
c = make(undefined);
ok(c === head + '\n' + spec, '어빌리티 없음 → 기존과 동일');
process.exit(f ? 1 : 0);
