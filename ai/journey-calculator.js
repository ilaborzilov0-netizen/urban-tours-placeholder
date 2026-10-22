/* /ai/ calculator: first-change goals plus repeat action journal. */
(()=>{'use strict';if(!/^\/ai\/?$/.test(location.pathname))return;
const track=window.aiJourneyTrack,root=document.getElementById('smoking-savings');
if(!root||typeof track!=='function')return;
const seen=new Set(),timers=new Map();
function change(field){
 if(field!=='cigarettes'&&field!=='pack')return;
 clearTimeout(timers.get(field));
 timers.set(field,setTimeout(()=>{
  const id=field==='cigarettes'?'ai_calculator_cigarettes_changed':'ai_calculator_pack_changed';
  track(id,{section:'calculator',field},!seen.has(field));seen.add(field);
 },350));
}
root.addEventListener('input',e=>change(e.target?.dataset?.calcInput));
root.addEventListener('click',e=>change(e.target.closest('[data-calc-adjust]')?.dataset.calcAdjust));
})();
