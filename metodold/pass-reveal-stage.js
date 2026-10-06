/* owner:pass-reveal-controller-0316 */
(function(){
  'use strict';
  var stage=document.querySelector('[data-bz-pass-reveal-stage]');
  var root=document.getElementById('borzilov-lp');
  var nav=root&&root.querySelector('.bz-nav-wrap');
  if(!stage||!root)return;
  var raf=0;
  var active=false;
  var released=false;

  function setActive(next){
    if(next===active)return;
    active=next;
    document.body.classList.toggle('bz-pass-reveal-active',active);
    if(nav){
      if(active){nav.inert=true;nav.setAttribute('aria-hidden','true');}
      else{nav.inert=false;nav.removeAttribute('aria-hidden');}
    }
    if(active&&window.BZMobileNavigation&&window.BZMobileNavigation.isOpen&&window.BZMobileNavigation.isOpen()){
      window.BZMobileNavigation.close();
    }
  }

  function releaseNavigation(){
    if(released||!nav)return;
    var navRect=nav.getBoundingClientRect();
    var docY=window.scrollY||window.pageYOffset||0;
    var releaseTop=Math.max(0,docY+navRect.top);
    root.style.setProperty('--bz-pass-nav-release-top',releaseTop.toFixed(2)+'px');
    root.setAttribute('data-bz-nav-pass-released','1');
    released=true;
  }

  function restoreNavigation(){
    if(!released)return;
    root.removeAttribute('data-bz-nav-pass-released');
    root.style.removeProperty('--bz-pass-nav-release-top');
    released=false;
  }

  function update(){
    raf=0;
    var rect=stage.getBoundingClientRect();
    var vh=Math.max(1,window.innerHeight||document.documentElement.clientHeight||800);

    /* In menu preview the SAME pass DOM is temporarily hosted inside the mobile
       navigation overlay. It must not claim the page viewport or close its host. */
    if(root.classList.contains('bz-mobile-pass-preview')){
      if(released)restoreNavigation();
      if(active){active=false;document.body.classList.remove('bz-pass-reveal-active');if(nav){nav.inert=false;nav.removeAttribute('aria-hidden');}}
      return;
    }

    /* Navigation physically detaches before the reveal owns the frame.
       Hysteresis prevents sticky/un-sticky chatter when hovering around the seam. */
    if(!released&&rect.top<=vh*1.08){
      releaseNavigation();
    }else if(released&&rect.top>vh*1.34){
      restoreNavigation();
    }

    /* The reveal itself remains chrome-free. */
    var ownsFrame=rect.top<vh*.82&&rect.bottom>vh*.18;
    setActive(ownsFrame);
  }

  function schedule(){if(!raf)raf=requestAnimationFrame(update);}
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule,{passive:true});
  addEventListener('orientationchange',schedule,{passive:true});
  addEventListener('pageshow',schedule,{passive:true});
  window.addEventListener('bz:pass-preview-open',schedule);
  window.addEventListener('bz:pass-preview-close',schedule);
  window.visualViewport&&window.visualViewport.addEventListener('resize',schedule,{passive:true});
  window.visualViewport&&window.visualViewport.addEventListener('scroll',schedule,{passive:true});
  schedule();
})();

/* owner:mobile-shared-pass-preview-0316-js
   Mobile menu -> SAME pricing pass DOM -> checkout.
   The pass is temporarily reparented into the existing mobile navigation overlay,
   then restored to its exact page position on back/close/checkout handoff. */
