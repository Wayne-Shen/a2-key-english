// Start a local server for dist/, then run with Playwright installed or on NODE_PATH.
const assert = require('node:assert/strict');
const {chromium, webkit} = require('playwright');
const BASE = process.env.COURSE_TEST_URL || 'http://127.0.0.1:8765/';
const KEY = 'a2-unfamiliar-words-v1';
async function run(engine, name) {
  const browser = await engine.launch({headless: true, ...(name === 'chromium' && process.env.COURSE_BROWSER_PATH ? {executablePath: process.env.COURSE_BROWSER_PATH} : {})});
  try {
    const context = await browser.newContext({viewport: {width: 1024, height: 768}});
    const page = await context.newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(BASE + 'html/index.html');
    await page.waitForSelector('.word-mark');
    assert.equal(await page.locator('.word-mark').count(), 60);
    const age = page.locator('.word-mark[data-word-id="CORE0031"]');
    await age.click();
    assert.equal(await age.getAttribute('aria-pressed'), 'true');
    await page.reload();
    assert.equal(await age.getAttribute('aria-pressed'), 'true', 'mark survives reload');
    await page.evaluate(()=>localStorage.setItem('a2-day-completed','[1]'));
    await page.goto(BASE + 'html/day02.html');
    await page.selectOption('#sectionPicker', 'review');
    assert.equal(await age.getAttribute('aria-pressed'), 'true', 'same word shares its mark on review slides');
    await age.click();
    assert.equal(await age.getAttribute('aria-pressed'), 'false');
    await age.click();
    await page.selectOption('#sectionPicker', 'vocab');
    await page.locator('.word-mark[data-word-id="CORE0001"]').click();
    const other = await context.newPage();
    await other.goto(BASE + 'word-review.html');
    await other.waitForSelector('.review-word');
    assert.equal(await other.locator('.review-word').count(), 2);
    assert.equal(await other.locator('.word-translation[open]').count(), 0, 'translations start hidden');
    await other.locator('.review-word').filter({has: other.getByRole('heading', {name: 'age', exact: true})}).locator('summary').click();
    assert.equal(await other.locator('.word-translation[open]').count(), 1);
    assert((await other.locator('.word-example').allTextContents()).some(t => t.includes('Children of my age')), 'canonical example is present even when marked on a review slide');
    await other.getByLabel('Find a word').fill('年龄');
    assert.equal(await other.locator('.review-word').count(), 1, 'Chinese search');
    await other.getByLabel('Find a word').fill(' AGE ');
    assert.equal(await other.locator('.review-word').count(), 1, 'case-insensitive search');
    await other.getByLabel('Find a word').fill('');
    await other.getByLabel('Learning day').selectOption('2');
    assert.equal(await other.locator('.review-word').count(), 1);
    await other.getByLabel('Learning day').selectOption('30');
    assert.equal(await other.locator('.review-word').count(), 0);
    assert.equal(await other.locator('#word-empty-title').textContent(), 'No matching words');
    await other.getByLabel('Learning day').selectOption('');
    await other.getByRole('button', {name: 'age: learned, remove', exact: true}).click();
    await page.waitForFunction(() => document.querySelector('[data-word-id="CORE0031"]').getAttribute('aria-pressed') === 'false');
    assert.equal(await other.locator('#word-count').textContent(), '1');
    await other.locator('.word-actions a').click();
    await other.waitForFunction(() => document.querySelector('.slide:not([hidden]) h2').textContent.includes('a / an'));
    assert.equal(new URL(other.url()).hash, '#word-CORE0001', 'return to the specific source word');
    await page.goto(BASE + 'word-review.html');
    await page.locator('.word-learned').click();
    assert.equal(await page.locator('#word-count').textContent(), '0');
    assert.equal(await page.locator('#word-empty-title').textContent(), 'Your collection is empty');
    await page.reload();
    assert.equal(await page.locator('.review-word').count(), 0, 'removal persists');
    // Preserve independent course progress and fail honestly if storage cannot be written.
    await page.goto(BASE + 'html/index.html');
    await page.evaluate(() => localStorage.setItem('a2-day-completed', '[7]'));
    await page.evaluate(() => { Storage.prototype.setItem = () => { throw new Error('quota'); }; });
    await age.click();
    assert.equal(await age.getAttribute('aria-pressed'), 'false');
    assert(await page.locator('#word-storage-error').isVisible());
    await page.reload();
    assert.equal(await page.evaluate(() => localStorage.getItem('a2-day-completed')), '[7]');
    // Check every lesson receives new and scheduled-review marking controls.
    await page.evaluate(()=>localStorage.setItem('a2-day-completed',JSON.stringify(Array.from({length:30},(_,i)=>i+1))));
    for (let day = 1; day <= 30; day++) {
      await page.goto(BASE + `html/${day === 1 ? 'index' : 'day' + String(day).padStart(2, '0')}.html`);
      const result = await page.evaluate(() => ({actual: document.querySelectorAll('.word-mark').length, expected: D.new_vocabulary.length + D.review_vocabulary.length}));
      assert.equal(result.actual, result.expected, `day ${day} has all mark buttons`);
    }
    // Actual service-worker caching, followed by network-disconnected review and navigation.
    await page.goto(BASE + 'html/index.html');
    await age.click();
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    await context.setOffline(true);
    await page.goto(BASE + 'word-review.html');
    await page.waitForSelector('.review-word');
    assert.equal(await page.locator('#word-count').textContent(), '1');
    await page.reload();
    assert.equal(await page.locator('.review-word').count(), 1);
    await page.locator('.word-actions a').click();
    await page.waitForSelector('.slide:not([hidden]) .word-mark');
    await page.locator('.slide:not([hidden]) .word-mark').click();
    await page.goto(BASE + 'word-review.html');
    assert.equal(await page.locator('.review-word').count(), 0, 'offline unmark persists');
    await context.setOffline(false);
    // Damaged state is reported without being overwritten by a later click.
    await page.evaluate(key => localStorage.setItem(key, '{broken'), KEY);
    await page.goto(BASE + 'html/index.html');
    await age.click();
    assert(await page.locator('#word-storage-error').isVisible());
    assert.equal(await page.evaluate(key => localStorage.getItem(key), KEY), '{broken');
    await page.evaluate(key => localStorage.removeItem(key), KEY);
    await page.goto(BASE + 'word-review.html');
    await page.evaluate(key => localStorage.setItem(key, JSON.stringify({CORE0031: 1, CORE0001: 2})), KEY);
    await page.reload();
    for (const size of [{width: 1024, height: 768}, {width: 768, height: 1024}, {width: 390, height: 844}]) {
      await page.setViewportSize(size);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `no overflow at ${size.width}px`);
    }
    await page.setViewportSize({width: 1024, height: 768});
    if (process.env.COURSE_SCREENSHOT) await page.screenshot({path: process.env.COURSE_SCREENSHOT, fullPage: true});
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({browser: name, passed: true, lessons: 30, persistence: true, shared_marks: true, filters: true, hidden_translations: true, storage_failure: true, offline: true, responsive: true}));
  } finally { await browser.close(); }
}
(async () => {
  await run(chromium, 'chromium');
  if (require('node:fs').existsSync(webkit.executablePath())) await run(webkit, 'webkit');
  else console.log('WebKit is not installed; Safari/iPad still needs a device check.');
})().catch(error => { console.error(error); process.exitCode = 1; });
