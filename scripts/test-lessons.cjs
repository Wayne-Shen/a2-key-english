// Focused lesson layout, using the unchanged authored exercises and browser interactions.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const BASE=process.env.COURSE_TEST_URL||'http://127.0.0.1:8766/';
const OUT=process.env.LESSON_SCREENSHOTS||'/tmp/a2-focused-lessons';
(async()=>{
 fs.mkdirSync(OUT,{recursive:true});
 const browser=await chromium.launch({headless:true,executablePath:process.env.COURSE_BROWSER_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 try{
  const context=await browser.newContext({viewport:{width:1194,height:834},reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(BASE);
  await page.evaluate(()=>localStorage.setItem('a2-day-completed',JSON.stringify(Array.from({length:30},(_,i)=>i+1))));
  for(let day=1;day<=30;day++){
   await page.goto(BASE+`html/${day===1?'index':`day${String(day).padStart(2,'0')}`}.html`);
   try{await page.waitForSelector('.slide:not([hidden]) .word-mark',{timeout:10000});}catch(error){throw new Error(`Day ${day}: ${page.url()} ${JSON.stringify(errors)} ${error.message}`);}
   assert.equal(await page.locator('#courseMenu').getAttribute('open'),null);
   assert.equal(await page.locator('#done').isVisible(),false,'completion is available in tools');
   assert.equal(await page.locator('.slide:not([hidden]) .context .word-mark').count(),1);
   assert.equal(await page.locator('.slide:not([hidden]) .translation-disclosure .context-cn').isVisible(),false);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`day ${day} fits width`);
   await page.selectOption('#sectionPicker','reading-part3');
   assert.equal(await page.locator('#sectionCount').innerText(),'1 / 5');
   assert.equal(await page.locator('.slide:not([hidden]) .answer-help').getAttribute('open'),null);
   assert.equal(await page.locator('.slide:not([hidden]) .question-actions button').filter({hasText:'Show answer'}).isVisible(),false);
   assert.equal(await page.locator('.slide:not([hidden])').getByRole('button',{name:'Check answer',exact:true}).count(),0,'choices need no manual check button');
  }
  await page.evaluate(()=>localStorage.setItem('a2-day-completed','[]'));
  await page.goto(BASE+'html/index.html');
  const active=()=>page.locator('.slide:not([hidden])');
  await page.locator('#courseToggle').click();
  await page.locator('#done').check();
  assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('a2-day-completed'))),[1]);
  await page.keyboard.press('Escape');assert.equal(await page.locator('#courseMenu').getAttribute('open'),null);
  await active().locator('.word-mark').click();
  await page.reload();assert.equal(await active().locator('.word-mark').getAttribute('aria-pressed'),'true');
  await active().locator('.translation-toggle').click();
  assert.equal(await active().locator('.translation-disclosure .context-cn').isVisible(),true);
  await page.selectOption('#sectionPicker','vquiz');
  await active().locator('.choice-row').first().click();assert.match(await active().locator('.feedback').innerText(),/Correct/);
  await active().locator('.answer-help summary').click();
  await active().getByRole('button',{name:'Show answer',exact:true}).click();
  assert.equal(await active().locator('.answer').isVisible(),true);
  await active().getByRole('button',{name:'Why?',exact:true}).click();assert.equal(await active().locator('.explanation').isVisible(),true);
  await page.locator('#nextSlide').click();await page.locator('#prevSlide').click();
  assert.equal(await active().locator('.answer').isVisible(),false,'answer helper closes when moving on');
  assert.equal(await active().locator('input[type=radio]:checked').count(),1,'answer selection preserved');
  await page.selectOption('#sectionPicker','reading-part5');
  const expected=await page.evaluate(()=>D.answers.reading_part5[0]);await active().locator('input[type=text]').fill(expected);
  await active().getByRole('button',{name:'Check answer',exact:true}).click();assert.match(await active().locator('.feedback').innerText(),/Correct/);
  await page.selectOption('#sectionPicker','news-shadow');
  assert.equal(await active().locator('.source-details').getAttribute('open'),null);
  assert.equal(await active().locator('.source-details a').first().isVisible(),false);
  await active().locator('.source-details summary').click();assert.equal(await active().locator('.source-details a').first().isVisible(),true);
  await active().locator('.self-check input').check();
  await page.reload();await page.selectOption('#sectionPicker','news-shadow');assert.equal(await active().locator('.self-check input').isChecked(),true);
  for(const group of ['vocab','grammar-a','reading-part3','listening-part5','speaking','news-read']){
   await page.selectOption('#sectionPicker',group);
   await page.screenshot({path:path.join(OUT,`${group}.png`),fullPage:true});
  }
  for(const size of [{width:1440,height:900},{width:1024,height:768},{width:768,height:1024},{width:390,height:844},{width:320,height:700}]){
   await page.setViewportSize(size);
   for(const group of ['vocab','grammar-a','reading-part3','listening-part5','news-read']){
    await page.selectOption('#sectionPicker',group);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${group} fits ${size.width}`);
    const desktop=size.width>=1000;
    assert(await active().locator('.context-body').evaluate((e,desktop)=>getComputedStyle(e).overflowY===(desktop?'auto':'visible'),desktop),'desktop content regions and narrow page scrolling');
    if(desktop)assert(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1&&scrollY===0),'desktop viewport stays fixed');
    const card=await active().boundingBox(),nav=await page.locator('.turner').boundingBox();assert(nav.y>=card.y+card.height-1,'navigation does not obscure lesson content');
   }
   await page.selectOption('#sectionPicker','reading-part3');
   await page.screenshot({path:path.join(OUT,`reading-${size.width}.png`),fullPage:true});
   await page.locator('#courseToggle').click();
   const menu=await page.locator('.course-panel').boundingBox();assert(menu.x>=0&&menu.x+menu.width<=size.width,'tools fit viewport');
   await page.keyboard.press('Escape');
  }
  await page.evaluate(()=>localStorage.setItem('a2-day-completed',JSON.stringify(Array.from({length:30},(_,i)=>i+1))));
  await page.evaluate(async()=>{await navigator.serviceWorker.ready;});await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.goto(BASE+'html/day30.html');await page.waitForSelector('.slide:not([hidden])');
  await page.selectOption('#sectionPicker','reading-part3');assert.equal(await active().locator('.answer-help').count(),1);
  await page.goto(BASE+'html/index.html#word-CORE0031');await page.waitForSelector('.slide:not([hidden]) .word-mark');
  assert.equal(await active().locator('.word-mark').getAttribute('aria-pressed'),'true');
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({passed:true,lessons:30,quiet_tools:true,section_progress:true,hidden_helpers:true,answer_checking:true,word_marks:true,completion:true,news_sources_and_practice:true,responsive_widths:[1440,1024,768,390,320],desktop_anchored_viewport:true,narrow_natural_scrolling:true,unobscured_content:true,offline:true,screenshots:OUT},null,2));
  await context.close();
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
