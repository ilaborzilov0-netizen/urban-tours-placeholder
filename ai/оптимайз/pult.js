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
 const likedKey='predfinal_liked_genres';
 function likes(){
  try{const v=JSON.parse(sessionStorage.getItem(likedKey)||'[]');return new Set(Array.isArray(v)?v:[])}catch(_){return new Set()}
 }
 function fmt(n){const t=Math.max(0,Math.floor(n));return Math.floor(t/60)+':'+String(t%60).padStart(2,'0')}
 function playLabel(t){return active===t.id&&playing?'Пауза: '+t.name:'Слушать: '+t.name}
 function item(t){
  const isActive=active===t.id;
  const isLiked=likes().has(t.id);
  return '<div class="opt-line'+(isActive?' is-active':'')+'" data-demo-style="'+t.id+'">'
   +'<button class="opt-round" type="button" data-opt-play="'+t.id+'" aria-label="'+playLabel(t)+'" aria-pressed="'+(isActive&&playing)+'"><span aria-hidden="true">'+(isActive&&playing?'Ⅱ':'▶')+'</span></button>'
   +'<div class="opt-line-text"><strong>'+t.name+'</strong>'
   +'<span class="opt-line-caption" data-status="'+t.id+'">'+(isActive&&playing?'Сейчас играет':finished.has(t.id)?'Прослушано · '+Math.round(t.duration)+' сек.': 'Фрагмент · '+Math.round(t.duration)+' сек.')+'</span></div>'
   +'<button class="opt-like'+(isLiked?' is-liked':'')+'" type="button" data-opt-like="'+t.id+'" aria-pressed="'+isLiked+'" aria-label="'+(isLiked?'Убрать отметку «Нравится»: ':'Нравится звучание: ')+t.name+'"><span aria-hidden="true">'+(isLiked?'♥':'♡')+'</span><span>Нравится</span></button>'
   +'<div class="opt-trackbar" role="progressbar" aria-label="Прослушано: '+t.name+'" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" data-progress="'+t.id+'"><i></i></div>'
   +'</div>';
 }
 function render(){
  root.innerHTML='<div class="opt-overline"><strong>Послушайте, как звучат аудиоякоря</strong><span>3 коротких фрагмента на выбор</span></div>'
   +'<div class="opt-lines">'+tracks.map(item).join('')+'</div>'
   +'<p class="opt-tip">Нажмите ▶ для прослушивания. Отметьте ♥ то, что понравилось.</p>'
   +'<p class="opt-error" role="status"'+(errorText?'':' hidden')+'>'+errorText+'</p>';
  progress();
 }
 function progress(){
  tracks.forEach(t=>{
   const value=active===t.id?Math.min(100,100*(audio.currentTime||0)/t.duration):finished.has(t.id)?100:0;
   const bar=root.querySelector('[data-progress="'+t.id+'"]');
   if(bar){bar.setAttribute('aria-valuenow',String(Math.round(value)));bar.querySelector('i').style.width=value.toFixed(1)+'%'}
   const status=root.querySelector('[data-status="'+t.id+'"]');
   if(status&&active===t.id){
    status.textContent=playing?'Играет · '+fmt(audio.currentTime)+' / '+fmt(t.duration)
      :audio.currentTime>0&&!audio.ended?'Пауза · '+fmt(audio.currentTime)+' / '+fmt(t.duration)
      :finished.has(t.id)?'Прослушано · '+Math.round(t.duration)+' сек.':'Фрагмент · '+Math.round(t.duration)+' сек.';
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
 function toggleLike(id){
  if(!music[id])return;
  const nativeButton=document.querySelector('#sounds [data-favorite-genre="'+id+'"]');
  if(nativeButton){
   nativeButton.click(); // Keep the original page's favorite storage and logic.
  }else{
   const saved=likes();
   if(saved.has(id))saved.delete(id);else saved.add(id);
   try{sessionStorage.setItem(likedKey,JSON.stringify([...saved]))}catch(_){}
  }
  const b=root.querySelector('[data-opt-like="'+id+'"]'),yes=likes().has(id);
  if(b){
   b.classList.toggle('is-liked',yes);
   b.setAttribute('aria-pressed',String(yes));
   b.setAttribute('aria-label',(yes?'Убрать отметку «Нравится»: ':'Нравится звучание: ')+music[id].name);
   b.querySelector('span').textContent=yes?'♥':'♡';
  }
 }
 root.addEventListener('click',e=>{
  const b=e.target.closest('button');
  if(!b)return;
  if(b.dataset.optPlay)toggle(b.dataset.optPlay);
  else if(b.dataset.optLike)toggleLike(b.dataset.optLike);
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

 // Keep the three tracks in ONE card. Only adjust the vertical rhythm above it:
 // on the first mobile viewport, row 1 stays visible and row 2 starts below the fold.
 // No clipping, duplicate player or artificially divided card.
 let foldFrame=0;
 function scheduleFoldAlignment(){
  if(foldFrame)cancelAnimationFrame(foldFrame);
  foldFrame=requestAnimationFrame(()=>{foldFrame=0;alignFirstFold()});
 }
 function alignFirstFold(){
  if(!hero)return;
  const keys=['--fold-heading-gap','--fold-offer-gap','--fold-demo-gap'];
  keys.forEach(k=>hero.style.removeProperty(k));
  if(!matchMedia('(max-width:780px)').matches||window.scrollY>3)return;
  const first=root.querySelector('.opt-line:nth-child(1)');
  const second=root.querySelector('.opt-line:nth-child(2)');
  if(!first||!second)return;
  // Measure AFTER applying CSS minima (including hero CTA and review).
  const viewport=Math.max(1,window.visualViewport?.height||window.innerHeight);
  const firstBottom=first.getBoundingClientRect().bottom;
  const secondTop=second.getBoundingClientRect().top;
  // Never let the first sample disappear below the fold.
  const capacity=Math.max(0,viewport-firstBottom-9);
  // The next row should start immediately below the fold, without splitting the card.
  const required=Math.max(0,viewport+1-secondTop);
  const extra=Math.floor(Math.min(capacity,required,290));
  if(extra<3)return;
  const baseHeading=16,baseOffer=13,baseDemo=10;
  const headingAdd=Math.round(extra*.32);
  const offerAdd=Math.round(extra*.33);
  const demoAdd=extra-headingAdd-offerAdd;
  hero.style.setProperty('--fold-heading-gap',baseHeading+headingAdd+'px');
  hero.style.setProperty('--fold-offer-gap',baseOffer+offerAdd+'px');
  hero.style.setProperty('--fold-demo-gap',baseDemo+demoAdd+'px');
 }
 window.addEventListener('resize',scheduleFoldAlignment,{passive:true});
 window.addEventListener('orientationchange',scheduleFoldAlignment,{passive:true});
 if(document.fonts?.ready)document.fonts.ready.then(scheduleFoldAlignment);
 window.addEventListener('load',scheduleFoldAlignment,{once:true});
 render();
 scheduleFoldAlignment();
})();