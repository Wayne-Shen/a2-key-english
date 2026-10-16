/* Presentation only: retain original lesson nodes, answers, audio and storage keys. */
(() => {
  'use strict';
  let lastSlide=null,lastScrollTop=0;
  let playerHost=null,player=null,audioSlot=null,playerObserver=null;
  function positionPlayer(){
    if(!audioSlot||!playerHost||playerHost.hidden)return;
    const slot=audioSlot.getBoundingClientRect(),deck=playerHost.parentElement.getBoundingClientRect();
    Object.assign(playerHost.style,{left:`${slot.left-deck.left}px`,top:`${slot.top-deck.top}px`,width:`${slot.width}px`});
  }
  function updatePlayer(slide){
    audioSlot=slide.querySelector('.lesson-audio');
    if(!playerHost)return;
    playerObserver.disconnect();
    if(!audioSlot){player.pause();playerHost.hidden=true;return;}
    if(player.src!==audioSlot.dataset.src){
      player.pause();player.src=audioSlot.dataset.src;
    }
    player.setAttribute('aria-label',audioSlot.dataset.label);
    playerHost.hidden=false;
    positionPlayer();
    playerObserver.observe(audioSlot);
    playerObserver.observe(audioSlot.parentElement);
  }
  window.addEventListener('resize',positionPlayer);
  function prepare(slide) {
    const group=slide.dataset.group;
    if(group==='vocab'||group==='review') {
      const title=slide.querySelector('.context>h2');
      title.textContent=title.textContent.replace(/^\d+\s*·\s*/, '');
      const mark=slide.querySelector('.task-content>.word-mark');
      if(mark)slide.querySelector('.context-body').append(mark);
    }
    if(slide.dataset.focusPrepared)return;
    slide.dataset.focusPrepared='true';
    for(const [selector,label] of [['.context-body','Lesson material'],['.task-content','Current activity']]){
      const region=slide.querySelector(selector);
      region.tabIndex=0;
      region.setAttribute('role','region');
      region.setAttribute('aria-label',label);
    }
    const contextTitle=slide.querySelector('.context>h2');
    contextTitle.textContent=contextTitle.textContent.replace(/\s*·\s*shared (text|recording)$/i,'');
    const context=slide.querySelector('.context'),body=slide.querySelector('.context-body');
    body.querySelectorAll('.audio-hint').forEach(hint=>hint.remove());
    const audio=body.querySelector('audio');
    if(audio){
      const heading=document.createElement('div');heading.className='context-heading';
      const slot=document.createElement('div');slot.className='lesson-audio';
      slot.dataset.src=audio.src;slot.dataset.label=audio.getAttribute('aria-label');
      context.insertBefore(heading,body);
      heading.append(contextTitle,slot);
      // Keep native controls mounted outside the hidden slides, so changing
      // questions does not rebuild their timeline or interrupt shared audio.
      if(!playerHost){
        playerHost=document.createElement('div');playerHost.className='lesson-player';
        playerHost.hidden=true;player=audio;playerHost.append(player);
        document.querySelector('.deck-wrap').append(playerHost);
        playerObserver=new ResizeObserver(positionPlayer);
      }else audio.remove();
    }
    const card=slide.querySelector('.question-card');
    if(card) {
      const actions=card.querySelector('.question-actions');
      const buttons=[...actions.children].slice(1);
      if(card.querySelector('input[type=radio]'))actions.querySelector('.primary').remove();
      const details=document.createElement('details');details.className='answer-help';
      const summary=document.createElement('summary');summary.textContent='Answer help';
      const tools=document.createElement('div');tools.className='help-buttons';tools.append(...buttons);
      details.append(summary,tools,card.querySelector('.answer'),card.querySelector('.explanation'));
      actions.append(details);
    }
    if(group.startsWith('news-')) {
      const content=slide.querySelector('.task-content');
      const metadata=content.querySelector('p.context-instructions');
      if(metadata) {
        const details=document.createElement('details');details.className='source-details';
        const summary=document.createElement('summary');summary.textContent='Source & downloads';details.append(summary);
        let node=metadata;
        while(node&&!node.classList.contains('self-check')) {const next=node.nextElementSibling;details.append(node);node=next;}
        content.insertBefore(details,node);
      }
    }
  }
  globalThis.LessonFocus={capture(slide){
    if(slide&&!slide.hidden)lastScrollTop=slide.querySelector('.context-body').scrollTop;
  },update(data,slides,groups,current){
    const slide=slides[current],group=groups.find(g=>g.key===slide.dataset.group);
    if(!group)return;
    prepare(slide);
    const position=current-group.start+1;
    document.getElementById('sectionCount').textContent=`${position} / ${group.count}`;
    document.getElementById('focusCount').textContent=group.label;
    const progress=document.getElementById('slideProgress');progress.max=group.count;progress.value=position;
    if(lastSlide&&lastSlide!==slide) {
      // Avoid carrying an open answer helper onto the next activity.
      lastSlide.querySelectorAll('.answer-help,.source-details').forEach(details=>details.open=false);
      if(window.matchMedia('(min-width:1000px)').matches){
        const before=lastSlide.querySelector('.context-body'),after=slide.querySelector('.context-body');
        const shared=lastSlide.dataset.group===slide.dataset.group && before.textContent===after.textContent;
        after.scrollTop=shared?lastScrollTop:0;
        slide.querySelector('.task-content').scrollTop=0;
      }else{
        // Narrow layouts keep natural page scrolling.
        window.scrollTo({top:0,behavior:'instant'});
      }
    }
    updatePlayer(slide);
    lastSlide=slide;
  }};
})();
