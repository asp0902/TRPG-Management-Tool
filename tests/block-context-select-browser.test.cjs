const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('C:/Users/asp92/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  try {
    await page.goto(pathToFileURL(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html')).href);
    const ids = await page.evaluate(() => {
      createNew();
      const parent = createBlockData('callout');
      const child = createBlockData('text');
      parent.content = '부모 블록';
      child.content = '자식 블록 선택 문자열';
      parent.children.push(child);
      cur().blocks = [parent, createBlockData('text')];
      switchTab('body');
      loadBody(cur());
      resetScenarioHistory(cur().id);
      return {
        scenarioId: cur().id,
        parent: parent.id,
        child: child.id,
        other: cur().blocks[1].id,
        visibleCount: flattenBlockTreeForRangeSelection('blocks-container').length,
      };
    });

    const toolbarTop = await page.locator('#format-bar').evaluate(el => el.getBoundingClientRect().top);
    await page.setViewportSize({ width: 640, height: 350 });
    assert.equal(await page.locator('#format-bar').evaluate(el => el.getBoundingClientRect().top), toolbarTop, '창 축소 시 툴바 위치를 유지해야 합니다.');
    assert.equal(await page.locator('#format-bar').evaluate(el => el.getBoundingClientRect().height), 37, '툴바 높이를 유지해야 합니다.');
    await page.setViewportSize({ width: 1440, height: 900 });

    const child = page.locator(`.block[data-id="${ids.child}"]`);
    await child.locator('[contenteditable="true"]').evaluate(el => {
      const range = document.createRange();
      range.selectNodeContents(el);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    });
    await child.click({ button: 'right' });
    await page.getByText('전체 블록 선택', { exact: true }).click();

    assert.equal(await page.locator('.block.range-selected').count(), ids.visibleCount, '현재 페이지의 최상위·자식 블록을 모두 선택해야 합니다.');
    assert.equal(await page.evaluate(() => selectedBlockId), null, '단일 블록 선택 상태가 남으면 안 됩니다.');
    assert.equal(await page.evaluate(() => window.getSelection().toString()), '', '전체 블록 선택 시 텍스트 selection을 정리해야 합니다.');
    assert.equal(await child.evaluate(el => getComputedStyle(el).outlineStyle), 'solid', '다중 블록 선택 표시는 유지해야 합니다.');

    const other = page.locator(`.block[data-id="${ids.other}"]`);
    await page.evaluate(id => {
      const block = getBlockArrayInfo(id, 'blocks-container').block;
      block.circularCutGuard = block;
    }, ids.parent);
    await other.click({ button: 'right' });
    await page.getByText('잘라내기', { exact: true }).click();
    assert.equal(await page.evaluate(() => cur().blocks.length), 2, '클립보드 생성 실패 시 원본을 삭제하면 안 됩니다.');
    await page.evaluate(id => { delete getBlockArrayInfo(id, 'blocks-container').block.circularCutGuard; }, ids.parent);

    await other.click({ button: 'right' });
    await page.getByText('잘라내기', { exact: true }).click();
    assert.equal(await page.evaluate(() => cur().blocks.length), 0, '선택한 최상위 블록 트리 전체를 잘라내야 합니다.');
    assert.equal(await page.evaluate(() => _blockClipboard.blocks?.length), 2, '잘라낸 최상위 블록 순서를 클립보드에 보존해야 합니다.');
    assert.equal(await page.evaluate(() => _blockClipboard.blocks[0].children.some(block => block.content === '자식 블록 선택 문자열')), true, '잘라낸 중첩 자식 데이터를 보존해야 합니다.');
    await page.evaluate(() => tbUndo());
    assert.equal(await page.evaluate(() => cur().blocks.length), 2, '한 번의 실행 취소로 전체 잘라내기를 복원해야 합니다.');
    await page.evaluate(() => tbRedo());
    assert.equal(await page.evaluate(() => cur().blocks.length), 0, '다시 실행하면 전체 잘라내기를 재적용해야 합니다.');
    const cutPaste = await page.evaluate(() => {
      const sourceIds = getScriptBlockTreeItems(_blockClipboard.blocks).map(block => block.id);
      pasteBlock(0, makeRootBlockTargetKey('blocks-container'));
      const pastedIds = getScriptBlockTreeItems(cur().blocks).map(block => block.id);
      return {
        count: cur().blocks.length,
        unique: new Set(pastedIds).size === pastedIds.length,
        replacedIds: pastedIds.every(id => !sourceIds.includes(id)),
      };
    });
    assert.equal(cutPaste.count, 2, '잘라내기 직후 전체 묶음을 붙여넣어야 합니다.');
    assert.equal(cutPaste.unique, true, '붙여넣은 중첩 트리 ID가 중복되면 안 됩니다.');
    assert.equal(cutPaste.replacedIds, true, '붙여넣기는 잘라낸 원본과 다른 ID를 사용해야 합니다.');
    await page.evaluate(() => { tbUndo(); tbUndo(); });
    assert.equal(await page.evaluate(() => cur().blocks.length), 2, '붙여넣기와 잘라내기를 각각 실행 취소해 원본을 복원해야 합니다.');

    await child.click({ button: 'right' });
    await page.getByText('전체 블록 선택', { exact: true }).click();
    await other.click({ button: 'right' });
    await page.getByText('복사', { exact: true }).click();
    assert.equal(await page.evaluate(() => _blockClipboard.blocks?.length), 2, '선택된 최상위 블록 묶음을 복사해야 합니다.');

    await other.click({ button: 'right' });
    await page.getByText('붙여넣기', { exact: true }).click();
    await page.waitForTimeout(80);
    const pasted = await page.evaluate(async () => {
      await persistNow();
      const blocks = cur().blocks;
      const ids = getScriptBlockTreeItems(blocks).map(block => block.id);
      const stored = await getIndexedState();
      return {
        topLevelCount: blocks.length,
        uniqueIdCount: new Set(ids).size,
        idCount: ids.length,
        copiedChildContent: getScriptBlockTreeItems(blocks.slice(2)).some(block => block.content === '자식 블록 선택 문자열'),
        storedCount: stored?.scenarios?.find(item => item.id === cur().id)?.blocks?.length || 0,
      };
    });
    assert.equal(pasted.topLevelCount, 4, '복사한 전체 블록을 대상 뒤에 같은 순서로 붙여넣어야 합니다.');
    assert.equal(pasted.uniqueIdCount, pasted.idCount, '붙여넣은 중첩 구조까지 ID가 중복되면 안 됩니다.');
    assert.equal(pasted.copiedChildContent, true, '자식 구조와 내용을 보존해야 합니다.');
    assert.equal(pasted.storedCount, 4, '붙여넣기 결과를 저장해야 합니다.');

    await page.evaluate(() => tbUndo());
    assert.equal(await page.evaluate(() => cur().blocks.length), 2, '붙여넣기 전체를 한 번에 실행 취소해야 합니다.');
    await page.evaluate(() => tbRedo());
    assert.equal(await page.evaluate(() => cur().blocks.length), 4, '다시 실행하면 전체 붙여넣기를 복원해야 합니다.');
    await page.evaluate(() => persistNow());
    await page.reload();
    await page.waitForFunction(id => state.scenarios.some(item => item.id === id), ids.scenarioId);
    assert.equal(await page.evaluate(id => state.scenarios.find(item => item.id === id).blocks.length, ids.scenarioId), 4, '새로고침 후 붙여넣기 결과를 유지해야 합니다.');

    await page.evaluate(id => select(id, 'body'), ids.scenarioId);
    const lastBlock = page.locator('#blocks-container > .block').last();
    const otherBox = await lastBlock.boundingBox();
    await lastBlock.click({ position: { x: otherBox.width - 3, y: otherBox.height / 2 } });
    assert.equal(await page.locator('.block.range-selected').count(), 0, '블록 우측 공백 클릭은 전체 선택을 해제해야 합니다.');

    await other.click();
    await page.locator('#sidebar').dispatchEvent('mousedown', { button: 0 });
    assert.equal(await page.locator('.block.selected').count(), 0, '본문 밖 클릭은 선택을 해제해야 합니다.');

    const firstBlock = page.locator('#blocks-container > .block').first();
    await firstBlock.click({ button: 'right' });
    await page.getByText('전체 블록 선택', { exact: true }).click();
    const persistedCutPaste = await page.evaluate(async () => {
      const oldIds = getScriptBlockTreeItems(cur().blocks).map(block => block.id);
      cutBlock(cur().blocks[0].id, 'blocks-container');
      pasteBlock(0, makeRootBlockTargetKey('blocks-container'));
      const newIds = getScriptBlockTreeItems(cur().blocks).map(block => block.id);
      await persistNow();
      return { count: cur().blocks.length, idsChanged: newIds.every(id => !oldIds.includes(id)) };
    });
    assert.equal(persistedCutPaste.count, 4, '전체 잘라내기 후 붙여넣기 블록 수를 유지해야 합니다.');
    assert.equal(persistedCutPaste.idsChanged, true, '전체 잘라내기 후 붙여넣기는 모든 트리에 새 ID를 부여해야 합니다.');
    await page.reload();
    await page.waitForFunction(id => state.scenarios.some(item => item.id === id), ids.scenarioId);
    assert.equal(await page.evaluate(id => state.scenarios.find(item => item.id === id).blocks.length, ids.scenarioId), 4, '전체 잘라내기·붙여넣기를 새로고침 후 유지해야 합니다.');
    console.log('block context select browser checks: OK');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
