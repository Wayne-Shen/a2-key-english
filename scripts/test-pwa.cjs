const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'../dist');
const assets=JSON.parse(fs.readFileSync(path.join(ROOT,'assets.json')));
const manifest=JSON.parse(fs.readFileSync(path.join(ROOT,'manifest.webmanifest')));
const BASE='https://example.test/course/';
assert.equal(manifest.display,'standalone');assert.equal(manifest.scope,'./');assert.equal(manifest.start_url,'./index.html');
assert.equal(assets.days.length,30);
let audio=0;
for(const item of [...assets.shell,...assets.days.flatMap(d=>d.assets)]){
 const file=path.join(ROOT,item.url.split('?')[0]);assert(fs.existsSync(file),item.url);
 const bytes=fs.readFileSync(file);assert.equal(bytes.length,item.bytes);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),item.sha256);
 if(item.kind==='audio')audio++;
}
assert.equal(audio,330);
for(const d of assets.days){
 const page=fs.readFileSync(path.join(ROOT,d.page),'utf8');assert(page.includes('../manifest.webmanifest'));assert(page.includes('../register.js'));
 const app=d.day===1?'html/app.js':`html/app_day${String(d.day).padStart(2,'0')}.js`;
 const js=fs.readFileSync(path.join(ROOT,app),'utf8');assert(js.includes('translation.hidden=true'));assert(js.includes("{type:'translation',text:w.chinese_meaning}"));
}
class MemoryCache{
 constructor(){this.entries=new Map();}
 key(request){return typeof request==='string'?request:request.url;}
 async put(request,response){assert.equal(response.status,200,'partial/error responses never enter cache');this.entries.set(this.key(request),response.clone());}
 async match(request){return this.entries.get(this.key(request))?.clone();}
}
const stores=new Map(),caches={async open(name){if(!stores.has(name))stores.set(name,new MemoryCache());return stores.get(name);},async keys(){return [...stores.keys()];},async delete(name){return stores.delete(name);}};
const listeners={},fetched=[];let offline=false,failurePath=null,brokenManifest=false;
const self={registration:{scope:BASE},addEventListener:(name,fn)=>listeners[name]=fn,async skipWaiting(){},clients:{async claim(){}}};
async function fetchMock(request){
 const href=typeof request==='string'?request:request.url;fetched.push(href);
 if(offline)throw new Error('offline');
 const relative=new URL(href).pathname.slice(new URL(BASE).pathname.length);
 if(relative===failurePath)return new Response('<html>Sign in</html>',{status:200,headers:{'Content-Type':'text/html'}});
 let body=fs.readFileSync(path.join(ROOT,relative));
 if(relative==='assets.json'&&brokenManifest)body=Buffer.from(JSON.stringify({...assets,version:'failed-install'}));
 const type=relative.endsWith('.html')?'text/html':relative.endsWith('.json')?'application/json':relative.endsWith('.mp3')?'audio/mpeg':'application/octet-stream';
 const response=new Response(body,{status:200,headers:{'Content-Type':type}});
 if(relative.endsWith('.html')){
  Object.defineProperty(response,'redirected',{value:true});
  Object.defineProperty(response,'url',{value:new URL(href).href.replace(/\/index\.html$/,'/').replace(/\.html$/,'')});
 }
 return response;
}
const sandbox={self,caches,fetch:fetchMock,URL,Response,Request,Headers,console};vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT,'sw.js'),'utf8'),sandbox);
async function lifetime(name){let pending;listeners[name]({waitUntil(promise){pending=promise;}});await pending;}
async function request(file,headers={}){
 let result;listeners.fetch({request:new Request(new URL(file,BASE),{headers}),respondWith(promise){result=promise;}});return result?await result:null;
}
(async()=>{
 await lifetime('install');await lifetime('activate');
 const meta=await caches.open('a2-ipad-metadata-v1');assert.equal((await (await meta.match(new URL('assets.json',BASE).href)).json()).version,assets.version);
 offline=true;
 for(const d of assets.days){const r=await request(d.page);assert.equal(r.status,200);assert((await r.text()).includes('id="deck"'));}
 assert.equal((await request('html/')).status,200,'clean lesson index works offline');
 assert.equal((await request('html/day30')).status,200,'clean lesson URLs work offline');
 assert.equal((await request('')).status,200,'scope root opens dashboard offline');
 assert.equal((await request('index.html?source=homescreen')).status,200,'home query does not break cache lookup');
 for(const file of ['word-review.html','word-review.js','word-review.css','word-catalog.js','changelog.html','update.html'])assert.equal((await request(file)).status,200,`${file} is available offline`);
 const a=assets.days[0].assets.find(a=>a.kind==='audio');
 assert.equal((await request(a.url)).status,503,'unsaved audio fails honestly offline');
 offline=false;const full=await fetchMock(new URL(a.url,BASE).href);await (await caches.open('a2-ipad-media-v1')).put(new URL(a.url,BASE).href,full);offline=true;
 const original=fs.readFileSync(path.join(ROOT,a.url.split('?')[0]));
 const all=await request(a.url);assert.equal(all.status,200);assert.deepEqual(Buffer.from(await all.arrayBuffer()),original);
 for(const [range,first,last] of [['bytes=0-99',0,99],['bytes=100-',100,original.length-1],['bytes=-50',original.length-50,original.length-1],['bytes=0-999999999',0,original.length-1]]){
  const r=await request(a.url,{Range:range});assert.equal(r.status,206);assert.equal(r.headers.get('Content-Range'),`bytes ${first}-${last}/${original.length}`);assert.deepEqual(Buffer.from(await r.arrayBuffer()),original.subarray(first,last+1));
 }
 for(const range of ['bytes=999999999-','bytes=100-2','bytes=-0','bytes=0-1,3-4','garbage'])assert.equal((await request(a.url,{Range:range})).status,416);
 // Authentication pages cannot be cached as JavaScript, JSON, audio or transcripts.
 offline=false;brokenManifest=true;
 await assert.rejects(lifetime('install'),/still publishing/,'a mismatched release must not replace the current cache');
 brokenManifest=false;failurePath='html/app.js';
 await assert.rejects(lifetime('install'),/Sign-in page/);
 assert.equal((await (await meta.match(new URL('assets.json',BASE).href)).json()).version,assets.version,'failed setup leaves the last complete manifest intact');
 const before=fetched.length;
 assert.equal(await request('https://external.test/private'),null);assert.equal(fetched.length,before,'external requests are not intercepted');
 console.log(JSON.stringify({passed:true,lessons:30,audio_files:330,hashes_verified:true,offline_navigation:true,offline_audio_seek:true,incomplete_install_rejected:true,auth_html_rejected:true,nested_scope:true}));
})().catch(error=>{console.error(error);process.exitCode=1;});
