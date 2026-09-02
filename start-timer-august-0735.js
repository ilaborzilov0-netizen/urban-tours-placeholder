/* owner:start-timer-august-0735
   Production countdown locked to accepted lab variant 01.
   Target: Sunday 30.08.2026, 12:00 Europe/Moscow = 09:00 UTC.
*/
(function(){
  'use strict';
  if(window.__BZStartTimerAugust0735)return;
  window.__BZStartTimerAugust0735=true;

  var root=document.getElementById('borzilov-lp');
  if(!root)return;

  var TARGET_ISO='2026-08-30T12:00:00+03:00';
  var TARGET_MS=Date.parse(TARGET_ISO);
  var lastSecond=-1;

  function pad(n){return String(Math.max(0,n|0)).padStart(2,'0');}
  function pluralDays(n){var v=Math.abs(n)%100,last=v%10;if(v>10&&v<20)return'дней';if(last===1)return'день';if(last>1&&last<5)return'дня';return'дней';}
  function parts(now){
    var left=Math.max(0,TARGET_MS-(now||Date.now()));
    var totalSeconds=Math.floor(left/1000);
    return{expired:left<=0,totalSeconds:totalSeconds,days:Math.floor(totalSeconds/86400),hours:Math.floor((totalSeconds%86400)/3600),minutes:Math.floor((totalSeconds%3600)/60),seconds:totalSeconds%60};
  }
  function timerHtml(p){
    if(p.expired)return'<span>СТАРТ</span>';
    return'<span>'+pad(p.hours)+':'+pad(p.minutes)+':<span class="seconds">'+pad(p.seconds)+'</span></span>';
  }
  function directChild(host,tag){
    var kids=host&&host.children?host.children:[];tag=String(tag||'').toUpperCase();
    for(var i=0;i<kids.length;i++)if(kids[i].tagName===tag)return kids[i];
    return null;
  }
  function renderTemporalBento(p){
    document.querySelectorAll('.bz-solution-bento__start.bz1092-start').forEach(function(host){
      if(host.hasAttribute('data-bz-donor86-start'))return;
      var label=directChild(host,'SPAN'),meta=directChild(host,'STRONG'),note=directChild(host,'SMALL');
      host.setAttribute('data-bz-start-fixed','0730');
      if(!label)return;
      label.classList.add('bz-start-bento-live-label');
      label.setAttribute('data-bz-start-live-owned','0735');
      label.setAttribute('aria-label',p.expired?'Старт сейчас':'До старта — '+p.days+' '+pluralDays(p.days));
      label.innerHTML=p.expired
        ?'<span class="bz-start-bento-prefix">Старт —</span><b class="bz-start-bento-days">сейчас</b>'
        :'<span class="bz-start-bento-prefix">До старта —</span><b class="bz-start-bento-days">'+p.days+' '+pluralDays(p.days)+'</b><span class="bz-start-bento-live-timer" data-bz-start-bento-live-timer>'+timerHtml(p)+'</span>';
      if(meta){
        meta.classList.add('bz-start-bento-meta');
        meta.innerHTML='<span class="bz-start-bento-when">Воскресенье · 12:00</span><span class="bz-start-bento-date">30 августа · МСК</span>';
      }
      if(note)note.classList.add('bz-solution-bento__start-note');
    });
  }
  function mountDeadline(deadline){
    if(!deadline)return null;
    var meta=deadline.querySelector('.bz-start-live-meta'),timer=deadline.querySelector('[data-bz-start-live-timer]');
    if(!meta||!timer){
      deadline.textContent='';deadline.setAttribute('data-bz-start-live','');
      meta=document.createElement('span');meta.className='bz-start-live-meta';
      timer=document.createElement('span');timer.className='bz-start-live-timer';timer.setAttribute('data-bz-start-live-timer','');timer.setAttribute('aria-label','До старта');
      deadline.append(meta,timer);
    }
    return{meta:meta,timer:timer};
  }
  function renderPricingDeadline(p){
    var metaText=p.expired?'сейчас':'через '+p.days+' '+pluralDays(p.days);
    document.querySelectorAll('[data-pricing-register-start-deadline]').forEach(function(deadline){
      var nodes=mountDeadline(deadline);if(!nodes)return;
      nodes.meta.textContent=metaText;nodes.timer.innerHTML=timerHtml(p);deadline.hidden=false;
    });
  }
  function normalizeStaticStartCopy(){
    document.querySelectorAll('.bz-start-tag,.bz244-start-floating').forEach(function(el){
      var text=el.textContent||'';el.textContent='Старт 30 августа';
      var aria=el.getAttribute('aria-label')||'';el.setAttribute('aria-label','Старт 30 августа');
    });
  }
  function render(now){
    var p=parts(now);root.setAttribute('data-bz-start-timer-target',TARGET_ISO);root.setAttribute('data-bz-start-timer-owner','0735');root.setAttribute('data-bz-start-timer-treatment','fixed-layout-01-muted-right');
    renderTemporalBento(p);renderPricingDeadline(p);lastSecond=p.totalSeconds;
  }
  function tick(){var p=parts(Date.now());if(p.totalSeconds!==lastSecond)render(Date.now());}

  normalizeStaticStartCopy();render(Date.now());window.setInterval(tick,250);
  addEventListener('pageshow',function(){render(Date.now());});
  document.addEventListener('visibilitychange',function(){if(!document.hidden)render(Date.now());});
  window.addEventListener('bz:flow-calendar-updated',function(){setTimeout(function(){render(Date.now());},0);});
})();
