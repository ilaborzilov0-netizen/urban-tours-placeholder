(function(){
  'use strict';
  var root=document.querySelector('[data-bz-product-router]');
  if(!root||root.dataset.ready==='1')return;
  root.dataset.ready='1';
  function track(name,extra){
    var payload=Object.assign({event:name,source:'product_router'},extra||{});
    window.dataLayer=window.dataLayer||[];window.dataLayer.push(payload);
    try{window.dispatchEvent(new CustomEvent('bz:analytics',{detail:payload}))}catch(e){}
  }
  var fast=root.querySelector('.bz-product-router__lane--fast');
  var bot=root.querySelector('[data-bz-product-router-bot]');
  var explain=root.querySelector('[data-bz-product-router-explain]');
  var botDialog=document.getElementById('bz-product-router-bot-dialog');
  var botClose=botDialog&&botDialog.querySelector('[data-bz-product-router-bot-close]');
  var botPreviousFocus=null;
  var fastTrackLocked=false;
  function openBotDialog(){
    if(!botDialog)return;
    botPreviousFocus=document.activeElement;
    if(typeof botDialog.showModal==='function')botDialog.showModal();
    else botDialog.setAttribute('open','');
    var first=botDialog.querySelector('a[href]');
    if(first)requestAnimationFrame(function(){first.focus({preventScroll:true});});
  }
  function closeBotDialog(){
    if(!botDialog)return;
    if(typeof botDialog.close==='function'&&botDialog.open)botDialog.close();
    else botDialog.removeAttribute('open');
    if(botPreviousFocus&&botPreviousFocus.focus)setTimeout(function(){botPreviousFocus.focus({preventScroll:true});},0);
  }
  if(fast){
    document.addEventListener('click',function(e){
      var hit=e.target&&e.target.closest&&e.target.closest('.bz-product-router__lane--fast');
      if(!hit||hit!==fast||fastTrackLocked)return;
      fastTrackLocked=true;
      track('product_router_fast_click');
      track('commercial_drawer_open_from_product_router');
      setTimeout(function(){fastTrackLocked=false;},750);
    },true);
  }
  if(bot){
    bot.addEventListener('click',function(){track('product_router_bot_click');openBotDialog();});
  }
  if(botClose)botClose.addEventListener('click',closeBotDialog);
  if(botDialog){
    botDialog.addEventListener('click',function(e){if(e.target===botDialog)closeBotDialog();});
    botDialog.addEventListener('cancel',function(e){e.preventDefault();closeBotDialog();});
    botDialog.querySelectorAll('[data-bz-product-router-bot-link]').forEach(function(link){
      link.addEventListener('click',function(){track('product_router_bot_platform_click',{platform:link.getAttribute('data-bz-product-router-bot-link')});});
    });
  }
  if(explain){
    explain.addEventListener('click',function(){
      track('product_router_explain_click');
      var target=document.getElementById('bz-d10');
      if(!target)return;
      var reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      target.scrollIntoView({behavior:reduced?'auto':'smooth',block:'start'});
    });
  }
  document.addEventListener('click',function(e){
    var tariff=e.target.closest&&e.target.closest('#bz1092-product-commercial-late [data-tariff-select]');
    if(tariff)track('commercial_drawer_tariff_select',{tariff_index:tariff.closest('[data-tariff-index]')&&tariff.closest('[data-tariff-index]').getAttribute('data-tariff-index')});
  });
})();
