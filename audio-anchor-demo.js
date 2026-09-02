/* owner:audio-anchor-inline-demo-0643
   Placeholder mode keeps the play control trackable but exits before expansion, playback or state changes.
   Remove data-audio-anchor-placeholder to restore the existing inline demo. */
(function(){
  'use strict';
  var root=document.querySelector('[data-audio-anchor-demo]');
  if(!root||root.dataset.audioAnchorReady)return;
  root.dataset.audioAnchorReady='1';
  var toggle=root.querySelector('[data-audio-anchor-toggle]');
  if(root.hasAttribute('data-audio-anchor-placeholder')){
    root.dataset.audioAnchorReady='placeholder';
    return;
  }
  var panel=root.querySelector('[data-audio-anchor-panel]');
  var audio=root.querySelector('[data-audio-anchor-audio]');
  var progress=root.querySelector('[data-audio-anchor-progress]');
  var current=root.querySelector('[data-audio-anchor-current]');
  var count=root.querySelector('[data-audio-anchor-count]');
  var time=root.querySelector('[data-audio-anchor-time]');
  var buttons=Array.prototype.slice.call(root.querySelectorAll('[data-audio-anchor-track]'));
  if(!toggle||!panel||!audio||!buttons.length)return;
  var tracks=[
    {title:'Утро',src:'./audio-anchor-morning.mp3'},
    {title:'Внутренний торг',src:'./audio-anchor-bargain.mp3'},
    {title:'Привычная ситуация',src:'./audio-anchor-trigger.mp3'}
  ];
  var index=0;
  var completed=false;
  function format(sec){
    sec=Math.max(0,Math.floor(Number(sec)||0));
    return Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0');
  }
  function setOpen(on){
    root.classList.toggle('is-open',on);
    panel.setAttribute('aria-hidden',on?'false':'true');
    toggle.setAttribute('aria-expanded',on?'true':'false');
  }
  function syncButton(){
    var playing=!audio.paused&&!audio.ended;
    root.classList.toggle('is-playing',playing);
    toggle.querySelector('i').textContent=playing?'❚❚':(completed?'↻':'▶');
    toggle.setAttribute('aria-label',playing?'Поставить аудиодемо на паузу':(completed?'Послушать три фрагмента ещё раз':'Послушать три фрагмента аудиоякорей'));
  }
  function setTrack(next,autoplay){
    index=Math.max(0,Math.min(tracks.length-1,next));
    completed=false;
    buttons.forEach(function(btn,i){btn.classList.toggle('is-active',i===index)});
    current.textContent=tracks[index].title;
    count.textContent=String(index+1).padStart(2,'0')+'/03';
    time.textContent='0:00';
    progress.style.width='0%';
    if(audio.getAttribute('src')!==tracks[index].src){
      audio.src=tracks[index].src;
      audio.load();
    }
    if(autoplay){
      var promise=audio.play();
      if(promise&&promise.catch)promise.catch(function(){syncButton()});
    }
    syncButton();
  }
  toggle.addEventListener('click',function(){
    setOpen(true);
    if(completed){setTrack(0,true);return;}
    if(!audio.getAttribute('src')){setTrack(index,true);return;}
    if(audio.paused){
      var p=audio.play();
      if(p&&p.catch)p.catch(function(){syncButton()});
    }else audio.pause();
    syncButton();
  });
  buttons.forEach(function(btn){
    btn.addEventListener('click',function(){
      setOpen(true);
      setTrack(Number(btn.getAttribute('data-audio-anchor-track'))||0,true);
    });
  });
  audio.addEventListener('play',syncButton);
  audio.addEventListener('pause',syncButton);
  audio.addEventListener('timeupdate',function(){
    var duration=Number(audio.duration)||8;
    var currentTime=Number(audio.currentTime)||0;
    time.textContent=format(currentTime);
    progress.style.width=Math.max(0,Math.min(100,(currentTime/duration)*100))+'%';
  });
  audio.addEventListener('ended',function(){
    if(index<tracks.length-1){setTrack(index+1,true);return;}
    completed=true;
    progress.style.width='100%';
    time.textContent='0:08';
    syncButton();
  });
  audio.addEventListener('error',function(){
    root.classList.remove('is-playing');
    toggle.querySelector('i').textContent='▶';
    toggle.setAttribute('aria-label','Не удалось воспроизвести фрагмент. Попробовать ещё раз');
  });
  syncButton();
})();
