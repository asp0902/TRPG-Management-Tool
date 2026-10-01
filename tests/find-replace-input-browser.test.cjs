const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('C:/Users/asp92/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const page = await browser.newPage({ viewport: { width: 390, height: 700 } });
  try {
    await page.goto(pathToFileURL(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html')).href);
    await page.evaluate(() => {
      createNew();
      const block = createBlockData('text');
      block.content = 'alpha alpha';
      cur().blocks = [block];
      switchTab('body');
      loadBody(cur());
    });
    await page.locator('#tb-overflow-btn').click();
    await page.locator('#tb-overflow-menu [title^="찾아 바꾸기"]').click();
    assert.equal(await page.locator('#tb-overflow-menu').evaluate(el => el.classList.contains('open')), false, '찾기 패널을 열면 더보기 메뉴 닫기');
    const find = page.locator('#fr-find');
    assert.equal(await find.evaluate(el => document.activeElement === el), true, '단축키로 찾기 입력칸에 포커스');
    for (const key of ['a', 'b', 'c']) {
      await page.keyboard.type(key);
      assert.equal(await find.evaluate(el => document.activeElement === el), true, `${key} 입력 후 포커스 유지`);
    }
    assert.equal(await find.inputValue(), 'abc');
    await page.keyboard.press('Backspace');
    await page.keyboard.type('d');
    assert.equal(await find.inputValue(), 'abd', 'Backspace 후 재입력');

    await find.dispatchEvent('compositionstart', { data: 'ㅎ' });
    await find.pressSequentially('한글', { delay: 20 });
    await find.dispatchEvent('compositionend', { data: '한글' });
    await find.fill('한글 조합');
    assert.equal(await find.evaluate(el => document.activeElement === el), true, '한글 입력 후 포커스 유지');
    const replace = page.locator('#fr-replace');
    await find.fill('alpha');
    await replace.fill('beta');
    assert.equal(await replace.inputValue(), 'beta', '바꾸기 입력');
    await page.getByRole('button', { name: '다음 찾기', exact: true }).click();
    await page.getByRole('button', { name: '모두 찾기', exact: true }).click();
    assert.equal(await page.locator('#fr-panel').evaluate(el => el.classList.contains('open')), true, '모두 찾기 후 패널 유지');
    await page.getByRole('button', { name: '모두 바꾸기', exact: true }).click();
    assert.match(await page.locator('#blocks-container').innerText(), /beta beta/, '모두 바꾸기');
    await page.locator('.fr-close').click();
    assert.equal(await page.locator('#fr-panel').evaluate(el => el.classList.contains('open')), false, '닫기');
    console.log('find replace input browser checks: OK');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
