const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13, 10)).join(String.fromCharCode(10));
// MUSIC 페이지(#255): 순수 함수만 잘라 실행
const a = html.indexOf('const MUSIC_AUDIO_EXTS'), b = html.indexOf('async function musicReadTags');
assert.ok(a > 0 && b > a);
const ctx = { mkId: () => 'id' + Math.random().toString(36).slice(2), normalizeCssMacroTags: v => (Array.isArray(v) ? v : String(v || '').split(/[\s#,]+/)).filter(Boolean), esc: s => String(s), TextDecoder };
vm.runInNewContext(html.slice(a, b) + '\nthis.f = normalizeMusicFolder; this.t = normalizeMusicTrack; this.yt = musicParseYoutubeId; this.html = musicPlayerHtml; this.id3 = musicParseId3;', ctx);

// 유튜브 링크 파싱
['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'https://youtu.be/dQw4w9WgXcQ?t=3', 'https://youtube.com/watch?feature=x&v=dQw4w9WgXcQ', 'https://www.youtube.com/shorts/dQw4w9WgXcQ', 'https://music.youtube.com/watch?v=dQw4w9WgXcQ', 'https://www.youtube.com/embed/dQw4w9WgXcQ'].forEach(u => assert.equal(ctx.yt(u), 'dQw4w9WgXcQ', u));
['', 'https://example.com/watch?v=dQw4w9WgXcQ', 'https://www.youtube.com/watch?v=short'].forEach(u => assert.equal(ctx.yt(u), '', u));

// 정규화: 메타데이터에 Blob 류 값이 들어오지 않는다
const t = ctx.t({ id: 'x', kind: 'file', title: 'T', blob: 'BIG', cover: 'data:image/png;base64,AAAA', duration: 61.2, tags: '#a #b' });
assert.deepEqual(Object.keys(t).sort(), ['addedAt', 'album', 'attached', 'artist', 'duration', 'fileName', 'folderId', 'id', 'kind', 'notes', 'size', 'tags', 'thumbnail', 'title', 'url', 'youtubeId'].sort());
assert.ok(!JSON.stringify(t).includes('BIG') && !JSON.stringify(t).includes('data:image'));
assert.equal(ctx.f({ name: 'F', color: 'red' }).color, '');
assert.equal(ctx.f({ name: 'F', color: '#AABBCC' }).color, '#AABBCC');

// 플레이어: 유튜브는 임베드 iframe(다운로드 없음), 파일은 audio, Blob 없으면 안내
const yt = ctx.html({ kind: 'youtube', youtubeId: 'dQw4w9WgXcQ' });
assert.ok(yt.includes('src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1'));
assert.ok(ctx.html({ kind: 'file' }, 'blob:x').includes('<audio'));
assert.ok(ctx.html({ kind: 'file' }, '').includes('이 기기에 파일 없음'));

// ID3v2.3: TIT2(utf-16 BOM) / TPE1(latin1) / TALB(utf-8, v2.3 은 enc 3 없음이지만 디코더 확인) / APIC
const enc = new TextEncoder();
const u16 = s => { const out = [1, 0xFF, 0xFE]; for (const c of s) { const n = c.charCodeAt(0); out.push(n & 255, n >> 8); } return out; };
const frame = (id, data) => [...enc.encode(id), (data.length >>> 24) & 255, (data.length >>> 16) & 255, (data.length >>> 8) & 255, data.length & 255, 0, 0, ...data];
const body = [...frame('TIT2', u16('안녕')), ...frame('TPE1', [0, ...enc.encode('Artist')]), ...frame('TALB', [3, ...enc.encode('앨범')]), ...frame('APIC', [0, ...enc.encode('image/png'), 0, 3, 0, 1, 2, 3, 4])];
const size = body.length;
const tag = Uint8Array.from([0x49, 0x44, 0x33, 3, 0, 0, (size >> 21) & 127, (size >> 14) & 127, (size >> 7) & 127, size & 127, ...body]);
const r = ctx.id3(tag, TextDecoder);
assert.equal(r.title, '안녕'); assert.equal(r.artist, 'Artist'); assert.equal(r.album, '앨범');
assert.equal(r.cover.mime, 'image/png'); assert.deepEqual([...r.cover.bytes], [1, 2, 3, 4]);
assert.equal(JSON.stringify(ctx.id3(Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), TextDecoder)), JSON.stringify({ title: '', artist: '', album: '', cover: null }));

// #257: 유튜브 트랙의 파일 첨부(메타데이터는 여부만). 파일 트랙에는 attached 가 없다.
assert.equal(ctx.t({ kind: 'youtube', attached: true, fileName: 'a.mp3' }).attached, true);
assert.equal(ctx.t({ kind: 'youtube' }).attached, false);
assert.equal(ctx.t({ kind: 'file', attached: true }).attached, false);
// 첨부 파일 URL 이 있으면 유튜브 트랙도 audio, 없으면(다른 기기·유튜브 전환) iframe
assert.ok(ctx.html({ kind: 'youtube', youtubeId: 'dQw4w9WgXcQ', attached: true }, 'blob:x').includes('<audio'));
assert.ok(ctx.html({ kind: 'youtube', youtubeId: 'dQw4w9WgXcQ', attached: true }, '').includes('<iframe'));
['async function musicAttachFile', 'async function musicDetach', 'music-card-file', 'musicCardDrop(event,'].forEach(k => assert.ok(html.includes(k), k));
assert.ok(!fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').includes(String.fromCharCode(13, 13, 10)), 'CR 중복 없음');

// 연결: 내비·페이지·동기화 키(메타데이터만), Blob 저장소는 별도 DB
assert.ok(html.includes('data-page="music"') && html.includes('<div id="page-music">'));
assert.ok(html.includes("document.getElementById('page-music').style.display = page === 'music'"));
const make = html.slice(html.indexOf('function makeStatePayload'), html.indexOf('function applyStatePayload'));
assert.ok(make.includes('musicFolders: state.musicFolders') && make.includes('musicTracks: state.musicTracks'));
assert.ok(html.includes("const MUSIC_DB_NAME = 'trpg-music'") && !/musicBlob|MUSIC_DB/.test(make));
assert.ok(!/youtube[^\n]*(download|extract|ytdl)/i.test(html.slice(a, b)));
console.log('music page checks: OK');
