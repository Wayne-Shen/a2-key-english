const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const ROOT=path.resolve(__dirname,'../dist');
const manifest=JSON.parse(fs.readFileSync(path.join(ROOT,'assets.json'),'utf8'));
assert(fs.readFileSync(path.join(ROOT,'sw.js'),'utf8').includes(`const BUILD_VERSION='${manifest.version}';`),'the worker must change with every shell version');
async function scenario(controlled){
 const ids=new Map(),events={},workerEvents={};let reloads=0,checks=0,now=100000;
 const document={hidden:false,currentScript:{src:'https://example.test/course/register.js'},body:{append(node){ids.set(node.id,node);}},getElementById:id=>ids.get(id),addEventListener:(event,fn)=>events[event]=fn,createElement:tag=>({tagName:tag,style:{},children:[],setAttribute(){},append(...nodes){this.children.push(...nodes);}})};
 const registration={update:async()=>{checks++;}};
 const navigator={onLine:true,serviceWorker:{controller:controlled?{}:null,addEventListener:(event,fn)=>workerEvents[event]=fn,register:async(url,options)=>{assert.equal(url.href,'https://example.test/course/sw.js');assert.equal(options.updateViaCache,'none');return registration;}}};
 const context={document,navigator,URL,Date:{now:()=>now},location:{reload:()=>reloads++},window:{isSecureContext:true,addEventListener:(event,fn)=>events[event]=fn}};
 vm.runInNewContext(fs.readFileSync(path.join(ROOT,'register.js'),'utf8'),context);
 await Promise.resolve();
 workerEvents.controllerchange();workerEvents.controllerchange();
 assert.equal(reloads,0,'an update must not automatically interrupt an exercise');
 if(controlled){
  const notice=ids.get('course-update-notice');assert(notice,'existing offline users receive an update notice');
  assert.equal(ids.size,1,'duplicate events must not add duplicate notices');
  notice.children.find(node=>node.tagName==='button').onclick();assert.equal(reloads,1);
 }else assert.equal(ids.size,0,'the initial install does not ask a new visitor to reload');
 now+=61000;events.visibilitychange();await Promise.resolve();assert.equal(checks,1);
 events.visibilitychange();assert.equal(checks,1,'visibility changes do not repeatedly check');
 navigator.onLine=false;now+=61000;events.visibilitychange();assert.equal(checks,1);
 navigator.onLine=true;events.online();assert.equal(checks,2,'reconnecting checks for updates');
}
(async()=>{await scenario(true);await scenario(false);console.log(JSON.stringify({passed:true,build_stamp:true,update_notice:true,no_forced_reload:true,online_recheck:true}));})().catch(error=>{console.error(error);process.exitCode=1;});
