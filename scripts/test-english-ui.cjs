const assert=require('node:assert/strict'),{chromium}=require('playwright');
const BASE=process.env.COURSE_TEST_URL||'http://127.0.0.1:8766/';
async function checkEnglish(page){
 const failures=await page.evaluate(()=>{
  const allowed='.slide[data-group="vocab"] .context-cn,.slide[data-group="review"] .context-cn,.news-glossary,.word-definition-translation,.translation p,.word-translation p';
  const bad=[],walk=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  for(let node=walk.nextNode();node;node=walk.nextNode()){
   if(!/[\u3400-\u9fff]/u.test(node.textContent))continue;
   const parent=node.parentElement;
   if(parent.closest('script,style')||parent.closest(allowed))continue;
   bad.push(node.textContent.slice(0,160));
  }
  for(const node of document.querySelectorAll('[aria-label],[placeholder],[title]'))for(const key of ['aria-label','placeholder','title'])if(/[\u3400-\u9fff]/u.test(node.getAttribute(key)||''))bad.push(`${key}: ${node.getAttribute(key)}`);
  return bad;
 });assert.deepEqual(failures,[],`Only vocabulary definitions may contain Chinese: ${page.url()}`);
}
(async()=>{
 const b=await chromium.launch({headless:true,executablePath:process.env.COURSE_BROWSER_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 try{
  const context=await b.newContext({viewport:{width:1194,height:834},reducedMotion:'reduce'}),p=await context.newPage(),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  await p.goto(BASE);
  await p.evaluate(()=>localStorage.setItem('a2-day-completed',JSON.stringify(Array.from({length:30},(_,i)=>i+1))));
  let choices=0,typed=0;
  for(let day=1;day<=30;day++){
   await p.goto(BASE+`html/${day===1?'index':`day${String(day).padStart(2,'0')}`}.html`);
   try{await p.waitForSelector('.slide:not([hidden]) .word-mark',{timeout:10000});}catch(error){throw new Error(`Day ${day}: ${p.url()} ${JSON.stringify(errors)} ${error.message}`);}
   await checkEnglish(p);
   const result=await p.evaluate(()=>{
    await p.goto(BASE);
  await p.evaluate(()=>localStorage.setItem('a2-day-completed',JSON.stringify(Array.from({length:30},(_,i)=>i+1))));
  let choices=0,typed=0;
    for(const card of document.querySelectorAll('.question-card')){
     const check=[...card.querySelectorAll('button')].find(b=>b.textContent==='Check answer');
     if(card.querySelector('input[type=radio]')){
      if(check&&!check.hidden)throw new Error('Choice question has a manual check button');
      const correct=card.querySelector('input[type=radio]');correct.checked=true;correct.dispatchEvent(new Event('change',{bubbles:true}));
      if(!card.querySelector('.feedback').textContent)throw new Error('Automatic feedback missing');choices++;
     }else{if(!check||check.hidden)throw new Error('Typed check button missing');typed++;}
    }return{choices,typed};
   });choices+=result.choices;typed+=result.typed;
   await p.selectOption('#sectionPicker','grammar-a');await p.locator('.slide:not([hidden]) .answer-help summary').click();await p.locator('.slide:not([hidden])').getByRole('button',{name:'Why?',exact:true}).click();await checkEnglish(p);
   await p.selectOption('#sectionPicker','news-read');await p.locator('.slide:not([hidden]) .source-details summary').click();await checkEnglish(p);
   await p.locator('#courseToggle').click();await p.locator('.extras summary').click();await checkEnglish(p);
  }
  await p.goto(BASE+'index.html');await checkEnglish(p);
  await p.locator('#focus-start').click();await p.locator('.translation summary').click();assert.equal(await p.locator('.translation p').innerText(),'年龄');await checkEnglish(p);
  await p.locator('[data-nav=downloads]').click();await p.waitForSelector('#download-grid .day-card');await checkEnglish(p);
  await p.evaluate(()=>localStorage.setItem('a2-unfamiliar-words-v1','{"CORE0031":42}'));
  await p.goto(BASE+'word-review.html');await p.waitForSelector('.review-word');await p.locator('.word-translation summary').click();assert.equal(await p.locator('.word-translation p').innerText(),'年龄');await checkEnglish(p);
  await p.locator('.word-learned').click();await checkEnglish(p);
  await p.goto(BASE+'changelog.html');await checkEnglish(p);
  await p.goto(BASE+'update.html');await checkEnglish(p);
  await p.goto(BASE+'html/index.html');await p.selectOption('#sectionPicker','reading-part3');await p.screenshot({path:'/tmp/a2-english-choice.png',fullPage:true});
  await p.selectOption('#sectionPicker','reading-part5');assert.equal(await p.locator('.slide:not([hidden])').getByRole('button',{name:'Check answer',exact:true}).isVisible(),true);
  await p.evaluate(async()=>{await navigator.serviceWorker.ready;});await p.waitForFunction(()=>!!navigator.serviceWorker.controller);
  await context.setOffline(true);await p.goto(BASE+'html/day30.html');await p.selectOption('#sectionPicker','vquiz');await checkEnglish(p);
  assert.equal(await p.locator('.slide:not([hidden])').getByRole('button',{name:'Check answer',exact:true}).count(),0);
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({passed:true,lessons:30,choice_questions:choices,typed_questions:typed,automatic_feedback:true,choice_check_button_removed:true,typed_check_button_kept:true,english_interface:true,chinese_definitions_preserved:true,grammar_and_guidance_translated:true,offline:true},null,2));
  await context.close();
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
