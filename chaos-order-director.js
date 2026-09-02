/* owner:0677-chaos-order-director
   Invisible motion score for the long third route: chaos -> order.
   The score decays from asymmetric editorial reveals to almost-static structure.
   Signature local scenes retain their own animation owners. */
(function(){
  'use strict';
  if(window.__BZChaosOrderDirector0677)return;
  window.__BZChaosOrderDirector0677=true;

  var root=document.getElementById('borzilov-lp');
  if(!root)return;
  var reduced=window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduced)return;

  document.documentElement.classList.add('bz-chaos-order-motion');

  function one(selector){return root.querySelector(selector)}
  function all(selector){return [].slice.call(root.querySelectorAll(selector))}
  function clamp(v,min,max){return Math.max(min,Math.min(max,v))}

  /* Intensity is semantic rather than a blind page-progress curve.
     x/y values deliberately decay until chapter 03 is practically a straight vertical settle. */
  var score=[
    /* 2026 / noise: keep impact itself static; only surrounding copy has mild asynchronous drift. */
    {sel:'#bz-author-poster-second-screen .bz-author-poster__mast', x:-6,y:7,blur:.18,scale:.998,dur:600,delay:0},
    {sel:'#methods-field-title', x:8,y:6,blur:.16,scale:.998,dur:620,delay:55},

    /* SOLO: long quiet editorial passage. */
    {sel:'#bz-d10 .bz-spine-solo > div:first-child', x:-9,y:9,blur:.12,scale:.998,dur:600,delay:0},
    {sel:'#bz-d10 .bz-spine-solo__setup', x:7,y:8,blur:.08,scale:.998,dur:590,delay:64},
    {sel:'#bz-d10 .bz-spine-solo__copy', x:-5,y:7,blur:0,scale:.999,dur:570,delay:112},
    {sel:'#bz-d10 .bz-spine-solo__stat', x:4,y:8,blur:0,scale:.999,dur:580,delay:52},

    /* OTHER PEOPLE: lower amplitude, less irregular timing. */
    {sel:'#bz-d10 .bz-spine-success > .bz-spine-kicker', x:-5,y:6,blur:0,scale:1,dur:540,delay:0},
    {sel:'#bz-spine-success-title', x:4,y:7,blur:0,scale:.999,dur:560,delay:45},
    {sel:'#bz-d10 .bz-spine-success__lead', x:-3,y:6,blur:0,scale:1,dur:540,delay:78},
    {sel:'#bz-d10 .bz-spine-success__body', x:3,y:6,blur:0,scale:1,dur:550,delay:104},
    {sel:'#bz-d10 .bz-spine-success__bridge', x:0,y:5,blur:0,scale:1,dur:520,delay:70},
    {sel:'#bz-d10 .bz-spine-success__why', x:0,y:5,blur:0,scale:1,dur:520,delay:88},
    {sel:'#bz-d10 .bz-spine-success__verdict', x:0,y:4,blur:0,scale:1,dur:500,delay:96},

    /* TWO ERRORS: composition tightens. Life-calendar is the local peak, not a lateral show. */
    {sel:'#bz-d10 .bz-spine-errors > .bz-spine-kicker', x:-3,y:5,blur:0,scale:1,dur:500,delay:0},
    {sel:'#bz-d10 .bz-spine-error--delay', x:-3,y:6,blur:0,scale:1,dur:520,delay:36},
    {sel:'#bz-d10 .bz-spine-delay-time__intro', x:2,y:5,blur:0,scale:1,dur:510,delay:64},
    {sel:'#bz-life-calendar', x:0,y:12,blur:.28,scale:.991,dur:720,delay:30,calendar:true},
    {sel:'#bz-d10 .bz-spine-delay-time__conclusion', x:0,y:5,blur:0,scale:1,dur:510,delay:44},
    {sel:'#bz-d10 .bz-spine-error--wrong', x:2,y:5,blur:0,scale:1,dur:500,delay:54},
    {sel:'#bz-d10 .bz-spine-errors__bridge', x:0,y:4,blur:0,scale:1,dur:480,delay:64},

    /* PRODUCT PATH: order has arrived. Straight, regular, almost no motion. */
    {sel:'#bz-chapter-03 .bz-product-path__head', x:0,y:6,blur:0,scale:1,dur:500,delay:0,ordered:true},
    {sel:'#bz-chapter-03 .bz-product-path__transform', x:0,y:5,blur:0,scale:1,dur:490,delay:70,ordered:true},
    {sel:'#bz-chapter-03 .bz-product-path__stage--next', x:0,y:4,blur:0,scale:1,dur:480,delay:140,ordered:true},
    {sel:'#bz-chapter-03 .bz-product-path__collect-bridge', x:0,y:3,blur:0,scale:1,dur:460,delay:210,ordered:true},

    /* Proof: essentially static. */
    {sel:'#bz-proof-transition', x:0,y:3,blur:0,scale:1,dur:430,delay:0,proof:true}
  ];

  var items=[];
  score.forEach(function(spec,index){
    var el=one(spec.sel);
    if(!el)return;
    el.classList.add('bz-co-item');
    if(spec.calendar){
      var stage=el.closest('.bz-life-calendar-stage');
      if(stage){
        el.classList.remove('bz-co-item');
        el=stage;
        el.classList.add('bz-co-item');
      }
    }
    el.setAttribute('data-bz-co-index',String(index+1));
    if(spec.ordered)el.setAttribute('data-bz-co-order','settled');
    if(spec.proof)el.setAttribute('data-bz-co-order','proof');
    el.style.setProperty('--bz-co-x',(spec.x||0)+'px');
    el.style.setProperty('--bz-co-y',(spec.y||0)+'px');
    el.style.setProperty('--bz-co-blur',(spec.blur||0)+'px');
    el.style.setProperty('--bz-co-scale',String(spec.scale==null?1:spec.scale));
    el.style.setProperty('--bz-co-duration',(spec.dur||540)+'ms');
    el.style.setProperty('--bz-co-delay',(spec.delay||0)+'ms');
    items.push(el);
  });

  if(!items.length)return;

  function reveal(el){
    if(el.classList.contains('is-bz-co-visible'))return;
    el.classList.add('is-bz-co-visible');
  }

  /* Ensure direct/hash entry never leaves already-passed material hidden. */
  var vh=window.innerHeight||document.documentElement.clientHeight||1;
  items.forEach(function(el){
    var r=el.getBoundingClientRect();
    if(r.bottom<vh*.12)reveal(el);
  });

  if(!('IntersectionObserver' in window)){
    items.forEach(reveal);
    return;
  }

  var observer=new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(!entry.isIntersecting)return;
      reveal(entry.target);
      observer.unobserve(entry.target);
    });
  },{
    root:null,
    threshold:.08,
    rootMargin:'0px 0px -8% 0px'
  });

  items.forEach(function(el){
    if(!el.classList.contains('is-bz-co-visible'))observer.observe(el);
  });
})();