(function(){
  'use strict';
  function ready(fn){if(document.readyState!=='loading')fn();else document.addEventListener('DOMContentLoaded',fn,{once:true});}
  ready(function(){
    var root=document.getElementById('borzilov-lp');
    if(!root||root.dataset.bzMobileSharedPassPreviewReady==='1')return;
    var overlay=root.querySelector('.bz-mobile-nav-overlay');
    var shell=root.querySelector('.bz-mobile-nav-shell');
    var preview=root.querySelector('[data-bz-mobile-pass-preview]');
    var host=root.querySelector('[data-bz-mobile-pass-host]');
    var back=root.querySelector('[data-bz-mobile-pass-back]');
    var stage=root.querySelector('[data-bz-pass-reveal-stage]');
    var product=stage&&stage.closest('#bz1092-product-commercial-late');
    var mq=window.matchMedia?window.matchMedia('(max-width:980px)'):null;
    if(!overlay||!shell||!preview||!host||!back||!stage||!product)return;
    root.dataset.bzMobileSharedPassPreviewReady='1';

    /* Move the existing product shell, not a clone. Keeping #bz1092-product-commercial-late
       around the pass preserves all canonical pricing-register selectors. */
    var originalParent=product.parentNode;
    var originalNext=product.nextSibling;
    var open=false;
    var opener=null;

    function isMobile(){return mq?mq.matches:window.innerWidth<=980;}
    function restoreStage(){
      if(product.parentNode===originalParent)return;
      if(originalNext&&originalNext.parentNode===originalParent)originalParent.insertBefore(product,originalNext);
      else originalParent.appendChild(product);
    }
    function setShellAvailable(value){
      if(value){
        try{shell.inert=false;}catch(_){shell.removeAttribute('inert');}
        shell.removeAttribute('aria-hidden');
      }else{
        try{shell.inert=true;}catch(_){shell.setAttribute('inert','');}
        shell.setAttribute('aria-hidden','true');
      }
    }
    function openPreview(trigger){
      if(open)return true;
      if(!isMobile()||!root.classList.contains('bz-mobile-nav-open'))return false;
      opener=trigger||document.activeElement;
      open=true;
      setShellAvailable(false);
      preview.setAttribute('aria-hidden','false');
      try{preview.inert=false;}catch(_){preview.removeAttribute('inert');}
      host.appendChild(product);
      host.scrollTop=0;
      root.classList.add('bz-mobile-pass-preview');
      window.dispatchEvent(new CustomEvent('bz:pass-preview-open',{detail:{source:'mobile-menu'}}));
      requestAnimationFrame(function(){requestAnimationFrame(function(){back.focus({preventScroll:true});});});
      return true;
    }
    function closePreview(options){
      options=options||{};
      if(!open)return;
      open=false;
      root.classList.remove('bz-mobile-pass-preview');
      restoreStage();
      preview.setAttribute('aria-hidden','true');
      try{preview.inert=true;}catch(_){preview.setAttribute('inert','');}
      setShellAvailable(true);
      host.scrollTop=0;
      window.dispatchEvent(new CustomEvent('bz:pass-preview-close',{detail:{source:options.reason||'back'}}));
      if(options.restoreFocus!==false&&root.classList.contains('bz-mobile-nav-open')){
        requestAnimationFrame(function(){(opener&&opener.focus?opener:root.querySelector('.bz-mobile-nav-cta')).focus({preventScroll:true});});
      }
    }

    back.addEventListener('click',function(e){e.preventDefault();closePreview({reason:'back',restoreFocus:true});});
    window.addEventListener('bz-mobile-nav-state',function(e){if(open&&(!e.detail||e.detail.open===false))closePreview({reason:'menu-close',restoreFocus:false});});
    window.addEventListener('resize',function(){if(open&&!isMobile()&&window.BZMobileNavigation)window.BZMobileNavigation.close({restoreFocus:false,unlock:true});},{passive:true});
    if(mq){var onChange=function(e){if(open&&!e.matches&&window.BZMobileNavigation)window.BZMobileNavigation.close({restoreFocus:false,unlock:true});};if(mq.addEventListener)mq.addEventListener('change',onChange);else if(mq.addListener)mq.addListener(onChange);}

    window.BZSharedPassPreview={open:openPreview,close:closePreview,isOpen:function(){return open;}};
  });
})();
;
