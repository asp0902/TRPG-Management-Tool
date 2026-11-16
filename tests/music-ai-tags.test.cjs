const fs = require('fs'), path = require('path'), vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13,10)).join(String.fromCharCode(10));
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok', m); };
const cut = (a, b) => html.slice(html.indexOf(a), html.indexOf(b));
const block = cut('// ── AI 태그 추천(#285)', 'async function openMusicDetail');
const code = cut('const MUSIC_TAG_PRESETS', 'async function openMusicDetail'); // 프리셋 + 태그 토글 + AI 블록
ok(html.includes('openMusicAiSettings()" title="AI 태그 설정"'), '도구 모음 ⚙ 설정 버튼');
ok(html.includes("+ field('tags', '태그') + musicAiRowHtml(track) + musicTagPresetsHtml(track)"), '상세 모달에 추천 줄');
ok(!html.includes('Anthropic API 로 전송') && !html.includes('MUSIC_AI_NOTICE'), '전송 안내 문구 없음(사용자 결정)');
ok(!html.includes('musicAiSuggest') && !html.includes('>AI 추천</button>'), '추천 버튼 없음(자동)');
ok(html.includes("aiTagSuggestions: Array.isArray(input?.aiTagSuggestions)"), 'track.aiTagSuggestions 필드');
ok(html.includes('musicAiAuto(added)') && html.includes('addedTracks.forEach(musicAiAuto)') && html.includes('musicAiAuto(track); // 추천이 없으면 자동 1회'), '추가 직후(유튜브·PC 파일)·상세 열 때 자동 호출');
// 키 보호
ok(!/console\./.test(block), '키·응답 로그 출력 없음');
const outside = html.replace(block, '');
ok(!outside.includes('trpg-music-ai-key') && !outside.includes('MUSIC_AI_KEY_STORE'), 'AI 키 저장소는 이 블록에서만 사용(동기화·내보내기 payload 에 없음)');

