(function(){
  'use strict';
  var stat=document.querySelector('[data-bz-solo-unfold]');
  if(!stat)return;
  if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    stat.style.setProperty('--solo-stat-p','1');
    stat.style.setProperty('--solo-stat-line-p','1');
    stat.classList.add('is-static');
    return;
  }

  var ticking=false;
  function clamp(v,min,max){return v<min?min:(v>max?max:v);}
  function update(){
    ticking=false;
    var rect=stat.getBoundingClientRect();
    var vh=window.innerHeight||document.documentElement.clientHeight||0;
    var start=vh*0.94;
    var end=vh*0.16;
    var p=clamp((start-rect.top)/(start-end),0,1);
    var line=clamp((p-0.58)/0.42,0,1);
    stat.style.setProperty('--solo-stat-p',p.toFixed(4));
    stat.style.setProperty('--solo-stat-line-p',line.toFixed(4));
  }
  function requestTick(){
    if(ticking)return;
    ticking=true;
    window.requestAnimationFrame(update);
  }
  window.addEventListener('scroll',requestTick,{passive:true});
  window.addEventListener('resize',requestTick,{passive:true});
  window.addEventListener('orientationchange',requestTick,{passive:true});
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',requestTick,{once:true});
  }
  requestTick();
})();
