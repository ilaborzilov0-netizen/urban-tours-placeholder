/* /ai/ ordered event journal; no PII or field contents. */
(()=>{'use strict';
if(!/^\/ai\/?$/.test(location.pathname))return;
const counter=110906734, prefix='ai_journey_sequence';
const read=()=>{try{return Number(sessionStorage.getItem(prefix)||0)}catch(_){return 0}};
let seq=read();if(!Number.isSafeInteger(seq)||seq<0)seq=0;
const started=performance.now();
const allowed=['section','element','genre','plan','field','action','percent','cigarettes_day','pack_price'];
function track(id,meta={},goal=true){
 if(!/^ai_[a-z0-9_]+$/.test(id))return;
 const data={event:id,page:'/ai/',variant:'main',sequence:++seq,seconds_on_page:Math.round((performance.now()-started)/100)/10};
 for(const key of allowed){
  const val=meta[key];
  if(typeof val==='string')data[key]=val.slice(0,65);
  else if(typeof val==='number'&&Number.isFinite(val))data[key]=val;
 }
 try{sessionStorage.setItem(prefix,String(seq))}catch(_){}
 try{window.posthog?.capture?.('ai_journey_step',data)}catch(_){}
 if(goal){
  const params={page:'/ai/',sequence:seq,seconds_on_page:data.seconds_on_page};
  for(const key of allowed)if(data[key]!==undefined)params[key]=data[key];
  try{window.ym?.(counter,'reachGoal',id,params)}catch(_){}
 }
}
window.aiJourneyTrack=track;
const legacy=window.aiGoals?.fromLegacy;
if(typeof legacy==='function')window.aiGoals.fromLegacy=(event,details={})=>{
 const meta={action:String(event).slice(0,65)};
 for(const key of ['plan','genre','style','channel','location']){
  if(typeof details[key]==='string')meta[key==='style'?'genre':key]=details[key];
 }
 track('ai_legacy_step',meta,false);
 return legacy(event,details);
};
track('ai_visit_start',{section:'hero'},false);
window.addEventListener('pagehide',()=>track('ai_page_exit',{section:'page'},false));
})();
