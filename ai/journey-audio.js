/* /ai/ playback stops and genuine full finishes; no seeking permitted. */
(()=>{'use strict';if(!/^\/ai\/?$/.test(location.pathname))return;
const track=window.aiJourneyTrack;if(typeof track!=='function')return;
const names={author:'guitar',estrada:'estrada',modern:'modern'};
const completed=new WeakSet();
document.querySelectorAll('[data-audio-preview]').forEach(block=>{
 const audio=block.querySelector('audio'),kind=names[block.dataset.audioPreview];
 if(!audio||!kind)return;
 const limit=Number(block.dataset.audioDuration)||30;
 audio.addEventListener('play',()=>completed.delete(audio));
 audio.addEventListener('timeupdate',()=>{
  if(completed.has(audio)||audio.paused||!Number.isFinite(audio.currentTime))return;
  if(audio.currentTime>=limit-0.035){
   completed.add(audio);
   track('ai_'+kind+'_complete',{section:'demos',genre:kind,percent:100});
  }
 },true);
 // Non-bubbling media event is intercepted during document capture
 // before the original player resets currentTime to zero.
 document.addEventListener('timeupdate',event=>{
  if(event.target!==audio||completed.has(audio)||audio.paused)return;
  if(audio.currentTime>=limit-0.035){
   completed.add(audio);track('ai_'+kind+'_complete',{section:'demos',genre:kind,percent:100});
  }
 },true);
});
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-play]');if(!b)return;
 const block=b.closest('[data-audio-preview]'),audio=block?.querySelector('audio');
 const kind=names[block?.dataset.audioPreview];
 if(!kind||!audio||audio.paused)return;
 const limit=Number(block.dataset.audioDuration)||30;
 track('ai_'+kind+'_stop',{section:'demos',genre:kind,
  percent:Math.max(0,Math.min(100,Math.floor(audio.currentTime/limit*100)))});
},true);
})();
