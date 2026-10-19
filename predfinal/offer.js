(()=>{'use strict';
const counter=110906734;
const goal=(name,details)=>{try{window.ym?.(counter,'reachGoal',name,details||{})}catch(e){}};
const styles={
  author:{title:'Под гитару',subtitle:'Гитара и взрослый мужской голос'},
  estrada:{title:'Душевная эстрада',subtitle:'Оркестровая мелодия и сильный припев'},
  modern:{title:'Современное звучание',subtitle:'Тёплый поп и живой ритм'}
};
let selectedStyle='author',selectedPlan='one',isSending=false,isSent=false;
const styleButtons=[...document.querySelectorAll('.tier-genre [data-style]')];
const planButtons=[...document.querySelectorAll('[data-select-plan]')];
const priceChoice=document.querySelector('#selected-price-choice');
const priceName=document.querySelector('#selected-price-name');
const form=document.querySelector('#release-form');
const status=document.querySelector('#release-status');
const pathStory=document.getElementById('path-story');
const pathReplay=document.getElementById('path-replay');
const pathAnnouncement=document.getElementById('path-announcement');
const mechanismSteps=[...document.querySelectorAll('[data-mech-step]')];
const listeningNotes=[...document.querySelectorAll('.listen-beats b')];
function updateState(){
 styleButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.style===selectedStyle)));
 document.querySelectorAll('[data-price-card]').forEach(c=>c.classList.toggle('is-selected',c.dataset.priceCard===selectedPlan));
 planButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.selectPlan===selectedPlan)));
 const priceMap={one:990,all:1490,duo:2090};
 const titles={
  one:styles[selectedStyle].title+' · 990 ₽',
  all:'Все звучания · 1 490 ₽',
  duo:'Для двоих · 2 090 ₽'
 };
 const selectedPrice=priceMap[selectedPlan]??990;
 priceChoice.textContent=titles[selectedPlan]??titles.one;
 priceName.value=selectedPlan==='duo'?'all-six-duo':selectedPlan==='all'?'all-six':selectedStyle;
 const payButton=document.querySelector('.prefinal-pay-btn');
 if(payButton)payButton.textContent='Перейти к оплате · '+selectedPrice.toLocaleString('ru-RU')+' ₽ →';
}
styleButtons.forEach(button=>button.addEventListener('click',()=>{
 selectedStyle=button.dataset.style;
 selectedPlan='one';
 updateState();goal('predfinal_style_select',{style:selectedStyle,source:'basic_price_card'});
}));
planButtons.forEach(button=>button.addEventListener('click',()=>{
 selectedPlan=button.dataset.selectPlan;
 updateState();goal('predfinal_plan_select',{plan:selectedPlan});
 document.getElementById('request').scrollIntoView({behavior:useMotion()?'smooth':'auto',block:'start'});
 document.getElementById('email').focus({preventScroll:true});
}));
document.querySelectorAll('[data-scroll-request]').forEach(button=>button.addEventListener('click',()=>{
 goal('predfinal_request_click',{location:button.dataset.scrollRequest});
 document.getElementById('pricing').scrollIntoView({behavior:'smooth',block:'start'});
}));
// Native previews: each player is independent of purchasing. A new play pauses the
// previous one. Missing files are NEVER substituted with the wrong genre.
const sampleBlocks=[...document.querySelectorAll('[data-audio-preview]')];
let activeSample=null;
const clock=t=>{const sec=Math.max(0,Math.floor(t||0));return Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0');};
sampleBlocks.forEach(block=>{
 const audio=block.querySelector('audio');
 const button=block.querySelector('[data-play]');
 const seek=block.querySelector('.sound-seek');
 const time=block.querySelector('.sound-elapsed');
 const genre=block.dataset.audioPreview;
 const url=block.dataset.audioSrc;
 if(!url){
  button.disabled=true;
  button.setAttribute('aria-label','Образец звучания не загружен');
  button.title='Для этого стиля ещё нет отдельного аудиофрагмента';
  time.textContent='0:00 / 0:30';
  return;
 }
 const sync=()=>{
  const total=30;
  const t=Math.min(total,audio.currentTime||0);
  seek.value=String(t);
  seek.style.setProperty('--progress',(t/total*100)+'%');
  time.textContent=clock(t)+' / 0:30';
  const playing=!audio.paused&&!audio.ended;
  button.textContent=(playing?'❚❚ Пауза':'▶ Послушать')+' · 30 секунд';
  button.setAttribute('aria-label',playing?'Приостановить прослушивание':'Воспроизвести фрагмент');
  block.classList.toggle('is-playing',playing);
 };
 button.addEventListener('click',()=>{
  if(audio.paused){
   sampleBlocks.forEach(other=>{const player=other.querySelector('audio');if(player!==audio&&!player.paused)player.pause();});
   activeSample=block;
   const p=audio.play();
   if(p?.catch)p.catch(()=>{sync();});
  }else audio.pause();
 });
 seek.addEventListener('input',()=>{
  if(audio.readyState>0&&Number.isFinite(audio.duration))audio.currentTime=Math.min(29.99,Number(seek.value));
  sync();
 });
 audio.addEventListener('play',()=>{sync();goal('predfinal_audio_preview_play',{genre});});
 audio.addEventListener('pause',sync);
 audio.addEventListener('timeupdate',()=>{if(audio.currentTime>=30){audio.pause();audio.currentTime=0;}sync();});
 audio.addEventListener('ended',()=>{audio.currentTime=0;sync();goal('predfinal_audio_preview_complete',{genre});});
 audio.addEventListener('error',()=>{
  button.disabled=true;
  button.setAttribute('aria-label','Не удалось загрузить аудиозапись');
  button.title='Не удалось загрузить аудиозапись';
 });
 sync();
});
// Final dark-only layout: large-print style is a fixed baseline, not an optional mode.
const theme='dark';
const motionPref=true;
const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
const useMotion=()=>motionPref&&!reduceMotion.matches;
let motionObserver=null;
const motionIntroTags=new WeakSet();

function clearMotionObserver(){
 if(motionObserver){motionObserver.disconnect();motionObserver=null;}
}
function setupScrollMotion(){
 clearMotionObserver();
 const diagram=document.getElementById('mechanic-diagram');
 const convert=document.querySelector('.lab-conversion');
 diagram?.classList.remove('is-activated');
 convert?.classList.remove('is-activated');
 if(!useMotion() || !('IntersectionObserver' in window))return;
 if(theme==='neural'){
  // All copy stays visible. At most 6px/240ms heading movement, once per heading.
  motionObserver=new IntersectionObserver(entries=>{
   entries.forEach(entry=>{
    if(!entry.isIntersecting)return;
    const el=entry.target;
    motionObserver?.unobserve(el);
    if(!motionIntroTags.has(el)){
     motionIntroTags.add(el);
     el.animate?.([
       {opacity:.86,transform:'translateY(6px)'},
       {opacity:1,transform:'translateY(0)'}
     ],{duration:240,easing:'ease-out'});
    }
   });
  },{threshold:.22});
  document.querySelectorAll('.section h2,.proof-panel h2').forEach(el=>motionObserver.observe(el));
 }
 if(theme==='futurelab'){
  motionObserver=new IntersectionObserver(entries=>{
   entries.forEach(entry=>{
    if(!entry.isIntersecting)return;
    entry.target.classList.add('is-activated');
    motionObserver?.unobserve(entry.target);
   });
  },{threshold:.2});
  if(diagram)motionObserver.observe(diagram);
  if(convert)motionObserver.observe(convert);
 }
}

/* A 12-second silent explanatory cartoon. No copy is gated on motion. */
let pathAutoUsed=false;
let pathPlaying=false;
let pathObserver=null;
let pathTimers=[];
function stopPathTimers(){
 pathTimers.forEach(clearTimeout);
 pathTimers=[];
 pathPlaying=false;
}
function setPathScene(scene){
 if(!pathStory)return;
 pathStory.dataset.progress=scene;
 const active=scene==='habit'?'habit':scene.startsWith('listen')?'repeat':scene==='choice'||scene==='complete'?'choice':'';
 const passed=scene.startsWith('listen')?['habit']:scene==='choice'||scene==='complete'?['habit','repeat']:[];
 mechanismSteps.forEach(el=>{
  el.classList.toggle('is-current',el.dataset.mechStep===active);
  el.classList.toggle('is-completed',passed.includes(el.dataset.mechStep));
 });
 const heard=scene==='complete'||scene==='choice'?3:scene.startsWith('listen')?Number(scene.slice(6)):0;
 listeningNotes.forEach((note,index)=>note.classList.toggle('is-heard',index<heard));
}
function playPathStory(trigger){
 if(!pathStory||!pathReplay)return;
 if(pathObserver){pathObserver.disconnect();pathObserver=null;}
 pathAutoUsed=true;
 stopPathTimers();
 if(!useMotion()){
  setPathScene('complete');
  pathReplay.textContent='↻ Схема без анимации';
  if(trigger==='button')pathAnnouncement.textContent='Схема показана без движения: знакомая ситуация, повторение песни, новый ответ.';
  return;
 }
 pathPlaying=true;
 pathAnnouncement.textContent='';
 pathReplay.textContent='↻ Посмотреть ещё раз';
 setPathScene('habit');
 const schedule=[
  [2650,'listen1'],
  [4350,'listen2'],
  [6050,'listen3'],
  [8350,'choice'],
  [12000,'complete']
 ];
 schedule.forEach(([delay,scene])=>{
  pathTimers.push(setTimeout(()=>{
   if(!useMotion()){stopPathTimers();setPathScene('complete');return;}
   setPathScene(scene);
   if(scene==='complete'){
    pathPlaying=false;pathTimers=[];
    if(trigger==='button')pathAnnouncement.textContent='Анимация завершена: повторение музыки показывает, как другой ответ может стать легче вспомнить.';
    goal('predfinal_path_story_complete',{trigger});
   }
  },delay));
 });
 goal('predfinal_path_story_start',{trigger});
}
function setupPathAuto(){
 if(pathObserver){pathObserver.disconnect();pathObserver=null;}
 if(!pathStory)return;
 if(!useMotion()){
  stopPathTimers();
  setPathScene('complete');
  pathReplay.textContent='↻ Схема без анимации';
  return;
 }
 if(!pathPlaying && pathAutoUsed){
  pathReplay.textContent='↻ Повторить за 12 секунд';
 }
 if(pathPlaying||pathAutoUsed||!('IntersectionObserver' in window))return;
 pathObserver=new IntersectionObserver(entries=>{
  if(entries.some(e=>e.isIntersecting)){
   pathObserver?.disconnect();pathObserver=null;
   playPathStory('auto');
  }
 },{rootMargin:'0px 0px -10% 0px',threshold:.08});
 pathObserver.observe(pathStory);
}
pathReplay?.addEventListener('click',()=>playPathStory('button'));

function applyAppearance(){
 document.body.classList.add('theme-dark','vision-mode');
 const enabled=useMotion();
 document.body.classList.toggle('motion-enabled',enabled);
 document.body.classList.toggle('motion-disabled',!enabled);
 document.documentElement.style.scrollBehavior=enabled?'smooth':'auto';
 setupScrollMotion();
 setupPathAuto();
}
if(reduceMotion.addEventListener)reduceMotion.addEventListener('change',applyAppearance);
else if(reduceMotion.addListener)reduceMotion.addListener(applyAppearance);
applyAppearance();
document.querySelectorAll('[data-direct-contact]').forEach(a=>a.addEventListener('click',()=>goal('predfinal_author_contact',{channel:a.dataset.directContact})));
// Isolated checkout mock; no bank call to the unrelated ai_album tariff.
form.addEventListener('submit',e=>{
 e.preventDefault();
 status.hidden=true;status.classList.remove('error');
 const email=String(form.elements.email.value||'').trim();
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
  status.textContent='Укажите правильный email для получения альбомов и чека.';
  status.classList.add('error');status.hidden=false;form.elements.email.focus();return;
 }
 if(form.elements.website.value)return;
 goal('predfinal_checkout_preview',{plan:selectedPlan,style:selectedStyle,amount:selectedPlan==='one'?990:selectedPlan==='all'?1490:2090});
 status.textContent='Внутренний предпросмотр оформления. Для выбранных комплектов необходимо подключить соответствующие тарифы Т-Банка; оплата не списывается.';
 status.classList.add('error');status.hidden=false;
});

updateState();
})();