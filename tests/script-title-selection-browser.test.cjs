const assert = require('node:assert/strict');
const os = require('node:os');
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
    await page.addInitScript(() => localStorage.setItem('trpg-auto-backup-enabled', '0')); // 시작 시 자동 백업 권한 팝업(#152)이 클릭을 가리지 않게
    await page.goto(pathToFileURL(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html')).href);
    await page.evaluate(() => {
      createNew();
      const scenario = cur();
      scenario.title = '중앙 제목';
      scenario.info.subtitle = '<div><br></div>&nbsp;';
      switchTab('body');
      updateBodyHeader();
      addBlock('text');
      addBlock('branch');
    });
    await page.waitForFunction(() => document.getElementById('body-title-block') && document.querySelectorAll('#blocks-container .block').length >= 2); // 블록 두 개가 그려질 때까지(#376)

    const titleState = () => page.evaluate(() => {
      const block = document.getElementById('body-title-block');
      const title = document.getElementById('body-display-title');
      const subtitle = document.getElementById('body-display-subtitle');
      const blockRect = block.getBoundingClientRect();
      const titleRect = title.getBoundingClientRect();
      return {
        classes: block.className,
        offset: titleRect.top - blockRect.top,
        subtitleDisplay: getComputedStyle(subtitle).display,
      };
    });

    // 제목 위치는 CSS 전환(transition)으로 움직이므로 값이 두 번 연속 같아질 때(안정)까지 기다린 뒤 읽는다(#416)
    const stableTitleState = async (cond) => {
      let prev = null, last = null;
      await page.waitForFunction(() => true);
      for (let i = 0; i < 100; i++) {
        last = await titleState();
        if (cond(last) && prev !== null && Math.abs(prev.offset - last.offset) < 0.01) return last;
        prev = last;
        await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
      }
      throw new Error('title state did not settle: ' + JSON.stringify(last));
    };
    // focus() 가 부하 시 편집 상태를 못 거는 경우가 있어, 안 걸리면 click()·focus() 를 번갈아 다시 시도한다(#416)
    for (let attempt = 0; attempt < 4; attempt++) {
      if (attempt % 2 === 0) await page.locator('#body-display-title').focus(); else await page.locator('#body-display-title').click();
      const ok = await page.waitForFunction(() => document.getElementById('body-title-block').className.includes('title-editing'), null, { timeout: 2500 }).then(() => true, () => false);
      if (ok) break;
    }
    // 편집 상태는 포커스에 묶여 부하 시 짧게 풀릴 수 있어, 조건을 만족한 바로 그 순간의 값을 같은 evaluate 안에서 읽는다(#416)
    const editingHandle = await page.waitForFunction(() => {
      const block = document.getElementById('body-title-block');
      if (!block || !block.className.includes('title-editing')) return false;
      const title = document.getElementById('body-display-title');
      return { classes: block.className, offset: title.getBoundingClientRect().top - block.getBoundingClientRect().top, subtitleDisplay: getComputedStyle(document.getElementById('body-display-subtitle')).display };
    });
    const editing = await editingHandle.jsonValue();
    await page.locator('#body-title-block').screenshot({ path: path.join(os.tmpdir(), 'trpg-title-editing.png') });
    assert.match(editing.classes, /title-editing/);
    assert.equal(editing.subtitleDisplay, 'block');

    await page.locator('#panel-body > .panel-inner > .body-add-area').click({ position: { x: 5, y: 5 } });
    await page.waitForFunction(() => !document.getElementById('body-title-block').className.includes('title-editing')); // 제목 편집 상태가 풀릴 때까지(#376)
    const idle = await stableTitleState(st => !/title-editing/.test(st.classes));
    await page.locator('#body-title-block').screenshot({ path: path.join(os.tmpdir(), 'trpg-title-idle.png') });
    assert.doesNotMatch(idle.classes, /title-editing/);
    assert.match(idle.classes, /subtitle-empty/);
    assert.equal(idle.subtitleDisplay, 'none');
    assert.ok(idle.offset > editing.offset + 5, `title must move to vertical center: editing=${editing.offset}, idle=${idle.offset}, classes=${idle.classes}`);

    const textBlock = page.locator('#blocks-container > .block.block-text').first();
    const selectedCount = () => page.locator('.block.selected').count();
    await textBlock.click();
    await page.waitForFunction(() => document.querySelectorAll('.block.selected').length === 1);
    assert.equal(await textBlock.evaluate(el => el.classList.contains('selected')), true, 'text block must be selected after click');
    await page.locator('#format-bar').dispatchEvent('mousedown', { button: 0 });
    assert.equal(await textBlock.evaluate(el => el.classList.contains('selected')), true, 'format toolbar must preserve selection');
    await page.locator('#panel-body > .panel-inner').dispatchEvent('mousedown', { button: 0 });
    await page.waitForFunction(() => document.querySelectorAll('.block.selected').length === 0).catch(() => {});
    assert.equal(await selectedCount(), 0, 'body margin must clear block selection');

    await textBlock.click();
    await page.waitForFunction(() => document.querySelectorAll('.block.selected').length === 1);
    await page.locator('#sidebar').dispatchEvent('mousedown', { button: 0 });
    await page.waitForFunction(() => document.querySelectorAll('.block.selected').length === 0).catch(() => {});
    assert.equal(await selectedCount(), 0, 'sidebar must clear block selection');

    const branchChoice = page.locator('#blocks-container > .block.block-branch .branch-choice').first();
    await branchChoice.click();
    await page.waitForFunction(() => document.querySelectorAll('.branch-choice.active').length === 1);
    assert.equal(await page.locator('.branch-choice.active').count(), 1);
    await page.locator('#sidebar').dispatchEvent('mousedown', { button: 0 });
    await page.waitForFunction(() => document.querySelectorAll('.branch-choice.active').length === 0).catch(() => {});
    assert.equal(await page.locator('.branch-choice.active').count(), 0, 'external click must clear branch choice selection');

    console.log(`script title and external selection browser checks: OK (title offset ${editing.offset.toFixed(1)}px -> ${idle.offset.toFixed(1)}px)`);
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
