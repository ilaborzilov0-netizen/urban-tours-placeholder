/* /ai/оптимайз/: production candidate — compact three-row demo player. */
(()=>{'use strict';
 const root=document.getElementById('opt-demo');
 if(!root)return;
 const hero=root.closest('.ai-test-hero');
 const tracks=[
  {id:'author',name:'Под гитару',duration:37.6,src:'https://d2ol7oe51mr4n9.cloudfront.net/user_3KrouuquIhgLmM3Dgm3GoNReITb/ed83f511-977e-4fe7-840c-e8ff1222c3a2.mp3'},
  {id:'estrada',name:'Душевная эстрада',duration:34.12,src:'https://d2ol7oe51mr4n9.cloudfront.net/user_3KrouuquIhgLmM3Dgm3GoNReITb/40afffa9-c314-45d7-9052-15ecd65cc48c.mp3'},
  {id:'modern',name:'Современное звучание',duration:32.94,src:'https://d2ol7oe51mr4n9.cloudfront.net/user_3KrouuquIhgLmM3Dgm3GoNReITb/2c4c9344-789f-442a-9311-ad9daf6211a2.mp3'}
 ];
 const music=Object.fromEntries(tracks.map(t=>[t.id,t]));
 const audio=new Audio();
 audio.preload='none';
 let active=null,playing=false,finished=new Set(),request=0,errorText='';
 function listenedPercent(t){
  if(active===t.id){
   const value=Math.round(100*Math.max(0,Math.min(audio.currentTime||0,t.duration))/t.duration);
   return audio.ended?100:value;
  }
  return finished.has(t.id)?100:0;
 }
 function playLabel(t){return active===t.id&&playing?'Пауза: '+t.name:'Слушать: '+t.name}
 function item(t){
  const isActive=active===t.id;
  return '<div class="opt-line'+(isActive?' is-active':'')+'" data-demo-style="'+t.id+'">'
   +'<button class="opt-round" type="button" data-opt-play="'+t.id+'" aria-label="'+playLabel(t)+'" aria-pressed="'+(isActive&&playing)+'"><span aria-hidden="true">'+(isActive&&playing?'Ⅱ':'▶')+'</span></button>'
   +'<div class="opt-line-text"><strong>'+t.name+'</strong>'
   +'<span class="opt-line-caption" data-status="'+t.id+'">'+(finished.has(t.id)?'Прослушано · 100%':'Прослушано · '+listenedPercent(t)+'%')+'</span></div>'
   +'<div class="opt-trackbar" role="progressbar" aria-label="Прослушано: '+t.name+'" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" data-progress="'+t.id+'"><i></i></div>'
   +'</div>';
 }
 function render(){
  root.innerHTML='<div class="opt-overline"><strong>Послушайте аудиоякоря</strong><span>Три звучания на выбор</span></div>'
   +'<div class="opt-lines">'+tracks.map(item).join('')+'</div>'
   +'<p class="opt-error" role="status"'+(errorText?'':' hidden')+'>'+errorText+'</p>';
  progress();
  scheduleFit();
 }
 function progress(){
  tracks.forEach(t=>{
   const value=listenedPercent(t);
   const bar=root.querySelector('[data-progress="'+t.id+'"]');
   if(bar){bar.setAttribute('aria-valuenow',String(Math.round(value)));bar.querySelector('i').style.width=value.toFixed(1)+'%'}
   const status=root.querySelector('[data-status="'+t.id+'"]');
   if(status){
    const prefix=active===t.id&&playing?'Играет':active===t.id&&audio.currentTime>0&&!audio.ended?'Пауза':'Прослушано';
    status.textContent=prefix+' · '+value+'%';
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
 audio.addEventListener('timeupdate',progress);
 audio.addEventListener('ended',()=>{
  if(active)finished.add(active);
  playing=false;render();
 });
 audio.addEventListener('error',()=>{
  if(!active)return;
  playing=false;errorText='Запись временно недоступна. Попробуйте ещё раз.';
  render();
 });
 document.addEventListener('visibilitychange',()=>{
  if(document.hidden&&playing){playing=false;audio.pause();updatePlayState()}
 });
 window.addEventListener('pagehide',()=>{playing=false;audio.pause()});

 // The first-screen panel is a complete viewport-height layout.
 // On unusually short displays, soften nonessential gaps while preserving
 // 44px tap targets and scroll access.
 let fitFrame=0;
 function scheduleFit(){
  if(fitFrame)cancelAnimationFrame(fitFrame);
  fitFrame=requestAnimationFrame(()=>{
   fitFrame=0;
   if(!hero)return;
   hero.classList.remove('hero-compact-height');
   if(!matchMedia('(max-width:780px)').matches)return;
   const viewport=window.visualViewport?.height||window.innerHeight;
   if(hero.scrollHeight>viewport+3)hero.classList.add('hero-compact-height');
  });
 }
 window.addEventListener('resize',scheduleFit,{passive:true});
 window.addEventListener('orientationchange',scheduleFit,{passive:true});
 window.visualViewport?.addEventListener('resize',scheduleFit,{passive:true});
 if(document.fonts?.ready)document.fonts.ready.then(scheduleFit);
 window.addEventListener('load',scheduleFit,{once:true});
 render();
})();