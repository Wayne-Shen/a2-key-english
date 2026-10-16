const assert=require('node:assert/strict'),{chromium}=require('playwright');
const BASE=process.env.COURSE_TEST_URL||'http://127.0.0.1:8766/';
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.COURSE_BROWSER_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 try{
  const page=await browser.newPage({viewport:{width:1194,height:834}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(BASE+'html/index.html');
  await page.selectOption('#sectionPicker','reading-part3');
  await page.waitForFunction(()=>document.querySelector('.lesson-player audio')?.readyState>=1);
  await page.evaluate(()=>{
   window.testPlayer=document.querySelector('.lesson-player audio');
   window.playerEvents=[];
   testPlayer.addEventListener('emptied',()=>playerEvents.push('emptied'));
   window.playerMutations=[];
   window.playerMutationObserver=new MutationObserver(records=>playerMutations.push(...records.map(r=>r.type+':'+r.attributeName)));
   playerMutationObserver.observe(testPlayer.parentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','src']});
   return testPlayer.play();
  });
  await page.evaluate(()=>{testPlayer.currentTime=8;});
  await page.waitForFunction(()=>!testPlayer.seeking&&testPlayer.currentTime>=8);
  await page.locator('#nextSlide').focus();
  for(let step=0;step<8;step++){
   await page.keyboard.press(step<4?'ArrowRight':'ArrowLeft');
   const state=await page.evaluate(()=>({same:document.querySelector('.lesson-player audio')===testPlayer,paused:testPlayer.paused,time:testPlayer.currentTime,group:document.querySelector('.slide:not([hidden])').dataset.group,events:playerEvents}));
   assert(state.same&&!state.paused&&state.time>=8,`same recording continues through both arrow directions: ${JSON.stringify(state)}`);
  }
  assert.deepEqual(await page.evaluate(()=>playerEvents),[],'timeline is never reloaded for shared questions');
  assert.deepEqual(await page.evaluate(()=>playerMutations),[],'player stays mounted and visible while questions change');
  for(const size of [{width:1440,height:900},{width:1024,height:768},{width:1280,height:600},{width:768,height:1024},{width:390,height:844},{width:320,height:700}]){
   await page.setViewportSize(size);
   for(const group of ['reading-part1','reading-part3','listening-part5','news-read','news-shadow']){
    await page.selectOption('#sectionPicker',group);
    await page.waitForFunction(()=>{
     const slot=document.querySelector('.slide:not([hidden]) .lesson-audio').getBoundingClientRect(),host=document.querySelector('.lesson-player').getBoundingClientRect();
     return Math.abs(slot.x-host.x)<1&&Math.abs(slot.y-host.y)<1&&Math.abs(slot.width-host.width)<1;
    });
    assert.equal(await page.locator('.slide:not([hidden]) .audio-hint').count(),0,'no recording hint');
    assert.equal(await page.locator('.lesson-player:visible').count(),1);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'player fits responsive layout');
   }
  }
  await page.setViewportSize({width:1194,height:834});
  await page.selectOption('#sectionPicker','reading-part3');
  assert(await page.evaluate(()=>testPlayer.paused),'new recording does not autoplay');
  await page.selectOption('#sectionPicker','vocab');
  assert.equal(await page.locator('.lesson-player').isVisible(),false,'player hides on activities without audio');
  await page.selectOption('#sectionPicker','reading-part3');
  await page.screenshot({path:'/tmp/a2-player-desktop.png'});
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:'/tmp/a2-player-phone.png',fullPage:true});
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({passed:true,continuous_playback:true,no_control_remount_or_reload:true,no_hints:true,responsive_sizes:6,no_overflow:true}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
