const assert=require('node:assert/strict'),{chromium}=require('playwright');
const BASE=process.env.COURSE_TEST_URL||'http://127.0.0.1:8766/';
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.COURSE_BROWSER_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 try{
  const context=await browser.newContext({viewport:{width:1194,height:834},reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.goto(BASE+'html/index.html');
  const active=()=>page.locator('.slide:not([hidden])');
  async function fixed(){assert(await page.evaluate(()=>scrollY===0&&document.documentElement.scrollHeight<=innerHeight+1&&document.documentElement.scrollWidth<=innerWidth),'no page scrolling or drift');}
  for(const size of [{width:1440,height:900},{width:1194,height:834},{width:1024,height:768},{width:1280,height:600}]){
   await page.setViewportSize(size);let baseline;
   for(const group of ['vocab','grammar-a','reading-part3','listening-part5','speaking','news-read']){
    await page.selectOption('#sectionPicker',group);await fixed();
    const nav=await page.locator('.turner').boundingBox(),card=await active().boundingBox();
    if(!baseline)baseline={nav,card};
    assert(Math.abs(nav.y-baseline.nav.y)<1,'navigation stays at the same height');
    assert(Math.abs(card.y-baseline.card.y)<1&&Math.abs(card.height-baseline.card.height)<1,'practice sheet stays anchored');
    assert.equal(await active().locator('.context-body').evaluate(e=>getComputedStyle(e).scrollbarWidth),'none');
    if(group==='reading-part3'){
     await active().locator('.context-body').evaluate(e=>e.scrollTop=e.scrollHeight);
     const before=await active().locator('.context-body').evaluate(e=>e.scrollTop);
     await active().locator('.choice-row').first().click();
     await active().locator('input[type=radio]:checked').press('ArrowRight');
     assert.equal(await active().locator('.context-body').evaluate(e=>e.scrollTop),before,'shared passage retains its reading position');
     await fixed();await page.keyboard.press('ArrowLeft');await fixed();
     assert.equal(await active().locator('input[type=radio]:checked').count(),1,'selected answer is preserved');
    }
    if(group==='vocab'){
     await active().locator('.translation-toggle').click();
     assert.equal(await active().locator('.context-cn').evaluate(e=>getComputedStyle(e).fontSize),'22px');
    }
   }
  }
  await page.setViewportSize({width:1194,height:834});
  await page.evaluate(()=>localStorage.setItem('a2-day-completed',JSON.stringify(Array.from({length:30},(_,i)=>i+1))));
  for(let day=1;day<=30;day++){
   await page.goto(BASE+`html/${day===1?'index':`day${String(day).padStart(2,'0')}`}.html`);
   await page.selectOption('#sectionPicker','news-read');await fixed();
   const body=active().locator('.context-body');
   await body.evaluate(e=>e.scrollTop=e.scrollHeight);
   assert(await body.evaluate(e=>Math.abs(e.scrollHeight-e.clientHeight-e.scrollTop)<=1),'all long material remains reachable');
   await page.selectOption('#sectionPicker','reading-part3');
   await page.locator('#nextSlide').click();await fixed();
  }
  await page.goto(BASE+'html/index.html');await page.selectOption('#sectionPicker','news-read');
  await active().locator('.context-body').hover();await page.mouse.wheel(0,800);await fixed();
  await page.selectOption('#sectionPicker','grammar-a');
  await active().locator('.answer-help summary').click();await active().getByRole('button',{name:'Why?',exact:true}).click();await fixed();
  await active().locator('.task-content').evaluate(e=>e.scrollTop=e.scrollHeight);await fixed();
  await page.selectOption('#sectionPicker','reading-part3');await page.screenshot({path:'/tmp/a2-fixed-desktop.png'});
  await page.setViewportSize({width:390,height:844});
  assert.equal(await active().locator('.context-body').evaluate(e=>getComputedStyle(e).overflowY),'visible');
  assert(await page.evaluate(()=>document.documentElement.scrollHeight>innerHeight),'phone keeps natural page scrolling');
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({passed:true,lessons:30,desktop_sizes:['1440x900','1194x834','1024x768','1280x600'],no_page_overflow:true,no_visible_content_scrollbars:true,stable_arrow_navigation:true,shared_reading_position:true,all_content_reachable:true,answer_selection_preserved:true,large_chinese_meanings:true,mobile_natural_scroll:true},null,2));
  await context.close();
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
