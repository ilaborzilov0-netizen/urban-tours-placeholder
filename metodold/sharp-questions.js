(function(){
'use strict';

var interactionLearned=false;
var naturalDemoShown=false;
var demoPhase='idle';
var demoCard=null;
var demoTimers=[];
var observer=null;
var observerTarget=null;
var visibilityHoldTimer=0;
var scrollSettled=true;
var scrollSettleTimer=0;
var mmMobile=window.matchMedia&&window.matchMedia('(max-width:760px)');
var mmReduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)');
var OPEN_MS=890;
var CLOSE_MS=820;
var ANSWER_HOLD_MS=1000;

function clearTimer(id){if(id)clearTimeout(id);}
function clearDemoTimers(){demoTimers.forEach(clearTimeout);demoTimers=[];clearTimer(visibilityHoldTimer);visibilityHoldTimer=0;}
function later(fn,ms){var id=setTimeout(fn,ms);demoTimers.push(id);return id;}
function isMobile(){return !!(mmMobile&&mmMobile.matches);}
function isReduced(){return !!(mmReduce&&mmReduce.matches);}

function visibleRatio(node){
  if(!node)return 0;
  var rect=node.getBoundingClientRect();
  var vh=window.innerHeight||document.documentElement.clientHeight||0;
  var visible=Math.max(0,Math.min(rect.bottom,vh)-Math.max(rect.top,0));
  return rect.height>0?Math.min(1,visible/rect.height):0;
}

function canStartNaturalDemo(card){
  return !!(card&&!naturalDemoShown&&!interactionLearned&&isMobile()&&!isReduced()&&scrollSettled&&document.visibilityState==='visible'&&visibleRatio(card)>=.7);
}

function armNaturalDemo(card){
  clearTimer(visibilityHoldTimer);
  visibilityHoldTimer=0;
  if(!canStartNaturalDemo(card))return;
  visibilityHoldTimer=setTimeout(function(){
    visibilityHoldTimer=0;
    if(canStartNaturalDemo(card))runNaturalDemo();
  },500);
}

function mountSection(){
  var section=document.querySelector('[data-bz-final-decision-host="0339"] [data-bz-sharp-questions]')||document.querySelector('[data-bz-sharp-questions]');
  if(section)section.setAttribute('data-bz-sharp-flip-variant','v1');
  return section;
}

function question(card){
  var node=card.querySelector('.bz-sharp-flip-card__front strong');
  return node?node.textContent.trim():'';
}

function setAria(card,open){
  card.setAttribute('aria-pressed',open?'true':'false');
  card.setAttribute('aria-expanded',open?'true':'false');
  card.setAttribute('aria-label',(open?'Вернуть вопрос: ':'Открыть ответ на вопрос: ')+question(card));
}

function makeEdge(className){
  var edge=document.createElement('span');
  edge.className='bz-sharp-flip-card__edge '+className;
  edge.setAttribute('aria-hidden','true');
  return edge;
}

function prepareCards(scope){
  (scope||document).querySelectorAll('.bz-sharp-flip-card').forEach(function(card){
    if(card.dataset.bzSharpPrepared==='1')return;
    var inner=card.querySelector('.bz-sharp-flip-card__inner');
    if(inner&&!inner.querySelector('.bz-sharp-flip-card__edge')){
      inner.appendChild(makeEdge('bz-sharp-flip-card__edge--left'));
      inner.appendChild(makeEdge('bz-sharp-flip-card__edge--right'));
      inner.appendChild(makeEdge('bz-sharp-flip-card__edge--top'));
      inner.appendChild(makeEdge('bz-sharp-flip-card__edge--bottom'));
    }
    card.dataset.bzSharpPrepared='1';
    setAria(card,card.classList.contains('is-flipped'));
  });
}

function finishAnimation(card,ms){
  clearTimer(Number(card.dataset.bzSharpFinishTimer||0));
  var id=setTimeout(function(){
    card.classList.remove('is-animating','is-pressing');
    card.style.willChange='';
    card.removeAttribute('data-bz-sharp-finish-timer');
  },ms+120);
  card.dataset.bzSharpFinishTimer=String(id);
}

function setState(card,open,options){
  options=options||{};
  if(!card)return;
  card.classList.add('is-animating');
  card.style.willChange='transform';
  card.classList.toggle('is-flipped',open);
  setAria(card,open);
  finishAnimation(card,open?OPEN_MS:CLOSE_MS);
  if(options.phase)demoPhase=options.phase;
}

function closeOthers(active){
  var section=active&&active.closest('[data-bz-sharp-questions]');
  if(!section)return;
  section.querySelectorAll('.bz-sharp-flip-card.is-flipped').forEach(function(card){
    if(card!==active)setState(card,false);
  });
}

function stopAutoDemo(options){
  options=options||{};
  clearDemoTimers();
  if(demoCard&&options.closeFirst&&demoCard.classList.contains('is-flipped'))setState(demoCard,false);
  demoPhase='idle';
  demoCard=null;
}

function resetCards(){
  stopAutoDemo();
  document.querySelectorAll('.bz-sharp-flip-card').forEach(function(card){
    clearTimer(Number(card.dataset.bzSharpFinishTimer||0));
    card.removeAttribute('data-bz-sharp-finish-timer');
    card.classList.remove('is-flipped','is-animating','is-pressing');
    card.style.willChange='';
    setAria(card,false);
  });
}

function runNaturalDemo(){
  var section=mountSection();
  var card=section&&section.querySelector('[data-bz-sharp-card-index="0"]');
  if(!card||naturalDemoShown||interactionLearned||!isMobile()||isReduced()||document.visibilityState!=='visible')return;
  naturalDemoShown=true;
  demoCard=card;
  demoPhase='opening';
  setState(card,true,{phase:'opening'});
  later(function(){
    if(!demoCard||interactionLearned)return;
    demoPhase='holding';
  },OPEN_MS);
  later(function(){
    if(!demoCard||interactionLearned)return;
    demoPhase='closing';
    setState(card,false,{phase:'closing'});
  },OPEN_MS+ANSWER_HOLD_MS);
  later(function(){
    if(!demoCard||interactionLearned)return;
    demoPhase='idle';
    demoCard=null;
  },OPEN_MS+ANSWER_HOLD_MS+CLOSE_MS+140);
}

function handleCardActivation(card){
  interactionLearned=true;
  var isDemoCard=card===demoCard;
  var phase=demoPhase;
  clearDemoTimers();

  if(isDemoCard&&(phase==='opening'||phase==='holding')){
    demoPhase='idle';
    demoCard=null;
    if(!card.classList.contains('is-flipped'))setState(card,true);
    return;
  }

  if(isDemoCard&&phase==='closing'){
    demoPhase='idle';
    demoCard=null;
    setState(card,true);
    return;
  }

  if(demoCard&&card!==demoCard){
    var oldDemo=demoCard;
    demoPhase='idle';
    demoCard=null;
    if(oldDemo.classList.contains('is-flipped'))setState(oldDemo,false);
  }

  var open=!card.classList.contains('is-flipped');
  card.classList.add('is-pressing');
  if(open)closeOthers(card);
  later(function(){setState(card,open);},80);
}

function observeNaturalDemo(){
  var section=mountSection();
  var card=section&&section.querySelector('[data-bz-sharp-card-index="0"]');
  if(!card||!('IntersectionObserver' in window))return;
  if(observer&&observerTarget===card)return;
  if(observer)observer.disconnect();
  observerTarget=card;
  observer=new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.target!==card)return;
      clearTimer(visibilityHoldTimer);
      visibilityHoldTimer=0;
      if(entry.intersectionRatio<.7)return;
      armNaturalDemo(card);
    });
  },{threshold:[0,.7,1]});
  observer.observe(card);
}

