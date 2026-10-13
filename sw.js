/* Cache only this course's known assets; audio downloads are user initiated. */
const SHELL_PREFIX='a2-ipad-shell-';
const META='a2-ipad-metadata-v1';
const MEDIA='a2-ipad-media-v1';
const ROOT=new URL('./',self.registration.scope);
const MANIFEST_URL=new URL('assets.json',ROOT).href;
let manifestPromise;
function localURL(path){return new URL(path,ROOT).href;}
async function verifiedFetch(url){
  const response=await fetch(url,{credentials:'same-origin',cache:'no-cache'});
  if(!response.ok||response.redirected||(response.url&&new URL(response.url).origin!==ROOT.origin))throw new Error('Course file unavailable. Reconnect and sign in, then try again.');
  const pathname=new URL(url).pathname,type=response.headers.get('Content-Type')||'';
  if(!pathname.endsWith('.html')&&type.includes('text/html'))throw new Error('Sign-in page returned instead of a course file.');
  return response;
}
async function manifest(){
  if(!manifestPromise)manifestPromise=(async()=>{
    const meta=await caches.open(META),saved=await meta.match(MANIFEST_URL);
    if(!saved)throw new Error('Offline setup is incomplete.');
    return saved.json();
  })().catch(error=>{manifestPromise=null;throw error;});
  return manifestPromise;
}
self.addEventListener('install',event=>event.waitUntil((async()=>{
  const response=await verifiedFetch(MANIFEST_URL),data=await response.clone().json();
  if(!data.version||data.days?.length!==30||!Array.isArray(data.shell))throw new Error('Invalid course manifest.');
  const shell=await caches.open(SHELL_PREFIX+data.version);
  // A failed or interrupted install never promotes an incomplete lesson cache.
  for(const asset of data.shell)await shell.put(localURL(asset.url),await verifiedFetch(localURL(asset.url)));
  await shell.put(MANIFEST_URL,response.clone());
  const meta=await caches.open(META);await meta.put(MANIFEST_URL,response);
  manifestPromise=Promise.resolve(data);
  await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  const data=await manifest();
  for(const name of await caches.keys())if(name.startsWith(SHELL_PREFIX)&&name!==SHELL_PREFIX+data.version)await caches.delete(name);
  await self.clients.claim();
})()));
function offlineResponse(message){return new Response(message,{status:503,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});}
async function rangeResponse(response,range){
  const buffer=await response.arrayBuffer(),length=buffer.byteLength;
  const match=/^bytes=(\d*)-(\d*)$/.exec(range);
  let start,end;
  if(!match||(!match[1]&&!match[2]))return new Response(null,{status:416,headers:{'Content-Range':`bytes */${length}`}});
  if(!match[1]){const tail=Number(match[2]);start=Math.max(0,length-tail);end=length-1;if(tail===0)start=length;}
  else{start=Number(match[1]);end=match[2]?Math.min(Number(match[2]),length-1):length-1;}
  if(start>=length||start>end||!Number.isSafeInteger(start)||!Number.isSafeInteger(end))return new Response(null,{status:416,headers:{'Content-Range':`bytes */${length}`}});
  const headers=new Headers(response.headers);headers.delete('Content-Encoding');headers.set('Content-Range',`bytes ${start}-${end}/${length}`);headers.set('Content-Length',String(end-start+1));headers.set('Accept-Ranges','bytes');
  return new Response(buffer.slice(start,end+1),{status:206,headers});
}
async function handleRequest(request){
  const url=new URL(request.url);
  if(url.pathname===ROOT.pathname)url.pathname+='index.html';
  const data=await manifest();
  const shellAsset=data.shell.find(a=>new URL(a.url,ROOT).pathname===url.pathname);
  if(shellAsset||url.pathname===new URL(MANIFEST_URL).pathname){
    const shell=await caches.open(SHELL_PREFIX+data.version),key=shellAsset?localURL(shellAsset.url):MANIFEST_URL;
    const saved=await shell.match(key);
    if(saved)return saved;
    try{return await verifiedFetch(key);}catch{return offlineResponse('Reconnect once to finish downloading the course lessons.');}
  }
  const asset=data.days.flatMap(d=>d.assets).find(a=>new URL(a.url,ROOT).pathname===url.pathname);
  if(!asset)return fetch(request);
  const media=await caches.open(MEDIA),saved=await media.match(localURL(asset.url));
  if(saved){const range=request.headers.get('Range');return range&&asset.kind==='audio'?rangeResponse(saved,range):saved;}
  // Do not cache partial network responses. Only full downloads enter MEDIA.
  try{return await fetch(request);}catch{return offlineResponse('This recording is not saved. Download this day while online before using it offline.');}
}
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==ROOT.origin||!url.pathname.startsWith(ROOT.pathname)||url.pathname===new URL('sw.js',ROOT).pathname)return;
  event.respondWith(handleRequest(event.request).catch(()=>offlineResponse('Reconnect to prepare this course for offline use.')));
});
