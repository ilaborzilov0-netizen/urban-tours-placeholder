/* /ai/оптимайз/: production candidate — compact three-row demo player. */
(()=>{'use strict';
 const root=document.getElementById('opt-demo');
 if(!root)return;
 const tracks=[
  {id:'author',name:'Под гитару',duration:37.6,src:'https://d2ol7oe51mr4n9.cloudfront.net/user_3KrouuquIhgLmM3Dgm3GoNReITb/ed83f511-977e-4fe7-840c-e8ff1222c3a2.mp3'},
  {id:'estrada',name:'Душевная эстрада',duration:34.12,src:'https://d2ol7oe51mr4n9.cloudfront.net/user_3KrouuquIhgLmM3Dgm3GoNReITb/40afffa9-c314-45d7-9052-15ecd65cc48c.mp3'},
  {id:'modern',name:'Современное звучание',duration:32.94,src:'https://d2ol7oe51mr4n9.cloudfront.net/user_3KrouuquIhgLmM3Dgm3GoNReITb/2c4c9344-789f-442a-9311-ad9daf6211a2.mp3'}
 ];
 const music=Object.fromEntries(tracks.map(t=>[t.id,t]));
 const audio=new Audio();
 audio.preload='none';
 const metricGenres={author:'guitar',estrada:'estrada',modern:'modern'};
 const listenedRanges=Object.fromEntries(tracks.map(t=>[t.id,[]]));
 let lastAudioTime=null,lastWallTime=null;
 const goal=(id,data={},once=false)=>{try{window.aiGoals?.emit?.(id,data,once)}catch(_){}};
 const journey=(id,data={},goalFlag=false)=>{try{window.aiJourneyTrack?.(id,data,goalFlag)}catch(_){}};
 function addCoveredSegment(id,from,to){
  const duration=music[id]?.duration;
  if(!duration||!(to>from))return;
  let left=Math.max(0,from),right=Math.min(to,duration);
  const merged=[];
  let inserted=false;
  for(const pair of listenedRanges[id]){
   if(pair[1]<left-.03){merged.push(pair);continue;}
   if(pair[0]>right+.03){if(!inserted){merged.push([left,right]);inserted=true;}merged.push(pair);continue;}
   left=Math.min(left,pair[0]);right=Math.max(right,pair[1]);
  }
  if(!inserted)merged.push([left,right]);
  listenedRanges[id]=merged;
  const amount=merged.reduce((sum,pair)=>sum+pair[1]-pair[0],0);
  const kind=metricGenres[id],ctx={genre:id};
  if(amount>=duration*.5)goal('ai_'+kind+'_50',ctx,true);
  if(amount>=duration*.9)goal('ai_'+kind+'_90',ctx,true);
 }
 function startCoverage(){
  lastAudioTime=Number(audio.currentTime)||0;
  lastWallTime=performance.now();
 }

 let active=null,playing=false,finished=new Set(),request=0,errorText='';
 function listenedPercent(t){
  if(active===t.id){
   const value=Math.round(100*Math.max(0,Math.min(audio.currentTime||0,t.duration))/t.duration);
   return audio.ended?100:value;
  }
  return finished.has(t.id)?100:0;
 }
 // The visual timer is a countdown, never a percentage.
 // Ceil prevents displaying "0 сек." before the audio actually ends.
 function remainingSeconds(t){
  if(finished.has(t.id))return 0;
  if(active!==t.id)return Math.ceil(t.duration);
  if(audio.ended)return 0;
  const current=Number.isFinite(audio.currentTime)?audio.currentTime:0;
  return Math.max(0,Math.ceil(t.duration-Math.max(0,current)));
 }
 function remainingLabel(t){return remainingSeconds(t)+' сек.'}
 function playLabel(t){return active===t.id&&playing?'Пауза: '+t.name:'Слушать: '+t.name}
 function item(t){
  const isActive=active===t.id;
  return '<div class="opt-line'+(isActive?' is-active':'')+'" data-demo-style="'+t.id+'">'
   +'<button class="opt-round" type="button" data-opt-play="'+t.id+'" aria-label="'+playLabel(t)+'" aria-pressed="'+(isActive&&playing)+'"><span aria-hidden="true">'+(isActive&&playing?'Ⅱ':'▶')+'</span></button>'
   +'<div class="opt-line-text"><strong>'+t.name+'</strong>'
   +'<span class="opt-line-caption" data-status="'+t.id+'" aria-label="Осталось '+remainingSeconds(t)+' секунд">'+remainingLabel(t)+'</span></div>'
   +'<div class="opt-trackbar" role="progressbar" aria-label="Прослушано: '+t.name+'" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" data-progress="'+t.id+'"><i></i></div>'
   +'</div>';
 }
 function render(){
  root.innerHTML='<div class="opt-overline"><strong>Послушайте демо</strong></div>'
   +'<div class="opt-lines">'+tracks.map(item).join('')+'</div>'
   +'<p class="opt-error" role="status"'+(errorText?'':' hidden')+'>'+errorText+'</p>';
  progress();
 }
 function progress(){
  tracks.forEach(t=>{
   const value=listenedPercent(t);
   const bar=root.querySelector('[data-progress="'+t.id+'"]');
   if(bar){bar.setAttribute('aria-valuenow',String(Math.round(value)));bar.querySelector('i').style.width=value.toFixed(1)+'%'}
   const status=root.querySelector('[data-status="'+t.id+'"]');
   if(status){
    status.textContent=remainingLabel(t);
    status.setAttribute('aria-label','Осталось '+remainingSeconds(t)+' сек.');
   }
  });
 }
 function updatePlayState(){
  root.querySelectorAll('[data-opt-play]').forEach(b=>{
   const id=b.dataset.optPlay,on=playing&&active===id;
   b.querySelector('span').textContent=on?'Ⅱ':'▶';
   b.setAttribute('aria-label',(on?'Пауза: ':'Слушать: ')+music[id].name);
   b.setAttribute('aria-pressed',String(on));
  });
  root.querySelectorAll('.opt-line').forEach(r=>r.classList.toggle('is-active',r.dataset.demoStyle===active));
  progress();
 }
 function toggle(id){
  if(!music[id])return;
  const thisRequest=++request;
  errorText='';
  root.querySelectorAll('.opt-error').forEach(error=>{error.hidden=true;error.textContent=''});
  if(active===id&&playing){
   playing=false;
   audio.pause();
   updatePlayState();
   return;
  }
  if(active!==id||audio.ended){
   audio.pause();
   finished.delete(id);
   lastAudioTime=null;lastWallTime=null;
   active=id;
   audio.src=music[id].src;
   audio.load();
  }
  playing=true;
  updatePlayState();
  const promise=audio.play();
  if(promise&&typeof promise.catch==='function'){
   promise.catch(()=>{
    if(thisRequest!==request)return;
    playing=false;
    errorText='Не удалось запустить фрагмент. Нажмите ▶ ещё раз.';
    render();
   });
  }
 }
 root.addEventListener('click',e=>{
  const b=e.target.closest('button');
  if(!b)return;
  if(b.dataset.optPlay)toggle(b.dataset.optPlay);
 });
 audio.addEventListener('play',()=>{
  if(!active)return;
  startCoverage();
  const kind=metricGenres[active];
  goal('ai_'+kind+'_play',{genre:active},true);
  journey('ai_demo_play',{section:'demos',genre:active},false);
 });
 audio.addEventListener('timeupdate',()=>{
  progress();
  if(!active||audio.paused)return;
  const now=performance.now(),time=Number(audio.currentTime);
  if(!Number.isFinite(time))return;
  if(lastAudioTime!==null&&lastWallTime!==null){
   const step=time-lastAudioTime,wall=(now-lastWallTime)/1000;
   if(step>0&&step<=Math.max(1.25,wall+.35)&&step<4)
    addCoveredSegment(active,lastAudioTime,time);
  }
  lastAudioTime=time;lastWallTime=now;
 });
 audio.addEventListener('pause',()=>{lastAudioTime=null;lastWallTime=null;});
 audio.addEventListener('ended',()=>{
  if(active){
   finished.add(active);
   const kind=metricGenres[active];
   goal('ai_'+kind+'_50',{genre:active},true);
   goal('ai_'+kind+'_90',{genre:active},true);
   goal('ai_'+kind+'_complete',{genre:active},true);
   journey('ai_demo_complete',{section:'demos',genre:active,percent:100},false);
  }
  playing=false;render();
 });
 audio.addEventListener('error',()=>{
  if(!active)return;
  playing=false;errorText='Запись временно недоступна. Попробуйте ещё раз.';
  goal('ai_'+metricGenres[active]+'_error',{genre:active});
  render();
 });
 document.addEventListener('visibilitychange',()=>{
  if(document.hidden&&playing){playing=false;audio.pause();updatePlayState()}
 });
 window.addEventListener('pagehide',()=>{playing=false;audio.pause()});

 // The hero size is fixed by CSS using the stable small viewport unit (svh).
 // Never toggle layout classes on audio state changes or mobile chrome resize.
 render();
})();