const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('C:/Users/asp92/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const shots = path.join(__dirname, '.artifacts', 'format-toolbar-overflow');
  fs.mkdirSync(shots, { recursive: true });
  try {
    await page.goto(pathToFileURL(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html')).href);
    await page.evaluate(() => {
      createNew();
      cur().blocks = [createBlockData('text')];
      cur().blocks[0].content = '서식 도구 선택 유지 검사';
      switchTab('body');
      loadBody(cur());
    });

    for (const width of [760, 600, 390]) {
      await page.setViewportSize({ width, height: 700 });
      await page.waitForTimeout(80);
      const metrics = await page.locator('#format-bar').evaluate(el => {
        const bar = el.querySelector('.tb-bar');
        const button = el.querySelector('#tb-overflow-btn');
        return {
          barHeight: bar.getBoundingClientRect().height,
          scrollHeight: bar.scrollHeight,
          scrollWidth: bar.scrollWidth,
          clientWidth: bar.clientWidth,
          buttonVisible: getComputedStyle(button).display !== 'none',
          pageOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        };
      });
      assert.equal(metrics.barHeight, 36, `${width}px 툴바 높이`);
      assert.equal(metrics.scrollHeight, 36, `${width}px 세로 스크롤 공간 없음`);
      assert.equal(metrics.scrollWidth, metrics.clientWidth, `${width}px 가로 스크롤 없음`);
      assert.equal(metrics.buttonVisible, true, `${width}px 더보기 표시`);
      assert.equal(metrics.pageOverflow, false, `${width}px 페이지 가로 오버플로 없음`);
      await page.screenshot({ path: path.join(shots, `${width}.png`), fullPage: true });
    }

    const editable = page.locator('.block [contenteditable="true"]').first();
    await editable.evaluate(el => {
      const range = document.createRange();
      range.selectNodeContents(el);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      el.focus();
      el.dispatchEvent(new Event('focusin', { bubbles: true }));
    });
    await page.locator('#tb-overflow-btn').click();
    assert.equal(await page.locator('#tb-overflow-menu').getAttribute('class'), 'tb-overflow-menu open');
    await page.screenshot({ path: path.join(shots, '390-menu-open.png'), fullPage: true });
    await page.locator('#tb-overflow-menu #tb-bold-btn').click();
    assert.match(await editable.innerHTML(), /font-weight:\s*bold|<b>|<strong>/i, '더보기 안 원본 버튼이 저장된 선택에 적용');

    await page.setViewportSize({ width: 1920, height: 900 });
    await page.waitForTimeout(80);
    assert.equal(await page.locator('#tb-overflow-btn').isVisible(), false, '넓은 화면 더보기 숨김');
    assert.equal(await page.locator('#tb-overflow-menu').locator(':scope > *').count(), 0, '모든 원본 도구 복귀');

    await page.evaluate(() => {
      const rb = normalizeRulebookEntry({
        id: 'toolbar-layout-rulebook', title: '레이아웃 검사',
        chapters: [{ id: 'toolbar-layout-chapter', title: '1장', parentId: '', blocks: [createBlockData('text')] }],
      });
      state.rulebooks.push(rb);
      switchPage('rulebook');
      openRulebookDetail(rb.id);
    });
    for (const width of [760, 600, 390]) {
      await page.setViewportSize({ width, height: 700 });
      await page.waitForTimeout(80);
      const layout = await page.locator('#rb-chapter-content').evaluate(el => {
        const body = el.querySelector('#rb-chapter-body');
        const contentRect = el.getBoundingClientRect();
        const bodyRect = body.getBoundingClientRect();
        return {
          contained: bodyRect.left >= contentRect.left && bodyRect.right <= contentRect.right + 0.5,
          pageOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        };
      });
      assert.equal(layout.contained, true, `${width}px 룰북 본문 왼쪽 잘림 없음`);
      assert.equal(layout.pageOverflow, false, `${width}px 룰북 페이지 가로 오버플로 없음`);
    }
    console.log('format toolbar overflow browser test: ok');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
