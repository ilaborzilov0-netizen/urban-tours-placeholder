(function(){
  "use strict";
  if(window.__BZBottleneckScroll0662) return;
  window.__BZBottleneckScroll0662 = true;
  var root = document.querySelector('[data-bz-bv10-root][data-bz-bv10-mode="scroll-scrub"]') || document.querySelector('[data-bz-bv10-root]');
  if(!root) return;
  var stage = root.querySelector('.bz-bv10-stage');
  var scene = root.querySelector('[data-bv10-scene="single"]');
  var grid = root.querySelector('.bz-bv10-gridfx');
  var aura = root.querySelector('.bz-bv10-aura');
  var rings = Array.prototype.slice.call(root.querySelectorAll('.bz-bv10-ring'));
  var core = root.querySelector('.bz-bv10-core');
  var chips = Array.prototype.slice.call(root.querySelectorAll('.bz-bv10-chip'));
  if(!stage || !scene || !grid || !aura || !rings.length || !core || !chips.length) return;
  var motion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var active = false, listening = false, observer = null, raf = 0;
  var chipProfiles = [
    { x1: 9, y1: 7, x2: 12, y2: 8, s: .050, o: .18, p1: 0.0, p2: 1.8, p3: 0.6, p4: 2.4 },
    { x1: 7, y1:10, x2: 10, y2:12, s: .042, o: .16, p1: 0.9, p2: 0.4, p3: 2.0, p4: 1.2 },
    { x1:10, y1: 8, x2: 13, y2:10, s: .050, o: .19, p1: 1.5, p2: 2.2, p3: 1.1, p4: 0.4 },
    { x1: 7, y1: 9, x2: 11, y2:13, s: .040, o: .16, p1: 2.0, p2: 1.1, p3: 0.2, p4: 1.9 },
    { x1: 8, y1: 7, x2: 14, y2:10, s: .044, o: .16, p1: 2.7, p2: 0.3, p3: 2.6, p4: 1.0 },
    { x1: 8, y1: 8, x2: 14, y2:10, s: .044, o: .16, p1: 0.5, p2: 2.6, p3: 1.4, p4: 2.0 },
    { x1: 8, y1: 8, x2: 13, y2:11, s: .042, o: .16, p1: 1.2, p2: 0.8, p3: 2.3, p4: 1.6 },
    { x1: 8, y1: 8, x2: 13, y2:11, s: .042, o: .17, p1: 2.3, p2: 1.7, p3: 0.9, p4: 2.7 }
  ];
  function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }
  function ease(t){ return 1 - Math.pow(1 - clamp(t,0,1), 3); }
  function resetScene(){ grid.style.backgroundPosition='26px 26px'; aura.style.transform='translate(-50%,-50%) scale(1)'; aura.style.opacity=''; rings.forEach(function(ring, index){ ring.style.transform = index===1 ? 'translate(-50%,-50%) rotate(45deg) scale(1)' : 'translate(-50%,-50%) scale(1)'; ring.style.opacity=''; }); core.style.transform='translate(-50%,-50%) scale(1)'; core.style.opacity=''; chips.forEach(function(chip){ chip.style.transform='translate3d(0,0,0) scale(1)'; chip.style.opacity=''; }); }
  function render(progress){
    var p = ease(progress), waveA = p * Math.PI * 2.45, waveB = p * Math.PI * 4.10, waveC = p * Math.PI * 6.05;
    grid.style.backgroundPosition = (26 + Math.sin(waveA * .55 + .3) * 10).toFixed(2) + 'px ' + (26 + Math.cos(waveA * .48 + .65) * 8).toFixed(2) + 'px';
    var auraScale = 0.96 + Math.sin(waveA * .72 + .2) * .06 + Math.sin(waveB * .2 + .8) * .03;
    aura.style.transform = 'translate(-50%,-50%) scale(' + auraScale.toFixed(4) + ')';
    aura.style.opacity = (0.11 + (0.08 * (0.5 + 0.5 * Math.sin(waveB * .44 + .9)))).toFixed(3);
    rings.forEach(function(ring, index){ var scale = 0.985 + Math.sin(waveA * .62 + index * 1.15) * .018; var opacity = index===1 ? 0.30 + (0.10 * (0.5 + 0.5 * Math.sin(waveB * .38 + 1.3))) : 0.18 + (0.10 * (0.5 + 0.5 * Math.sin(waveB * .4 + .4))); ring.style.transform = index===1 ? 'translate(-50%,-50%) rotate(45deg) scale(' + scale.toFixed(4) + ')' : 'translate(-50%,-50%) scale(' + scale.toFixed(4) + ')'; ring.style.opacity = opacity.toFixed(3); });
    core.style.transform = 'translate(-50%,calc(-50% + ' + (Math.sin(waveB * .36 + .7) * 4).toFixed(2) + 'px)) scale(' + (0.992 + Math.sin(waveA * .78 + .4) * .014 + Math.sin(waveC * .22) * .008).toFixed(4) + ')';
    core.style.opacity = (0.96 + 0.04 * (0.5 + 0.5 * Math.sin(waveB * .48 + 1.1))).toFixed(3);
    chips.forEach(function(chip, index){ var m = chipProfiles[index % chipProfiles.length]; var x = Math.sin(waveA + m.p1) * m.x1 + Math.sin(waveB + m.p2) * m.x2; var y = Math.cos(waveA * 1.08 + m.p3) * m.y1 + Math.sin(waveC * .64 + m.p4) * m.y2; var scale = 1 + Math.sin(waveB * .42 + m.p2) * m.s + Math.sin(waveC * .18 + m.p4) * (m.s * .45); var opacity = 0.58 + m.o * (0.5 + 0.5 * Math.sin(waveB * .52 + m.p1 + m.p4)); chip.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0) scale(' + scale.toFixed(4) + ')'; chip.style.opacity = opacity.toFixed(3); });
  }
  function stageProgress(){ var rect = root.getBoundingClientRect(); var vh = window.innerHeight || document.documentElement.clientHeight || 1; var start = vh * 0.88; var end = vh * 0.12; return clamp((start - rect.top) / Math.max(1, (rect.height + start - end)), 0, 1); }
  function renderFromScroll(){ raf = 0; render(stageProgress()); }
  function requestRender(){ if(raf) return; raf = window.requestAnimationFrame(renderFromScroll); }
  function addListeners(){ if(listening) return; listening = true; window.addEventListener('scroll', requestRender, {passive:true}); window.addEventListener('resize', requestRender, {passive:true}); window.addEventListener('orientationchange', requestRender, {passive:true}); }
  function removeListeners(){ if(!listening) return; listening = false; window.removeEventListener('scroll', requestRender); window.removeEventListener('resize', requestRender); window.removeEventListener('orientationchange', requestRender); if(raf){ window.cancelAnimationFrame(raf); raf = 0; } }
  function setActive(next){ if(active === next) return; active = next; if(active){ addListeners(); requestRender(); } else { removeListeners(); render(stageProgress()); } }
  function init(){ if(motion && motion.matches){ if(observer){ observer.disconnect(); observer = null; } removeListeners(); resetScene(); return; } render(stageProgress()); if('IntersectionObserver' in window){ observer = new IntersectionObserver(function(entries){ entries.forEach(function(entry){ if(entry.target === root) setActive(entry.isIntersecting || entry.intersectionRatio > 0); }); }, {root:null, rootMargin:'35% 0px 35% 0px', threshold:0}); observer.observe(root); } else { setActive(true); } }
  function onMotionChange(){ if(observer){ observer.disconnect(); observer = null; } active = false; removeListeners(); init(); }
  if(motion){ if(motion.addEventListener) motion.addEventListener('change', onMotionChange); else if(motion.addListener) motion.addListener(onMotionChange); }
  document.addEventListener('visibilitychange', function(){ if(document.hidden){ if(raf){ window.cancelAnimationFrame(raf); raf = 0; } } else if(active){ requestRender(); } }, {passive:true});
  init();
})();
