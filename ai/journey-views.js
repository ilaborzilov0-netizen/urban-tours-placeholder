/* Page view milestones: a section heading/element visible >=0.8s. */
(()=>{'use strict';
if(!/^\/ai\/?$/.test(location.pathname))return;
const track=window.aiJourneyTrack;if(typeof track!=='function')return;
const visible=new Set();
const rows=[
 ['.ai-test-title-main','ai_hero_view','hero'],
 ['#opt-demo','ai_demo_view_journey','demos'],
 ['.hero-buy-cta','ai_hero_buy_cta_view','hero'],
 ['.album-display--one .album-cover','ai_album1_view','albums'],
 ['.album-display--two .album-cover','ai_album2_view','albums'],
 ['#about h2','ai_author_view','author'],
 ['#audio-path h2','ai_method_view','method'],
 ['#brain h3','ai_brain_view','brain'],
 ['#freedom h2','ai_freedom_view','freedom'],
 ['#smoking-savings h2','ai_calculator_view','calculator'],
 ['[data-price-card="one"] .price-card-top','ai_pricing_one_view','pricing'],
 ['[data-price-card="all"] .price-card-top','ai_pricing_all_view','pricing'],
 ['[data-price-card="duo"] .price-card-top','ai_pricing_duo_view','pricing'],
 ['#guarantee h3','ai_guarantee_view','guarantee'],
 ['.faq h2','ai_faq_view','faq'],
 ['#start-today h2','ai_final_view','final']
];
function watch(selector,id,section){
 const el=document.querySelector(selector);if(!el||!('IntersectionObserver'in window))return;
 let active=false,timer=0;
 const ob=new IntersectionObserver(([entry])=>{
  const yes=entry?.isIntersecting&&entry.intersectionRatio>=0.4;
  if(yes&&!active){
   active=true;timer=setTimeout(()=>{
    if(active&&!visible.has(id)&&document.visibilityState==='visible'&&el.getClientRects().length){
     visible.add(id);track(id,{section});ob.disconnect();
    }
   },800);
  }else if(!yes){active=false;clearTimeout(timer)}
 },{threshold:[0,0.4,0.75]});
 ob.observe(el);
}
rows.forEach(args=>watch(...args));
function revisit(selector,id,section){
 const el=document.querySelector(selector);if(!el||!('IntersectionObserver'in window))return;
 let inside=false,visits=0,leftAt=0;
 const ob=new IntersectionObserver(([e])=>{
  const isVisible=e?.isIntersecting&&e.intersectionRatio>=0.35;
  if(isVisible&&!inside){
   inside=true;
   if(visits>0&&performance.now()-leftAt>=2000)track(id,{section});
   visits++;
  }else if(!isVisible&&inside){inside=false;leftAt=performance.now()}
 },{threshold:[0,0.35,0.75]});
 ob.observe(el);
}
revisit('#opt-demo','ai_demos_return_view','demos');
revisit('#pricing .pricing','ai_pricing_return_view','pricing');
})();
