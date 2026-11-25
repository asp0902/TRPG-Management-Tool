const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');
let f = 0; const ok = (c, m) => { if (!c) { f++; console.log('FAIL', m); } else console.log('ok', m); };
// [실행] [취소] 순서(#372): 각 팝업에서 실행 버튼이 취소 버튼보다 앞
const pairs = [
  ['데이터 시트 추가/편집', 'onclick="saveDataSheetModal()"', 'onclick="closeDataSheetModal()">취소'],
  ['색상 패널', 'onclick="applyColorPanel()"', 'onclick="closeColorPanel()">취소'],
  ['카탈로그 링크', 'onclick="closeCatalogLinksPopover(true)"', 'onclick="closeCatalogLinksPopover(false)">취소'],
  ['D&D 5e 빌더', 'onclick="applyDnd5eBuilder()"', 'onclick="closeDnd5eBuilder()">취소'],
  ['CoC 사용자 기능', 'onclick="saveCocCustomSkillModal()"', 'onclick="closeCocCustomSkillModal()">취소'],
  ['GitHub 동기화 설정', 'onclick="saveGitHubSyncSettings()"', 'onclick="closeGitHubSyncModal()">취소'],
  ['색상 분할 매크로', 'onclick="insertColorSplitMacro()"', 'onclick="closeColorSplitDialog()">취소'],
  ['MUSIC 복구', 'onclick="musicRecoverApply()"', 'onclick="musicCloseModal()">취소'],
  ['룰북 추가/편집(#368)', 'onclick="saveRulebookModal()"', 'onclick="closeRulebookModal()">취소'],
];
pairs.forEach(([name, run, cancel]) => {
  const r = html.indexOf(run, html.indexOf('취소') > 0 ? 0 : 0), c = html.indexOf(cancel);
  // 실행 버튼은 해당 팝업 마크업(취소 버튼 바로 앞 600자 안)에 있어야 한다
  ok(c > 0 && html.slice(Math.max(0, c - 700), c).includes(run), name + ': [실행] [취소] 순서');
});
// 삭제 버튼 위치 유지
ok(/id="ds-modal-del-btn" style="display:none;" onclick="deleteDataSheetFromModal\(\)">삭제<\/button>\s*<button class="ds-modal-save"/.test(html), '데이터 시트: 삭제는 맨 앞(왼쪽 끝) 유지');
ok(/id="coc-custom-skill-delete-btn" style="display:none;margin-right:auto;"/.test(html) && html.indexOf('id="coc-custom-skill-delete-btn"') < html.indexOf('id="coc-custom-skill-save-btn"'), 'CoC 사용자 기능: 삭제 왼쪽 끝 유지');
ok(html.indexOf('disconnectGitHubSync()">연결 해제') < html.indexOf('onclick="saveGitHubSyncSettings()"'), 'GitHub 동기화: 연결 해제 왼쪽 끝 유지');
process.exit(f ? 1 : 0);
