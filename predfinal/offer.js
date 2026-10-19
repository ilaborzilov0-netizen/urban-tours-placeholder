(()=>{'use strict';
const counter=110906734;
const goal=(name,details)=>{try{window.ym?.(counter,'reachGoal',name,details||{})}catch(e){}};
const styles={
  author:{title:'Авторская песня',subtitle:'Гитара и взрослый мужской голос'},
  estrada:{title:'Душевная эстрада',subtitle:'Оркестровая мелодия и сильный припев'},
  modern:{title:'Современное звучание',subtitle:'Тёплый поп и живой ритм'}
};
let selectedStyle='author',selectedPlan='one',isSending=false,isSent=false;
const styleButtons=[...document.querySelectorAll('[data-style]')];
const planButtons=[...document.querySelectorAll('[data-select-plan]')];
const priceChoice=document.querySelector('#selected-price-choice');
const priceName=document.querySelector('#selected-price-name');
const form=document.querySelector('#release-form');
const status=document.querySelector('#release-status');
const sunoLoad=document.getElementById('suno-load');
const sunoFrame=document.getElementById('suno-player');
const sunoPlaceholder=document.getElementById('suno-placeholder');
const sunoHelp=document.getElementById('suno-help');
const pultButtons=[...document.querySelectorAll('[data-theme]')];
const visionButton=document.getElementById('vision-switch');
const motionButton=document.getElementById('motion-switch');
const explainFrame=document.querySelector('#video-explainer iframe');
function syncExplainer(){
 if(!explainFrame?.contentWindow)return;
 try{
  explainFrame.contentWindow.postMessage({type:'ai-theme',theme},location.origin);
  explainFrame.contentWindow.postMessage({type:'ai-motion',enabled:useMotion()},location.origin);
  explainFrame.contentWindow.postMessage({type:'ai-vision',enabled:vision},location.origin);
 }catch(_){}
}
explainFrame?.addEventListener('load',syncExplainer);
window.addEventListener('message',event=>{
 if(event.origin!==location.origin||event.source!==explainFrame?.contentWindow)return;
 if(event.data?.type!=='ai-video-event')return;
 const allowed=new Set(['predfinal_video_start','predfinal_video_75','predfinal_video_complete']);
 if(allowed.has(event.data.name))goal(event.data.name);
});
const pathStory=document.getElementById('path-story');
const pathReplay=document.getElementById('path-replay');
const pathAnnouncement=document.getElementById('path-announcement');
const mechanismSteps=[...document.querySelectorAll('[data-mech-step]')];
const listeningNotes=[...document.querySelectorAll('.listen-beats b')];
function updateState(){
 styleButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.style===selectedStyle)));
 document.querySelectorAll('[data-price-card]').forEach(c=>c.classList.toggle('is-selected',c.dataset.priceCard===selectedPlan));
 planButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.selectPlan===selectedPlan)));
 const planTitle=selectedPlan==='all'?'Все шесть альбомов · 1 590 ₽':'Оба этапа · '+styles[selectedStyle].title+' · 990 ₽';
 priceChoice.textContent=planTitle;
 priceName.value=selectedPlan==='all'?'all-six':selectedStyle;
 const payButton=document.querySelector('.prefinal-pay-btn');
 if(payButton)payButton.textContent=selectedPlan==='all'?'Перейти к оплате · 1 590 ₽ →':'Перейти к оплате · 990 ₽ →';

}
styleButtons.forEach(button=>button.addEventListener('click',()=>{
 selectedStyle=button.dataset.style;
 updateState();goal('predfinal_style_select',{style:selectedStyle});
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
// Suno is a third-party cross-origin player. Do not claim play or 75% completion
// when all we can observe is an iframe attempt or a click on the external link.
sunoLoad.addEventListener('click',()=>{
 // The provided /s/ URL is a short link, not a verified Suno song UUID.
 // If a canonical ID is supplied later, the official /embed/<uuid> route is used.
 const songId=new URLSearchParams(location.search).get('suno_id')||'';
 const safeId=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(songId)?songId:null;
 sunoFrame.src=safeId?'https://suno.com/embed/'+safeId:'https://suno.com/s/AOYtFSnkg4gmPAVT';
 sunoFrame.hidden=false;
 sunoPlaceholder.hidden=true;
 sunoHelp.textContent='Плеер загружается с Suno. Если не появился или не воспроизводит, воспользуйтесь ссылкой «Открыть песню в Suno».';
 goal('predfinal_suno_embed_attempt');
});
document.querySelectorAll('[data-suno-direct]').forEach(a=>a.addEventListener('click',()=>goal('predfinal_suno_direct_click')));
// Three shortlisted treatments. Accessibility and motion preferences are independent.
const allowedThemes=['dark'];
let theme='dark',vision=false,motionPref=true;
const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
const useMotion=()=>motionPref&&!reduceMotion.matches;
let motionObserver=null;
const motionIntroTags=new WeakSet();
try{
 const saved=localStorage.getItem('predfinal_theme');
 if(allowedThemes.includes(saved))theme=saved;
 vision=localStorage.getItem('predfinal_vision')==='on';
 if(localStorage.getItem('predfinal_motion')==='off')motionPref=false;
}catch(_){}

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
 document.body.classList.remove(...allowedThemes.map(x=>'theme-'+x));
 document.body.classList.add('theme-'+theme);
 document.body.classList.toggle('vision-mode',vision);
 const enabled=useMotion();
 document.body.classList.toggle('motion-enabled',enabled);
 document.body.classList.toggle('motion-disabled',!enabled);
 document.documentElement.style.scrollBehavior=enabled?'smooth':'auto';
 pultButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.theme===theme)));
 visionButton.setAttribute('aria-pressed',String(vision));
 visionButton.textContent=vision?'А− Обычный':'А+ Текст';
 motionButton.setAttribute('aria-pressed',String(enabled));
 motionButton.textContent=enabled?'◉ Анимация':'○ Без движения';
 motionButton.disabled=reduceMotion.matches;
 motionButton.title=reduceMotion.matches?'Анимация отключена системной настройкой':'Переключить декоративную анимацию';
 const meta=document.querySelector('meta[name="theme-color"]');
 if(meta)meta.content=({dark:'#141814',classic:'#f6f2e7',vinyl:'#f0e3cc',soviet:'#efe9d7',phonotheque:'#352a22',concert:'#f5ecdb',bureau:'#e8eee9',neural:'#f7f8f3',quantum:'#080f14',futurelab:'#edf2f1'})[theme]||'#f6f2e7';
 setupScrollMotion();
 setupPathAuto();
 syncExplainer();
}
pultButtons.forEach(b=>b.addEventListener('click',()=>{
 theme=b.dataset.theme;
 applyAppearance();
 try{localStorage.setItem('predfinal_theme',theme)}catch(_){}
 goal('predfinal_theme_select',{theme});
}));
visionButton.addEventListener('click',()=>{
 vision=!vision;
 applyAppearance();
 try{localStorage.setItem('predfinal_vision',vision?'on':'off')}catch(_){}
 goal('predfinal_vision_toggle',{enabled:vision?1:0});
});
motionButton.addEventListener('click',()=>{
 if(reduceMotion.matches)return;
 motionPref=!motionPref;
 applyAppearance();
 try{localStorage.setItem('predfinal_motion',motionPref?'on':'off')}catch(_){}
 goal('predfinal_motion_toggle',{enabled:motionPref?1:0,theme});
});
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
 goal('predfinal_checkout_preview',{plan:selectedPlan,style:selectedStyle});
 status.textContent='Внутренний предпросмотр оформления. Для выбранных комплектов необходимо подключить соответствующие тарифы Т-Банка; оплата не списывается.';
 status.classList.add('error');status.hidden=false;
});

updateState();
})();