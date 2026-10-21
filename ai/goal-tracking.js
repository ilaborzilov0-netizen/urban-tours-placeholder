/* /ai/ semantic Yandex Metrika goals.
 * Only fires verified actions. No PII, order IDs, payment URLs or field values.
 * Site-wide predfinal JS reports legacy events through window.aiGoals.fromLegacy.
 */
(()=>{
 'use strict';
 if(!/^\/ai\/?$/.test(location.pathname))return;
 const COUNTER=110906734;
 const genres={author:'guitar',estrada:'estrada',modern:'modern'};
 const prices={audio_pair_one:'1990',audio_pair_all:'2990',audio_pair_duo:'4490'};
 const soundKeys=new Set(Object.keys(genres));
 const seen=new Set();
 const stats={};
 const sessionPrefix='ai_goals_v1_';
 const safe=(raw)=>String(raw||'').slice(0,90);
 function emit(id,info={},once=false){
  if(!/^ai_[a-z0-9_]+$/.test(id))return false;
  if(once&&seen.has(id))return false;
  if(once){
   seen.add(id);
   try{sessionStorage.setItem(sessionPrefix+id,'1')}catch(_){}
  }
  const payload={page:'/ai/'};
  for(const key of ['genre','plan','origin','reason']){
   if(Object.prototype.hasOwnProperty.call(info,key))payload[key]=safe(info[key]);
  }
  try{window.ym?.(COUNTER,'reachGoal',id,payload)}catch(_){}
  try{window.posthog?.capture?.(id,payload)}catch(_){}
  try{window.gtag?.('event',id,payload)}catch(_){}
  return true;
 }
 const unique=(id,info)=>emit(id,info,true);
 // Existing semantic events are forwarded through one adapter, no DOM click double-counts.
 function fromLegacy(name,data={}){
  const genre=genres[data.genre||data.style];
  const plan=prices[data.plan];
  const ctx={genre:data.genre||data.style,plan:data.plan,reason:data.reason};
  switch(name){
   case 'predfinal_audio_preview_play':
    if(genre)unique('ai_'+genre+'_play',ctx);
    break;
   case 'predfinal_demo_favorite':
    if(genre)emit('ai_'+genre+(data.liked?'_like':'_unlike'),ctx);
    break;
   case 'predfinal_style_select':
    if(genre){
     if(window.aiGoals?.suppressPriceStyleOnce){window.aiGoals.suppressPriceStyleOnce=false;break;}
     emit('ai_price_style_'+genre,ctx);
    }
    break;
   case 'predfinal_author_contact':
    if(data.channel==='max')emit('ai_author_max');
    if(data.channel==='telegram')emit('ai_author_telegram');
    break;
   case 'predfinal_checkout_open':
    if(plan)emit('ai_plan_'+plan+'_click',ctx);
    emit('ai_checkout_open',ctx);
    break;
   case 'predfinal_checkout_genre_select':
    if(genre)emit('ai_checkout_genre_'+genre,ctx);
    break;
   case 'predfinal_payment_create':
    if(plan)emit('ai_pay_click_'+plan,ctx);
    break;
   case 'predfinal_payment_created':
    if(plan)emit('ai_order_created_'+plan,ctx);
    break;
   case 'predfinal_bank_redirect':
    if(plan)emit('ai_bank_redirect_'+plan,ctx);
    break;
   case 'predfinal_payment_success':
    if(plan)unique('ai_purchase_'+plan,ctx);
    break;
   case 'predfinal_payment_error':
    emit('ai_order_create_error',ctx);
    break;
   case 'predfinal_payment_failed':
    emit('ai_bank_payment_failed',ctx);
    break;
   case 'predfinal_question_open':
    if(data.location==='pricing'||data.location==='faq')emit('ai_question_open_'+data.location,{origin:data.location});
    break;
   case 'predfinal_question_success':
    emit('ai_question_sent',{origin:data.location});
    break;
   case 'predfinal_question_error':
    emit('ai_question_error',{origin:data.location});
    break;
   case 'predfinal_delivery_sent':
    // Call ONLY from backend-verified actual product-access delivery, never from a confirmation email.
    unique('ai_delivery_sent',ctx);
    break;
   case 'predfinal_delivery_failed':
    // Call ONLY from a confirmed failure of album access delivery.
    emit('ai_delivery_failed',ctx);
    break;
  }
 }
 const api=window.aiGoals={emit,fromLegacy,suppressPriceStyleOnce:false};
 // Keep passive milestones once per browser-tab session, including reloads.
 for(const id of [
  'ai_demo_view','ai_guide_view','ai_reviews_view','ai_pricing_view',
  'ai_guitar_50','ai_guitar_90','ai_estrada_50','ai_estrada_90',
  'ai_modern_50','ai_modern_90','ai_checkout_email_valid','ai_calculator_changed'
 ]){
  try{if(sessionStorage.getItem(sessionPrefix+id)==='1')seen.add(id)}catch(_){}
 }
 function visibleOnce(selector,id){
  const el=document.querySelector(selector);
  if(!el||typeof IntersectionObserver!=='function'||seen.has(id))return;
  let timer=null,visible=false;
  const observer=new IntersectionObserver(entries=>{
   const entry=entries[0];
   if(entry.isIntersecting&&entry.intersectionRatio>=0.35){
    if(!visible){
     visible=true;
     timer=setTimeout(()=>{
      if(visible&&el.getClientRects().length&&document.visibilityState!=='hidden'){
       unique(id);observer.disconnect();
      }
     },650);
    }
   }else{
    visible=false;clearTimeout(timer);timer=null;
   }
  },{threshold:[0,0.35,0.75]});
  observer.observe(el);
 }
 visibleOnce('#sounds h2','ai_demo_view');
 visibleOnce('#listening-guide h2','ai_guide_view');
 visibleOnce('#reviews h2','ai_reviews_view');
 visibleOnce('#pricing h2','ai_pricing_view');

 // Albums & FAQs. Reading them is an explicit click, not just page scroll.
 document.querySelectorAll('.album-tracklist-details[data-album]').forEach(el=>{
  el.addEventListener('toggle',()=>{
   if(el.open&&(el.dataset.album==='1'||el.dataset.album==='2'))
    emit('ai_album'+el.dataset.album+'_tracks');
  });
 });
 const faq=['ai_faq_how','ai_faq_when','ai_faq_longterm','ai_faq_action','ai_faq_duration','ai_faq_afterpay'];
 document.querySelectorAll('.faq details').forEach((el,i)=>{
  if(!faq[i])return;
  el.addEventListener('toggle',()=>{if(el.open)emit(faq[i]);});
 });
 const links=[
  ['.sound-showcase-action a[href="#pricing"]','ai_to_pricing_demo'],
  ['.freedom-vision-cta[href="#pricing"]','ai_to_demo_explainer'],
  ['.predfinal-final-invitation-cta[href="#pricing"]','ai_to_demo_final']
 ];
 links.forEach(([selector,id])=>document.querySelectorAll(selector).forEach(el=>el.addEventListener('click',()=>emit(id))));

 // Calculator: one real change compared with the page's 20/200 starting values.
 const calculator=document.getElementById('smoking-savings');
 if(calculator){
  const inputs=calculator.querySelectorAll('[data-calc-input]');
  let baseline={};
  inputs.forEach(el=>{baseline[el.dataset.calcInput]=el.value.trim();});
  function checkChange(){
   const changed=[...inputs].some(el=>el.value.trim()!==baseline[el.dataset.calcInput]);
   if(changed)unique('ai_calculator_changed');
  }
  calculator.addEventListener('input',checkChange);
  calculator.addEventListener('click',event=>{
   if(event.target.closest('[data-calc-adjust]'))setTimeout(checkChange,0);
  });
 }
 // Checkout email completion and explicit genre choice.
 const form=document.getElementById('predfinal-checkout-form');
 if(form){
  const email=form.querySelector('input[name="email"]');
  const check=()=>{
   if(email&&email.value.length<=64&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()))
    unique('ai_checkout_email_valid');
  };
  email?.addEventListener('change',check);
  email?.addEventListener('blur',check);
  form.querySelectorAll('input[name="genre"]').forEach(input=>{
   input.addEventListener('change',()=>{
    if(input.checked&&soundKeys.has(input.value))emit('ai_checkout_genre_'+genres[input.value],{genre:input.value});
   });
  });
 }
 // A genuinely dismissed payment sheet; not the redirect to the bank.
 const checkout=document.getElementById('predfinal-checkout-dialog');
 if(checkout){
  let opened=false,submitted=false;
  checkout.addEventListener('close',()=>{
   if(opened&&!submitted)emit('ai_checkout_closed');
   opened=false;submitted=false;
  });
  // A form submit can fail validation or backend creation. Only actual bank
  // redirection counts as leaving the sheet to pay.
  window.addEventListener('pagehide',()=>{submitted=true;});
  const observer=new MutationObserver(()=>{
   if(checkout.open&&!opened){opened=true;submitted=false;}
  });
  observer.observe(checkout,{attributes:true,attributeFilter:['open']});
 }
 // Audio coverage uses the union of continuously PLAYED intervals. Seeking never counts,
 // and replaying the same seconds cannot fake 50% or 90%.
 document.querySelectorAll('[data-audio-preview]').forEach(block=>{
  const audio=block.querySelector('audio');
  const genre=genres[block.dataset.audioPreview];
  if(!audio||!genre)return;
  const declared=Number(block.dataset.audioDuration);
  const duration=Number.isFinite(declared)&&declared>0?declared:30;
  const covered=[];
  let lastTime=null,lastWall=null,seeking=false;
  function coverage(){
   return covered.reduce((total,range)=>total+range[1]-range[0],0);
  }
  function addInterval(start,end){
   if(!(end>start))return;
   let a=Math.max(0,start),b=Math.min(duration,end);
   if(!(b>a))return;
   const updated=[];
   let merged=false;
   for(const [left,right] of covered){
    if(right<a-0.03){updated.push([left,right]);continue;}
    if(left>b+0.03){if(!merged){updated.push([a,b]);merged=true;}updated.push([left,right]);continue;}
    a=Math.min(a,left);b=Math.max(b,right);
   }
   if(!merged)updated.push([a,b]);
   covered.splice(0,covered.length,...updated);
  }
  function resetToMedia(){
   lastTime=Number(audio.currentTime)||0;
   lastWall=performance.now();
  }
  audio.addEventListener('seeking',()=>{seeking=true;lastTime=null;lastWall=null;});
  audio.addEventListener('seeked',()=>{seeking=false;resetToMedia();});
  audio.addEventListener('play',resetToMedia);
  audio.addEventListener('pause',()=>{lastTime=null;lastWall=null;});
  audio.addEventListener('timeupdate',()=>{
   if(audio.paused||seeking)return;
   const now=performance.now(),t=Number(audio.currentTime);
   if(!Number.isFinite(t))return;
   if(lastTime!==null&&lastWall!==null){
    const dt=t-lastTime,wall=(now-lastWall)/1000;
    if(dt>0&&dt<=Math.max(1.25,wall+0.35)&&dt<4){
     addInterval(lastTime,t);
     const amount=coverage();
     if(amount>=duration*.5)unique('ai_'+genre+'_50',{genre:block.dataset.audioPreview});
     if(amount>=duration*.9)unique('ai_'+genre+'_90',{genre:block.dataset.audioPreview});
    }
   }
   lastTime=t;lastWall=now;
  });
  audio.addEventListener('error',()=>emit('ai_'+genre+'_error',{genre:block.dataset.audioPreview}));
 });
})();
