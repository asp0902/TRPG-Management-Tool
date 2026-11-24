const fs = require('fs'), path = require('path'), vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13, 10)).join(String.fromCharCode(10));
let f = 0; const ok = (c, m) => { if (!c) { f++; console.log('FAIL', m); } else console.log('ok', m); };
const a = html.indexOf('const SNAPSHOT_KEEP_RECENT'), b = html.indexOf('async function pruneAppSnapshots');
const consts = html.slice(a, html.indexOf('let snapshotDirty'));
const ctx = {}; vm.createContext(ctx);
vm.runInContext(consts + html.slice(html.indexOf('// 가지치기 계획(순수 함수)'), b) + ';this.f={plan:planSnapshotPrune,C:{recent:SNAPSHOT_KEEP_RECENT,days:SNAPSHOT_KEEP_DAYS,pd:SNAPSHOT_PROTECT_DAYS,max:SNAPSHOT_MAX_BYTES}}', ctx);
const { plan, C } = ctx.f;
const MB = 1048576, H = 3600000, now = Date.parse('2026-11-20T12:00:00');
const snap = (hoursAgo, mb, extra) => Object.assign({ id: new Date(now - hoursAgo * H).toISOString(), at: new Date(now - hoursAgo * H).toISOString(), bytes: mb * MB }, extra || {});
const kept = (list, removed) => list.filter(s => !removed.includes(s.id));
const total = l => l.reduce((s, x) => s + x.bytes, 0);
const dayOf = s => new Date(s.at).toLocaleDateString('sv-SE');
// 시나리오 1: 사용자 상황 — 오늘 5분 간격 10개(+) 와 지난 9일 날짜별 1개, 50MB 씩
const s1 = []; for (let i = 0; i < 12; i++) s1.push(snap(i * (5 / 60), 50)); for (let d = 1; d <= 9; d++) s1.push(snap(d * 24 + 1, 50));
const r1 = plan(s1, now), k1 = kept(s1, r1);
const dayCount = new Set(k1.map(dayOf)).size;
ok(total(k1) <= C.max && k1.some(s => s.id === s1[0].id), '50MB×(오늘 12개+9일): 용량 한도 준수·최신 1개 유지(남은 ' + k1.length + '개, ' + Math.round(total(k1) / MB) + 'MB)');
ok(dayCount >= 7, '날짜별 7일치가 최근 여분보다 우선 보존(남은 날짜 수 ' + dayCount + ')');
// 구 알고리즘(최신순 누적, 오래된 것부터 제거) 재현 — 오늘 것만 남는 문제
const legacy = list => { const l = list.slice().sort((x, y) => y.id.localeCompare(x.id)); const keep = new Set(l.slice(0, 10).map(i => i.id)); const days = new Set(); l.forEach(i => { const d = dayOf(i); if (!days.has(d)) { days.add(d); keep.add(i.id); } }); let t = 0; const rm = []; l.forEach((i, idx) => { if (!keep.has(i.id)) { rm.push(i.id); return; } t += i.bytes; if (idx > 0 && t > C.max) rm.push(i.id); }); return rm; };
const kl = kept(s1, legacy(s1)); ok(new Set(kl.map(dayOf)).size < dayCount, '비교: 구 알고리즘은 ' + new Set(kl.map(dayOf)).size + '일치만 남김 → 개선');
// 시나리오 2: 보호 스냅샷 유지, 14일 지나면 제외
const s2 = [snap(1, 50), snap(24 * 2 + 1, 50), snap(24 * 3 + 1, 50, { protect: true }), snap(24 * 4 + 1, 50), snap(24 * 5 + 1, 50), snap(24 * 6 + 1, 50), snap(24 * 7 + 1, 50), snap(24 * 8 + 1, 50)];
const r2 = plan(s2, now), k2 = kept(s2, r2);
ok(k2.some(s => s.protect) && total(k2) <= C.max, '보호 스냅샷(3일 전) 유지, 한도 준수');
const s2b = [snap(1, 50), snap(24 * 15, 50, { protect: true })]; ok(plan(s2b, now).length === 1, '보호 14일 초과분은 자동 삭제 대상');
// 시나리오 3: 용량 압박 시 지우는 순서 — 여분 최근 → 오래된 날짜별 → 보호
const s3 = [snap(0.1, 100), snap(1, 100), snap(2, 100), snap(24 + 1, 100), snap(48 + 1, 100, { protect: true })];
const r3 = plan(s3, now); const k3 = kept(s3, r3);
ok(k3[0].id === s3[0].id && total(k3) <= C.max && k3.some(s => s.protect) && r3.includes(s3[2].id) && !r3.includes(s3[3].id) && !r3.includes(s3[4].id), '압박 시 같은 날 여분(가장 오래된 것)부터 제거, 날짜별·보호는 남김');
const s3b = [snap(0.1, 300), snap(24 + 1, 300, { protect: true }), snap(48 + 1, 300)];
const k3b = kept(s3b, plan(s3b, now)); ok(k3b[0].id === s3b[0].id && total(k3b) <= C.max, '더 압박하면 날짜별 → 보호 순으로 줄이되 최신 1개는 항상 유지');
// 시나리오 4: 최신 1개만 있어도 유지, 작은 스냅샷이면 전부 유지
ok(plan([snap(0, 999)], now).length === 0, '스냅샷 1개는 (한도 초과여도) 유지');
const s4 = [snap(0, 10), snap(1, 10), snap(2, 10), snap(24 + 1, 10), snap(48 + 1, 10)]; ok(plan(s4, now).length === 0, '10MB 이하·날짜별+최근 규칙 안이면 전부 유지');
// 7일 지난 일반 스냅샷은 제거
ok(plan([snap(1, 10), snap(24 * 9, 10)], now).length === 1, '7일 지난 일반 스냅샷은 제거');
// 최근 여분은 30분 간격·최대 4개
const s5 = []; for (let i = 0; i < 20; i++) s5.push(snap(i * 0.1, 1)); const k5 = kept(s5, plan(s5, now));
ok(k5.length <= C.recent + 1, '같은 날 5분 간격 20개 → 간격·개수 제한 후 ' + k5.length + '개');
// 목록 표시·보호 스냅샷 기록
ok(/MUSIC \$\{item\.musicTracks\}곡/.test(html) && /캐릭터 \$\{item\.characters\}명/.test(html) && /item\.protect \? '🛡 '/.test(html), '목록: MUSIC 곡 수·캐릭터 수·보호 표시(값이 없는 옛 스냅샷은 생략)');
ok(/musicTracks: count\('musicTracks'\)/.test(html) && /musicTracks: state\.musicTracks\.length/.test(html) && /await pruneAppSnapshots\(\)/.test(html), '스냅샷 기록에 곡 수 등 포함, 보호 스냅샷 뒤 가지치기');
// 용량 조사 도구
{ const ctx2 = {}; vm.createContext(ctx2);
  vm.runInContext(html.slice(html.indexOf('function appPayloadSizeReport'), html.indexOf('async function saveProtectionSnapshot')) + ';this.f=appPayloadSizeReport', ctx2);
  const r = ctx2.f({ scenarios: [{ blocks: [{ content: 'data:image/png;base64,' + 'A'.repeat(30000) }] }], customFonts: [{ data: 'B'.repeat(50000) }], tiny: [1] }, 5);
  ok(r.keys[0].key === 'customFonts' && r.biggestStrings[0].path === '.customFonts[0].data' && r.biggestStrings.length === 2 && r.totalBytes > 80000, 'appPayloadSizeReport: 키별 크기·큰 문자열 상위(임베드 이미지·글꼴 등)'); }
process.exit(f ? 1 : 0);
