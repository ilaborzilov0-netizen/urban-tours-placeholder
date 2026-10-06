/* owner:bz-site-core-runtime — desktop navigation, anchor scrolling and canonical interaction state. */
(function(){var root=document.getElementById('borzilov-lp');if(root)root.dataset.bzSiteRuntimeReady='1';})();
;
/* owner:anonymous-page-core */
(function(){
  var root = document.getElementById('borzilov-lp');
  if (!root) return;

  var sectionLinks = [];
  var sectionTargets = [];
  var desktopNavQuery = window.matchMedia ? window.matchMedia('(min-width: 981px)') : { matches: window.innerWidth >= 981 };
  var desktopNavInitialized = false;
  var activeSectionIndex = -1;
  var navTicking = false;
  var layoutTicking = false;
  var navElement = root.querySelector('.bz-nav-wrap');

  /* 0650: partially persistent navigation.
     Down = content owns the viewport. Up = controls return.
     The former page-progress paint owner has been removed. */
  var navRevealLastY = 0;
  var navRevealAnchorY = 0;
  var navRevealState = 'shown';
  var navRevealThreshold = 16;
  var navRevealTopGuard = 24;
  var navReduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function navInteractionOwnsHeader(){
    return root.classList.contains('bz-mobile-nav-open') ||
      root.classList.contains('bz-whole-nav-dragging') ||
      root.classList.contains('bz-mobile-nav-dragging');
  }

  function setNavRevealState(next, immediate){
    if (!navElement) return;
    if (navRevealState === next && !immediate) return;
    navRevealState = next;
    root.setAttribute('data-bz-nav-reveal', next);
    navElement.style.setProperty(
      'transition',
      immediate || navReduceMotion ? 'none' : 'transform 190ms cubic-bezier(.16,1,.3,1)',
      'important'
    );
    navElement.style.setProperty(
      'transform',
      next === 'hidden' ? 'translate3d(0,calc(-100% - 8px),0)' : 'translate3d(0,0,0)',
      'important'
    );
    navElement.style.setProperty('pointer-events', next === 'hidden' ? 'none' : 'auto', 'important');
  }

  function updateNavReveal(){
    if (!navElement) return;
    var y = Math.max(0, getScrollY());
    if (navInteractionOwnsHeader() || y <= navRevealTopGuard) {
      navRevealLastY = y;
      navRevealAnchorY = y;
      setNavRevealState('shown', false);
      return;
    }
    var delta = y - navRevealLastY;
    if (delta === 0) return;
    var direction = delta > 0 ? 'down' : 'up';
    var anchorDirection = y - navRevealAnchorY;
    if ((direction === 'down' && anchorDirection < 0) || (direction === 'up' && anchorDirection > 0)) {
      navRevealAnchorY = navRevealLastY;
      anchorDirection = y - navRevealAnchorY;
    }
    if (direction === 'down' && anchorDirection >= navRevealThreshold) {
      setNavRevealState('hidden', false);
      navRevealAnchorY = y;
    } else if (direction === 'up' && anchorDirection <= -navRevealThreshold) {
      setNavRevealState('shown', false);
      navRevealAnchorY = y;
    }
    navRevealLastY = y;
  }

  var getScrollY = function(){
    return window.scrollY || window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
  };

  /* 2103: remove state owners whose final CSS is hardlocked to one 64px mobile header.
     Keeping these classes/variables alive caused root-wide cascade invalidation and a
     64/70px geometry fight even though compact/full visual states no longer existed. */
  root.classList.remove(
    'bz-scrolled', 'bz-mobile-compact', 'bz-mobile-expanded',
    'bz-header-date-active', 'bz-header-cta-hidden', 'bz-first-splash'
  );
  [
    '--bz-nav-min-h', '--bz-logo-full-opacity', '--bz-logo-full-y',
    '--bz-logo-compact-opacity', '--bz-logo-compact-y', '--bz-cta-opacity',
    '--bz-cta-y', '--bz-cta-scale', '--bz-start-opacity', '--bz-start-y',
    '--bz-nav-unified-foreground', '--bz-nav-menu-link-color', '--bz-nav-logo-base-color'
  ].forEach(function(name){ root.style.removeProperty(name); });

  /* Native scrolling is the only wheel/touch scroll owner. */
  var bzSmoothScroll = (function(){
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var clearLegacyState = function(){
      if (document.documentElement) document.documentElement.classList.remove('bz-cinematic-scroll');
      root.classList.remove('bz-cinematic-scroll-on');
    };
    var clampY = function(value){
      var doc = document.documentElement;
      var body = document.body;
      var maxY = Math.max(0, doc.scrollHeight || 0, body ? body.scrollHeight : 0) - window.innerHeight;
      return Math.max(0, Math.min(maxY, Number(value) || 0));
    };
    clearLegacyState();
    window.addEventListener('pageshow', clearLegacyState, { passive: true });
    return {
      isEnabled: function(){ return false; },
      scrollTo: function(y, immediate){ window.scrollTo({ top: clampY(y), behavior: immediate || reduceMotion ? 'auto' : 'smooth' }); },
      scrollToElement: function(el){ if (el) el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }); },
      refresh: clearLegacyState,
      config: { nativeScroll: true, smoothWheel: false }
    };
  })();


  function clearDesktopActiveLink(){
    if (activeSectionIndex >= 0 && sectionTargets[activeSectionIndex]) {
      sectionTargets[activeSectionIndex].link.classList.remove('bz-active-section');
    }
    activeSectionIndex = -1;
  }

  function updateDesktopActiveLink(force){
    if (!desktopNavQuery.matches || !sectionTargets.length) {
      clearDesktopActiveLink();
      return;
    }
    var probeY = getScrollY() + 130;
    var nextIndex = 0;
    for (var i = 0; i < sectionTargets.length; i += 1) {
      if (sectionTargets[i].top <= probeY) nextIndex = i;
      else break;
    }
    if (!force && nextIndex === activeSectionIndex) return;
    if (activeSectionIndex >= 0 && sectionTargets[activeSectionIndex]) {
      sectionTargets[activeSectionIndex].link.classList.remove('bz-active-section');
    }
    activeSectionIndex = nextIndex;
    sectionTargets[activeSectionIndex].link.classList.add('bz-active-section');
  }

  function rebuildSectionGeometry(){
    layoutTicking = false;
    var scrollY = getScrollY();
    sectionTargets.forEach(function(item){
      item.top = scrollY + item.target.getBoundingClientRect().top;
    });
    sectionTargets.sort(function(a,b){ return a.top - b.top; });
    updateDesktopActiveLink(true);
  }

  function requestGeometryRebuild(){
    if (layoutTicking) return;
    layoutTicking = true;
    window.requestAnimationFrame(rebuildSectionGeometry);
  }

  function onDesktopNavScroll(){
    if (navTicking) return;
    navTicking = true;
    window.requestAnimationFrame(function(){
      navTicking = false;
      updateNavReveal();
      if (desktopNavQuery.matches) updateDesktopActiveLink(false);
    });
  }

  function initDesktopNavigation(){
    if (!desktopNavQuery.matches || desktopNavInitialized) return;
    desktopNavInitialized = true;
    sectionLinks = Array.prototype.slice.call(root.querySelectorAll('.bz-menu a[href^="#bz-"]'));
    sectionTargets = sectionLinks.map(function(link){
      var target = root.querySelector(link.getAttribute('href'));
      return target ? { link: link, target: target, top: 0 } : null;
    }).filter(Boolean);
    requestAnimationFrame(rebuildSectionGeometry);
    if ('IntersectionObserver' in window) {
      var desktopNavObserver = new IntersectionObserver(function () {
        updateDesktopActiveLink(false);
      }, { threshold: 0, rootMargin: '-130px 0px -68% 0px' });
      sectionTargets.forEach(function (item) { desktopNavObserver.observe(item.target); });
    }
    window.addEventListener('resize', requestGeometryRebuild, { passive: true });
    window.addEventListener('orientationchange', requestGeometryRebuild, { passive: true });
    window.addEventListener('load', requestGeometryRebuild, { once: true });
    window.addEventListener('pageshow', requestGeometryRebuild, { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(requestGeometryRebuild).catch(function(){});
  }
  window.addEventListener('pageshow', function(){
    navRevealLastY = Math.max(0, getScrollY());
    navRevealAnchorY = navRevealLastY;
    setNavRevealState(navRevealLastY <= navRevealTopGuard ? 'shown' : navRevealState, true);
  }, { passive: true });
  window.addEventListener('scroll', onDesktopNavScroll, { passive: true });
  navRevealLastY = Math.max(0, getScrollY());
  navRevealAnchorY = navRevealLastY;
  setNavRevealState('shown', true);
  initDesktopNavigation();
  var onDesktopQueryChange=function(){if(desktopNavQuery.matches)initDesktopNavigation();else clearDesktopActiveLink()};
  if (desktopNavQuery.addEventListener) desktopNavQuery.addEventListener('change', onDesktopQueryChange);
  else if (desktopNavQuery.addListener) desktopNavQuery.addListener(onDesktopQueryChange);

  var faqButtons = root.querySelectorAll('.bz-faq-q');
  faqButtons.forEach(function(btn){
    btn.addEventListener('click', function(){
      var item = btn.closest('.bz-faq-item');
      if (!item) return;
      var isOpen=item.classList.toggle('bz-open');
      btn.setAttribute('aria-expanded',isOpen?'true':'false');
    });
  });

  var links = root.querySelectorAll('a[href^="#bz-"]:not([data-bz-layer-open])');
  links.forEach(function(link){
    link.addEventListener('click', function(e){
      var target = root.querySelector(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      if (bzSmoothScroll && bzSmoothScroll.isEnabled()) bzSmoothScroll.scrollToElement(target);
      else target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    });
  });

  /* 2104: removed label-wave observer and its large offscreen compositor rings. */

  /* Fade/reveal state is canonicalized in CSS; no root-wide startup mutation. */
})();
;

/* owner:bz-canonical-interaction-state-js */
(function(){
  'use strict';
  var root=document.getElementById('borzilov-lp');
  if(!root||root.dataset.bzCanonicalInteractionReady==='1')return;
  root.dataset.bzCanonicalInteractionReady='1';

  var timers=new WeakMap();
  var coarse=window.matchMedia?window.matchMedia('(hover: none), (pointer: coarse)'):null;
  var HERO='#bz-hero .bz-hero-actions > .bz-btn';
  var FINAL='.bz-final .bz-final-card .bz-hero-actions > a.bz-btn';
  var TARIFF='.bz-tariff-7000-cta';
  var CONSULT='.bz-consultation-cta';
  var CARD='.bz-price-card.bz-tariff-lift';

  function closest(target,selector){return target&&target.closest?target.closest(selector):null;}
  function clearTimer(el){var id=timers.get(el);if(id){clearTimeout(id);timers.delete(el);}}
  function later(el,ms,fn){clearTimer(el);timers.set(el,setTimeout(function(){timers.delete(el);fn();},ms));}
  function leaving(el,related){return !related||!el.contains(related);}

  Array.prototype.forEach.call(root.querySelectorAll(CONSULT),function(el){
    el.classList.add('bz-human-ready','bz-human-visible');
    el.dataset.bzHumanPlayed='1';
  });
  Array.prototype.forEach.call(root.querySelectorAll(TARIFF),function(el){
    el.classList.add('bz-tariff-auto-visible');
    el.classList.remove('bz-tariff-auto-ready','bz-tariff-auto-press','bz-tariff-auto-bounce');
  });

  function heroPress(el){
    clearTimer(el);
    el.classList.remove('bz219-is-releasing');
    el.classList.add('bz219-is-pressing');
    el.style.setProperty('transition','transform 420ms cubic-bezier(.09,.42,.10,1), box-shadow 420ms cubic-bezier(.09,.42,.10,1), border-color 420ms cubic-bezier(.09,.42,.10,1)','important');
    el.style.setProperty('transform','translate3d(0, calc(var(--cta-y, 0px) + var(--cta-spring-y, 0px) + var(--cta-hover-y, 0px) + 1px), 0) scale(var(--cta-entrance-scale, 1)) scale(var(--cta-active-scale, 1)) scale(var(--cta-pulse-scale, 1)) scale(.987)','important');
  }
  function heroRelease(el){
    if(!el.classList.contains('bz219-is-pressing'))return;
    el.classList.remove('bz219-is-pressing');
    el.classList.add('bz219-is-releasing');
    el.style.setProperty('transition','transform 900ms cubic-bezier(.14,.96,.22,1), box-shadow 900ms cubic-bezier(.14,.96,.22,1), border-color 900ms cubic-bezier(.14,.96,.22,1)','important');
    el.style.setProperty('transform','translate3d(0, calc(var(--cta-y, 0px) + var(--cta-spring-y, 0px) + var(--cta-hover-y, 0px)), 0) scale(var(--cta-entrance-scale, 1)) scale(var(--cta-active-scale, 1)) scale(var(--cta-pulse-scale, 1)) scale(1)','important');
    later(el,1040,function(){el.classList.remove('bz219-is-releasing');el.style.removeProperty('transition');el.style.removeProperty('transform');});
  }
  function finalPress(el){clearTimer(el);el.classList.remove('bz-final-cta-is-releasing');el.classList.add('bz-final-cta-is-pressing');}
  function finalRelease(el){
    if(!el.classList.contains('bz-final-cta-is-pressing'))return;
    el.classList.remove('bz-final-cta-is-pressing');el.classList.add('bz-final-cta-is-releasing');
    later(el,540,function(){el.classList.remove('bz-final-cta-is-releasing');});
  }
  function tariffPress(el){clearTimer(el);el.classList.remove('bz-tariff-user-bounce');el.classList.add('bz-tariff-user-press','bz-solar-shadow-press');}
  function tariffRelease(el,bounce){
    el.classList.remove('bz-tariff-user-press','bz-solar-shadow-press');
    if(bounce){el.classList.add('bz-tariff-user-bounce');later(el,220,function(){el.classList.remove('bz-tariff-user-bounce');});}
  }
  function consultPress(el){
    clearTimer(el);el.classList.add('bz-consultation-tap-active','bz-glass-tap');
    later(el,760,function(){el.classList.remove('bz-glass-tap');});
  }
  function consultRelease(el){later(el,80,function(){el.classList.remove('bz-consultation-tap-active');});}
  function cardPress(el){if(!coarse||coarse.matches)el.classList.add('bz-touch-active');}
  function cardRelease(el,delayed){if(delayed)later(el,120,function(){el.classList.remove('bz-touch-active');});else el.classList.remove('bz-touch-active');}

  function pressFrom(target){
    var el=closest(target,HERO);if(el)heroPress(el);
    el=closest(target,FINAL);if(el)finalPress(el);
    el=closest(target,TARIFF);if(el)tariffPress(el);
    el=closest(target,CONSULT);if(el)consultPress(el);
    el=closest(target,CARD);if(el)cardPress(el);
  }
  function releaseFrom(target,bounce,delayedCard){
    var el=closest(target,HERO);if(el)heroRelease(el);
    el=closest(target,FINAL);if(el)finalRelease(el);
    el=closest(target,TARIFF);if(el)tariffRelease(el,bounce);
    el=closest(target,CONSULT);if(el)consultRelease(el);
    el=closest(target,CARD);if(el)cardRelease(el,delayedCard);
  }

  root.addEventListener('pointerdown',function(event){pressFrom(event.target);},{passive:true,capture:true});
  root.addEventListener('pointerup',function(event){releaseFrom(event.target,true,true);},{passive:true,capture:true});
  root.addEventListener('pointercancel',function(event){releaseFrom(event.target,false,false);},{passive:true,capture:true});
  root.addEventListener('lostpointercapture',function(event){releaseFrom(event.target,false,false);},{passive:true,capture:true});
  root.addEventListener('pointerout',function(event){
    [HERO,FINAL,TARIFF,CONSULT,CARD].forEach(function(selector){var el=closest(event.target,selector);if(el&&leaving(el,event.relatedTarget))releaseFrom(el,false,false);});
  },{passive:true,capture:true});
  root.addEventListener('focusout',function(event){
    [HERO,FINAL,TARIFF,CONSULT,CARD].forEach(function(selector){var el=closest(event.target,selector);if(el&&leaving(el,event.relatedTarget))releaseFrom(el,false,false);});
  },{passive:true,capture:true});
  root.addEventListener('keydown',function(event){
    if(event.key!=='Enter'&&event.key!==' ')return;
    var el=closest(event.target,TARIFF);if(el)tariffPress(el);
  },{capture:true});
  root.addEventListener('keyup',function(event){
    if(event.key!=='Enter'&&event.key!==' ')return;
    var el=closest(event.target,TARIFF);if(el)tariffRelease(el,true);
  },{capture:true});
  root.addEventListener('animationend',function(event){
    var el=closest(event.target,CONSULT);if(el&&event.animationName==='bz-mobile-consultation-glass')el.classList.remove('bz-glass-tap');
  },{passive:true});
})();
;
