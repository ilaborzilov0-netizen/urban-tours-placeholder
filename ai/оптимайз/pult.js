/* Five first-screen demo-player concepts for /ai/оптимайз/ only. */
(function () {
 'use strict';
 const root=document.getElementById('opt-demo');
 if(!root)return;
 const tracks={
  author:{name:'Под гитару',short:'Гитара',duration:38,src:'https://d2ol7oe51mr4n9.cloudfront.net/user_3KrouuquIhgLmM3Dgm3GoNReITb/ed83f511-977e-4fe7-840c-e8ff1222c3a2.mp3'},
  estrada:{name:'Душевная эстрада',short:'Эстрада',duration:34,src:'https://d2ol7oe51mr4n9.cloudfront.net/user_3KrouuquIhgLmM3Dgm3GoNReITb/40afffa9-c314-45d7-9052-15ecd65cc48c.mp3'},
  modern:{name:'Современное звучание',short:'Современное',duration:33,src:'https://d2ol7oe51mr4n9.cloudfront.net/user_3KrouuquIhgLmM3Dgm3GoNReITb/2c4c9344-789f-442a-9311-ad9daf6211a2.mp3'}
 };
 const ids=Object.keys(tracks);
 const concepts=['Три строки','Один плеер','Три кнопки','Радиопульт','Мини-плейлист'];
 const urlMode=Number(new URLSearchParams(location.search).get('v'));
 let mode=urlMode>=1&&urlMode<=5?urlMode:1;
 let current='author',playing=false,ended=false;
 const audio=new Audio();
 audio.preload='none';
 const storageKey='predfinal_liked_genres';
 function favorites(){
  try{const a=JSON.parse(sessionStorage.getItem(storageKey)||'[]');return new Set(Array.isArray(a)?a:[]);}catch(_){return new Set();}
 }
 function liked(id){return favorites().has(id);}
 function likeButton(id,compact){
  return '<button type="button" class="opt-like'+(liked(id)?' is-liked':'')+'" data-opt-like="'+id+'" aria-pressed="'+liked(id)+'" aria-label="'+(liked(id)?'Убрать отметку «Нравится»: ':'Мне нравится: ')+tracks[id].name+'" title="Мне нравится">'+(compact?'♥':('<span aria-hidden="true">♥</span><span>Нравится</span>'))+'</button>';
 }
 function playButton(id,cls,label){
  return '<button type="button" class="'+cls+'" data-opt-play="'+id+'" aria-label="'+(playing&&current===id?'Пауза':'Воспроизвести')+': '+tracks[id].name+'"><span aria-hidden="true">'+(playing&&current===id?'Ⅱ':'▶')+'</span>'+(label?'<span>'+label+'</span>':'')+'</button>';
 }
 function line(id,i){
  return '<div class="opt-line'+(current===id?' is-active':'')+'">'
   +playButton(id,'opt-round','')
   +'<div class="opt-line-text"><strong>'+tracks[id].name+'</strong><small>'+tracks[id].duration+' сек. · демо</small></div>'
   +likeButton(id,true)
   +'<div class="opt-trackbar"><i data-opt-bar="'+id+'"></i></div>'
   +'</div>';
 }
 function tab(id){return '<button type="button" data-opt-choose="'+id+'" class="opt-tab'+(current===id?' is-active':'')+'" aria-pressed="'+(current===id)+'">'+tracks[id].short+'</button>';}
 function transport(){
  return '<div class="opt-transport">'+playButton(current,'opt-primary',(playing?'Пауза':'Слушать · '+tracks[current].duration+' сек.'))
   +likeButton(current,false)+'</div><div class="opt-time"><span data-opt-status>Демо без перемотки</span><span data-opt-clock>0:'+String(tracks[current].duration).padStart(2,'0')+'</span></div>'
   +'<div class="opt-mainbar"><i data-opt-bar="'+current+'"></i></div>';
 }
 function render(){
  root.dataset.mode=String(mode);
  const buttons=concepts.map((c,i)=>'<button type="button" data-opt-mode="'+(i+1)+'" aria-pressed="'+(mode===i+1)+'" aria-label="Вариант '+(i+1)+': '+c+'">'+(i+1)+'</button>').join('');
  let content='';
  if(mode===1){
   content='<div class="opt-lines">'+ids.map(line).join('')+'</div>';
  }else if(mode===2){
   content='<div class="opt-tabs">'+ids.map(tab).join('')+'</div>'+transport();
  }else if(mode===3){
   content='<div class="opt-tiles">'+ids.map(id=>'<div class="opt-tile'+(current===id?' is-active':'')+'">'
    +playButton(id,'opt-round','')+'<strong>'+tracks[id].short+'</strong>'+likeButton(id,true)
    +'<div class="opt-trackbar"><i data-opt-bar="'+id+'"></i></div></div>').join('')+'</div>';
  }else if(mode===4){
   content='<div class="opt-radio">'+ids.map((id,i)=>'<button type="button" data-opt-choose="'+id+'" class="opt-radio-choice'+(current===id?' is-active':'')+'" aria-pressed="'+(current===id)+'"><span class="opt-dial">'+(i+1)+'</span><span>'+tracks[id].name+'</span><span class="opt-choice-arrow">›</span></button>').join('')+'</div>'+transport();
  }else{
   content='<div class="opt-playlist">'+ids.map((id,i)=>'<div class="opt-playitem'+(current===id?' is-active':'')+'"><span class="opt-playitem-n">'+(i+1)+'.</span>'+playButton(id,'opt-tiny-play','')
    +'<strong>'+tracks[id].name+'</strong>'+likeButton(id,true)+'</div>').join('')+'</div>'
    +'<div class="opt-dock"><div><span>Сейчас выбрано</span><strong>'+tracks[current].name+'</strong></div>'+playButton(current,'opt-dock-play','')+'</div>'
    +'<div class="opt-mainbar"><i data-opt-bar="'+current+'"></i></div>';
  }
  root.innerHTML='<div class="opt-overline"><strong>Послушайте, как звучат аудиоякоря</strong><span>3 фрагмента по 30–40 сек.</span></div>'
  +'<div class="opt-concept"><span>Вариант пульта: <b>'+concepts[mode-1]+'</b></span><div class="opt-switch" aria-label="Пять вариантов оформления">'+buttons+'</div></div>'
  +'<div class="opt-content">'+content+'</div>'
  +'<p class="opt-tip">Нажмите ▶, чтобы послушать. ♥ — если понравилось.</p>';
  refresh();
 }
 function refresh(){
  const elapsed=current?Math.max(0,audio.currentTime||0):0;
  root.querySelectorAll('[data-opt-bar]').forEach(e=>{
   const id=e.dataset.optBar;
   const value=id===current?Math.max(0,Math.min(100,elapsed/tracks[id].duration*100)):0;
   e.style.width=value.toFixed(1)+'%';
  });
  root.querySelectorAll('[data-opt-clock]').forEach(e=>{const rest=Math.max(0,Math.ceil(tracks[current].duration-elapsed));e.textContent='Осталось 0:'+String(rest).padStart(2,'0');});
  root.querySelectorAll('[data-opt-status]').forEach(e=>{e.textContent=playing?'Сейчас играет':ended?'Фрагмент прослушан':'Без перемотки';});
 }
 function choose(id){
  if(!tracks[id])return;
  audio.pause(); playing=false;ended=false;current=id;
  audio.src=tracks[id].src;audio.load();render();
 }
 function play(id){
  if(!tracks[id])return;
  if(id===current&&playing){audio.pause();playing=false;render();return;}
  if(id!==current || !audio.src || ended){
   audio.pause();current=id;audio.src=tracks[id].src;audio.load();ended=false;
  }
  playing=true;render();
  const promise=audio.play();
  if(promise&&promise.catch)promise.catch(()=>{playing=false;render();});
 }
 audio.addEventListener('timeupdate',refresh);
 audio.addEventListener('ended',()=>{playing=false;ended=true;render();});
 audio.addEventListener('pause',()=>{if(!audio.ended&&playing){playing=false;render();}});
 root.addEventListener('click',e=>{
  const button=e.target.closest('button');
  if(!button)return;
  if(button.dataset.optMode){
   mode=Number(button.dataset.optMode);
   const u=new URL(location.href);u.searchParams.set('v',String(mode));
   history.replaceState(null,'',u.pathname+u.search+u.hash);
   render();return;
  }
  if(button.dataset.optChoose){choose(button.dataset.optChoose);return;}
  if(button.dataset.optPlay){play(button.dataset.optPlay);return;}
  if(button.dataset.optLike){
   const id=button.dataset.optLike;
   const real=document.querySelector('#sounds .sound-favorite[data-favorite-genre="'+id+'"]');
   if(real) real.click();
   else{
    const likes=favorites();
    if(likes.has(id))likes.delete(id);else likes.add(id);
    try{sessionStorage.setItem(storageKey,JSON.stringify([...likes]));}catch(_){}
   }
   render();
  }
 });
 window.addEventListener('pagehide',()=>audio.pause());
 render();
})();