// Install the previous public release, then upgrade that same origin to this checkout.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {execFileSync}=require('node:child_process');
const {chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..'),DIST=path.join(ROOT,'dist');
const current=JSON.parse(fs.readFileSync(path.join(DIST,'assets.json')));
const previousRef=process.env.COURSE_PREVIOUS_REF||'14686e1';
const oldFile=name=>execFileSync('git',['show',`${previousRef}:dist/${name}`],{cwd:ROOT,maxBuffer:10*1024*1024,stdio:['ignore','pipe','ignore']});
const previous=JSON.parse(oldFile('assets.json'));
const oldFiles=new Map(['assets.json','sw.js',...previous.shell.map(a=>a.url)].map(name=>[name,oldFile(name)]));
let legacy=true,audioRequests=0;
const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost'),name=decodeURIComponent(url.pathname.slice(1))||'index.html';
  if(name.split('/').includes('..')){res.writeHead(400).end();return;}
  try{
    const file=legacy&&oldFiles.has(name)?oldFiles.get(name):fs.readFileSync(path.join(DIST,name));
    if(name.endsWith('.mp3'))audioRequests++;
    const type=name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':name.endsWith('.html')?'text/html':name.endsWith('.json')?'application/json':name.endsWith('.mp3')?'audio/mpeg':name.endsWith('.png')?'image/png':'text/plain';
    res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-cache'});res.end(file);
  }catch{res.writeHead(404).end();}
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}/`;
  const browser=await chromium.launch({headless:true,executablePath:process.env.COURSE_BROWSER_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
  try{
    const context=await browser.newContext({viewport:{width:1024,height:768}}),page=await context.newPage();
    await page.goto(base);
    await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
    const first=previous.days[0];
    await page.evaluate(async day=>{
      localStorage.setItem('a2-day-completed','[3,7]');
      localStorage.setItem('a2-unfamiliar-words-v1','{"CORE0031":42}');
      localStorage.setItem('a2-day1-word-CORE0031','true');
      const media=await caches.open('a2-ipad-media-v1');
      for(const asset of day.assets)await media.put(new URL(asset.url,location.href).href,await fetch(asset.url));
    },first);
    legacy=false;const before=audioRequests;
    await page.evaluate(async version=>{
      const registration=await navigator.serviceWorker.getRegistration();await registration.update();
      const worker=registration.installing||registration.waiting||registration.active;
      if(worker.state!=='activated')await new Promise((resolve,reject)=>{
        worker.addEventListener('statechange',()=>{if(worker.state==='activated')resolve();if(worker.state==='redundant')reject(new Error('Upgrade failed'));});
      });
      const names=await caches.keys();if(!names.includes('a2-ipad-shell-'+version))throw new Error('New shell missing');
    },current.version);
    await page.reload();await page.waitForSelector('#dashboard-title');
    assert.equal(await page.locator('#days-complete').innerText(),'2');
    assert.equal(await page.evaluate(()=>localStorage.getItem('a2-day-completed')),'[3,7]');
    assert.equal(await page.evaluate(()=>localStorage.getItem('a2-unfamiliar-words-v1')),'{"CORE0031":42}');
    assert.equal(await page.evaluate(()=>localStorage.getItem('a2-day1-word-CORE0031')),'true');
    await page.locator('[data-nav=downloads]').click();
    await page.waitForFunction(()=>document.querySelector('#download-status').textContent.startsWith('1 / 30'));
    assert.equal(await page.locator('#download-grid .day-card').count(),30);
    assert.equal(await page.locator('#download-grid .day-card').first().locator('button').innerText(),'Saved ✓');
    assert.equal(audioRequests,before,'the upgrade does not download audio again');
    const mediaAsset=first.assets.find(a=>a.kind==='audio');
    await context.setOffline(true);
    const saved=await page.evaluate(async asset=>{
      const response=await fetch(asset.url,{headers:{Range:'bytes=0-99'}});
      return {status:response.status,bytes:(await response.arrayBuffer()).byteLength};
    },mediaAsset);
    assert.deepEqual(saved,{status:206,bytes:100});
    await page.goto(base+'index.html#vocabulary');await page.waitForSelector('#word-title');
    await page.getByRole('button',{name:'Try a quick check'}).click();assert.equal(await page.locator('.choice').count(),3);
    await page.goto(base+'html/day07.html');await page.waitForSelector('#deck');
    assert.equal(await page.locator('#done').isChecked(),true);
    await context.close();
    console.log(JSON.stringify({passed:true,from_version:previous.version,to_version:current.version,completion_preserved:true,word_marks_preserved:true,per_word_practice_preserved:true,downloaded_day_retained:true,no_audio_redownload:true,offline_audio_range:true,offline_studio:true,offline_existing_lesson:true}));
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{server.close();console.error(error);process.exitCode=1;});
