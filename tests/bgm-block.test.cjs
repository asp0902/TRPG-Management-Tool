const fs = require('fs'), path = require('path'), vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13,10)).join(String.fromCharCode(10));
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok', m); };
const cut = (a, b) => html.slice(html.indexOf(a), html.indexOf(b));
ok(html.includes("{ id:'bgm',     label:'BGM',"), 'BTYPES 에 bgm');
ok(html.includes("if (typeId === 'bgm') b.trackId = '';") && html.includes("case 'bgm':\n      bodyHtml = bgmBlockHtml(b, cid);"), '블록 생성(trackId)·렌더');
ok(!html.includes("bgm:'BGM / SE 정보'"), '옛 placeholder 정리');
ok(html.includes("if (b.type === 'bgm') {\n      text = bgmExportLine(b);") && html.includes("if (block?.type === 'bgm') return bgmExportLine(block);"), '복사·범위 복사 내보내기 경로');
ok(html.includes("'column', 'bgm'].includes(block.type)"), '본문→하위 블록 승격 제외');
const code = cut('function bgmTrackOf', 'async function bgmPlay');
const els = {};
const ctx = { state: { musicTracks: [] }, esc: x => String(x == null ? '' : x), musicTrackTitle: t => t.title || t.fileName || '제목 없음', musicCoverUrls: {}, musicLocalIds: new Set() };
vm.createContext(ctx); vm.runInContext(code + ';this.f={bgmTrackOf,bgmBlockHtml,bgmExportLine}', ctx);
const f = ctx.f; const S = ctx.state;
S.musicTracks = [{ id: 'y', kind: 'youtube', url: 'https://youtu.be/x', title: '곡', artist: '가수', thumbnail: 'T.jpg', tags: [] }, { id: 'f', kind: 'file', fileName: 'a.mp3', title: '', artist: '', tags: [] }];
ok(f.bgmExportLine({ trackId: 'y' }) === 'BGM: 곡 - 가수 https://youtu.be/x', '내보내기: 제목 - 아티스트 + 유튜브 URL');
ok(f.bgmExportLine({ trackId: 'f' }) === 'BGM: a.mp3', '파일 곡: 제목 없으면 파일명, URL 없음');
ok(f.bgmExportLine({ trackId: 'zz' }) === 'BGM: (삭제된 곡)' && f.bgmExportLine({ trackId: '' }) === 'BGM:', '삭제된 곡·미선택 내보내기');
ok(f.bgmBlockHtml({ id: 'b1', trackId: '' }, 'c').includes('곡 선택') && !f.bgmBlockHtml({ id: 'b1', trackId: '' }, 'c').includes('bgm-play'), '미선택: 곡 선택 버튼만');
const sel = f.bgmBlockHtml({ id: 'b1', trackId: 'y' }, 'c');
ok(sel.includes('T.jpg') && sel.includes('곡') && sel.includes('가수') && sel.includes("bgmPlay('y')") && sel.includes('fa-right-left') && sel.includes('title="곡 바꾸기"') && sel.includes('aria-label="곡 바꾸기"') && sel.includes('class="bgm-play bgm-swap"') && !sel.includes('>바꾸기<'), '선택됨: 섬네일·제목·아티스트·▶·바꾸기 아이콘(fa-right-left, title·aria-label 곡 바꾸기, #346)');
const del = f.bgmBlockHtml({ id: 'b1', trackId: 'zz' }, 'c');
ok(del.includes('삭제된 곡') && del.includes('곡 선택') && !del.includes('bgm-play'), '삭제된 곡 표시 + 곡 선택');
ctx.musicLocalIds = new Set(['other']);
ok(f.bgmBlockHtml({ id: 'b1', trackId: 'f' }, 'c').includes('이 기기에 파일 없음'), '이 기기에 파일 없는 PC 파일 곡 안내');
ok(!JSON.stringify({ id: 'b', type: 'bgm', trackId: 'y' }).includes('곡'), '제목·섬네일은 블록에 저장하지 않음');
{ const css = html.match(/\.bgm-block \{[^}]*\}/)[0];
  ok(!/border|background|radius/.test(css) && css.includes('padding: 0'), '.bgm-block 자체 테두리·배경·둥근 모서리 없음(이중 박스 제거, #342)');
  ok(/\.block:has\(> \.block-body > \.bgm-block\) \{ background: #fff; \}/.test(html), '바깥 .block 배경 #fff(테두리는 .block 기존 것, #344)');
  ok(/\.block\.block-child > \.block-body > \.bgm-block \{ padding: 4px 8px; \}/.test(html), '콜아웃 안쪽 블록 여백 보충');
  ok(/:is\(\.callout-body, \.nested-callout\) \.block-children-wrap > \.block:has\(> \.block-body > \.bgm-block\) \{[^}]*width: calc\(100% - 12px\)[^}]*max-width: calc\(100% - 12px\)[^}]*margin: 3px 6px/.test(html), '콜아웃 안 BGM 바깥 여백 상하 3px·좌우 6px(#345)');
  ok(/\.bgm-btn, \.bgm-play \{[^}]*border: 1px solid #1a1a1a; background: #1a1a1a;[^}]*color: #fff;/.test(html) && /\.bgm-btn:hover, \.bgm-play:hover \{ background: #333;/.test(html), 'BGM 버튼 #1a1a1a·글자 흰색·hover #333(#344)'); }
{
  ok(/\.block-body:has\(> \.bgm-block\) > \.block-children-wrap \{ margin-top: 0; \}/.test(html), 'BGM 본문의 빈 자식 영역 위 여백 제거 → 내용 세로 중앙(#349)');
  ok(/\.callout-body > \.block-children-wrap > \.block:has\(> \.block-body > \.bgm-block\) \{ width: calc\(100% - 9px\); max-width: calc\(100% - 9px\); margin-right: 3px; \}/.test(html), '콜아웃 안 BGM 오른쪽 3px 로 좌우 보이는 여백 12px 동일(#349)');
}
console.log('fails=' + fails); process.exit(fails ? 1 : 0);
