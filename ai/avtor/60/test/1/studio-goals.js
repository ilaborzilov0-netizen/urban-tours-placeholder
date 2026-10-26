/* Studio (/ai/avtor/60/test/1/) behavioral funnel for Yandex Metrika 110906734.
   No personally identifiable data, email contents, order IDs, or bank links are logged. */
(()=>{
'use strict';
if(!/^\/ai\/avtor\/60\/test\/1\/?$/.test(location.pathname))return;
const counter=110906734;
const sessionOnce=new Set();
const safe=(s)=>String(s??'').replace(/[^a-z0-9_\-]/gi,'').slice(0,45);
const allow=new Set([
 'hero_view','how_view','author_view','making_view','tariffs_view','tracks_view',
 'people_view','voices_view','faq_view','final_view','scroll_50','scroll_90',
 'demo_play','demo_50','demo_90','demo_error','voice_play','song_open','faq_open',
 'buy_hero','buy_tariff','buy_tracks','buy_final','checkout_open','checkout_close',
 'email_valid','pay_click','order_created','bank_redirect','payment_error','paid',
 'payment_failed','collector_interest'
]);
let sequence=0;
const track=(short,options={},once=false)=>{
 if(!allow.has(short))return;
 const id='studio_'+short;
 if(once&&sessionOnce.has(id))return;
 if(once)sessionOnce.add(id);
 const details={variant:'studio',section:safe(options.section||''),item:safe(options.item||''),sequence:++sequence};
 // Exact goal IDs are separate from existing classic or old /ai/ actions.
 try{window.ym?.(counter,'reachGoal',id,details)}catch(_){}
 try{window.posthog?.capture?.(id,details)}catch(_){}
 try{window.clarity?.('event',id)}catch(_){}
};
window.studioTrack=track;
const once=(name,o)=>track(name,o,true);
const sections=[
 ['.hero','hero_view','hero'],['#example','how_view','mechanism'],
 ['#origin','author_view','author'],['#making','making_view','making'],
 ['#editions','tariffs_view','editions'],['#songs','tracks_view','songs'],
 ['#people','people_view','people'],['#voices','voices_view','voices'],
 ['#questions','faq_view','faq'],['#offer','final_view','final']
];
for(const [selector,event,section] of sections){
 const el=document.querySelector(selector);
 if(!el)continue;
 if(!('IntersectionObserver' in window)){if(event==='hero_view')once(event,{section});continue}
 let timer=null;
 const observer=new IntersectionObserver(entries=>{
  const e=entries[0];
  if(e?.isIntersecting && e.intersectionRatio>=.06){
   if(timer!==null||sessionOnce.has('studio_'+event))return;
   timer=setTimeout(()=>{
     timer=null;
     if(document.visibilityState==='visible'&&el.getClientRects().length)once(event,{section});
   },550);
  }else if(timer!==null){clearTimeout(timer);timer=null}
 },{threshold:[0,.06,.25],rootMargin:'0px 0px -10% 0px'});
 observer.observe(el);
}
let scrollTick=false;
function onScroll(){
 const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);
 const depth=Math.min(100,Math.round(Math.max(0,scrollY)/max*100));
 if(depth>=50)once('scroll_50',{section:'page'});
 if(depth>=90)once('scroll_90',{section:'page'});
}
addEventListener('scroll',()=>{
 if(scrollTick)return;scrollTick=true;
 requestAnimationFrame(()=>{scrollTick=false;onScroll()});
},{passive:true});
onScroll();
function buyFrom(el){
 if(el.closest('.hero'))return 'hero';
 if(el.closest('.edition-card.digital'))return 'tariff';
 if(el.closest('#songs'))return 'tracks';
 if(el.closest('#offer'))return 'final';
 return 'final';
}
document.addEventListener('click',event=>{
 const el=event.target instanceof Element?event.target.closest('button,a,summary'):null;
 if(!el)return;
 if(el.matches('.js-buy')){
  const from=buyFrom(el);
  track('buy_'+from,{section:'checkout',item:from});
 }else if(el.matches('.js-collector-interest')){
  track('collector_interest',{section:'editions'});
 }else if(el.matches('.song-row summary')){
  if(!el.parentElement?.open){
   const index=[...document.querySelectorAll('.song-row summary')].indexOf(el)+1;
   track('song_open',{section:'songs',item:'track_'+index});
  }
 }else if(el.matches('.faq-list summary')&&!el.parentElement?.open){
  const index=[...document.querySelectorAll('.faq-list summary')].indexOf(el)+1;
  track('faq_open',{section:'faq',item:'question_'+index});
 }
},true);
const modal=document.getElementById('order-modal');
if(modal){
 let open=Boolean(modal.open);
 const observer=new MutationObserver(()=>{
  const now=Boolean(modal.open);
  if(now===open)return;open=now;
  track(now?'checkout_open':'checkout_close',{section:'checkout'});
 });
 observer.observe(modal,{attributes:true,attributeFilter:['open']});
}
const email=document.querySelector('#author-checkout-form [name=email]');
function checkEmail(){
 const val=String(email?.value||'').trim();
 if(val.length<=64&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val))once('email_valid',{section:'checkout'});
}
email?.addEventListener('blur',checkEmail);
email?.addEventListener('change',checkEmail);
// Demo: count actual sequential playback, not seeking/skipping.
const sample=document.getElementById('sample-audio');
if(sample){
 let last=null,lastWall=null;const ranges=[];
 function cover(start,end){
  let a=start,b=end,inserted=false;const merged=[];
  for(const [lo,hi] of ranges){
   if(hi<a-.03){merged.push([lo,hi]);continue}
   if(lo>b+.03){if(!inserted){merged.push([a,b]);inserted=true}merged.push([lo,hi]);continue}
   a=Math.min(a,lo);b=Math.max(b,hi);
  }
  if(!inserted)merged.push([a,b]);
  ranges.splice(0,ranges.length,...merged);
 }
 const total=()=>ranges.reduce((n,[a,b])=>n+b-a,0);
 sample.addEventListener('play',()=>{track('demo_play',{section:'demo'});last=sample.currentTime;lastWall=performance.now()});
 sample.addEventListener('seeking',()=>{last=null;lastWall=null});
 sample.addEventListener('seeked',()=>{last=sample.currentTime;lastWall=performance.now()});
 sample.addEventListener('pause',()=>{last=null;lastWall=null});
 sample.addEventListener('timeupdate',()=>{
  if(sample.paused||sample.seeking)return;
  const t=sample.currentTime,now=performance.now(),elapsed=lastWall===null?0:(now-lastWall)/1000;
  if(Number.isFinite(t)&&last!==null&&t>last&&t-last<3&&t-last<=Math.max(1.25,elapsed+.35)){
   cover(Math.max(0,last),Math.min(30,t));
   if(total()>=15)once('demo_50',{section:'demo'});
   if(total()>=27)once('demo_90',{section:'demo'});
  }
  last=t;lastWall=now;
 });
 sample.addEventListener('error',()=>track('demo_error',{section:'demo'}));
}
document.querySelectorAll('.voice-feedback-card audio').forEach((audio,i)=>{
 audio.addEventListener('play',()=>track('voice_play',{section:'voices',item:'voice_'+(i+1)}));
});
})();
