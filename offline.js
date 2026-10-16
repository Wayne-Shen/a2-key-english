/* Foreground downloads survive pauses and verify completeness against CacheStorage. */
(() => {
  'use strict';
  const MEDIA='a2-ipad-media-v1',META='a2-ipad-metadata-v1',ROOT=new URL('./',location.href);
  const $=id=>document.getElementById(id);
  let data,cache,downloading=false,cancelled=false,aborter,deferredInstall;
  const cards=new Map();
  function url(path){return new URL(path,ROOT).href;}
  function connection(){$('connection').textContent=navigator.onLine?'Online':'Offline';}
  async function verify(response,asset){
    const expected=new URL(url(asset.url)),final=response.url?new URL(response.url):expected;
    const cleanHTML=asset.kind==='shell'&&expected.pathname.endsWith('.html')&&final.pathname===expected.pathname.replace(/\/index\.html$/,'/').replace(/\.html$/,'');
    if(!response.ok||(response.redirected&&!cleanHTML)||final.origin!==ROOT.origin)throw new Error('Download unavailable. Reconnect and sign in, then retry.');
    const type=response.headers.get('Content-Type')||'';
    if(type.includes('text/html')&&!(asset.kind==='shell'&&asset.url.endsWith('.html')))throw new Error('Sign in online, then resume the download.');
    const body=await response.clone().arrayBuffer();
    if(body.byteLength!==asset.bytes)throw new Error('Incomplete download. Please retry.');
    const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',body))).map(n=>n.toString(16).padStart(2,'0')).join('');
    if(hash!==asset.sha256)throw new Error('Download could not be verified. Please retry.');
  }
  async function status(day){
    let count=0;
    for(const asset of day.assets)if(await cache.match(url(asset.url)))count++;
    return {count,ready:count===day.assets.length};
  }
  async function refresh(){
    let complete=0;
    for(const day of data.days){
      const saved=await status(day),card=cards.get(day.day);if(saved.ready)complete++;
      card.root.classList.toggle('ready',saved.ready);
      card.status.textContent=saved.ready?'Audio ready offline':saved.count?`Partly saved · ${saved.count} / ${day.assets.length} files`:`Audio: ${(day.bytes/1000000).toFixed(1)} MB · Not downloaded`;
      card.button.disabled=downloading||saved.ready;
      card.button.textContent=saved.ready?'Saved ✓':'Download audio';
    }
    $('download-all').disabled=downloading||complete===30;
    if(!downloading)$('download-status').textContent=`${complete} / 30 days ready offline${complete===30?' · All lessons and audio saved':''}`;
    $('download-progress').max=30;$('download-progress').value=complete;
    return complete;
  }
  function render(){
    let completed=[];try{const saved=JSON.parse(localStorage.getItem('a2-day-completed')||'[]');if(Array.isArray(saved))completed=saved;}catch{/* Course content stays available if progress storage is unavailable. */}
    for(const day of data.days){
      const card=document.createElement('article');card.className='day-card';
      const number=document.createElement('div');number.className='day-number';number.textContent=`DAY ${String(day.day).padStart(2,'0')}${completed.includes(day.day)?' · ✓ COMPLETED':''}`;
      const title=document.createElement('h3');title.textContent=day.title;
      const state=document.createElement('p');state.textContent='Checking saved files…';
      const actions=document.createElement('div');actions.className='actions';
      const link=document.createElement('a');link.className='lesson-link';link.href=day.page;link.textContent='Open lesson →';
      const button=document.createElement('button');button.type='button';button.disabled=true;button.textContent='Download audio';button.addEventListener('click',()=>download([day]));
      actions.append(link,button);card.append(number,title,state,actions);$('download-grid').append(card);cards.set(day.day,{root:card,status:state,button});
    }
  }
  async function download(days){
    if(downloading)return;
    downloading=true;cancelled=false;aborter=new AbortController();
    $('cancel').hidden=false;await refresh();
    try{
      if(navigator.storage?.persist)await navigator.storage.persist().catch(()=>false);
      const assets=days.flatMap(d=>d.assets);let finished=0;
      for(const asset of assets){
        if(cancelled)break;
        if(!await cache.match(url(asset.url))){
          const response=await fetch(url(asset.url),{credentials:'same-origin',signal:aborter.signal});
          await verify(response,asset);await cache.put(url(asset.url),response);
        }
        finished++;
        $('download-status').textContent=`Saving audio & transcripts · ${finished} / ${assets.length} files`;
        $('download-progress').max=assets.length;$('download-progress').value=finished;
      }
    }catch(error){
      if(error.name!=='AbortError')$('download-status').textContent=error.name==='QuotaExceededError'?'Not enough device storage. Free some space, then resume.':`${error.message} Saved files are kept; tap Download to resume.`;
      else cancelled=true;
      const message=$('download-status').textContent;
      downloading=false;$('cancel').hidden=true;await refresh();
      if(!cancelled)$('download-status').textContent=message;
      else $('download-status').textContent+=' · Download paused; saved files are kept.';
      return;
    }
    downloading=false;$('cancel').hidden=true;await refresh();
    if(cancelled)$('download-status').textContent+=' · Download paused; saved files are kept.';
  }
  async function initialize(){
    connection();
    if(!('serviceWorker' in navigator)||!window.isSecureContext){$('setup-status').textContent='Offline setup needs a supported browser and the course’s HTTPS address.';return;}
    try{
      await navigator.serviceWorker.register(url('sw.js'),{scope:ROOT.pathname,updateViaCache:'none'});
      // Ready resolves only when all lesson text files have been saved successfully.
      let timer;
      try{await Promise.race([navigator.serviceWorker.ready,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Offline setup is taking longer than expected. Reconnect, sign in if needed, and reload.')),60000);})]);}finally{clearTimeout(timer);}
      const metadata=await caches.open(META),response=await metadata.match(url('assets.json'));
      if(!response)throw new Error('Reconnect and reload to finish offline setup.');
      data=await response.json();cache=await caches.open(MEDIA);
      const shell=await caches.open('a2-ipad-shell-'+data.version);
      for(const asset of data.shell){
        if(!await shell.match(url(asset.url))){
          const restored=await fetch(url(asset.url),{credentials:'same-origin'});
          await verify(restored,asset);await shell.put(url(asset.url),restored);
        }
      }
      $('setup-status').textContent='All 30 lesson texts are ready offline';
      $('download-size').textContent=Math.ceil(data.total_audio_bytes/1000000);
      render();await refresh();
      $('download-all').addEventListener('click',()=>download(data.days));
      $('cancel').addEventListener('click',()=>{cancelled=true;aborter?.abort();});
      window.addEventListener('pageshow',()=>{if(!downloading)refresh().catch(()=>{});});
    }catch(error){$('setup-status').textContent=error.message;$('download-status').textContent='Reload this screen online to retry setup.';}
  }
  window.addEventListener('online',connection);window.addEventListener('offline',connection);
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredInstall=event;$('install-button').hidden=false;});
  $('install-button').addEventListener('click',async()=>{if(!deferredInstall)return;await deferredInstall.prompt();await deferredInstall.userChoice;deferredInstall=null;$('install-button').hidden=true;});
  initialize();
})();
