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
    await page.waitForTimeout(120);

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

    await page.locator('#body-display-title').focus();
    const editing = await titleState();
    await page.locator('#body-title-block').screenshot({ path: path.join(os.tmpdir(), 'trpg-title-editing.png') });
    assert.match(editing.classes, /title-editing/);
    assert.equal(editing.subtitleDisplay, 'block');

    await page.locator('#panel-body > .panel-inner > .body-add-area').click({ position: { x: 5, y: 5 } });
    await page.waitForTimeout(20);
    const idle = await titleState();
    await page.locator('#body-title-block').screenshot({ path: path.join(os.tmpdir(), 'trpg-title-idle.png') });
    assert.doesNotMatch(idle.classes, /title-editing/);
    assert.match(idle.classes, /subtitle-empty/);
    assert.equal(idle.subtitleDisplay, 'none');
    assert.ok(idle.offset > editing.offset + 5, `title must move to vertical center: editing=${editing.offset}, idle=${idle.offset}`);

    const textBlock = page.locator('#blocks-container > .block.block-text').first();
    await textBlock.click();
    assert.equal(await textBlock.evaluate(el => el.classList.contains('selected')), true);
    await page.locator('#format-bar').dispatchEvent('mousedown', { button: 0 });
    assert.equal(await textBlock.evaluate(el => el.classList.contains('selected')), true, 'format toolbar must preserve selection');
    await page.locator('#panel-body > .panel-inner').dispatchEvent('mousedown', { button: 0 });
    assert.equal(await page.locator('.block.selected').count(), 0, 'body margin must clear block selection');

    await textBlock.click();
    await page.locator('#sidebar').dispatchEvent('mousedown', { button: 0 });
    assert.equal(await page.locator('.block.selected').count(), 0, 'sidebar must clear block selection');

    const branchChoice = page.locator('#blocks-container > .block.block-branch .branch-choice').first();
    await branchChoice.click();
    assert.equal(await page.locator('.branch-choice.active').count(), 1);
    await page.locator('#sidebar').dispatchEvent('mousedown', { button: 0 });
    assert.equal(await page.locator('.branch-choice.active').count(), 0, 'external click must clear branch choice selection');

    console.log(`script title and external selection browser checks: OK (title offset ${editing.offset.toFixed(1)}px -> ${idle.offset.toFixed(1)}px)`);
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
