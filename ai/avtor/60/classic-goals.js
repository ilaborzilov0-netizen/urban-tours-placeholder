/* Male 55+ /ai/avtor/60/ landing: same goals with isolated path and variant attribution.
   Real payment success is emitted ONLY after backend confirms order.
   Never capture email, freeform questions, identity, order IDs or payment URLs.
*/
(()=>{
'use strict';
if(!/^\/ai\/avtor\/60\/?$/.test(location.pathname))return;
const YANDEX=110906734, prefix='ai_classic_';
const storagePrefix='classic_author60_goal_session_v1_';
let seq=0, playCount=0, recentScroll=0, lastScrollDir='', directionChangeAt=0;
const sent=new Set(), counts={};
const safe=(x)=>String(x??'').replace(/[^a-z0-9_\-]/gi,'').slice(0,48);
function track(short,extra={},goal=true,once=false){
 const id=prefix+safe(short);
 if(!/^ai_classic_[a-z0-9_]+$/.test(id))return;
 if(once&&sent.has(id))return;
 if(once){sent.add(id);try{sessionStorage.setItem(storagePrefix+id,'1')}catch(_){}}
 const data={variant:'classic_author60_1990',page:'/ai/avtor/60/',sequence:++seq};
 for(const key of ['section','origin','action','depth','count','item','state','reason']){
   const v=extra[key];
   if(typeof v==='number'&&Number.isFinite(v))data[key]=Math.max(0,Math.min(1000,Math.round(v)));
   else if(typeof v==='string')data[key]=safe(v);
 }
 counts[id]=(counts[id]||0)+1;
 try{window.posthog?.capture?.(id,{...data,occurrence:counts[id]})}catch(_){}
 try{window.gtag?.('event',id,{...data,occurrence:counts[id]})}catch(_){}
 try{window.clarity?.('event',id)}catch(_){}
 if(goal)try{window.ym?.(YANDEX,'reachGoal',id,{page:'/ai/avtor/60/',variant:'classic_author60_1990',...data})}catch(_){}
}
const unique=(name,data)=>track(name,data,true,true);
window.aiClassicTracker={
 track,unique,counts,
 legacy(name){
  // Preserve pre-existing /ai/ historical action IDs in Yandex Metrika.
  try{window.ym?.(YANDEX,'reachGoal',name)}catch(_){}
  const mapping={
   ai_purchase_form_open:'checkout_open',
   ai_question_form_open:'question_open',
   ai_payment_create:'pay_click',
   ai_payment_created:'order_created',
   ai_payment_error:'payment_error',
   ai_payment_success:'paid',
   ai_question_success:'question_sent',
   ai_question_error:'question_error'
  };
  if(mapping[name]){
    // Bank redirect follows only the validated payment URL and confirmed create.
    if(name==='ai_payment_created')track('bank_redirect',{section:'checkout'});
    track(mapping[name],{section:name.startsWith('ai_question')?'question':'checkout'},true,name==='ai_payment_success');
  }else if(name==='ai_play_click')track('demo_intent',{section:'demo'},false);
 }
};
for(const name of ['hero_view','idea_view','switch_view','mechanism_view','tracks_view','order_view','faq_view','final_view',...['25','50','75','90','100'].map(x=>'scroll_'+x)]){
 try{if(sessionStorage.getItem(storagePrefix+prefix+name)==='1')sent.add(prefix+name)}catch(_){}
}
track('page_loaded',{section:'hero'},false);
function watch(selector,name){
 const el=document.querySelector(selector);if(!el)return;
 if(!('IntersectionObserver' in window))return;
 let timer=0,inside=false,visits=0,entered=0;
 const observer=new IntersectionObserver(([e])=>{
  const visible=!!(e&&e.isIntersecting&&e.intersectionRatio>=.35);
  if(visible&&!inside){
    inside=true;entered=performance.now();
    if(visits>0)track('section_revisit',{section:name,count:visits+1},false);
    visits++;
    timer=setTimeout(()=>{
      if(inside&&document.visibilityState==='visible'&&el.getClientRects().length){
        if(!sent.has(prefix+name+'_view')){
         if(name==='author'||name==='usage'){
           sent.add(prefix+name+'_view');
           track(name+'_view',{section:name},false);
         }else unique(name+'_view',{section:name});
       }
      }
    },700);
  }else if(!visible&&inside){
    inside=false;clearTimeout(timer);timer=0;
    if(performance.now()-entered>=700)track('section_leave',{section:name},false);
  }
 },{threshold:[0,.35,.7]});
 observer.observe(el);
}
[
 ['.hero','hero'],['#idea','idea'],['.switch-section','switch'],
 ['#science','mechanism'],['#inside','tracks'],['.daily','usage'],
 ['#author','author'],['#order','order'],['#faq','faq'],
 ['.last-line','final']
].forEach(([q,id])=>watch(q,id));
const breaks=[25,50,75,90,100];
let prevDepth=0,scrollScheduled=false,scrollCount=0,scrollMax=0;
function onScroll(){
 const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);
 const depth=Math.max(0,Math.min(100,Math.floor(scrollY/max*100)));
 scrollMax=Math.max(scrollMax,depth);
 for(const pct of breaks)if(depth>=pct)unique('scroll_'+pct,{depth:pct});
 const direction=scrollY>recentScroll+24?'down':scrollY<recentScroll-24?'up':'';
 if(direction&&direction!==lastScrollDir&&lastScrollDir&&performance.now()-directionChangeAt>700){
   directionChangeAt=performance.now();scrollCount++;track('scroll_reverse',{depth,count:scrollCount,action:direction},false);
 }
 if(direction){lastScrollDir=direction;recentScroll=scrollY}
 if(depth>=50&&prevDepth<50)track('scroll_pass_half',{depth,count:(counts.scroll_pass_half||0)+1},false);
 prevDepth=depth;
}
addEventListener('scroll',()=>{
 if(scrollScheduled)return;scrollScheduled=true;
 requestAnimationFrame(()=>{scrollScheduled=false;onScroll()});
},{passive:true});
onScroll();
function origin(el){
 if(el.closest('.hero'))return 'hero';
 if(el.closest('.order-card'))return 'order';
 if(el.closest('.last-line'))return 'final';
 if(el.closest('#audio-dialog'))return 'demo';
 return 'other';
}
document.addEventListener('click',event=>{
 const el=event.target.closest('button,a,summary');if(!el)return;
 if(el.matches('[data-buy]')){
   const o=origin(el);
   track('buy_'+o,{origin:o,section:o},['hero','order','final','demo'].includes(o));
 }else if(el.matches('[data-question]')){
   track('question_click',{origin:origin(el)},false);
 }else if(el.matches('[data-demo-hero],[data-demo]')){
   const o=el.matches('[data-demo-hero]')?'hero':'tracks';
   track('demo_button_'+o,{origin:o,section:'demo'});
 }else if(el.matches('[data-situation]')){
   track('situation_click',{section:'switch',item:el.dataset.situation},true);
 }else if(el.matches('.faq-list summary')){
   const idx=[...document.querySelectorAll('.faq-list summary')].indexOf(el)+1;
   const opening=!el.closest('details')?.open;
   track(opening?'faq_open':'faq_close',{section:'faq',item:'question_'+idx},opening);
 }else if(el.matches('[data-modal-close]')){
   track('modal_close',{origin:el.closest('dialog')?.id||''},false);
 }else if(el.matches('.release-motion-toggle')){
   track('cover_animation_toggle',{section:'hero'},false);
 }else if(el.matches('a')){
   track('internal_link_click',{section:origin(el),item:el.getAttribute('href')?.replace(/[^a-z0-9]/gi,'_')||''},false);
 }
},true);
const checkout=document.getElementById('purchase-dialog');
checkout?.addEventListener('close',()=>track('checkout_closed',{section:'checkout'}));
const purchase=document.getElementById('purchase-form');
const email=purchase?.elements?.email;
let emailValid=false;
function emailCheck(){
 if(email&&!emailValid&&email.value.length<=64&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())){
  emailValid=true;unique('email_valid',{section:'checkout'});
 }
}
email?.addEventListener('change',emailCheck);
email?.addEventListener('blur',emailCheck);
// HTML form submission listener from original checkout generates pay_click & subsequent bank events.
const audio=document.getElementById('demo-audio');
if(audio){
 const covered=[], nominal=30;
 let lastT=null,lastWall=null,seeking=false;
 function union(a,b){
  const merged=[];let done=false;
  for(const [lo,hi] of covered){
   if(hi<a-0.02){merged.push([lo,hi]);continue}
   if(lo>b+0.02){if(!done){merged.push([a,b]);done=true}merged.push([lo,hi]);continue}
   a=Math.min(lo,a);b=Math.max(hi,b);
  }
  if(!done)merged.push([a,b]);
  covered.splice(0,covered.length,...merged);
 }
 function coverage(){return covered.reduce((sum,[a,b])=>sum+b-a,0)}
 audio.addEventListener('seeking',()=>{seeking=true;lastT=null;lastWall=null});
 audio.addEventListener('seeked',()=>{seeking=false;lastT=audio.currentTime;lastWall=performance.now()});
 audio.addEventListener('play',()=>{
  playCount++;
  track('demo_play',{section:'demo',count:playCount});
  lastT=audio.currentTime;lastWall=performance.now();
 });
 audio.addEventListener('pause',()=>{if(!audio.ended)track('demo_pause',{section:'demo',count:playCount},false);lastT=null;lastWall=null});
 audio.addEventListener('timeupdate',()=>{
  if(audio.paused||seeking)return;
  const t=Number(audio.currentTime),now=performance.now(),wall=lastWall===null?0:(now-lastWall)/1000;
  if(Number.isFinite(t)&&lastT!==null&&t>lastT&&t-lastT<=Math.max(1.25,wall+.3)&&t-lastT<4){
    union(Math.max(0,lastT),Math.min(nominal,t));
    const seconds=coverage();
    if(seconds>=nominal*.5)unique('demo_50',{section:'demo'});
    if(seconds>=nominal*.9)unique('demo_90',{section:'demo'});
  }
  lastT=t;lastWall=now;
 });
 audio.addEventListener('ended',()=>{
  if(coverage()>=nominal*.9)track('demo_complete',{section:'demo',count:playCount});
  else track('demo_skipped_to_end',{section:'demo',count:playCount},false);
 });
 audio.addEventListener('error',()=>track('demo_error',{section:'demo'},false));
}
addEventListener('pagehide',()=>track('session_exit',{depth:scrollMax,count:playCount},false));
})();