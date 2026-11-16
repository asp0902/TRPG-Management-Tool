const fs = require('fs'), path = require('path'), vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13,10)).join(String.fromCharCode(10));
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok', m); };
const cut = (a, b) => html.slice(html.indexOf(a), html.indexOf(b));
const block = cut('// ── AI 태그 추천(#285)', 'async function openMusicDetail');
const code = cut('const MUSIC_TAG_PRESETS', 'async function openMusicDetail') ; // 프리셋 + 태그 토글 + AI 블록
ok(html.includes('openMusicAiSettings()" title="AI 태그 설정"'), '도구 모음 ⚙ 버튼');
ok(html.includes('+ field(' + "'tags', '태그') + musicAiRowHtml(track) + musicTagPresetsHtml(track)"), '상세 모달에 AI 추천 줄');
// 키 보호: 블록에 console 출력 없음, 키 이름은 AI 블록 밖(동기화·내보내기 코드)에서 쓰이지 않음
ok(!/console\./.test(block), '키·응답 로그 출력 없음');
const outside = html.replace(block, '');
ok(!outside.includes('trpg-music-ai-key') && !outside.includes('MUSIC_AI_KEY_STORE'), 'AI 키 저장소는 이 블록에서만 사용(동기화·내보내기 payload 에 없음)');

const store = {}; const toasts = [];
const calls = [];
let mode = 'ok', replyText = '{"tags":["경쾌한","긴장감있는","없는태그","경쾌한","행복한","희망찬","설레는","따뜻한","유쾌한"]}';
const ctx = {
  esc: x => String(x), state: { musicTracks: [{ id: 'm1', title: '곡', artist: 'A', album: 'B', notes: 'N', tags: [] }] },
  localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
  showToast: m => toasts.push(m), console, normalizeCssMacroTags: x => x, persist() {}, renderMusicPage() {},
  document: { getElementById: () => null, querySelector: () => null, querySelectorAll: () => [] },
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
vm.runInContext(code + ';this.f={musicAiBuildRequest,musicAiParse,musicAiRequestTags,musicAiSuggest,musicAiGet,musicAiPresets,MUSIC_AI_ERRORS}', ctx);
const f = ctx.f;
(async () => {
  const track = ctx.state.musicTracks[0];
  // 요청: URL·헤더·본문(모델·effort·json_schema·max_tokens, thinking 없음)
  const req = f.musicAiBuildRequest(track, 'TEST-KEY', undefined);
  const body = JSON.parse(req.init.body);
  ok(req.url === 'https://api.anthropic.com/v1/messages' && req.init.method === 'POST', 'URL·POST');
  ok(req.init.headers['x-api-key'] === 'TEST-KEY' && req.init.headers['anthropic-version'] === '2023-06-01' && req.init.headers['content-type'] === 'application/json' && req.init.headers['anthropic-dangerous-direct-browser-access'] === 'true', '헤더');
  ok(body.model === 'claude-opus-5-5' && body.max_tokens === 1024, '기본 모델·max_tokens');
  ok(body.output_config.effort === 'low' && body.output_config.format.type === 'json_schema', 'effort low + json_schema');
  ok(!('thinking' in body), 'thinking 미전송');
  const sch = body.output_config.format.schema;
  ok(sch.properties.tags.type === 'array' && sch.required[0] === 'tags' && sch.properties.tags.items.enum.length === 49 && sch.properties.tags.items.enum.includes('긴장감있는'), '스키마 {tags: 프리셋 enum 49}');
  ok(body.system.includes('목록에 없는 태그는 쓰지 않는다') && body.system.includes('경쾌한 (경쾌한 | Cheerful'), '시스템 프롬프트에 프리셋 목록');
  ok(body.messages[0].content.includes('제목: 곡') && body.messages[0].content.includes('앨범: B'), '사용자 메시지에 곡 정보');
  ok(f.musicAiBuildRequest(track, 'k', 'claude-haiku-5-5').init.body.includes('"model":"claude-haiku-5-5"'), '설정 모델 반영');
  ok(!req.init.body.includes('TEST-KEY'), '키가 본문에 들어가지 않음');
  // 응답 파싱: 프리셋 밖 값 버림·중복 제거·최대 6개
  const tags = await f.musicAiRequestTags(track, 'K', 'm');
  ok(JSON.stringify(tags) === JSON.stringify(['경쾌한', '긴장감있는', '행복한', '희망찬', '설레는', '따뜻한']), '프리셋 밖 값 버림, 중복 제거, 최대 6개');
  ok(f.musicAiParse({ stop_reason: 'end_turn', content: [{ type: 'text', text: 'not json' }] }).length === 0, '깨진 JSON → 빈 추천');
  // 오류: refusal / 401 / 429 / 네트워크
  for (const [m, msg] of [['refusal', 'refusal'], ['401', 'auth'], ['429', 'rate'], ['net', 'network']]) {
    mode = m; let err = ''; try { await f.musicAiRequestTags(track, 'K', 'm'); } catch (e) { err = e.message; }
    ok(err === msg, m + ' → ' + msg);
  }
  ok(!/sk-ant|API 키:/.test(JSON.stringify(f.MUSIC_AI_ERRORS)), '오류 문구 상수에 키 값 없음');
  mode = 'ok';
  // 키 미설정 → 호출 안 함 / 설정 후 호출, 오류 문구에 키 미포함
  const els = { 'music-ai-status': { textContent: '' }, 'music-ai-rec': { dataset: { id: 'm1' }, innerHTML: '' } };
  ctx.document.getElementById = id => els[id] || null;
  calls.length = 0; await f.musicAiSuggest('m1');
  ok(calls.length === 0 && els['music-ai-status'].textContent.includes('API 키를 먼저 입력'), '키 미설정 시 호출 안 함');
  store['trpg-music-ai-key'] = 'SECRET-KEY-123'; mode = '401';
  await f.musicAiSuggest('m1');
  ok(calls.length === 1 && !els['music-ai-status'].textContent.includes('SECRET-KEY-123') && els['music-ai-status'].textContent.includes('API 키가 올바르지'), '401 문구(키 미노출)');
  mode = 'ok'; await f.musicAiSuggest('m1');
  ok(els['music-ai-rec'].innerHTML.includes('music-tag-chip rec') && els['music-ai-rec'].innerHTML.includes('title="Cheerful"') && !els['music-ai-rec'].innerHTML.includes('SECRET'), '추천 칩(점선 rec, 영어 title)');
  // 늦은 응답 무시: 응답 사이에 다른 곡으로 바뀜
  els['music-ai-rec'].innerHTML = ''; const orig = ctx.fetch;
  ctx.fetch = async (u, i) => { els['music-ai-rec'].dataset.id = 'other'; return orig(u, i); };
  await f.musicAiSuggest('m1');
  ok(els['music-ai-rec'].innerHTML === '', '다른 곡/닫힌 뒤 늦은 응답 무시');
  console.log('fails=' + fails); process.exit(fails ? 1 : 0);
})();
