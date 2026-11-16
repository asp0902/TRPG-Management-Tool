const fs = require('fs'), path = require('path'), vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13,10)).join(String.fromCharCode(10));
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok', m); };
const cut = (a, b) => html.slice(html.indexOf(a), html.indexOf(b));
const soundBlock = cut('// ── 소리 분석 태그 추천(#286)', '// ── MUSIC 음원 동기화(#296)');
ok(!/fetch\(|XMLHttpRequest|sendBeacon/.test(soundBlock) && !/console\./.test(soundBlock), '소리 분석은 외부 전송·로그 없음');
ok(html.includes('addedTracks.push({ track, file })') && html.includes('await musicSoundAuto(item.track, item.file)'), '파일 추가 직후 자동 1회(PC 파일만)');
ok(html.includes("soundTagSuggestions: Array.isArray(input?.soundTagSuggestions)"), 'track.soundTagSuggestions 필드');
ok(html.includes("<span class=\"music-hint\">소리 분석</span>") && html.includes('track.soundTagSuggestions'), '추천 줄은 소리 분석 그룹');

const code = cut('const MUSIC_TAG_PRESETS', 'async function openMusicDetail');
const store = {};
const ctx = { esc: x => String(x), state: { musicTracks: [] }, localStorage: { getItem: () => null }, persist() {}, document: { getElementById: () => null }, normalizeCssMacroTags: x => x, Math, Float64Array, Float32Array, OfflineAudioContext: undefined, console };
vm.createContext(ctx);
vm.runInContext(code + ';this.f={musicSoundFeatures,musicSoundTags,musicSoundAuto,musicSoundFft,musicTagPresetMap,musicRecHtml,musicRecRowHtml,MUSIC_SOUND_RULES}', ctx);
const f = ctx.f, sr = 44100, N = sr * 30;
const sine = (freq, amp, len = N) => { const x = new Float32Array(len); for (let i = 0; i < len; i++) x[i] = amp * Math.sin(2 * Math.PI * freq * i / sr); return x; };
const addClicks = (x, bpm, amp, ms = 40) => { const step = sr * 60 / bpm, dur = sr * ms / 1000; for (let t = 0; t < x.length; t += step) for (let k = 0; k < dur && t + k < x.length; k++) { const i = Math.floor(t) + k; if (i < x.length) x[i] += amp * Math.sin(2 * Math.PI * 800 * k / sr) * (1 - k / dur); } return x; };
const presets = f.musicTagPresetMap();

// FFT: 단일 사인파 피크가 맞는 bin
{ const n = 1024, re = new Float64Array(n), im = new Float64Array(n); for (let i = 0; i < n; i++) re[i] = Math.sin(2 * Math.PI * 64 * i / n); f.musicSoundFft(re, im);
  let peak = 0; for (let k = 1; k < n / 2; k++) if (Math.hypot(re[k], im[k]) > Math.hypot(re[peak], im[peak])) peak = k; ok(peak === 64, 'FFT 피크 bin 64'); }
// 너무 짧으면 null → 빈 추천
ok(f.musicSoundFeatures(new Float32Array(4000), sr) === null && f.musicSoundTags(null).length === 0, '짧은 신호는 분석 안 함');

// 빠르고 큰 트랙: 140 BPM 클릭 + 지속음
const fast = addClicks(sine(220, 0.4), 140, 0.5);
const ff = f.musicSoundFeatures(fast, sr), ft = f.musicSoundTags(ff);
ok(Math.abs(ff.bpm - 140) <= 6, 'BPM 판정 140 ± 6 (측정 ' + ff.bpm + ')');
ok(ff.energy >= 0.12, '에너지 높음 (RMS ' + ff.energy.toFixed(3) + ')');
ok(ft.includes('신나는') && ft.includes('역동적인') && !ft.includes('잔잔한'), '빠름+고에너지 → 신나는/역동적인 (' + ft + ')');
// 느리고 작은 저음 사인파
const slow = sine(110, 0.05);
const sf = f.musicSoundFeatures(slow, sr), st = f.musicSoundTags(sf);
ok(sf.energy <= 0.05 && sf.centroid < 1500, '에너지 낮음·어두움 (RMS ' + sf.energy.toFixed(3) + ', 중심 ' + Math.round(sf.centroid) + 'Hz)');
ok(st.includes('잔잔한') && st.includes('어둡고 습한') && !st.includes('신나는'), '느림+저에너지+어두움 → 잔잔한/어둡고 습한 (' + st + ')');
// 밝은 고음
const bright = sine(6000, 0.1);
const bf = f.musicSoundFeatures(bright, sr), bt = f.musicSoundTags(bf);
ok(bf.centroid >= 3000 && bt.includes('맑고 투명한') && bt.includes('청량한'), '스펙트럼 밝음 → 맑고 투명한/청량한 (중심 ' + Math.round(bf.centroid) + 'Hz)');
// 모든 추천은 프리셋 안의 값, 최대 6개, 중복 없음
const outs = [ft, st, bt, f.musicSoundTags({ bpm: 140, energy: 0.3, energyVar: 0.9, centroid: 4000 })];
ok(outs.every(t => t.every(x => presets[x]) && t.length <= 6 && new Set(t).size === t.length), '매핑 결과는 프리셋 값만·최대 6·중복 없음');
ok(f.MUSIC_SOUND_RULES.every(([, tags]) => tags.every(t => presets[t])), '규칙표의 모든 태그가 프리셋에 존재');

// 자동 1회: 파일 곡만(유튜브 제외), 디코딩 불가(OfflineAudioContext 없음)면 조용히 건너뜀, 이미 있으면 재분석 안 함
(async () => {
  const yt = { id: 'y', kind: 'youtube', tags: [], soundTagSuggestions: null }; ctx.state.musicTracks.push(yt);
  await f.musicSoundAuto(yt, { size: 10, arrayBuffer: async () => new ArrayBuffer(8) });
  ok(yt.soundTagSuggestions === null, '유튜브 곡은 대상 아님');
  const fl = { id: 'f', kind: 'file', tags: [], soundTagSuggestions: null }; ctx.state.musicTracks.push(fl);
  await f.musicSoundAuto(fl, { size: 10, arrayBuffer: async () => new ArrayBuffer(8) });
  ok(fl.soundTagSuggestions === null, '디코딩 불가 환경은 조용히 건너뜀(저장 없음)');
  // 추천 줄: 출처 구분
  const html2 = f.musicRecHtml({ id: 'z', tags: ['신나는'], soundTagSuggestions: ['신나는', '없는태그'] });
  ok(html2.includes('>소리 분석</span>') && /class="music-tag-chip rec on" data-t="신나는"/.test(html2) && !html2.includes('없는태그'), '추천 줄: 소리 분석 그룹·붙은 태그 on·프리셋 밖 제외');
  { const h = f.musicRecHtml({ id: 'z', tags: ['어둡고습한'], soundTagSuggestions: ['어둡고습한', '어둡고 습한', '몽환적인'] });
    ok(h.includes('data-t="어둡고 습한"') && (h.match(/data-t=/g) || []).length === 2 && /rec on" data-t="어둡고 습한"/.test(h), '옛 저장값(공백 없음) 추천도 프리셋 형태로 표시·중복 제거·옛 태그와 같은 칩 켜짐'); }
  ok(f.musicRecHtml({ id: 'z', tags: [], soundTagSuggestions: null }) === '' && f.musicRecRowHtml({ id: 'z', tags: [] }).includes('id="music-rec" data-id="z"></div>') && html.includes('.music-rec:empty { display: none; }'), '추천이 없으면 줄이 비어 숨겨짐');
  console.log('fails=' + fails); process.exit(fails ? 1 : 0);
})();
