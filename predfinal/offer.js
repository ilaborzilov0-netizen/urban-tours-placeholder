(()=>{'use strict';
const counter=110906734;
const goal=(name,details)=>{
 try{window.ym?.(counter,'reachGoal',name,details||{})}catch(_){}
 if(!/^\/ai\/?$/.test(location.pathname))return;
 try{
  const safe={};for(const key of ['genre','style','liked','plan','source','channel']){
   if(Object.prototype.hasOwnProperty.call(details||{},key))safe[key]=details[key];
  }
  window.posthog?.capture?.(name,safe);
  window.gtag?.('event',name,safe);
 }catch(_){}
};
const styles={
  author:{title:'Под гитару',subtitle:'Гитара и взрослый мужской голос'},
  estrada:{title:'Душевная эстрада',subtitle:'Оркестровая мелодия и сильный припев'},
  modern:{title:'Современное звучание',subtitle:'Тёплый поп и живой ритм'}
};
// Demo likes are independent and multi-select. The 1 990 ₽ plan's genre is
// a separate single choice, selected only with the tariff genre controls.
let storedStyle=null;
try{storedStyle=sessionStorage.getItem('predfinal_preferred_genre')}catch(_){}
let selectedStyle=Object.hasOwn(styles,storedStyle)?storedStyle:'author';
let selectedPlan='all';
const styleButtons=[...document.querySelectorAll('.tier-genre [data-style]')];
const favoriteButtons=[...document.querySelectorAll('[data-favorite-genre]')];
const planButtons=[...document.querySelectorAll('[data-select-plan]')];
const favoritesKey='predfinal_liked_genres';
let likedStyles=new Set();
try{
 const saved=sessionStorage.getItem(favoritesKey);
 if(saved!==null){
  const parsed=JSON.parse(saved);
  if(Array.isArray(parsed))likedStyles=new Set(parsed.filter(s=>Object.hasOwn(styles,s)));
 }else if(Object.hasOwn(styles,storedStyle)){
  // Restore one formerly selected preference without changing the plan.
  likedStyles.add(storedStyle);
 }
}catch(_){}
function saveLikes(){
 try{sessionStorage.setItem(favoritesKey,JSON.stringify([...likedStyles]))}catch(_){}
}
function updateState(){
 styleButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.style===selectedStyle)));
 favoriteButtons.forEach(b=>{
  const genre=b.dataset.favoriteGenre;
  const liked=likedStyles.has(genre);
  b.setAttribute('aria-pressed',String(liked));
  b.closest('.sound-sample')?.classList.toggle('is-favorite',liked);
  const caption=b.querySelector('.sound-favorite-label');
  if(caption)caption.textContent=liked?'Нравится':'Мне нравится это звучание';
  b.setAttribute('aria-label',(liked?'Убрать отметку «Нравится»: ':'Отметить понравившееся звучание: ')+styles[genre].title);
 });
 document.querySelectorAll('[data-price-card]').forEach(c=>c.classList.toggle('is-selected',c.dataset.priceCard===selectedPlan));
 planButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.selectPlan===selectedPlan)));
}

