/* owner:0701-multi-inline-application
   One state-machine for all inline application slabs.
   Meaning checkpoint and author CTA are independent owners but share delivery/state behavior. */
(function(){
  'use strict';
  if(window.__BZInlineApplication0701)return;
  window.__BZInlineApplication0701=true;

  var owners=[].slice.call(document.querySelectorAll('[data-bz-application-owner]')).filter(function(owner){
    return !!owner.querySelector('[data-bz-inline-application-toggle]') &&
           !!owner.querySelector('[data-bz-inline-application-panel]') &&
           !!owner.querySelector('[data-bz-inline-application-form]');
  });
  if(!owners.length)return;

  var registry=[];
  var channelMeta={
    telegram:{field:'Контакт',placeholder:'@username или телефон',inputmode:'text',autocomplete:'off'},
    max:{field:'Телефон',placeholder:'+7 999 123-45-67',inputmode:'tel',autocomplete:'off'},
    call:{field:'Телефон',placeholder:'+7 999 123-45-67',inputmode:'tel',autocomplete:'off'}
  };

  function prepareAuthorFrame(state){
    if(!state.owner.classList.contains('bz-author-inline-application'))return;
    if(window.innerWidth<=980)return;
    var frame=state.owner.closest('.bz-day-author__frame');
    if(!frame)return;
    var oldOwnerHeight=Math.max(1,state.owner.getBoundingClientRect().height);
    var frameHeight=Math.max(1,frame.getBoundingClientRect().height);
    var panelHeight=Math.max(1,state.panel.scrollHeight);
    var targetOwnerHeight=panelHeight+2;
    var extra=Math.max(0,targetOwnerHeight-oldOwnerHeight);
    frame.style.setProperty('--bz-author-collapsed-frame-height',frameHeight+'px');
    frame.style.setProperty('--bz-author-inline-extra',extra+'px');
    frame.classList.add('bz-author-inline-frame-expanding');
  }

  function resetAuthorFrame(state){
    if(!state.owner.classList.contains('bz-author-inline-application'))return;
    var frame=state.owner.closest('.bz-day-author__frame');
    if(!frame)return;
    frame.classList.remove('bz-author-inline-frame-expanding');
    frame.style.removeProperty('--bz-author-collapsed-frame-height');
    frame.style.removeProperty('--bz-author-inline-extra');
  }

  function init(owner){
    var toggle=owner.querySelector('[data-bz-inline-application-toggle]');
    var panel=owner.querySelector('[data-bz-inline-application-panel]');
    var form=owner.querySelector('[data-bz-inline-application-form]');
    var success=owner.querySelector('[data-bz-inline-application-success]');
    var reset=owner.querySelector('[data-bz-inline-application-reset]');
    var contactLabel=owner.querySelector('[data-bz-inline-contact-label]');
    var contactInput=owner.querySelector('[data-bz-inline-contact-input]');
    if(!toggle||!panel||!form||!contactLabel||!contactInput)return null;

    var radios=[].slice.call(form.querySelectorAll('input[name="contact_type"]'));
    var source=owner.getAttribute('data-bz-application-source')||'inline-application';
    var state={owner:owner,toggle:toggle,panel:panel,form:form,success:success,reset:reset,contactLabel:contactLabel,contactInput:contactInput,radios:radios,source:source};

    function selectedChannel(){
      var current=radios.find(function(r){return r.checked;});
      return current?String(current.value||'telegram'):'telegram';
    }
    function syncChannel(){
      var meta=channelMeta[selectedChannel()]||channelMeta.telegram;
      contactLabel.textContent=meta.field;
      contactInput.placeholder=meta.placeholder;
      contactInput.setAttribute('inputmode',meta.inputmode);
      contactInput.setAttribute('autocomplete',meta.autocomplete);
    }
    function expand(opts){
      opts=opts||{};
      if(owner.classList.contains('is-expanded'))return;
      panel.hidden=false;
      panel.setAttribute('aria-hidden','false');
      prepareAuthorFrame(state);
      window.requestAnimationFrame(function(){
        owner.classList.add('is-expanded');
        toggle.setAttribute('aria-expanded','true');
      });
    }
    function collapse(){
      owner.classList.remove('is-expanded','is-success');
      toggle.setAttribute('aria-expanded','false');
      panel.setAttribute('aria-hidden','true');
      if(success)success.hidden=true;
      form.hidden=false;
      window.setTimeout(function(){
        if(!owner.classList.contains('is-expanded')){
          panel.hidden=true;
          resetAuthorFrame(state);
        }
      },520);
    }

    state.expand=expand;
    state.collapse=collapse;
    state.syncChannel=syncChannel;

    toggle.addEventListener('click',function(){
      if(owner.classList.contains('is-expanded')){
        owner.scrollIntoView({behavior:'smooth',block:'nearest'});
        return;
      }
      expand({focus:false});
    });

    radios.forEach(function(radio){radio.addEventListener('change',syncChannel);});
    form.addEventListener('input',function(event){
      var field=event.target&&event.target.closest?event.target.closest('[data-bz-inline-field]'):null;
      if(field)field.classList.remove('is-invalid');
      if(event.target&&event.target.removeAttribute)event.target.removeAttribute('aria-invalid');
    },{passive:true});
    form.addEventListener('change',function(event){
      var field=event.target&&event.target.closest?event.target.closest('[data-bz-inline-field]'):null;
      if(field)field.classList.remove('is-invalid');
      if(event.target&&event.target.removeAttribute)event.target.removeAttribute('aria-invalid');
    },{passive:true});

    if(reset){
      reset.addEventListener('click',function(){
        try{form.reset();}catch(_){ }
        radios.forEach(function(r){if(r.value==='telegram')r.checked=true;});
        syncChannel();
        if(success)success.hidden=true;
        form.hidden=false;
        owner.classList.remove('is-success');
        owner.classList.add('is-expanded');
        panel.hidden=false;
        panel.setAttribute('aria-hidden','false');
        prepareAuthorFrame(state);
      });
    }

    // Clean first frame: no persisted DOM/hash state may auto-open an inline form.
    owner.classList.remove('is-expanded','is-success');
    toggle.setAttribute('aria-expanded','false');
    panel.hidden=true;
    panel.setAttribute('aria-hidden','true');
    form.hidden=false;
    if(success)success.hidden=true;
    resetAuthorFrame(state);
    syncChannel();
    form.setAttribute('data-bz-application-source',source);
    return state;
  }

  owners.forEach(function(owner){
    var state=init(owner);
    if(state)registry.push(state);
  });

  function meaningState(){
    return registry.find(function(state){return state.owner.id==='bz-application-request';})||null;
  }
  function scrollMeaningHash(){
    var state=meaningState();
    if(!state)return;
    state.owner.scrollIntoView({behavior:'smooth',block:'start'});
  }

  // Other application checkpoints intentionally route only to the meaning inline owner.
  document.addEventListener('click',function(event){
    var link=event.target&&event.target.closest?event.target.closest('a[href="#bz-application-request"],button[data-bz-inline-application-open]'):null;
    if(!link)return;
    var state=meaningState();
    if(!state||link===state.toggle)return;
    event.preventDefault();
    event.stopPropagation();
    if(typeof event.stopImmediatePropagation==='function')event.stopImmediatePropagation();
    if(location.hash!=='#bz-application-request'){
      if(history.pushState)history.pushState(null,'','#bz-application-request');
      else location.hash='bz-application-request';
    }
    state.expand({focus:false});
    state.owner.scrollIntoView({behavior:'smooth',block:'start'});
  },true);

  // Persisted hash may scroll to the meaning checkpoint, but never auto-opens it.
  if(location.hash==='#bz-application-request')window.requestAnimationFrame(scrollMeaningHash);

  function refresh(owner){
    var state=registry.find(function(item){return item.owner===owner;});
    if(!state)return;
    if(state.owner.classList.contains('bz-author-inline-application')){
      resetAuthorFrame(state);
      state.panel.hidden=false;
      prepareAuthorFrame(state);
    }
  }

  window.BZInlineApplications={refresh:refresh,registry:registry};

  window.addEventListener('resize',function(){
    registry.forEach(function(state){
      if(!state.owner.classList.contains('bz-author-inline-application'))return;
      if(state.owner.classList.contains('is-expanded')){
        resetAuthorFrame(state);
        state.panel.hidden=false;
        prepareAuthorFrame(state);
      }
    });
  },{passive:true});
})();
