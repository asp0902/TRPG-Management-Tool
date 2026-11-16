const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13,10)).join(String.fromCharCode(10));
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok', m); };
const lines = html.split('\n');
// 정리 코드(예전 키 삭제) 한 줄만 허용하고 나머지에는 AI 추천·OpenAI·API 키 관련 문자열이 없어야 한다(#290)
const hits = lines.filter(l => /musicAi|MUSIC_AI|music-ai|aiTagSuggestions|AI 추천|OpenAI|api\.openai|api\.anthropic|API 키/i.test(l) && !l.includes("localStorage.removeItem(name)"));
ok(hits.length === 0, 'AI 추천·OpenAI·API 키 관련 코드/문구 없음 (남은 ' + hits.length + '건' + (hits[0] ? ': ' + hits[0].slice(0, 60) : '') + ')');
ok(!/fetch\([^)]*openai|fetch\([^)]*anthropic/i.test(html), 'AI 서비스 fetch 없음');
ok(html.includes("['trpg-music-ai-openai-key', 'trpg-music-ai-key', 'trpg-music-ai-model'].forEach(name => localStorage.removeItem(name))"), '시작 시 예전 키·모델 값 삭제');
ok(!html.includes('aiTagSuggestions') && !html.includes('soundTagSuggestions'), 'aiTagSuggestions·soundTagSuggestions(소리 분석, #301) 필드 제거');
ok(!html.includes('music-ai-key-input') && html.includes('동기화</div>'.slice(0, 0) + 'id="github-sync-token"'), '동기화 모달에 AI 키 섹션 없음(토큰 입력은 유지)');
ok(!html.includes('musicSoundAuto') && !html.includes('MUSIC_SOUND_RULES'), '소리 분석 추천 코드 없음(#301)');
console.log('fails=' + fails); process.exit(fails ? 1 : 0);
