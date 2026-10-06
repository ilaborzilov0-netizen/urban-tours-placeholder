(function(){
  'use strict';
  var clock=document.querySelector('[data-bz-now-clock]');
  if(!clock)return;
  var timer=0;
  function pad(value){return String(value).padStart(2,'0');}
  function render(){
    var now=new Date();
    var value=pad(now.getHours())+':'+pad(now.getMinutes());
    if(clock.textContent!==value)clock.textContent=value;
    clock.setAttribute('datetime',pad(now.getHours())+':'+pad(now.getMinutes()));
    clock.setAttribute('aria-label','Сейчас '+pad(now.getHours())+' '+pad(now.getMinutes()));
    clearTimeout(timer);
    timer=setTimeout(render,Math.max(1000,60000-(now.getSeconds()*1000+now.getMilliseconds())+40));
  }
  render();
  document.addEventListener('visibilitychange',function(){if(!document.hidden)render();});
})();
