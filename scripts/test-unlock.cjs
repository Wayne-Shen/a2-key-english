const assert=require('node:assert/strict'),{chromium}=require('playwright');
const BASE=process.env.COURSE_TEST_URL||'http://127.0.0.1:8766/';
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.COURSE_BROWSER_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 try{
  const context=await browser.newContext({viewport:{width:1194,height:834},reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.goto(BASE);
  assert.equal(await page.locator('#day-grid a').count(),1);assert.equal(await page.locator('#day-grid [aria-disabled=true]').count(),29);
  await page.locator('[data-nav=vocabulary]').click();assert.equal(await page.locator('#practice-day option:disabled').count(),29);
  await page.evaluate(()=>{
   const word=A2WordCatalog.find(w=>w.day===30);
   localStorage.setItem('a2-unfamiliar-words-v1',JSON.stringify({[word.id]:42}));
   localStorage.setItem('a2-studio-session-v1',JSON.stringify({version:1,source:'day',day:30,ids:[word.id],index:0,recalled:[],again:[]}));
  });
  await page.reload();assert.equal(await page.locator('#practice-day').inputValue(),'1','restored future session cannot bypass lesson order');
  await page.goto(BASE+'word-review.html');assert.equal(await page.locator('.review-word').count(),0,'future marked words stay gated');
  assert.equal(await page.locator('#word-empty-title').innerText(),'These words are in locked lessons');
  await page.goto(BASE+'html/day30.html#word-CORE0001');assert.equal(await page.locator('#lesson-access').isVisible(),true);assert.equal(await page.locator('.slide').count(),0);assert.equal(await page.evaluate(()=>typeof D),'undefined','locked lesson code is not executed');
  await page.goto(BASE+'html/index.html');await page.locator('#courseToggle').click();
  assert.equal(await page.locator('#dayNav [aria-disabled=true]').count(),29);
  await page.locator('#done').check();assert.match(await page.locator('#unlock-notice').innerText(),/Day 02 is unlocked/);
  assert.equal(await page.locator('#dayNav a[href]').count(),2);
  await page.locator('#unlocked-next').click();await page.waitForSelector('.slide:not([hidden])');
  assert.equal(await page.locator('#lessonTitle').innerText(),'My school bag');
  const other=await context.newPage();await other.goto(BASE);
  await other.evaluate(()=>localStorage.setItem('a2-day-completed','[]'));
  await page.waitForFunction(()=>!document.getElementById('lesson-access').hidden);
  assert.equal(await page.locator('#practice').isVisible(),false,'revoking an earlier day locks an open later lesson');
  await other.evaluate(()=>localStorage.setItem('a2-day-completed','[1]'));
  await page.waitForSelector('.slide:not([hidden])');
  assert.equal(await page.locator('#lessonTitle').innerText(),'My school bag','unlock restores the open lesson without duplicate execution');
  await other.close();
  await page.evaluate(async()=>{await navigator.serviceWorker.ready;});await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.goto(BASE+'html/day03.html');assert.equal(await page.locator('#lesson-access').isVisible(),true,'cached lessons remain gated offline');
  await page.goto(BASE+'html/day02.html');await page.waitForSelector('.slide:not([hidden])');await page.locator('#courseToggle').click();await page.locator('#done').check();await page.locator('#unlocked-next').click();await page.waitForSelector('.slide:not([hidden])');assert.equal(await page.locator('#lessonTitle').innerText(),'At home');
  await context.setOffline(false);
  for(let day=3;day<=30;day++){
   if(day!==3)await page.goto(BASE+`html/day${String(day).padStart(2,'0')}.html`);
   await page.waitForSelector('.slide:not([hidden])');await page.locator('#courseToggle').click();await page.locator('#done').check();
   assert.equal(await page.locator('#dayNav [aria-disabled=true]').count(),Math.max(0,29-day));
   if(day<30){const nextURL=BASE+`html/day${String(day+1).padStart(2,'0')}.html`;await page.locator('#unlocked-next').click();await page.waitForURL(nextURL);await page.waitForSelector('.slide:not([hidden])');}
  }
  await page.goto(BASE);assert.equal(await page.locator('#day-grid a').count(),30);assert.equal(await page.locator('#days-complete').innerText(),'30');
  await page.evaluate(()=>{localStorage.setItem('a2-day-completed','[7]');localStorage.setItem('a2-unfamiliar-words-v1','{"CORE0031":42}');});
  await page.reload();assert.equal(await page.locator('#day-grid a').count(),2,'legacy completed day stays reviewable, but does not unlock new future days');
  await page.goto(BASE+'html/day07.html');await page.waitForSelector('.slide:not([hidden])');assert.equal(await page.locator('#done').isChecked(),true);
  await page.goto(BASE+'html/day08.html');assert.equal(await page.locator('#lesson-access').isVisible(),true);
  assert.equal(await page.evaluate(()=>localStorage.getItem('a2-day-completed')),'[7]');assert.equal(await page.evaluate(()=>localStorage.getItem('a2-unfamiliar-words-v1')),'{"CORE0031":42}');
  await page.evaluate(()=>localStorage.setItem('a2-day-completed','{broken'));await page.reload();assert.equal(await page.locator('#lesson-access').isVisible(),true);assert.equal(await page.evaluate(()=>localStorage.getItem('a2-day-completed')),'{broken','invalid progress is not overwritten');
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({passed:true,sequential_days:30,initial_day_only:true,direct_link_guard:true,no_locked_lesson_execution:true,dashboard_and_menu:true,vocabulary_gate:true,cross_tab_lock_and_unlock:true,offline_unlock:true,legacy_records_preserved:true,completed_review:true,invalid_storage_preserved:true},null,2));
  await context.close();
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
