/* Learning dashboard and short vocabulary rounds; legacy lesson and cache keys stay intact. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const catalog = globalThis.A2WordCatalog || [];
  const courses = globalThis.A2StudioCourses || [];
  const byId = new Map(catalog.map(w => [w.id, w]));
  const SESSION_KEY = 'a2-studio-session-v1';
  const MARKS_KEY = 'a2-unfamiliar-words-v1';
  let day = 1, source = 'day', session = null, stage = 'learn', answered = false;
  let marks = {}, completed = [];
  const el = (tag, text, cls) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (cls) node.className = cls;
    return node;
  };
  function storageError() {
    $('storage-error').textContent = 'Practice could not be read or saved on this browser. You can still try the activity; changes may not survive a refresh.';
    $('storage-error').hidden = false;
  }
  function read(key, fallback, valid) {
    try {
      const data = JSON.parse(localStorage.getItem(key) || 'null');
      if (data === null) return fallback;
      if (!valid(data)) throw new Error('Invalid stored value');
      return data;
    } catch { storageError(); return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch { storageError(); return false; }
  }
  const validIds = value => Array.isArray(value) && value.every(id => byId.has(id));
  const validSession = s => s && s.version === 1 && ['day','saved'].includes(s.source) &&
    Number.isInteger(s.day) && s.day >= 1 && s.day <= 30 && validIds(s.ids) && (s.ids.length > 0 || s.source === 'saved') && s.ids.length <= 6 && new Set(s.ids).size === s.ids.length &&
    Number.isInteger(s.index) && s.index >= 0 && s.index <= s.ids.length && validIds(s.recalled) && validIds(s.again) &&
    [...s.recalled, ...s.again].length === s.index && new Set([...s.recalled, ...s.again]).size === s.index &&
    [...s.recalled, ...s.again].every(id => s.ids.slice(0,s.index).includes(id)) &&
    (s.seen === undefined || validIds(s.seen));
  function loadRecords() {
    completed = [...new Set(read('a2-day-completed', [], v => Array.isArray(v) && v.every(n => Number.isInteger(n) && n >= 1 && n <= 30)))];
    marks = read('a2-unfamiliar-words-v1', {}, v => v && !Array.isArray(v) && typeof v === 'object' && Object.entries(v).every(([id,time]) => /^CORE\d+$/.test(id) && Number.isFinite(time)));
  }
  const isUnlocked = d => CourseAccess.canAccess(d,completed);
  const collection = () => catalog.filter(w => Object.hasOwn(marks,w.id)&&isUnlocked(w.day));
  const lessonURL = d => `html/${d === 1 ? 'index' : 'day'+String(d).padStart(2,'0')}.html`;
  function dashboard() {
    loadRecords();
    const next = courses.find(d => !completed.includes(d.day)) || courses[0];
    if (!next) return;
    for(const option of $('practice-day').options){
      const available=isUnlocked(Number(option.value));option.disabled=!available;
      option.textContent=`Day ${String(option.value).padStart(2,'0')} · ${courses.find(d=>d.day===Number(option.value))?.title||''}${available?'':' · Locked'}`;
    }
    if(session&&session.ids.some(id=>!isUnlocked(byId.get(id).day))){
      session=null;day=next.day;
      if(['#vocabulary','#collection'].includes(location.hash))start(source,day);
    }
    $('days-complete').textContent = String(completed.length);
    $('course-ring').style.setProperty('--completion', `${completed.length / 30 * 100}%`);
    $('progress-copy').textContent = completed.length === 30 ? 'All 30 days complete. Revisit a favourite!' : completed.length ? 'Every completed day is a step forward.' : 'A fresh start. A whole adventure ahead.';
    $('next-label').textContent = `${completed.length === 30 ? 'REVISIT A FAVOURITE' : 'YOUR NEXT STEP'} · DAY ${String(next.day).padStart(2,'0')}`;
    $('next-title').textContent = next.title;
    $('continue-lesson').href = lessonURL(next.day);
    $('continue-lesson').replaceChildren(document.createTextNode(`${completed.length ? 'Continue lesson' : 'Start lesson'} `), el('span','↗'));
    $('day-word-count').textContent = `${catalog.filter(w => w.day === next.day).length} new words in the full lesson · 6 in a focus round`;
    $('listen-link').href = lessonURL(next.day);
    const startNext = () => {
      if (!session || session.index === session.ids.length || session.source !== 'day' || session.day !== next.day) start('day',next.day);
      location.hash = 'vocabulary';
    };
    $('hero-practice').onclick = startNext;
    $('focus-start').onclick = startNext;
    $('focus-label').replaceChildren(document.createTextNode(session && session.index < session.ids.length && session.source === 'day' && session.day === next.day ? `Continue · ${session.index} of ${session.ids.length} practised ` : 'Start a focus round '), el('span','→'));
    const count = collection().length;
    $('saved-title').textContent = count ? `${count} words to come back to.` : 'Make tricky words familiar.';
    $('saved-copy').textContent = count ? 'A few familiar faces, ready for another try.' : 'Collect words from your lessons and revisit them here.';
    $('saved-count').textContent = String(count);
    $('saved-start').onclick = () => { start('saved',next.day); location.hash = 'vocabulary'; };
    $('day-grid').replaceChildren(...courses.map(d => {
      const done = completed.includes(d.day), isNext = d.day === next.day, available=isUnlocked(d.day);
      const a = el(available?'a':'span', `${done ? '✓ ' : ''}${String(d.day).padStart(2,'0')}`, 'day-tile'+(!available?' locked':done?' done':isNext?' next':''));
      if(available)a.href = lessonURL(d.day);else a.setAttribute('aria-disabled','true');
      a.title = `Day ${d.day} · ${d.title}${!available?` · Locked. Complete Day ${next.day} first.`:done ? ' · Completed' : ''}`;
      a.setAttribute('aria-label',a.title);
      if (isNext) a.setAttribute('aria-current','step');
      return a;
    }));
    return next;
  }
  function focusWords(d) {
    const all = catalog.filter(w => w.day === d);
    // Prefer concrete words in this short introduction; the complete locked lesson stays available.
    const concrete = all.filter(w => /^(n|adj|v)( |$)/.test(w.part_of_speech));
    return [...concrete,...all.filter(w => !concrete.includes(w))].slice(0,6).map(w => w.id);
  }
  function start(from = source, d = day, ids, seen = []) {
    loadRecords(); source = from; day = Number(d); stage = 'learn'; answered = false;
    if(!isUnlocked(day))day=CourseAccess.next(completed);
    if(ids)ids=ids.filter(id=>isUnlocked(byId.get(id)?.day));
    const selected = (ids || (source === 'saved' ? collection().slice(0,6).map(w => w.id) : focusWords(day)));
    session = {version:1,source,day,ids:selected,index:0,recalled:[],again:[],seen};
    // Persist an empty collection too, so it survives refresh without reopening lesson words.
    write(SESSION_KEY,session);
    render();
  }
  function button(text, cls, action) {
    const b = el('button',text,cls); b.type = 'button'; b.onclick = action; return b;
  }
  function actions(...nodes) {const row = el('div',undefined,'word-actions');row.append(...nodes);return row;}
  function focusTitle() {requestAnimationFrame(() => {const title=$('word-title');if(title){title.tabIndex=-1;title.focus({preventScroll:true});}});}
  function render() {
    if(session&&session.ids.some(id=>!isUnlocked(byId.get(id).day))){start(source,CourseAccess.next(completed));return;}
    $('source-day').setAttribute('aria-pressed',String(source === 'day'));
    $('source-saved').setAttribute('aria-pressed',String(source === 'saved'));
    $('day-control').hidden = source !== 'day';
    $('practice-day').value = String(day);
    const total = session?.ids.length || 0, index = session?.index || 0;
    $('round-title').textContent = source === 'saved' ? 'My collection · focus round' : `${total || 6}-word focus round · Day ${String(day).padStart(2,'0')}`;
    $('round-subtitle').textContent = source === 'saved' ? 'From your lesson marks and studio practice' : `Part of ${catalog.filter(w => w.day === day).length} lesson words`;
    $('round-count').textContent = total ? `${Math.min(index+1,total)} / ${total}${index===total?' · complete':''}` : '0 words';
    $('round-progress').max = total || 6; $('round-progress').value = index;
    $('round-notice').textContent = index && index < total ? 'Your place in this round is saved on this browser.' : '';
    for (const step of ['learn','recall','say']) $('guide-'+step).classList.toggle('active',step === stage);
    const card = $('word-card'); card.replaceChildren();
    if (!session || !total) {renderEmpty(card); return;}
    if (index === total) {renderSummary(card); return;}
    const word = byId.get(session.ids[index]);
    const meta = el('div',undefined,'word-topline');
    meta.append(el('span',`DAY ${String(word.day).padStart(2,'0')} · WORD ${index+1} OF ${total}`),el('span', stage==='learn' ? 'EXPLORE' : answered ? 'MAKE IT YOURS' : 'QUICK CHECK','mini-tag')); card.append(meta);
    if (stage === 'learn') renderLearn(card,word); else renderRecall(card,word);
  }
  function renderEmpty(card) {
    const box = el('div',undefined,'empty-state');
    box.append(el('div','☆','success-mark'),el('h2','Your collection starts here.','summary-title'));
    box.querySelector('h2').id = 'word-title';
    box.append(el('p','Mark a tricky word in any lesson, or save one for later in a focus round. It will appear here.','definition'));
    box.append(actions(button('Try lesson words →','button primary',() => start('day',day)))); card.append(box);
  }
  function renderLearn(card,w) {
    const heading = el('h2',w.word_or_phrase); heading.id='word-title';card.append(heading,el('p',w.part_of_speech,'part'),el('p',w.simple_english_meaning,'definition'));
    const details=el('details',undefined,'translation');details.append(el('summary','Reveal Chinese'),el('p',w.chinese_meaning));card.append(details);
    const example=el('div',undefined,'example-box'); example.append(el('p','IN A SENTENCE','eyebrow'),el('p',w.example_sentence));card.append(example);
    card.append(actions(button('Try a quick check →','button primary',()=>{stage='recall';answered=false;render();focusTitle();}),button('Save for later','text-button',()=>finishWord(false))));
  }
  function renderRecall(card,w) {
    const heading=el('h2',answered ? 'Now make it yours.' : 'Which word fits this meaning?','question-title');heading.id='word-title';
    card.append(heading,el('p',w.simple_english_meaning,'definition'));
    const other = catalog.filter(x=>x.day===w.day && x.id!==w.id && x.word_or_phrase.toLowerCase()!==w.word_or_phrase.toLowerCase());
    const distractors=other.filter((x,i,a)=>a.findIndex(y=>y.word_or_phrase.toLowerCase()===x.word_or_phrase.toLowerCase())===i).slice(0,2);
    const options=[...distractors,w];const offset=session.index%3;options.unshift(...options.splice(0,offset));
    const choices=el('div',undefined,'choices'), feedback=el('p','','feedback'); feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');
    const hint=button('Need a Chinese hint?','hint-button',()=>{feedback.textContent=w.chinese_meaning;feedback.className='feedback word-definition-translation';}); hint.hidden=true;
    options.forEach((candidate,i)=>{
      const b=button('', 'choice',()=>{
        if (answered) return;
        if(candidate.id===w.id){
          answered=true;stage='say';
          heading.textContent='Now make it yours.';
          card.querySelector('.mini-tag').textContent='MAKE IT YOURS';
          b.classList.add('correct');choices.querySelectorAll('button').forEach(node=>node.disabled=true);
          feedback.textContent=`That’s it — ${w.word_or_phrase}. Say it in your own sentence.`;feedback.className='feedback';
          hint.hidden=true; $('guide-recall').classList.remove('active');$('guide-say').classList.add('active');
          const speaking=el('div',undefined,'speaking-box');speaking.append(el('span','YOUR TURN · SAY IT OUT LOUD','eyebrow'),el('p',w.speaking_question));
          card.insertBefore(speaking,card.querySelector('.word-actions'));
          const next=card.querySelector('[data-next]');next.disabled=false;next.focus({preventScroll:true});
          $('adaptive-note').textContent='You found the word. Take a moment to say a sentence before moving on.';
        } else {
          b.classList.add('wrong');b.disabled=true;feedback.textContent='Not quite. Read the meaning once more, or try a hint. You can choose again.';feedback.className='feedback retry';hint.hidden=false;
          $('adaptive-note').textContent='Take your time. A Chinese hint is available when you want a little help.';
        }
      });b.append(el('span',String.fromCharCode(65+i)),document.createTextNode(candidate.word_or_phrase)); choices.append(b);
    });
    const next=button(session.index===session.ids.length-1?'Finish round ✓':'Next word →','button primary',()=>finishWord(true));next.disabled=true;next.dataset.next='';
    card.append(choices,feedback,hint,actions(next,button('Practise again later','text-button',()=>finishWord(false))));
  }
  function saveMark(id) {
    try {
      const current=JSON.parse(localStorage.getItem(MARKS_KEY)||'{}');
      if(!current || Array.isArray(current) || typeof current!=='object' || Object.entries(current).some(([key,time])=>!/^CORE\d+$/.test(key)||!Number.isFinite(time))) throw new Error('Invalid marks');
      if(!Object.hasOwn(current,id)) current[id]=Date.now();
      localStorage.setItem(MARKS_KEY,JSON.stringify(current));
      marks=current;
      $('saved-count').textContent=String(collection().length);
      return true;
    } catch { storageError(); return false; }
  }
  function finishWord(remembered) {
    const id=session.ids[session.index];
    if(remembered) session.recalled.push(id);
    else {
      if(!saveMark(id)) return;
      session.again.push(id);
    }
    session.index++;write(SESSION_KEY,session);stage='learn';answered=false;
    $('adaptive-note').textContent='A short round, with space to think. Words you save for later get their own practice round.';
    render();focusTitle();
  }
  function renderSummary(card) {
    ['learn','recall','say'].forEach(step=>$('guide-'+step).classList.remove('active'));
    card.append(el('span','A LITTLE PROGRESS, MADE.','eyebrow'),el('div','✓','success-mark'));
    const heading=el('h2','One small round. Well done.','summary-title');heading.id='word-title';card.append(heading);
    card.append(el('p','You made time for your English. Keep going, or take a break — your place is saved.','muted'));
    const stats=el('div',undefined,'summary-stats');
    for(const [n,label] of [[session.recalled.length,'words recalled'],[session.again.length,'to practise again']]){const div=el('div');div.append(el('strong',String(n)),el('span',label));stats.append(div);}card.append(stats);
    const words=el('div',undefined,'summary-words');for(const id of session.ids) words.append(el('span',byId.get(id).word_or_phrase));card.append(words);
    const retry=button(session.again.length ? `Practise ${session.again.length} again →` : 'Try another round →','button primary',()=>{
      const seen=[...new Set([...(session.seen||[]),...session.ids])];
      if(session.again.length) start(source,day,[...session.again],seen);
      else {
        const pool=source==='saved'?collection():catalog.filter(w=>w.day===day);
        const nextIds=pool.filter(w=>!seen.includes(w.id)).slice(0,6).map(w=>w.id);
        if(nextIds.length)start(source,day,nextIds,seen);
        else start(source,day);
      }
      focusTitle();
    });
    const home=el('a','Back to dashboard','subtle-link');home.href='#dashboard';card.append(actions(retry,home));
    const full=el('a','Open the complete lesson ↗','subtle-link');full.href=lessonURL(day);card.append(full);
    $('round-notice').textContent='A focus round does not mark your day complete. Saved words stay in your collection until you remove them.';
  }
  function route() {
    const isStudio=['#vocabulary','#collection'].includes(location.hash);
    $('dashboard').hidden=isStudio;$('vocabulary').hidden=!isStudio;
    const isDownloads=location.hash==='#downloads';
    $('dashboard').hidden=isStudio||isDownloads;
    $('downloads').hidden=!isDownloads;
    $('breadcrumb').textContent=isStudio?'Word studio':isDownloads?'Offline & downloads':'My dashboard';
    document.querySelectorAll('[data-nav]').forEach(a=>{if(a.dataset.nav===(isStudio?'vocabulary':isDownloads?'downloads':'dashboard'))a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
    const next=dashboard();
    if(isStudio){
      if(location.hash==='#collection' && (!session || session.source!=='saved' || session.index===session.ids.length))start('saved',next?.day || 1);
      else if(!session && source==='day')start('day',next?.day || 1);
      else render();
    }
    // Keep native anchor navigation for the course section.
    if(location.hash!=='#course')window.scrollTo({top:0,behavior:'instant'});
  }
  for(const course of courses){const option=el('option',`Day ${String(course.day).padStart(2,'0')} · ${course.title}`);option.value=String(course.day);$('practice-day').append(option);}
  loadRecords();
  session=read(SESSION_KEY,null,validSession);
  if(!session) {
    const prior=read('a2-studio-prototype-session-v1',null,validSession);
    if(prior) {session=prior;write(SESSION_KEY,session);}
  }
  // Bring valid saved-for-later words from the approved prototype into the shared collection once.
  try {
    if(!localStorage.getItem('a2-studio-prototype-imported-v1')) {
      const prior=read('a2-studio-prototype-review-v1',[],validIds);
      if(prior.every(id=>saveMark(id)))write('a2-studio-prototype-imported-v1',true);
    }
  } catch { storageError(); }

  if(session){day=session.day;source=session.source;}
  $('source-day').onclick=()=>start('day',day);
  $('source-saved').onclick=()=>start('saved',day);
  $('practice-day').onchange=()=>start('day',Number($('practice-day').value));
  window.addEventListener('hashchange',route);
  window.addEventListener('storage',()=>{dashboard();if(source==='saved'&&!session)render();});
  window.addEventListener('pageshow',()=>dashboard());
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)dashboard();});
  route();
})();
