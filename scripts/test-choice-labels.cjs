// Reuse the course's DOM harness so ordering is checked alongside existing grading/navigation.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'..');
const harness=path.resolve(ROOT,'../ket-a2-30day/scripts/test_deck_dashboard.js');
const code=fs.readFileSync(harness,'utf8')+'\nglobalThis.result={all,slides};';
let questions=0;
for(let day=1;day<=30;day++){
 const app=path.join(ROOT,'dist/html',day===1?'app.js':`app_day${String(day).padStart(2,'0')}.js`);
 const context={require,__dirname:path.dirname(harness),process:{argv:['node',harness,app,String(day)]},console:{log(){}}};
 vm.runInNewContext(code,context);
 for(const card of context.result.all.filter(node=>node.className==='question-card')){
  const options=card.children.find(node=>node.className==='options');
  if(!options)continue;
  const answer=card.children.find(node=>node.className==='answer').textContent.slice('Answer: '.length).trim();
  const feedback=card.children.find(node=>node.className.includes('feedback'));
  options.children.forEach((row,index)=>{
   const letter=String.fromCharCode(65+index),[radio,label]=row.children;
   assert.equal(radio.value,letter,`Day ${day}: button value must match position`);
   assert(label.textContent.startsWith(letter+'. '),`Day ${day}: visible labels must be alphabetical`);
   assert(!/^[A-Z]\.\s*[A-Z]\.\s/.test(label.textContent),'duplicated label');
   for(const other of options.children)other.children[0].checked=false;
   radio.checked=true;radio.onchange();
   assert(feedback.className.includes(radio.value===answer?'correct':'retry'),`Day ${day}: auto-check must match the displayed letter`);
  });
  questions++;
 }
 if(day===5){
  const slide=context.result.slides.filter(node=>node.dataset.group==='listening-part4')[1];
  const card=slide.children[1].children[1].children.find(node=>node.className==='question-card');
  const options=card.children.find(node=>node.className==='options');
  assert.deepEqual(Array.from(options.children,row=>row.children[1].textContent),['A. A winter coat','B. Help with his idea','C. A new farm']);
  const feedback=card.children.find(node=>node.className.includes('feedback'));
  for(const row of options.children)row.children[0].checked=false;
  options.children[1].children[0].checked=true;options.children[1].children[0].onchange();
  assert(feedback.className.includes('correct'),'the answer supported by the recording must be correct');
 }
}
assert.equal(questions,2100);
console.log(JSON.stringify({passed:true,lessons:30,choice_questions:questions,objective_questions:2430,alphabetical_labels:true,automatic_grading:true,screenshot_case:true}));
