// Serve dist/ locally; use the same Playwright environment as test-word-review.cjs.
const assert = require('node:assert/strict');
const {chromium} = require('playwright');
const BASE = process.env.COURSE_TEST_URL || 'http://127.0.0.1:8765/';
(async () => {
  const browser = await chromium.launch({headless: true, ...(process.env.COURSE_BROWSER_PATH ? {executablePath: process.env.COURSE_BROWSER_PATH} : {})});
  try {
    const context = await browser.newContext({viewport: {width: 1024, height: 768}});
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(BASE + 'html/index.html');
    await page.selectOption('#sectionPicker', 'vquiz');
    const slide = page.locator('.slide:not([hidden])');
    const feedback = slide.locator('.feedback');
    assert.equal(await feedback.textContent(), '', 'no feedback before selecting');
    await slide.locator('.choice-row').nth(0).click();
    assert.match(await feedback.textContent(), /Correct!/);
    await slide.locator('.choice-row').nth(1).click();
    assert.match(await feedback.textContent(), /Not quite/);
    await slide.locator('input[type=radio]:checked').press('ArrowUp');
    assert.match(await feedback.textContent(), /Correct!/, 'keyboard selection also checks');
    const selected = await slide.locator('input[type=radio]:checked').inputValue();
    await slide.locator('input[type=radio]:checked').press('ArrowRight');
    await page.locator('#prevSlide').click();
    assert.equal(await slide.locator('input[type=radio]:checked').inputValue(), selected, 'page arrows preserve answers');
    assert.equal(await slide.locator('.answer.show,.explanation.show').count(), 0, 'checking does not reveal answers or explanations');
    let questions = 0;
    for (let day = 1; day <= 30; day++) {
      await page.goto(BASE + `html/${day === 1 ? 'index' : 'day' + String(day).padStart(2, '0')}.html`);
      questions += await page.evaluate(() => {
        let count = 0;
        for (const card of document.querySelectorAll('.question-card')) {
          const radios = [...card.querySelectorAll('input[type=radio]')];
          const feedback = card.querySelector('.feedback');
          if (!radios.length) {
            const input = card.querySelector('input[type=text]');
            input.value = 'unfinished';
            input.dispatchEvent(new Event('input', {bubbles: true}));
            if (feedback.textContent) throw new Error('Typing must not auto-check incomplete input');
            continue;
          }
          radios.forEach((radio, index) => {
            const label = String.fromCharCode(65 + index);
            const text = radio.closest('label').textContent.trim();
            if (radio.value !== label || !text.startsWith(label + '. ')) throw new Error('Choice labels must follow their displayed positions');
            if (/^[A-Z]\.\s*[A-Z]\.\s/.test(text)) throw new Error('Choice label is duplicated');
          });
          const expected = card.querySelector('.answer').textContent.slice('Answer: '.length).trim();
          const correct = radios.find(radio => radio.value === expected);
          const wrong = radios.find(radio => radio.value !== expected);
          if (!correct || !wrong) throw new Error('Cannot identify both options');
          wrong.checked = true;
          wrong.dispatchEvent(new Event('change', {bubbles: true}));
          if (!feedback.classList.contains('retry')) throw new Error('Wrong choice did not auto-check');
          correct.checked = true;
          correct.dispatchEvent(new Event('change', {bubbles: true}));
          if (!feedback.classList.contains('correct')) throw new Error('Corrected choice did not auto-check');
          if (card.querySelector('.answer.show,.explanation.show')) throw new Error('Auto-check revealed the answer');
          count++;
        }
        return count;
      });
    }
    await page.goto(BASE + 'html/day05.html');
    await page.selectOption('#sectionPicker', 'listening-part4');
    await page.locator('#nextSlide').click();
    assert.equal(await slide.locator('.qhead').textContent(), 'What does the boy want?');
    assert.deepEqual(await slide.locator('.choice-row span').allTextContents(), ['A. A winter coat', 'B. Help with his idea', 'C. A new farm']);
    await slide.locator('.choice-row').filter({hasText: 'B. Help with his idea'}).click();
    assert.match(await slide.locator('.feedback').textContent(), /Correct!/);
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({passed: true, lessons: 30, choice_questions: questions, automatic_feedback: true, retry: true, keyboard: true, typed_input_unchanged: true}));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
