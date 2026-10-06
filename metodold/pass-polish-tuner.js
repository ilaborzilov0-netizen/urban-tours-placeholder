/* owner:pass-polish-lock-0368
   Locked production polish preset over SLAB 5/10.
   Light: 4/15. Depth: 4/15. No tuner UI.
   Light distribution is localized in CSS; JS owns only the locked depth metrics + state markers. */
(function(){
  'use strict';
  if(window.__BZPassPolishLock0368)return;
  window.__BZPassPolishLock0368=true;

  var ticket=document.querySelector('#bz1092-product-commercial-late .pricing-register__register');
  if(!ticket)return;

  function setVar(name,value){ticket.style.setProperty(name,String(value));}

  /* LOCKED depth = 4/15. Exact values preserved from the existing depth scale. */
  setVar('--bz-polish-shadow-y','9.4px');
  setVar('--bz-polish-shadow-blur','22.3px');
  setVar('--bz-polish-shadow-a','.123');
  setVar('--bz-polish-contact-y','2.6px');
  setVar('--bz-polish-contact-blur','6.8px');
  setVar('--bz-polish-contact-a','.067');
  setVar('--bz-polish-bottom-a','.131');
  setVar('--bz-polish-edge-h','3.5px');
  setVar('--bz-polish-edge-a','.233');
  setVar('--bz-polish-edge-shadow-y','2.3px');
  setVar('--bz-polish-edge-shadow-blur','5.6px');
  setVar('--bz-polish-edge-shadow-a','.109');
  setVar('--bz-polish-copper-bottom-y','-2.1px');
  setVar('--bz-polish-copper-bottom-blur','5.1px');
  setVar('--bz-polish-copper-bottom-a','.094');
  setVar('--bz-polish-talk-bottom-a','.066');

  ticket.setAttribute('data-bz-pass-polish-light','4');
  ticket.setAttribute('data-bz-pass-polish-depth','4');
  ticket.setAttribute('data-bz-pass-polish-light-model','localized-specular');
})();
