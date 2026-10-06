/* owner:decision-turn-motion-0432 — terminal-hit playback preserved; pass may precede final hit */
(function(){
'use strict';
if(window.__BZDecisionTurnMotionOwner)return;
window.__BZDecisionTurnMotionOwner=true;

var doc=document;
var root=doc.getElementById('borzilov-lp');
if(!root)return;

var reducedQuery=matchMedia('(prefers-reduced-motion:reduce)');
var mobileQuery=matchMedia('(max-width:760px)');
var observer=null;
var started=false;
var settled=false;
var startTimer=0;
var settleTimer=0;
var activeAction=null;
var passShell=root.querySelector('[data-bz-pass-after-island]');
var passGuard=null;
var LOCKED_MS=1476;
var EDGE_TAIL_MS=326;
var TOTAL_MS=LOCKED_MS+EDGE_TAIL_MS;

function actions(){
  return Array.prototype.slice.call(doc.querySelectorAll('.bz-final-decision-host .bz1092-action, #bz1092-product-commercial-late .bz1092-action'));
}
function passPrecedesFinalHit(){
  if(!passShell)return false;
  var action=actions()[0];
  if(!action)return false;
  return !!(passShell.compareDocumentPosition(action)&Node.DOCUMENT_POSITION_FOLLOWING);
}
function setPassState(state){
  if(!passShell)return;
  /* 0432 architecture: the tariff now lives before the terminal hit. It must be
     visible on arrival, while the terminal hit keeps its own original playback. */
  if(state==='armed'&&passPrecedesFinalHit())state='revealed';
  passShell.setAttribute('data-bz-turn-pass-state',state);
}
function isRendered(action){
  if(!action)return false;
  var article=action.closest('.bz1092-object');
  if(article&&(article.hidden||article.getAttribute('aria-hidden')==='true'))return false;
  var style=getComputedStyle(action);
  if(style.display==='none'||style.visibility==='hidden')return false;
  var rect=action.getBoundingClientRect();
  return rect.width>0&&rect.height>0;
}
function clearTimers(){
  clearTimeout(startTimer);
  clearTimeout(settleTimer);
  startTimer=0;
  settleTimer=0;
}
function cancelImpactAnimations(action){
  if(!action)return;
  var move=action.querySelector('.bz1092-turn-word--move');
  if(!move)return;
  ['__bzTurnPaint','__bzTurnRecoil'].forEach(function(key){
    var animation=move[key];
    if(animation&&typeof animation.cancel==='function'){
      try{animation.cancel();}catch(error){}
    }
    move[key]=null;
  });
}
function finishImpact(action){
  if(!action)return;
  var move=action.querySelector('.bz1092-turn-word--move');
  if(move)move.style.setProperty('--bz-turn-impact-fill','100%');
  action.classList.remove('bz-turn-impact');
  action.classList.add('bz-turn-impact-finished');
  action.dataset.bzTurnImpactState='finished';
  cancelImpactAnimations(action);
}
function fireImpact(action){
  if(!action||action.classList.contains('bz-turn-impact')||action.classList.contains('bz-turn-impact-finished'))return;
  var move=action.querySelector('.bz1092-turn-word--move');
  if(!move)return;
  cancelImpactAnimations(action);
  move.style.setProperty('--bz-turn-impact-fill','0%');
  action.classList.add('bz-turn-impact');
  action.dataset.bzTurnImpactState='playing';
  if(typeof move.animate!=='function'){
    finishImpact(action);
    return;
  }
  var paint=move.animate([
    {'--bz-turn-impact-fill':'0%'},
    {'--bz-turn-impact-fill':'100%'}
  ],{duration:326,easing:'cubic-bezier(.16,.82,.16,1)',fill:'forwards'});
  /* Hero-parity recoil: the exact “Иначе” amplitude and curve, compressed only
     to the existing 326ms final-hit tail so the accepted scene timing stays intact. */
  var recoil=move.animate([
    {transform:'translateX(0) scaleX(1)',filter:'none',offset:0},
    {transform:'translateX(-5px) scaleX(.992)',filter:'brightness(1.16) blur(1.1px)',offset:.10},
    {transform:'translateX(1px) scaleX(1.002)',filter:'brightness(1.05) blur(.25px)',offset:.32},
    {transform:'translateX(-.5px) scaleX(.999)',filter:'none',offset:.58},
    {transform:'translateX(0) scaleX(1)',filter:'none',offset:1}
  ],{duration:320,easing:'cubic-bezier(.20,.78,.20,1)',fill:'none'});
  move.__bzTurnPaint=paint;
  move.__bzTurnRecoil=recoil;
  paint.onfinish=function(){finishImpact(action);};
  paint.oncancel=function(){if(move.__bzTurnPaint===paint)move.__bzTurnPaint=null;};
  recoil.onfinish=function(){
    try{recoil.cancel();}catch(error){}
    if(move.__bzTurnRecoil===recoil)move.__bzTurnRecoil=null;
  };
  setTimeout(function(){
    if(action.classList.contains('bz-turn-impact'))finishImpact(action);
  },340);
}
function releaseFloor(action){
  if(!action||action.classList.contains('bz-turn-floor-live'))return;
  action.classList.add('bz-turn-floor-live');
  action.dataset.bzTurnFloorRelease='dot-animationend';
  setPassState('revealing');
}
function settle(action){
  if(!action)return;
  var move=action.querySelector('.bz1092-turn-word--move');
  if(move)move.style.setProperty('--bz-turn-impact-fill','100%');
  cancelImpactAnimations(action);
  action.classList.remove('bz-turn-motion-armed','bz-turn-motion-pending','bz-turn-motion-playing','bz-turn-impact');
  action.classList.add('bz-turn-floor-live','bz-turn-impact-finished','bz-turn-motion-settled');
  action.dataset.bzTurnMotionState='settled';
  action.dataset.bzTurnImpactState='finished';
  setPassState('revealed');
}
function settleAll(){
  settled=true;
  clearTimers();
  if(observer){observer.disconnect();observer=null;}
  actions().forEach(settle);
}
function waitForFont(){
  if(!doc.fonts||!doc.fonts.load)return Promise.resolve();
  var timeout=new Promise(function(resolve){setTimeout(resolve,700);});
  var font=Promise.resolve(doc.fonts.load('860 80px Inter','ВАШ ХОД')).catch(function(){});
  return Promise.race([font,timeout]);
}
function checkExitFit(action){
  if(!action)return false;
  var prefix=action.querySelector('.bz1092-turn-exit-prefix');
  var move=action.querySelector('.bz1092-turn-word--move');
  var shell=action.closest('.bz1092-object');
  if(!prefix||!move||!shell)return false;
  action.classList.remove('bz-turn-exit-disabled');
  action.style.removeProperty('--bz-turn-exit-fit-scale');
  action.style.removeProperty('--bz-turn-cluster-shift-x');
  action.style.removeProperty('--bz-turn-cluster-fit-scale');
  var prefixRect=prefix.getBoundingClientRect();
  var moveRect=move.getBoundingClientRect();
  var shellRect=shell.getBoundingClientRect();
  var safeLeft=shellRect.left+10;
  /* 0091: do not horizontally squeeze “ВЫ”. It must keep the same glyph proportions
     as “ХОД”. Responsive fitting is applied to the complete lockup below. */
  var scale=1;
  var fits=prefixRect.width>0&&moveRect.width>0&&shellRect.width>0;
  action.style.setProperty('--bz-turn-exit-fit-scale','1');
  if(!fits)action.classList.add('bz-turn-exit-disabled');
  if(fits){
    var your=action.querySelector('.bz1092-turn-word--your');
    var dot=action.querySelector('.bz1092-turn-dot-piece');
    if(your&&dot){
      function visualBounds(){
        var rects=[
          your.getBoundingClientRect(),
          prefix.getBoundingClientRect(),
          move.getBoundingClientRect(),
          dot.getBoundingClientRect()
        ];
        return {
          left:Math.min.apply(null,rects.map(function(rect){return rect.left;})),
          right:Math.max.apply(null,rects.map(function(rect){return rect.right;}))
        };
      }
      var bounds=visualBounds();
      var visualWidth=Math.max(1,bounds.right-bounds.left);
      var shellWidth=Math.max(1,shellRect.width);
      var clusterFit=Math.min(1,(shellWidth-20)/visualWidth);
      if(clusterFit<.86){
        fits=false;
        action.classList.add('bz-turn-exit-disabled');
        action.style.removeProperty('--bz-turn-cluster-fit-scale');
      }else if(clusterFit<1){
        action.style.setProperty('--bz-turn-cluster-fit-scale',String(clusterFit));
        bounds=visualBounds();
      }
      if(fits){
        var shellCenter=(shellRect.left+shellRect.right)/2;
        var visualCenter=(bounds.left+bounds.right)/2;
        var wanted=shellCenter-visualCenter;
        var minShift=(shellRect.left+1)-bounds.left;
        var maxShift=(shellRect.right-1)-bounds.right;
        var shift=Math.max(minShift,Math.min(maxShift,wanted));
        action.style.setProperty('--bz-turn-cluster-shift-x',(Math.round(shift*100)/100)+'px');
        action.dataset.bzTurnClusterShift=String(Math.round(shift*100)/100);
        action.dataset.bzTurnClusterFit=String(Math.round(clusterFit*1000)/1000);
      }
    }
  }
  action.dataset.bzTurnExitFit=fits?'1':'0';
  action.dataset.bzTurnExitScale=fits?String(Math.round(scale*1000)/1000):'0';
  return fits;
}
function addPlaybackViewportGuard(action){
  var ticking=false;
  function cleanup(){
    removeEventListener('scroll',onMove);
    removeEventListener('resize',onMove);
  }
  function inspect(){
    ticking=false;
    if(settled||!started){cleanup();return;}
    var rect=action.getBoundingClientRect();
    var vh=window.visualViewport?window.visualViewport.height:innerHeight;
    if(rect.bottom<0||rect.top>vh){settleAll();cleanup();}
  }
  function onMove(){
    if(ticking)return;
    ticking=true;
    requestAnimationFrame(inspect);
  }
  addEventListener('scroll',onMove,{passive:true});
  addEventListener('resize',onMove,{passive:true});
  settleTimer=setTimeout(function(){cleanup();settle(action);settled=true;},TOTAL_MS);
}
function begin(action){
  if(!action||started||settled)return;
  started=true;
  setPassState('armed');
  activeAction=action;
  if(observer){observer.disconnect();observer=null;}
  actions().forEach(function(node){if(node!==action)settle(node);});
  action.classList.add('bz-turn-motion-pending');
  action.dataset.bzTurnMotionState='pending';
  waitForFont().then(function(){
    checkExitFit(action);
    if(reducedQuery.matches){settleAll();return;}
    startTimer=setTimeout(function(){
      if(!isRendered(action)){settleAll();return;}
      checkExitFit(action);
      action.classList.remove('bz-turn-motion-pending');
      action.classList.remove('bz-turn-floor-live');
      action.classList.add('bz-turn-motion-playing');
      action.dataset.bzTurnMotionState='playing';
      var dotPiece=action.querySelector('.bz1092-turn-dot-piece');
      if(dotPiece){
        dotPiece.addEventListener('animationend',function onDotEnd(event){
          if(event.animationName!=='bz-turn-dot-brake')return;
          dotPiece.removeEventListener('animationend',onDotEnd);
          /* Same causal contract as Hero: landing event starts both paint and recoil. */
          fireImpact(action);
          releaseFloor(action);
        });
      }
      setTimeout(function(){releaseFloor(action);},LOCKED_MS+24);
      addPlaybackViewportGuard(action);
    },180);
  });
}
function ensureObserver(){
  if(observer||started||settled)return;
  if(!('IntersectionObserver'in window))return;
  observer=new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting&&isRendered(entry.target))begin(entry.target);
    });
  },{root:null,rootMargin:'-45% 0px -45% 0px',threshold:0});
}
function arm(action){
  if(!action||action.dataset.bzTurnMotionPrepared==='1')return;
  action.dataset.bzTurnMotionPrepared='1';
  setPassState('armed');
  if(reducedQuery.matches||started||settled){settle(action);return;}
  action.classList.add('bz-turn-motion-armed');
  action.dataset.bzTurnMotionState='armed';
  ensureObserver();
  if(observer)observer.observe(action);
  else startTimer=setTimeout(function(){begin(action);},180);
}
function scan(){
  var rendered=actions().filter(isRendered);
  if(started||settled){rendered.forEach(settle);return;}
  rendered.forEach(arm);
}
function onReducedChange(){
  if(reducedQuery.matches)settleAll();
}
function onLayoutChange(){
  actions().filter(isRendered).forEach(checkExitFit);
  if(started){
    if(activeAction&&!isRendered(activeAction))settleAll();
    return;
  }
  requestAnimationFrame(scan);
}
function ensurePassGuard(){
  if(!passShell||passGuard||settled||!('IntersectionObserver'in window))return;
  /* Do not fast-forward a later terminal hit merely because the newly earlier
     tariff entered the viewport. */
  if(passPrecedesFinalHit()){setPassState('revealed');return;}
  passGuard=new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(!entry.isIntersecting||settled)return;
      if(!started){
        var action=actions().filter(isRendered)[0]||actions()[0];
        var rect=action&&action.getBoundingClientRect?action.getBoundingClientRect():null;
        var vh=window.visualViewport?window.visualViewport.height:innerHeight;
        /* Fast-forward only when the user has actually jumped past the final hit.
           If the hit is still in/near the viewport, keep the original choreography armed. */
        if(rect&&rect.bottom>=0&&rect.top<=vh)return;
        root.dataset.bzFinalSequenceState='skipped';
        settleAll();
      }
      if(passGuard){passGuard.disconnect();passGuard=null;}
    });
  },{root:null,rootMargin:'0px 0px 18% 0px',threshold:0});
  passGuard.observe(passShell);
}
function onFinalSequenceFastForward(event){
  var detail=event&&event.detail||{};
  if(detail.settleFinalHit===true){
    root.dataset.bzFinalSequenceState='skipped';
    settleAll();
  }
}
function init(){
  /* 0591: the decorative terminal hit was removed. With no action owner in DOM,
     the tariff must not remain armed/hidden waiting for a scene that no longer exists. */
  if(actions().length===0){
    setPassState('revealed');
    return;
  }
  setPassState(root.dataset.bzFinalSequenceState==='skipped'?'revealed':'armed');
  ensurePassGuard();
  doc.addEventListener('bz:final-sequence-fast-forward',onFinalSequenceFastForward);
  if(root.dataset.bzFinalSequenceState==='skipped')settleAll();
  else scan();
  window.addEventListener('bz:priority-island-ready',scan);
  window.addEventListener('bz:deferred-dom-ready',scan);
  window.addEventListener('pageshow',scan,{passive:true});
  window.addEventListener('orientationchange',onLayoutChange,{passive:true});
  window.addEventListener('resize',onLayoutChange,{passive:true});
  if(mobileQuery.addEventListener)mobileQuery.addEventListener('change',onLayoutChange);
  else if(mobileQuery.addListener)mobileQuery.addListener(onLayoutChange);
  if(reducedQuery.addEventListener)reducedQuery.addEventListener('change',onReducedChange);
  else if(reducedQuery.addListener)reducedQuery.addListener(onReducedChange);
}

if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
