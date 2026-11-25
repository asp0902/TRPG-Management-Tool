const fs = require('fs'), path = require('path'), vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13, 10)).join(String.fromCharCode(10));
let f = 0; const ok = (c, m) => { if (!c) { f++; console.log('FAIL', m); } else console.log('ok', m); };
const ctx = {}; vm.createContext(ctx);
const rich = html.slice(html.indexOf('var DS_RICH_ENT'), html.indexOf('// 글자 범위 [start, end) 에 서식 patch'));
const find = html.slice(html.indexOf('function ds_findRegex'), html.indexOf('var _dsFind ='));
vm.runInContext('function ds_isDataRow(r){return !!(r&&!r.isCategory&&!r.isMemo);}function ds_richPlain(h){return ds_richParse(h).map(function(s){return s.text;}).join("");}' + rich + find + ';this.f={ds_findRegex,ds_findCells,ds_findMatches,ds_findApply,ds_findApplyRich,ds_richReplaceRange,ds_findPick,ds_richPlain}', ctx);
const F = ctx.f;

// 정규식 만들기
ok(F.ds_findRegex('', {}) === null && F.ds_findRegex('(', { regex: true }) === null, '빈 검색어·잘못된 정규식은 null');
ok(F.ds_findRegex('a*', { regex: true }) === null, '빈 글자와 맞는 정규식은 거부(모든 자리에 바뀌는 사고 방지)');
ok(F.ds_findRegex('a.b', {}).test('a.b') && !F.ds_findRegex('a.b', {}).test('axb'), '일반 검색은 글자 그대로(. 이스케이프)');
ok(F.ds_findRegex('ABC', {}).test('xabcx') && !F.ds_findRegex('ABC', { matchCase: true }).test('xabcx'), '대소문자 구분 옵션');
ok(F.ds_findRegex('ab', { whole: true }).test('AB') && !F.ds_findRegex('ab', { whole: true }).test('abc'), '셀 전체 일치');
ok(F.ds_findRegex('a|b', { regex: true, whole: true }).test('b') && !F.ds_findRegex('a|b', { regex: true, whole: true }).test('ab'), '전체 일치는 정규식 선택지도 묶어서 검사');

// 찾을 칸 목록
const mk = (cells, extra) => Object.assign({ cells }, extra);
const sheets = [
  { columns: [{ id: 'a' }, { id: 'b', hidden: true }, { id: 'c' }], rows: [mk({ a: '불꽃 검', b: '불꽃', c: '=A1' }), mk({ a: '얼음' }, { isMemo: true }), mk({ a: '불꽃', c: '불' }, { hidden: true }), mk({ a: '', c: '화염 불꽃' })] },
  { columns: [{ id: 'x' }], rows: [mk({ x: '불꽃 구슬' })] },
];
const re = F.ds_findRegex('불꽃', {});
let L = F.ds_findCells(sheets, re, {});
ok(JSON.stringify(L.map(x => [x.si, x.ri, x.colId])) === '[[0,0,"a"],[0,3,"c"],[1,0,"x"]]', '데이터 행만·숨긴 행/열·메모 행 제외, 시트→행→열 순서');
ok(F.ds_findCells(sheets, re, { sheetIdx: 1 }).length === 1 && F.ds_findCells(sheets, re, { sheetIdx: 0 }).length === 2, '범위: 한 시트만');
ok(F.ds_findCells(sheets, F.ds_findRegex('A1', {}), {}).length === 0 && F.ds_findCells(sheets, F.ds_findRegex('A1', {}), { formulas: true }).length === 1, '수식 칸은 「수식 안 검색」일 때만 수식 글자로 검색');
ok(F.ds_findCells(sheets, re, { visible: (sh, si) => si === 0 ? [true, true, true, false] : null }).length === 2, '필터로 가려진 행 제외(콜백)');

// 바꾸기
const m1 = F.ds_findMatches('불꽃 불꽃 얼음', re, '불길', {});
ok(m1.length === 2 && F.ds_findApply('불꽃 불꽃 얼음', m1) === '불길 불길 얼음', '한 칸 안의 모든 곳 바꾸기');
const m2 = F.ds_findMatches('가나 다라', F.ds_findRegex('(\\S)(\\S)', { regex: true }), '$2$1', { regex: true });
ok(F.ds_findApply('가나 다라', m2) === '나가 라다', '정규식 모드: $1 $2 사용');
ok(F.ds_findApply('a.b', F.ds_findMatches('a.b', F.ds_findRegex('.', {}), '$1', {})) === 'a$1b', '일반 모드: $ 는 그대로 글자');
ok(F.ds_findApply('abc', F.ds_findMatches('abc', F.ds_findRegex('b', {}), '', {})) === 'ac', '빈 글자로 바꾸면 삭제');

// 서식 유지 바꾸기
const r0 = '<b>불꽃</b> 검 <i>불꽃</i>';
const mm = F.ds_findMatches(F.ds_richPlain(r0), re, '화염구', {});
const r1 = F.ds_findApplyRich(r0, mm);
ok(F.ds_richPlain(r1) === '화염구 검 화염구' && /<b>화염구<\/b>/.test(r1) && /<i>화염구<\/i>/.test(r1), '바꾼 글자는 원래 글자의 서식(굵게/기울임)을 이어받음');
ok(F.ds_richReplaceRange('<b>가나다</b>', 1, 2, 'XY').replace(/<[^>]+>/g, '') === '가XY다' && /<b>가XY다<\/b>/.test(F.ds_richReplaceRange('<b>가나다</b>', 1, 2, 'XY')), '서식 한가운데를 바꿔도 서식이 끊기지 않음');
ok(F.ds_richReplaceRange('<b>불꽃</b>', 0, 2, '') === '', '전부 지우면 서식도 비움');
ok(F.ds_richReplaceRange('일반 <b>굵게</b>', 0, 2, '보통') !== '' && F.ds_richPlain(F.ds_richReplaceRange('일반 <b>굵게</b>', 0, 2, '보통')) === '보통 굵게', '서식이 일부만 있는 칸에서 일반 부분 바꾸기');

// 현재 위치 고르기
const lst = [{ si: 0, ri: 0, ci: 0 }, { si: 0, ri: 3, ci: 2 }, { si: 1, ri: 0, ci: 0 }];
ok(F.ds_findPick(lst, { si: 0, ri: 1, ci: 0 }) === 1 && F.ds_findPick(lst, { si: 0, ri: 3, ci: 2 }) === 1 && F.ds_findPick(lst, { si: 1, ri: 5, ci: 0 }) === 0 && F.ds_findPick([], null) === -1, '활성 칸 이후 첫 번째(포함), 없으면 처음으로 되돌아감');

// 연결(소스 검사)
ok(/id="ds-find-panel"/.test(html) && /ds_findOpen\(k === 'h'\)/.test(html) && /currentPage !== 'datasheet'/.test(html.slice(html.indexOf('function ds_findOpen'))), 'Ctrl+F·Ctrl+H 는 데이터 시트 화면에서만 가로채기');
ok(/e\.shiftKey\)\s*return;[\s\S]{0,200}k !== 'f' && k !== 'h'/.test(html), 'Ctrl+Shift+F(본문 찾아 바꾸기)와 겹치지 않음');
ok(/ds_findPaint\(\); \/\/ 찾기 강조/.test(html) && /_dsForceNextHistoryCommit = true; persist\(\); renderDataSheetEditor/.test(html.slice(html.indexOf('function ds_findReplaceCells'))), '렌더 뒤 강조 복원·모두 바꾸기는 한 번만 저장');
process.exit(f ? 1 : 0);