function init(){
  var section=mountSection();
  if(!section)return;
  prepareCards(section);
  observeNaturalDemo();
}

document.addEventListener('pointerdown',function(event){
  var card=event.target.closest&&event.target.closest('[data-bz-sharp-questions] .bz-sharp-flip-card');
  if(card)card.classList.add('is-pressing');
},{passive:true});

document.addEventListener('click',function(event){
  var card=event.target.closest&&event.target.closest('[data-bz-sharp-questions] .bz-sharp-flip-card');
  if(!card)return;
  event.preventDefault();
  handleCardActivation(card);
});

window.addEventListener('scroll',function(){
  scrollSettled=false;
  clearTimer(scrollSettleTimer);
  clearTimer(visibilityHoldTimer);
  visibilityHoldTimer=0;
  scrollSettleTimer=setTimeout(function(){
    scrollSettled=true;
    var section=mountSection();
    var card=section&&section.querySelector('[data-bz-sharp-card-index="0"]');
    armNaturalDemo(card);
  },180);
},{passive:true});

document.addEventListener('visibilitychange',function(){
  if(document.hidden){
    clearDemoTimers();
    if(demoCard&&demoPhase!=='idle'){
      setState(demoCard,false);
      demoCard=null;
      demoPhase='idle';
    }
  }
});

function remount(){
  requestAnimationFrame(function(){
    var section=mountSection();
    if(section)prepareCards(section);
    observeNaturalDemo();
  });
}

window.addEventListener('bz:priority-island-ready',init);
window.addEventListener('pageshow',remount);
if(mmMobile){
  var onBreakpoint=function(){
    stopAutoDemo({closeFirst:true});
    resetCards();
    remount();
  };
  if(mmMobile.addEventListener)mmMobile.addEventListener('change',onBreakpoint);
  else mmMobile.addListener(onBreakpoint);
}
if(mmReduce){
  var onReduced=function(){
    if(isReduced())stopAutoDemo({closeFirst:true});
  };
  if(mmReduce.addEventListener)mmReduce.addEventListener('change',onReduced);
  else mmReduce.addListener(onReduced);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();
