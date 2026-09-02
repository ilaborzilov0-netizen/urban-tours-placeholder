(()=>{
  'use strict';

  const root=document.getElementById('borzilov-lp');
  const nav=root?.querySelector('.bz-nav-wrap');
  const firstIsland=root?.querySelector('#bz-d10');
  const mobileHeroTitle=root?.querySelector('#bz1050-mobile-transfer-title');
  const desktopHeroTitle=root?.querySelector('#bz-hero .bz-title.bz-title-huge');
  const hero=root?.querySelector('#bz-hero');
  const startWithBento=document.documentElement.classList.contains('bz-start-with-bento');
  const bentoEntry=root?.querySelector('#bz-hero-solution-bento-copy');
  const releaseTarget=root?.querySelector('#bz1092-product-lab')||root?.querySelector('#bz-format');
  if(!root||!nav||!firstIsland||!hero) return;

  const activeHeroPinTarget=()=>{
    if(mobileHeroTitle&&mobileHeroTitle.getClientRects().length) return mobileHeroTitle;
    if(desktopHeroTitle&&desktopHeroTitle.getClientRects().length) return desktopHeroTitle;
    return hero;
  };
  if(root.dataset.bzFirstIslandNavigationReady==='1') return;

  root.dataset.bzFirstIslandNavigationReady='1';
  root.dataset.bzFirstIslandNavigationOwner='hero-scroll-scrub-pin-to-product-release';

  let frameRequest=0;
  let fixedState=null;
  let releasedState=null;
  let releaseY=Number.POSITIVE_INFINITY;
  let pinY=0;
  let pinRevealStartY=0;
  let navHeight=0;

  const scrollY=()=>window.scrollY||window.pageYOffset||document.documentElement.scrollTop||document.body.scrollTop||0;

  const rebuildGeometry=()=>{
    const y=scrollY();
    navHeight=nav.getBoundingClientRect().height;

    /* 0345: pin the complete header substantially earlier, while the hero title
       is still in the composition shown by the approved mobile frame.
       The 194px sightline is deliberately a viewport coordinate, not a timer:
       reaching it by native scroll is the only trigger. */
    const pinTarget=activeHeroPinTarget();
    const pinRect=(startWithBento&&bentoEntry)?bentoEntry.getBoundingClientRect():pinTarget.getBoundingClientRect();
    const heroTop=y+(startWithBento&&bentoEntry?pinRect.bottom:pinRect.top);
    const pinSightline=Math.max(navHeight+24,Math.min(194,window.innerHeight-140));
    pinY=Math.max(0,heroTop-pinSightline);
    pinRevealStartY=Math.max(0,pinY-navHeight);
    root.style.setProperty('--bz-site-nav-pin-y',pinY.toFixed(2)+'px');
    root.style.setProperty('--bz-site-nav-pin-reveal-start-y',pinRevealStartY.toFixed(2)+'px');

    if(!releaseTarget){
      releaseY=Number.POSITIVE_INFINITY;
      root.style.removeProperty('--bz-site-nav-release-top');
      return;
    }
    const targetTop=y+releaseTarget.getBoundingClientRect().top;
    releaseY=Math.max(pinY,targetTop-navHeight);
    root.style.setProperty('--bz-site-nav-release-top',releaseY.toFixed(2)+'px');
    root.style.setProperty('--bz-logo-progress-end-y',releaseY.toFixed(2)+'px');
  };

  const commit=()=>{
    frameRequest=0;
    const y=scrollY();
    /* 0346: scroll-scrub the re-entry instead of snapping the header on.
       During exactly one nav-height before pinY, top moves -1px for every
       1px below the pin and therefore +1px for every 1px of forward scroll.
       Reverse scroll walks the exact same geometry backwards. */
    const fixed=fixedState===true
      ?y>=pinRevealStartY-1
      :y>=pinRevealStartY;
    const scrubTop=fixed?Math.max(-navHeight,Math.min(0,y-pinY)):0;
    root.style.setProperty('--bz-site-nav-scrub-top',scrubTop.toFixed(2)+'px');
    root.toggleAttribute('data-bz-nav-first-island-scrubbing',fixed&&y<pinY-.5);
    if(fixed!==fixedState){
      fixedState=fixed;
      root.toggleAttribute('data-bz-nav-first-island-fixed',fixed);
      root.dispatchEvent(new CustomEvent('bz:first-island-nav-state',{detail:{fixed,pinY,pinRevealStartY,scrubTop}}));
    }

    const released=Number.isFinite(releaseY)&&y>=releaseY-.5;
    if(released!==releasedState){
      releasedState=released;
      root.toggleAttribute('data-bz-nav-site-released',released);
      root.dispatchEvent(new CustomEvent('bz:site-nav-release-state',{detail:{released,releaseY}}));
    }
  };

  const requestCommit=()=>{
    if(frameRequest) return;
    frameRequest=requestAnimationFrame(commit);
  };

  const rebuildAndCommit=()=>{
    rebuildGeometry();
    requestCommit();
  };

  addEventListener('scroll',requestCommit,{passive:true});
  addEventListener('scrollend',requestCommit,{passive:true});
  addEventListener('resize',rebuildAndCommit,{passive:true});
  addEventListener('orientationchange',rebuildAndCommit,{passive:true});
  addEventListener('pageshow',rebuildAndCommit,{passive:true});
  addEventListener('load',rebuildAndCommit,{once:true,passive:true});
  window.visualViewport?.addEventListener('resize',rebuildAndCommit,{passive:true});
  window.visualViewport?.addEventListener('scroll',requestCommit,{passive:true});
  document.fonts?.ready?.then(rebuildAndCommit).catch(()=>{});

  if('ResizeObserver' in window){
    const observer=new ResizeObserver(rebuildAndCommit);
    observer.observe(firstIsland);
    if(mobileHeroTitle) observer.observe(mobileHeroTitle);
    if(desktopHeroTitle) observer.observe(desktopHeroTitle);
    if(bentoEntry) observer.observe(bentoEntry);
    observer.observe(hero);
    if(releaseTarget) observer.observe(releaseTarget);
    observer.observe(nav);
  }

  rebuildAndCommit();
})();
