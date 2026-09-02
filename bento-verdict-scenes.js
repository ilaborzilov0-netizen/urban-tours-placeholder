/* owner:bz-bento-final-sequence-static-0347 — final product island owns bento -> sharp questions -> quiet confession -> final hit. */
(function(){
'use strict';
function mount(){
  var host=document.querySelector('[data-bz-final-decision-host="0339"]');
  if(!host)return false;
  var sharp=host.querySelector(':scope > [data-bz-sharp-questions]');
  var confession=host.querySelector(':scope > [data-bz-final-confession="0347"]');
  var footer=host.querySelector(':scope > footer.bz1092-action');
  if(!sharp||!confession||!footer||sharp.nextElementSibling!==confession||confession.nextElementSibling!==footer)return false;
  sharp.dataset.bzMountedVariant='42';
  confession.dataset.bzMountedVariant='42';
  document.documentElement.classList.add('bz-final-sequence-ready');
  var lab=document.querySelector('#bz1092-product-lab[data-bz-late-product-island="0339"]');
  if(lab)lab.classList.add('bz-final-sequence-ready');
  return true;
}
function init(){
  if(mount())return;
  var attempts=0,timer=setInterval(function(){attempts+=1;if(mount()||attempts>=40)clearInterval(timer);},100);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
window.addEventListener('pageshow',mount,{passive:true});
})();
