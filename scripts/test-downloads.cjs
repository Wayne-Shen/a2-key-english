const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),{webcrypto}=require('node:crypto');
const ROOT=path.resolve(__dirname,'../dist'),data=JSON.parse(fs.readFileSync(path.join(ROOT,'assets.json'))),BASE='https://example.test/course/';
class El{constructor(){this.children=[];this.listeners={};this.textContent='';this.disabled=false;this.hidden=false;this.classList={toggle(){}};}append(...items){this.children.push(...items);}addEventListener(name,fn){this.listeners[name]=fn;}}
const ids=new Map();for(const key of ['connection','completed','continue','day-grid','download-all','download-status','download-progress','download-size','cancel','setup-status','install-button'])ids.set(key,new El());
class Cache{constructor(){this.items=new Map();}async match(key){return this.items.get(key)?.clone();}async put(key,value){this.items.set(key,value.clone());}}
const media=new Cache(),meta=new Cache(),shell=new Cache();
for(const a of data.shell)shell.items.set(new URL(a.url,BASE).href,new Response(fs.readFileSync(path.join(ROOT,a.url))));meta.items.set(new URL('assets.json',BASE).href,new Response(JSON.stringify(data)));
const caches={async open(name){return name.includes('metadata')?meta:name.includes('shell')?shell:media;}};
let corrupt=false,networkCalls=0;
async function fetchFile(url){networkCalls++;let body=fs.readFileSync(path.join(ROOT,new URL(url).pathname.slice('/course/'.length)));if(corrupt){body=Buffer.from(body);body[0]^=255;}return new Response(body,{headers:{'Content-Type':url.includes('.mp3')?'audio/mpeg':'text/plain'}});}
const document={getElementById:id=>ids.get(id),createElement:()=>new El()};
const sandbox={document,location:{href:BASE+'index.html'},window:{isSecureContext:true,addEventListener(){}},navigator:{onLine:true,serviceWorker:{async register(){},ready:Promise.resolve({})},storage:{async persist(){return true;}}},caches,fetch:fetchFile,crypto:webcrypto,URL,AbortController,Uint8Array,setTimeout,clearTimeout,localStorage:{getItem(){return null;}}};
vm.createContext(sandbox);vm.runInContext(fs.readFileSync(path.join(ROOT,'offline.js'),'utf8'),sandbox);
async function until(fn){for(let i=0;i<2000;i++){if(fn())return;await new Promise(r=>setTimeout(r,5));}throw new Error('UI did not settle');}
(async()=>{
 await until(()=>ids.get('day-grid').children.length===30&&!ids.get('download-all').disabled);
 assert(ids.get('setup-status').textContent.includes('30 lesson texts'));
 const first=ids.get('day-grid').children[0],button=first.children[3].children[1];
 corrupt=true;await button.listeners.click();
 assert.equal(media.items.size,0,'corrupt file is never saved');assert(ids.get('download-status').textContent.includes('verified'));
 corrupt=false;await button.listeners.click();
 assert.equal(media.items.size,data.days[0].assets.length);assert(ids.get('download-status').textContent.startsWith('1 / 30'));assert(button.disabled);
 // A partial saved day resumes without fetching already verified files.
 const second=ids.get('day-grid').children[1],day=data.days[1],cached=day.assets[0];
 await media.put(new URL(cached.url,BASE).href,await fetchFile(new URL(cached.url,BASE).href));
 const calls=networkCalls;await second.children[3].children[1].listeners.click();
 assert.equal(networkCalls-calls,day.assets.length-1,'resume skips the saved file');
 assert(ids.get('download-status').textContent.startsWith('2 / 30'));
 assert.equal(ids.get('download-all').disabled,false,'two days never count as all 30 ready');
 console.log(JSON.stringify({passed:true,download_verification:true,corrupt_file_rejected:true,resume_skips_saved_files:true,readiness_counts:true}));
})().catch(error=>{console.error(error);process.exitCode=1;});