styleButtons.forEach(button=>button.addEventListener('click',()=>{
 const style=button.dataset.style;
 if(!Object.hasOwn(styles,style))return;
 selectedStyle=style;
 try{sessionStorage.setItem('predfinal_preferred_genre',style)}catch(_){}
 selectedPlan='one';
 updateState();goal('predfinal_style_select',{style,source:'basic_price_card'});
}));
favoriteButtons.forEach(button=>button.addEventListener('click',()=>{
 const style=button.dataset.favoriteGenre;
 if(!Object.hasOwn(styles,style))return;
 if(likedStyles.has(style))likedStyles.delete(style);
 else likedStyles.add(style);
 saveLikes();
 updateState();
 goal('predfinal_demo_favorite',{style,liked:likedStyles.has(style)});
}));
planButtons.forEach(button=>button.addEventListener('click',()=>{
 selectedPlan=button.dataset.selectPlan;
 updateState();goal('predfinal_plan_select',{plan:selectedPlan});
}));
document.querySelectorAll('[data-scroll-request]').forEach(button=>button.addEventListener('click',()=>{
 goal('predfinal_request_click',{location:button.dataset.scrollRequest});
 document.getElementById('pricing').scrollIntoView({behavior:'smooth',block:'start'});
}));
// Native previews: each player is independent of purchasing. A new play pauses the
// previous one. Missing files are NEVER substituted with the wrong genre.
const sampleBlocks=[...document.querySelectorAll('[data-audio-preview]')];
const listenedKey='predfinal_listened_demos';
let listenedStyles=new Set();
try{
 const previous=JSON.parse(sessionStorage.getItem(listenedKey)||'[]');
 if(Array.isArray(previous))listenedStyles=new Set(previous.filter(s=>Object.hasOwn(styles,s)));
}catch(_){}
function saveListened(){
 try{sessionStorage.setItem(listenedKey,JSON.stringify([...listenedStyles]))}catch(_){}
}
const clock=t=>{const sec=Math.max(0,Math.floor(t||0));return Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0');};
sampleBlocks.forEach(block=>{
 const audio=block.querySelector('audio');
 const button=block.querySelector('[data-play]');
 const seek=block.querySelector('.sound-seek');
 const time=block.querySelector('.sound-elapsed');
 const status=block.closest('.sound-sample')?.querySelector('.sound-listen-status');
 const card=block.closest('.sound-sample');
 const genre=block.dataset.audioPreview;
 const url=block.dataset.audioSrc;
 const limit=Math.max(1,Number(block.dataset.audioDuration||30));
 const durationLabel=Math.round(limit);
 const secondsWord=(durationLabel%100>=11&&durationLabel%100<=14)?'секунд':durationLabel%10===1?'секунда':durationLabel%10>=2&&durationLabel%10<=4?'секунды':'секунд';
 seek.max=String(limit);
 if(!url){
  button.disabled=true;
  button.setAttribute('aria-label','Образец звучания не загружен');
  button.title='Для этого стиля ещё нет отдельного аудиофрагмента';
  time.textContent='0:00 / '+clock(durationLabel);
  return;
 }
 const sync=()=>{
  const t=Math.min(limit,audio.currentTime||0);
  const completed=listenedStyles.has(genre);
  const playing=!audio.paused&&!audio.ended;
  seek.value=String(t);
  seek.style.setProperty('--progress',(t/limit*100)+'%');
  time.textContent=clock(t)+' / '+clock(durationLabel);
  button.textContent=playing?'❚❚ Пауза':completed?'↻ Послушать ещё раз':'▶ Послушать фрагмент · '+durationLabel+' '+secondsWord;
  button.setAttribute('aria-label',playing?'Приостановить прослушивание':completed?'Послушать фрагмент ещё раз':'Воспроизвести фрагмент');
  block.classList.toggle('is-playing',playing);
  card?.classList.toggle('is-playing',playing);
  card?.classList.toggle('is-listened',completed);
  const message=playing?'Сейчас играет':completed?'✓ Фрагмент прослушан':'';
  if(status&&status.textContent!==message)status.textContent=message;
 };
 const finish=()=>{
  const fresh=!listenedStyles.has(genre);
  listenedStyles.add(genre);
  saveListened();
  if(!audio.paused)audio.pause();
  try{audio.currentTime=0}catch(_){}
  sync();
  if(fresh)goal('predfinal_audio_preview_complete',{genre});
 };
 button.addEventListener('click',()=>{
  if(audio.paused){
   sampleBlocks.forEach(other=>{
    const player=other.querySelector('audio');
    if(player!==audio&&!player.paused)player.pause();
   });
   if(audio.ended||audio.currentTime>=limit-0.02)audio.currentTime=0;
   const p=audio.play();
   if(p?.catch)p.catch(()=>sync());
  }else audio.pause();
 });
 seek.addEventListener('input',()=>{
  if(audio.readyState>0&&Number.isFinite(audio.duration))
   audio.currentTime=Math.max(0,Math.min(limit-0.05,audio.duration-0.05,Number(seek.value)));
  sync();
 });
 audio.addEventListener('play',()=>{sync();goal('predfinal_audio_preview_play',{genre});});
 audio.addEventListener('pause',sync);
 audio.addEventListener('timeupdate',()=>{
  if(audio.currentTime>=limit-0.02&&!audio.ended)finish();
  else sync();
 });
 audio.addEventListener('ended',finish);
 audio.addEventListener('error',()=>{
  button.disabled=true;
  button.setAttribute('aria-label','Не удалось загрузить аудиозапись');
  button.title='Не удалось загрузить аудиозапись';
  sync();
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

function applyAppearance(){
 document.body.classList.add('theme-dark','vision-mode');
 const enabled=useMotion();
 document.body.classList.toggle('motion-enabled',enabled);
 document.body.classList.toggle('motion-disabled',!enabled);
 document.documentElement.style.scrollBehavior=enabled?'smooth':'auto';
 setupScrollMotion();
}
if(reduceMotion.addEventListener)reduceMotion.addEventListener('change',applyAppearance);
else if(reduceMotion.addListener)reduceMotion.addListener(applyAppearance);
applyAppearance();
document.querySelectorAll('[data-direct-contact]').forEach(a=>a.addEventListener('click',()=>goal('predfinal_author_contact',{channel:a.dataset.directContact})));


/* Interactive cigarette-cost calculator; distinct from plan selection/checkout. */
const savingsCalculator=document.getElementById('smoking-savings');
if(savingsCalculator){
 const cigaretteInput=savingsCalculator.querySelector('[data-calc-input="cigarettes"]');
 const packInput=savingsCalculator.querySelector('[data-calc-input="pack"]');
 const error=savingsCalculator.querySelector('.smoking-calc-error');
 const priceDays={one:1990,all:2990,duo:4490};
 const priceRows=[...document.querySelectorAll('[data-smoking-equivalent]')];
 const packSize=20;
 const fmt=new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2});
 const bounds={cigarettes:{min:1,max:100,step:1},pack:{min:1,max:10000,step:10}};
 const inputs={cigarettes:cigaretteInput,pack:packInput};
 const read=(input,key)=>{
  const raw=input.value.trim();
  const n=Number(raw);
  const {min,max}=bounds[key];
  return raw!==''&&Number.isInteger(n)&&n>=min&&n<=max?n:null;
 };
 const dayUnit=days=>{
  const mod100=days%100,mod10=days%10;
  return mod100>=11&&mod100<=14?'дней':mod10===1?'день':mod10>=2&&mod10<=4?'дня':'дней';
 };
 const renderSavings=()=>{
  const cigarettes=read(cigaretteInput,'cigarettes');
  const pack=read(packInput,'pack');
  const valid=cigarettes!==null&&pack!==null;
  cigaretteInput.setAttribute('aria-invalid',String(cigarettes===null));
  packInput.setAttribute('aria-invalid',String(pack===null));
  error.textContent=valid?'':'Укажите от 1 до 100 сигарет в день и цену пачки от 1 до 10 000 ₽.';
  priceRows.forEach(row=>{
   const key=row.dataset.smokingEquivalent;
   if(!Object.hasOwn(priceDays,key))return;
   const days=valid?Math.ceil(priceDays[key]/(cigarettes*pack/packSize)):null;
   row.querySelector('[data-smoking-days]').textContent=days===null?'—':fmt.format(days);
   row.querySelector('[data-smoking-unit]').textContent=days===null?'дней':dayUnit(days);
  });
  savingsCalculator.querySelectorAll('[data-calc-adjust]').forEach(button=>{
   const key=button.dataset.calcAdjust;
   const value=read(inputs[key],key);
   const {min,max}=bounds[key];
   const change=Number(button.dataset.step);
   button.disabled=value!==null&&(change<0?value<=min:value>=max);
  });
 };
 savingsCalculator.querySelectorAll('[data-calc-adjust]').forEach(button=>{
  button.addEventListener('click',()=>{
   const key=button.dataset.calcAdjust;
   const input=inputs[key];
   const {min,max,step}=bounds[key];
   const current=read(input,key);
   const delta=Number(button.dataset.step)*step;
   const safe=current===null?Math.max(min,Math.min(max,Number(input.value)||min)):current;
   input.value=String(Math.max(min,Math.min(max,safe+delta)));
   renderSavings();
   input.focus({preventScroll:true});
  });
 });
 Object.entries(inputs).forEach(([key,input])=>{
  input.addEventListener('input',renderSavings);
  input.addEventListener('blur',()=>{
   const {min,max}=bounds[key];
   const raw=Number(input.value);
   input.value=String(input.value.trim()===''||!Number.isFinite(raw)?min:Math.max(min,Math.min(max,Math.round(raw))));
   renderSavings();
  });
 });
 renderSavings();
}

updateState();
})();