/* owner:pass-light-gallery-0370
   Locked production light preset for the final ticket.
   Variant: 00 / no light. No tuner UI. */
(function(){
  'use strict';
  if(window.__BZPassLightGallery0370)return;
  window.__BZPassLightGallery0370=true;

  var ticket=document.querySelector('#bz1092-product-commercial-late .pricing-register__register');
  if(!ticket) return;
  function setVar(name, value){ ticket.style.setProperty(name, value); }
  var transparent='linear-gradient(0deg, rgba(255,255,255,0), rgba(255,255,255,0))';

  setVar('--bz-gallery-register-top-a', '.030');
  setVar('--bz-gallery-register-top-fade-a', '.008');
  setVar('--bz-gallery-register-bottom-a', '.036');
  setVar('--bz-gallery-action-top-a', '.020');
  setVar('--bz-gallery-action-bottom-a', '.030');
  setVar('--bz-gallery-register-glint-1', transparent);
  setVar('--bz-gallery-register-glint-2', transparent);
  setVar('--bz-gallery-action-glint-1', transparent);
  setVar('--bz-gallery-action-glint-2', transparent);

  ticket.setAttribute('data-bz-pass-light-preset', '0');
  ticket.setAttribute('data-bz-pass-light-name', 'Без света');
})();
