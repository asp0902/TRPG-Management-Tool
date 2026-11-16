const fs = require('fs'), path = require('path'), vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13,10)).join(String.fromCharCode(10));
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok', m); };
// Blob 키 체계: 파일 곡·유튜브 첨부 모두 트랙 id(표지 'cover:<id>') → 변환 시 Blob 이동 없음
ok(html.includes("await musicBlobPut(track.id, file)") && html.includes("musicBlobPut('cover:' + track.id, cover)") && html.includes("await musicBlobPut(id, file); } catch (e) { showToast('저장 실패: ' + file.name"), 'Blob 키: 파일 곡도 첨부도 트랙 id 키, 표지는 cover:<id>');
ok(html.includes('id="music-link-url"') && html.includes('유튜브 주소 연결</button>') && html.includes("btn('삭제', 'musicUnlinkYoutube', 'music-danger')"), '파일 카드 상세에 연결 입력·버튼, 첨부 상태에 연결 해제 버튼');
ok(html.includes("(musicCoverUrls[track.id] || track.thumbnail)"), '카드 표지: 파일 표지 우선');
ok(html.includes("musicBlobDelete([id, 'cover:' + id])"), '떼어내기 시 표지 Blob 도 함께 삭제');

const code = html.slice(html.indexOf('function musicParseYoutubeId'), html.indexOf('function musicPlayerHtml')) + html.slice(html.indexOf('// 파일 곡에 유튜브 주소 연결(#295)'), html.indexOf('function musicCardDragOver'));
const els = { 'music-link-error': { textContent: '' }, 'music-modal-backdrop': {} };
let persisted = 0, rendered = 0, detail = [];
const ctx = { state: { musicTracks: [] }, persist() { persisted++; }, renderMusicPage() { rendered++; }, openMusicDetail: (id, src) => detail.push([id, src]), document: { getElementById: id => els[id] || null }, encodeURIComponent };
vm.createContext(ctx); vm.runInContext(code + ';this.f={musicLinkYoutube,musicUnlinkYoutube,musicLinkKey}', ctx);
const f = ctx.f;
const track = { id: 't1', kind: 'file', title: '제목', artist: 'A', album: 'B', tags: ['태그'], notes: 'N', folderId: 'f1', duration: 123, fileName: 'a.mp3', size: 10, attached: false, youtubeId: '', url: '', thumbnail: '', memo2: 'M' };
ctx.state.musicTracks.push(track);
// 잘못된 주소: 오류 문구, 변환 없음
f.musicLinkYoutube('t1', 'not a url');
ok(track.kind === 'file' && els['music-link-error'].textContent.includes('알아볼 수 없습니다') && persisted === 0, '잘못된 주소 → 기존 오류 문구·변환 없음');
// 연결
f.musicLinkYoutube('t1', 'https://youtu.be/dQw4w9WgXcQ');
ok(track.kind === 'youtube' && track.youtubeId === 'dQw4w9WgXcQ' && track.url === 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' && track.attached === true, '#257 「유튜브 + 첨부 파일」 형태로 변환');
ok(track.fileName === 'a.mp3' && track.size === 10 && track.duration === 123 && track.title === '제목' && track.artist === 'A' && track.album === 'B' && track.notes === 'N' && track.folderId === 'f1' && JSON.stringify(track.tags) === '["태그"]' && track.memo2 === 'M', '파일명·길이·제목·아티스트·앨범·메모·폴더·태그·기타 메타 유지');
ok(track.thumbnail === 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg', '유튜브 썸네일 설정(파일 표지는 카드에서 우선)');
ok(persisted === 1 && rendered === 1 && detail.length === 1 && detail[0][0] === 't1' && detail[0][1] === 'file', '저장·카드 갱신·상세 다시 열기(재생 기본 파일)');
// Enter 키
let prevented = false; track.kind = 'file'; track.attached = false;
f.musicLinkKey({ key: 'Enter', isComposing: true, keyCode: 229, preventDefault() { prevented = true; } }, 't1', { value: 'https://youtu.be/dQw4w9WgXcQ' });
ok(!prevented && track.kind === 'file', '한글 조합 중 Enter 무시');
f.musicLinkKey({ key: 'Enter', isComposing: false, keyCode: 13, preventDefault() { prevented = true; } }, 't1', { value: 'https://youtu.be/dQw4w9WgXcQ' });
ok(prevented && track.kind === 'youtube', 'Enter 로도 연결');
// 유튜브 곡(원래부터 유튜브)에는 연결 함수가 개입하지 않음
const yt = { id: 'y1', kind: 'youtube', youtubeId: 'abc', attached: false, tags: [] }; ctx.state.musicTracks.push(yt);
f.musicLinkYoutube('y1', 'https://youtu.be/dQw4w9WgXcQ'); ok(yt.youtubeId === 'abc', '파일 곡이 아니면 연결 안 함');
// 해제: 파일 카드로 복귀, 파일·메타 유지
f.musicUnlinkYoutube('t1');
ok(track.kind === 'file' && track.attached === false && track.youtubeId === '' && track.url === '' && track.thumbnail === '' && track.fileName === 'a.mp3' && track.duration === 123 && track.title === '제목' && JSON.stringify(track.tags) === '["태그"]', '연결 해제 → 파일 카드 복귀(파일·메타 유지)');
f.musicUnlinkYoutube('y1'); ok(yt.kind === 'youtube', '첨부 없는 유튜브 곡은 해제 대상 아님');
console.log('fails=' + fails); process.exit(fails ? 1 : 0);
