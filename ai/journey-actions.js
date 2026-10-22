/* /ai/ semantic interactions, without text or contact capture. */
(()=>{'use strict';
if(!/^\/ai\/?$/.test(location.pathname))return;
const track=window.aiJourneyTrack;
if(typeof track!=='function')return;
document.addEventListener('click',event=>{
 const el=event.target.closest('a,button,summary');
 if(!el)return;
 if(el.closest('.ai-test-look-at-tiers'))
  track('ai_hero_tariffs_click',{section:'hero',element:'tariffs_link'});
 if(el.matches('.ai-refund-more'))
  track('ai_guarantee_details_click',{section:'guarantee'});
 if(el.matches('.predfinal-final-invitation-cta'))
  track('ai_final_tariffs_click',{section:'final'});
 const map=[
  ['[data-select-plan]','pricing_plan','pricing'],
  ['[data-style]','pricing_genre','pricing'],
  ['[data-favorite-genre]','favorite_toggle','demos'],
  ['[data-open-question]','question_open','questions'],
  ['.sound-showcase-action a','demo_to_pricing','demos'],
  ['.freedom-vision-cta','freedom_to_pricing','freedom'],
  ['[data-sheet-close]','sheet_close','checkout']
 ];
 for(const [selector,element,section] of map)if(el.matches(selector)){
  track('ai_ui_action',{section,element,plan:el.dataset.selectPlan||'',genre:el.dataset.style||el.dataset.favoriteGenre||''},false);
  break;
 }
});
const faq=document.getElementById('guarantee-faq');
faq?.addEventListener('toggle',()=>track(faq.open?'ai_faq_refund_open':'ai_faq_refund_close',{section:'faq'}));

document.querySelectorAll('.album-tracklist-details').forEach(d=>{
 d.addEventListener('toggle',()=>track('ai_ui_toggle',{section:'albums',element:'tracklist_'+d.dataset.album,action:d.open?'open':'close'},false));
});
document.querySelectorAll('.faq details').forEach((d,i)=>{
 d.addEventListener('toggle',()=>track('ai_ui_toggle',{section:'faq',element:'question_'+(i+1),action:d.open?'open':'close'},false));
});

})();