const store = {}; const calls = [];
let mode = 'ok', persisted = 0, replyText = '{"tags":["경쾌한","긴장감있는","없는태그","경쾌한","행복한","희망찬","설레는","따뜻한","유쾌한"]}';
const els = {};
const ctx = {
  esc: x => String(x), state: { musicTracks: [{ id: 'm1', title: '곡', artist: 'A', album: 'B', notes: 'N', tags: [], aiTagSuggestions: null }, { id: 'm2', title: '곡2', tags: [], aiTagSuggestions: null }] },
  localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
  showToast() {}, console, normalizeCssMacroTags: x => x, persist() { persisted++; }, renderMusicPage() {},
  document: { getElementById: id => els[id] || null, querySelector: () => null, querySelectorAll: () => [] },
  fetch: async (url, init) => {
    calls.push({ url, init });
    if (mode === '401') return { ok: false, status: 401, json: async () => ({}) };
    if (mode === '429') return { ok: false, status: 429, json: async () => ({}) };
    if (mode === 'net') throw new TypeError('Failed to fetch');
    if (mode === 'refusal') return { ok: true, status: 200, json: async () => ({ stop_reason: 'refusal', content: [] }) };
    return { ok: true, status: 200, json: async () => ({ stop_reason: 'end_turn', content: [{ type: 'text', text: replyText }] }) };
  },
};
vm.createContext(ctx);
vm.runInContext(code + ';this.f={musicAiBuildRequest,musicAiParse,musicAiRequestTags,musicAiAuto,musicAiRecHtml,musicAiRowHtml,musicAiGet,MUSIC_AI_ERRORS,musicAiTried}', ctx);
const f = ctx.f;
(async () => {
  const track = ctx.state.musicTracks[0];
  const req = f.musicAiBuildRequest(track, 'TEST-KEY', f.musicAiGet('trpg-music-ai-model', 'claude-haiku-5-5'));
  const body = JSON.parse(req.init.body);
  ok(req.url === 'https://api.anthropic.com/v1/messages' && req.init.method === 'POST', 'URL·POST');
  ok(req.init.headers['x-api-key'] === 'TEST-KEY' && req.init.headers['anthropic-version'] === '2023-06-01' && req.init.headers['content-type'] === 'application/json' && req.init.headers['anthropic-dangerous-direct-browser-access'] === 'true', '헤더');
  ok(body.model === 'claude-haiku-5-5' && body.max_tokens === 1024, '기본 모델 claude-haiku-5-5·max_tokens');
  ok(f.musicAiBuildRequest(track, 'k').init.body.includes('"model":"claude-haiku-5-5"'), '모델 미지정 시 haiku 기본값');
  ok(body.output_config.effort === 'low' && body.output_config.format.type === 'json_schema', 'effort low + json_schema');
  ok(!('thinking' in body), 'thinking 미전송');
  const sch = body.output_config.format.schema;
  ok(sch.properties.tags.type === 'array' && sch.required[0] === 'tags' && sch.properties.tags.items.enum.length === 49 && sch.properties.tags.items.enum.includes('긴장감있는'), '스키마 {tags: 프리셋 enum 49}');
  ok(body.system.includes('목록에 없는 태그는 쓰지 않는다') && body.system.includes('경쾌한 (경쾌한 | Cheerful'), '시스템 프롬프트에 프리셋 목록');
  ok(body.messages[0].content.includes('제목: 곡') && body.messages[0].content.includes('앨범: B'), '사용자 메시지에 곡 정보');
  ok(!req.init.body.includes('TEST-KEY'), '키가 본문에 들어가지 않음');
  const tags = await f.musicAiRequestTags ? 0 : 0; // (함수는 아래 자동 경로로 검증)
  ok(JSON.stringify(f.musicAiParse({ stop_reason: 'end_turn', content: [{ type: 'text', text: replyText }] })) === JSON.stringify(['경쾌한', '긴장감있는', '행복한', '희망찬', '설레는', '따뜻한']), '프리셋 밖 값 버림, 중복 제거, 최대 6개');
  ok(f.musicAiParse({ stop_reason: 'end_turn', content: [{ type: 'text', text: 'not json' }] }).length === 0, '깨진 JSON → 빈 추천');
  let err = ''; try { f.musicAiParse({ stop_reason: 'refusal', content: [] }); } catch (e) { err = e.message; }
  ok(err === 'refusal', 'refusal 처리');
  for (const [m, msg] of [['401', 'auth'], ['429', 'rate'], ['net', 'network']]) {
    mode = m; err = ''; try { await f.musicAiRequestTags(track, 'K', 'm'); } catch (e) { err = e.message; }
    ok(err === msg, m + ' → ' + msg);
  }
  ok(!/sk-ant|API 키:/.test(JSON.stringify(f.MUSIC_AI_ERRORS)), '오류 문구 상수에 키 값 없음');
  mode = 'ok';

  // 자동 1회: 키 없으면 조용히 건너뜀(호출 없음)
  calls.length = 0; await f.musicAiAuto(ctx.state.musicTracks[0]);
  ok(calls.length === 0 && ctx.state.musicTracks[0].aiTagSuggestions === null, '키 없으면 조용히 건너뜀');
  // 키 있음: 요청 1회 → track.aiTagSuggestions 저장·persist, 상세가 열려 있으면 추천 줄 갱신
  store['trpg-music-ai-key'] = 'SECRET-KEY-123';
  els['music-ai-rec'] = { dataset: { id: 'm1' }, innerHTML: '' };
  await f.musicAiAuto(ctx.state.musicTracks[0]);
  ok(calls.length === 1 && JSON.stringify(ctx.state.musicTracks[0].aiTagSuggestions) === JSON.stringify(['경쾌한', '긴장감있는', '행복한', '희망찬', '설레는', '따뜻한']) && persisted === 1, '자동 요청 → aiTagSuggestions 저장');
  ok(calls[0].init.headers['x-api-key'] === 'SECRET-KEY-123' && JSON.parse(calls[0].init.body).model === 'claude-haiku-5-5', '저장된 키·haiku 모델로 요청');
  ok(els['music-ai-rec'].innerHTML.includes('music-tag-chip rec') && els['music-ai-rec'].innerHTML.includes('title="Cheerful"') && !els['music-ai-rec'].innerHTML.includes('SECRET'), '추천 줄 칩(점선 rec, 영어 title, 키 미노출)');
  // 이미 추천이 있으면 재요청 없음(중복 방지)
  await f.musicAiAuto(ctx.state.musicTracks[0]);
  ok(calls.length === 1, '이미 추천 있음 → 재요청 없음');
  // 실패(401): 조용히 끝, 저장 없음, 같은 세션 재시도 없음
  mode = '401'; const t2 = ctx.state.musicTracks[1];
  await f.musicAiAuto(t2);
  ok(calls.length === 2 && t2.aiTagSuggestions === null, '실패 시 조용히 끝(저장 없음)');
  await f.musicAiAuto(t2);
  ok(calls.length === 2, '실패한 곡은 이번 세션에서 재시도 안 함');
  // 요청 중 곡이 삭제되면 저장하지 않음
  mode = 'ok'; const t3 = { id: 'gone', title: 'x', tags: [], aiTagSuggestions: null };
  const before = persisted; await f.musicAiAuto(t3);
  ok(persisted === before, '삭제된 곡은 저장 안 함');
  // 비어 있는 추천 줄 / 상세 행
  ok(f.musicAiRecHtml({ id: 'z', tags: [], aiTagSuggestions: null }) === '' && f.musicAiRowHtml({ id: 'z', tags: [], aiTagSuggestions: null }).includes('id="music-ai-rec" data-id="z"'), '추천이 없으면 빈 줄');
  console.log('fails=' + fails); process.exit(fails ? 1 : 0);
})();
