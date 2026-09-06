(function(){
  'use strict';
  var LOCAL = location.hostname === '127.0.0.1' || location.hostname === 'localhost';
  var API_BASE = LOCAL ? '' : 'https://api.ne-sila-voli.online';
  var ENDPOINT = API_BASE + '/api/site-events';
  var METRIKA_ID = 110906734;
  function rid(prefix){
    try{return prefix+Array.from(crypto.getRandomValues(new Uint32Array(4))).join('-');}
    catch(e){return prefix+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);}
  }
  var visitor=localStorage.getItem('method_visitor_id');
  if(!visitor){visitor=rid('v_');localStorage.setItem('method_visitor_id',visitor);}
  var session=sessionStorage.getItem('method_session_id');
  if(!session){session=rid('s_');sessionStorage.setItem('method_session_id',session);}
  var metrikaClientId='';
  function loadMetrikaClientId(){
    try{
      if(typeof window.ym!=='function') return;
      window.ym(METRIKA_ID,'getClientID',function(cid){metrikaClientId=String(cid||'');});
    }catch(e){}
  }
  function send(type,meta){
    var body=JSON.stringify({
      event_type:type,
      visitor_id:visitor,
      session_id:session,
      source:'site',
      meta:Object.assign({
        path:location.pathname,
        referrer:document.referrer||'',
        metrika_counter:METRIKA_ID,
        metrika_client_id:metrikaClientId||null
      },meta||{})
    });
    try{
      if(navigator.sendBeacon && document.visibilityState==='hidden'){
        navigator.sendBeacon(ENDPOINT,new Blob([body],{type:'text/plain;charset=UTF-8'}));
        return;
      }
      fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'text/plain;charset=UTF-8'},body:body,keepalive:true,credentials:'omit'}).catch(function(){});
    }catch(e){}
  }
  loadMetrikaClientId();
  send('SITE_VISIT');
  var active=0,last=performance.now(),a15=false,a30=false;
  function isActive(){return document.visibilityState==='visible' && document.hasFocus();}
  setInterval(function(){
    var now=performance.now(),d=now-last;last=now;
    if(!isActive()) return;
    active+=Math.min(d,1000);
    if(!a15 && active>=15000){a15=true;send('SITE_ENGAGED',{seconds:15});}
    if(!a30 && active>=30000){a30=true;send('SITE_ENGAGED',{seconds:30});}
  },500);
  ['focus','blur','visibilitychange'].forEach(function(ev){window.addEventListener(ev,function(){last=performance.now();},{passive:true});});
  document.addEventListener('click',function(e){
    var a=e.target.closest && e.target.closest('[data-max-cta]');
    if(a) send('MAX_CTA_CLICK',{href:a.href});
  },{passive:true});
})();
