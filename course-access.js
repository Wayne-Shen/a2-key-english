/* One local progress policy for the dashboard, lessons and vocabulary. */
(() => {
  'use strict';
  const KEY='a2-day-completed';
  let loaded=false,loading=false;
  function completed(){
    try{
      const value=JSON.parse(localStorage.getItem(KEY)||'[]');
      if(!Array.isArray(value)||value.some(n=>!Number.isInteger(n)||n<1||n>30))return [];
      return [...new Set(value)];
    }catch{return [];}
  }
  function next(days=completed()){for(let day=1;day<=30;day++)if(!days.includes(day))return day;return 1;}
  function canAccess(day,days=completed()){
    if(!Number.isInteger(day)||day<1||day>30)return false;
    // Previously completed lessons remain available for review, even in older non-sequential records.
    return days.includes(day)||day<=next(days)||days.length===30;
  }
  function lessonURL(day){return day===1?'index.html':`day${String(day).padStart(2,'0')}.html`;}
  function decorateLessons(){
    const days=completed();
    for(const tile of document.querySelectorAll('#dayNav [data-day]')){
      const day=Number(tile.dataset.day),allowed=canAccess(day,days);
      tile.classList.toggle('is-locked',!allowed);
      const state=tile.querySelector('.day-status');
      if(allowed){
        tile.href=lessonURL(day);tile.removeAttribute('aria-disabled');
        if(state)state.textContent=days.includes(day)?'✓ Completed':'Start practice';
      }
      else{
        tile.removeAttribute('href');tile.setAttribute('aria-disabled','true');
        if(state)state.textContent=`Complete Day ${next(days)} first`;
      }
      tile.setAttribute('aria-label',`Day ${day} · ${tile.querySelector('.day-title')?.textContent||''} · ${allowed?state?.textContent:'Locked'}`);
    }
    for(const link of document.querySelectorAll('#download-grid .lesson-link')){
      const match=link.href.match(/\/html\/(index|day(\d+))\.html/),day=match?(match[1]==='index'?1:Number(match[2])):0;
      if(!day)continue;
      const allowed=canAccess(day,days);
      link.setAttribute('aria-disabled',String(!allowed));
      link.classList.toggle('is-locked',!allowed);
      link.textContent=allowed?'Open lesson →':`Locked · Complete Day ${next(days)}`;
    }
    const entry=document.getElementById('lesson-entry');
    if(entry&&loaded){
      const day=Number(entry.dataset.day),notice=document.getElementById('unlock-notice'),link=document.getElementById('unlocked-next');
      const done=days.includes(day);
      if(notice)notice.textContent=done?(day<30&&canAccess(day+1,days)?`Day ${String(day+1).padStart(2,'0')} is unlocked.`:'This lesson is complete.'):'Mark this day complete to unlock the next lesson.';
      if(link){link.hidden=!(done&&day<30&&canAccess(day+1,days));if(!link.hidden){link.href=lessonURL(day+1);link.textContent=`Continue to Day ${String(day+1).padStart(2,'0')} →`;}}
    }
  }
  function guardLesson(){
    const entry=document.getElementById('lesson-entry');if(!entry)return;
    const day=Number(entry.dataset.day),allowed=canAccess(day);
    const main=document.getElementById('practice'),gate=document.getElementById('lesson-access'),menu=document.getElementById('courseMenu');
    main.hidden=!allowed;gate.hidden=allowed;menu.hidden=!allowed;
    document.body.classList.toggle('lesson-locked',!allowed);
    if(!allowed){
      document.body.classList.remove('lesson-loading');
      document.getElementById('locked-description').textContent=`Complete Day ${String(next()).padStart(2,'0')} before starting Day ${String(day).padStart(2,'0')}. Your saved progress is kept.`;
      const resume=document.getElementById('locked-resume');resume.href=lessonURL(next());resume.textContent=`Go to Day ${String(next()).padStart(2,'0')} →`;
      document.querySelectorAll('audio').forEach(audio=>audio.pause());
      return;
    }
    if(!loaded&&!loading){
      loading=true;document.body.classList.add('lesson-loading');
      const script=document.createElement('script');script.src=entry.dataset.src;
      script.onload=()=>{loaded=true;loading=false;document.body.classList.remove('lesson-loading');guardLesson();decorateLessons();};
      script.onerror=()=>{loading=false;document.body.classList.remove('lesson-loading');main.hidden=true;gate.hidden=false;document.getElementById('locked-title').textContent='Lesson could not be opened';document.getElementById('locked-description').textContent='Reconnect and reload to finish saving the lesson for offline use.';};
      document.body.append(script);
    }else decorateLessons();
  }
  function refresh(){guardLesson();decorateLessons();window.dispatchEvent(new Event('course-access-change'));}
  globalThis.CourseAccess={completed,next,canAccess,decorateLessons,refresh};
  document.addEventListener('DOMContentLoaded',()=>{
    guardLesson();decorateLessons();
    const downloads=document.getElementById('download-grid');
    if(downloads)new MutationObserver(decorateLessons).observe(downloads,{childList:true});
  });
  document.addEventListener('change',event=>{if(event.target.id==='done')refresh();});
  window.addEventListener('storage',event=>{if(event.key===KEY||event.key===null)refresh();});
  window.addEventListener('pageshow',()=>{guardLesson();decorateLessons();});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){guardLesson();decorateLessons();}});
  document.addEventListener('click',event=>{
    const link=event.target.closest?.('a[href]');
    if(!link)return;
    const url=new URL(link.href,location.href);
    if(url.origin!==location.origin)return;
    const match=url.pathname.match(/\/html\/(?:index(?:\.html)?|day(\d{2})(?:\.html)?)?$/);
    if(match&&!canAccess(match[1]?Number(match[1]):1))event.preventDefault();
  },true);
})();
