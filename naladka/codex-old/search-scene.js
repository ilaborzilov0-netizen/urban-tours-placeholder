/* owner:search-scene-0548
   Production scroll-scrub controller for the existing search illustration.
   Natural document scroll only: no pinning, no scroll-lock, no wheel/touch interception.
   HTML contains the complete static final frame; JS only maps scroll position to motion. */
(function(){
  'use strict';
  if(window.__BZSearchScene0548) return;
  window.__BZSearchScene0548 = true;

  var root = document.querySelector('[data-search-scene]');
  var stage = root && root.querySelector('[data-search-stage]');
  var shell = stage && stage.querySelector('[data-search-real]');
  var query = stage && stage.querySelector('[data-search-query]');
  var submit = stage && stage.querySelector('[data-search-submit]');
  var results = stage ? Array.prototype.slice.call(stage.querySelectorAll('[data-search-result]')) : [];
  if(!root || !stage || !shell || !query || !submit || !results.length) return;

  var fullQuery = 'как бросить курить';
  var motion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var active = false;
  var listening = false;
  var raf = 0;
  var observer = null;

  function clamp(value, min, max){
    return Math.max(min, Math.min(max, value));
  }

  function segment(progress, start, end){
    return clamp((progress - start) / Math.max(.0001, end - start), 0, 1);
  }

  function renderFinal(){
    root.classList.remove('is-search-scrub-enabled');
    root.style.removeProperty('--search-shell-opacity');
    root.style.removeProperty('--search-shell-y');
    query.textContent = fullQuery;
    results.forEach(function(row){
      row.style.removeProperty('--search-result-opacity');
      row.style.removeProperty('--search-result-y');
    });
    submit.classList.add('is-ready');
  }

  function viewportBandProgress(y, startRatio, endRatio, vh){
    var startY = vh * startRatio;
    var endY = vh * endRatio;
    return clamp((startY - y) / Math.max(1, startY - endY), 0, 1);
  }

  function renderProgress(){
    var vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0, 1);
    var stageRect = stage.getBoundingClientRect();
    var bar = stage.querySelector('.search-real__bar');
    var barRect = bar ? bar.getBoundingClientRect() : stageRect;

    /* Deliberately slower than 0547: the shell gets a long approach, and the
       query types while the search bar travels through a broad lower-middle
       viewport band. Scroll position is still the only clock. */
    var shellP = viewportBandProgress(stageRect.top, .94, .72, vh);
    var typingP = viewportBandProgress(barRect.top, .80, .46, vh);
    var count = Math.floor(fullQuery.length * typingP + .0001);

    root.style.setProperty('--search-shell-opacity', (.16 + .84 * shellP).toFixed(4));
    root.style.setProperty('--search-shell-y', ((1 - shellP) * 10).toFixed(2) + 'px');
    query.textContent = fullQuery.slice(0, count);

    var lastProgress = 0;
    results.forEach(function(row){
      var rect = row.getBoundingClientRect();
      var centerY = rect.top + rect.height * .5;
      /* Each suggestion is revealed by its OWN position in the viewport.
         It becomes visible as it arrives in the reader's lower focal zone,
         rather than by a detached master timeline. This keeps the reveal
         literally in front of the eye and perfectly reversible on scroll-up. */
      var eyeP = viewportBandProgress(centerY, .60, .48, vh);
      var typingGate = segment(typingP, .96, 1);
      var rp = Math.min(eyeP, typingGate);
      lastProgress = rp;
      row.style.setProperty('--search-result-opacity', rp.toFixed(4));
      row.style.setProperty('--search-result-y', ((1 - rp) * 14).toFixed(2) + 'px');
    });

    submit.classList.toggle('is-ready', lastProgress >= .92);
  }

  function measureActiveRange(){
    var rect = stage.getBoundingClientRect();
    var vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0, 1);
    /* Keep the controller awake from a little before entry until the card has
       travelled well through the viewport. No pinning; just a longer natural
       scrub distance. */
    return rect.bottom > vh * .10 && rect.top < vh * .98;
  }

  function update(){
    raf = 0;
    if(!active || document.hidden) return;
    renderProgress();
  }

  function requestUpdate(){
    if(raf || !active || document.hidden) return;
    raf = window.requestAnimationFrame(update);
  }

  function addScrollListener(){
    if(listening) return;
    listening = true;
    window.addEventListener('scroll', requestUpdate, {passive:true});
    window.addEventListener('resize', requestUpdate, {passive:true});
    window.addEventListener('orientationchange', requestUpdate, {passive:true});
  }

  function removeScrollListener(){
    if(!listening) return;
    listening = false;
    window.removeEventListener('scroll', requestUpdate);
    window.removeEventListener('resize', requestUpdate);
    window.removeEventListener('orientationchange', requestUpdate);
    if(raf){
      window.cancelAnimationFrame(raf);
      raf = 0;
    }
  }

  function setActive(next){
    if(active === next) return;
    active = next;
    root.classList.toggle('is-search-scrub-active', active);
    if(active){
      addScrollListener();
      requestUpdate();
    }else{
      removeScrollListener();
      renderProgress();
    }
  }

  function initMotion(){
    if(motion && motion.matches){
      if(observer){ observer.disconnect(); observer = null; }
      setActive(false);
      renderFinal();
      return;
    }

    root.classList.add('is-search-scrub-enabled');
    renderProgress();

    if('IntersectionObserver' in window){
      observer = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if(entry.target === root) setActive(entry.isIntersecting || measureActiveRange());
        });
      }, {root:null, rootMargin:'35% 0px 35% 0px', threshold:0});
      observer.observe(root);
    }else{
      setActive(true);
    }
  }

  function onMotionChange(){
    if(observer){ observer.disconnect(); observer = null; }
    removeScrollListener();
    active = false;
    initMotion();
  }

  if(motion){
    if(motion.addEventListener) motion.addEventListener('change', onMotionChange);
    else if(motion.addListener) motion.addListener(onMotionChange);
  }

  document.addEventListener('visibilitychange', function(){
    if(document.hidden){
      if(raf){ window.cancelAnimationFrame(raf); raf = 0; }
    }else if(active){
      requestUpdate();
    }
  }, {passive:true});

  initMotion();
})();
