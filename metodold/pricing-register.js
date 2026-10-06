/* owner:pricing-editorial-register-v03 */
(function(){
  'use strict';
  if(window.__BZPricingEditorialRegisterV03)return;
  window.__BZPricingEditorialRegisterV03=true;

  var ROOT_SELECTOR='[data-pricing-register]';
  var keys=['group'];
  var indices={group:'01'};
  var actionFallback={group:'Оплатить участие'};
  var reduced=window.matchMedia('(prefers-reduced-motion:reduce)');
  var calcFields={cigarettesPerDay:{min:1,max:100},packPrice:{min:50,max:2000}};

  function config(){return window.BZCommercialConfig||null;}
  function moscowTodayUtc(){
    var parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Moscow',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
    var values={};parts.forEach(function(part){if(part.type!=='literal')values[part.type]=Number(part.value);});
    return Date.UTC(values.year,values.month-1,values.day);
  }
  function startUtc(start){
    var parts=String(start&&start.value||start&&start.id||'').split('-').map(Number);
    return parts.length===3&&parts.every(Number.isFinite)?Date.UTC(parts[0],parts[1]-1,parts[2]):NaN;
  }
  function availableStarts(){
    var c=config(),today=moscowTodayUtc();
    var source=window.BZFlowCalendar&&typeof window.BZFlowCalendar.upcoming==='function'?window.BZFlowCalendar.upcoming(4):(c&&Array.isArray(c.flows)?c.flows:[]);
    return source.filter(function(start){
      var time=startUtc(start);
      return start&&start.available!==false&&!start.closed&&Number(start.remaining)!==0&&Number.isFinite(time)&&time>today;
    }).sort(function(a,b){return startUtc(a)-startUtc(b);});
  }
  function flow(){return availableStarts()[0]||((config()||{}).flows||[])[0]||null;}
  function tariff(key){var c=config();return c&&c.tariffs&&c.tariffs[key]||null;}
  function decisionState(){
    var owner=window.BZCommercialDecisionState;
    return owner&&typeof owner.read==='function'?owner.read():{cigarettesPerDay:null,packPrice:null,calculationCompleted:false,selectedStartId:null};
  }
  function updateDecisionState(patch){
    var owner=window.BZCommercialDecisionState;
    return owner&&typeof owner.update==='function'?owner.update(patch):Object.assign({},decisionState(),patch||{});
  }
  function rub(value){return new Intl.NumberFormat('ru-RU').format(Number(value)||0)+' ₽';}
  function offer(){return window.BZCommercialOffer||null;}
  function decisionWindow(){return window.BZDecisionWindow||null;}
  function timeLabel(timestamp){
    if(!Number.isFinite(Number(timestamp)))return '—:—';
    var date=new Date(Number(timestamp));
    return String(date.getHours()).padStart(2,'0')+':'+String(date.getMinutes()).padStart(2,'0');
  }
  function renderDecisionWindow(root,now,opts){
    if(!root)return null;
    opts=opts||{};
    var host=root.querySelector('[data-pricing-decision-window]'),owner=decisionWindow();
    var state=owner&&typeof owner.state==='function'?owner.state(now):{locked:false,active:false,expired:false,progress:0};
    if(!host)return state;
    var wasVisible=!host.hidden&&!host.classList.contains('is-closing');
    var shouldShow=!!state.active;
    var expired=!!(state.locked&&state.expired);
    root.classList.toggle('is-decision-active',shouldShow);
    root.classList.toggle('is-decision-expired',expired);
    if(expired&&opts.animateClose&&!reduced.matches){
      root.classList.remove('is-expiry-morphing');
      void root.offsetWidth;
      root.classList.add('is-expiry-morphing');
      window.clearTimeout(root.__pricingExpiryMorphTimer);
      root.__pricingExpiryMorphTimer=window.setTimeout(function(){root.classList.remove('is-expiry-morphing');},900);
    }
    if(root.__pricingSyncCalculatorDecision)root.__pricingSyncCalculatorDecision({animate:!!opts.animateClose,state:state});
    host.classList.remove('is-expired');
    host.style.setProperty('--pricing-decision-progress',(Math.max(0,Math.min(1,Number(state.progress)||0))*100).toFixed(3)+'%');
    var start=host.querySelector('[data-pricing-decision-start]'),end=host.querySelector('[data-pricing-decision-end]'),meta=host.querySelector('[data-pricing-decision-window-meta]'),row=host.querySelector('[data-pricing-decision-window-row]');
    if(start)start.textContent=timeLabel(state.decisionAt);
    if(end)end.textContent=timeLabel(state.expiresAt);
    if(meta)meta.textContent='ПЕРСОНАЛЬНОЕ · 3 ЧАСА';
    var offerOwner=offer();
    var standardPrice=Number(offerOwner&&offerOwner.standardPrice)||14000;
    var livePrice=offerOwner&&typeof offerOwner.currentPrice==='function'?Number(offerOwner.currentPrice()):standardPrice;
    var discount=Math.max(0,standardPrice-(Number.isFinite(livePrice)?livePrice:standardPrice));
    host.setAttribute('data-pricing-decision-discount',discount?('-'+new Intl.NumberFormat('ru-RU').format(discount)+' ₽'):'');
    if(row&&state.locked)row.setAttribute('aria-label','Время решения '+timeLabel(state.decisionAt)+'. Личное окно до '+timeLabel(state.expiresAt)+'. Текущий момент на линии окна.');
    if(shouldShow){
      window.clearTimeout(host.__pricingDecisionHideTimer);
      host.classList.remove('is-closing');
      host.hidden=false;
      return state;
    }
    if(wasVisible&&!reduced.matches&&opts.animateClose){
      window.clearTimeout(host.__pricingDecisionHideTimer);
      host.style.setProperty('--pricing-decision-collapse-height',Math.ceil(host.getBoundingClientRect().height)+'px');
      void host.offsetHeight;
      host.classList.add('is-closing');
      host.__pricingDecisionHideTimer=window.setTimeout(function(){
        host.hidden=true;
        host.classList.remove('is-closing');
        host.style.removeProperty('--pricing-decision-collapse-height');
      },260);
    }else{
      window.clearTimeout(host.__pricingDecisionHideTimer);
      host.hidden=true;
      host.classList.remove('is-closing');
      host.style.removeProperty('--pricing-decision-collapse-height');
    }
    return state;
  }
  function renderOffer(root,opts){
    if(!root)return;
    opts=opts||{};
    var owner=offer(),standard=root.querySelector('[data-pricing-register-standard-price]'),copy=root.querySelector('[data-pricing-register-offer]');
    var state=renderDecisionWindow(root,null,{animateClose:!!opts.animateDecisionWindowClose});
    var active=!!(state&&state.active&&owner&&typeof owner.active==='function'&&owner.active());
    if(standard){standard.textContent=rub(owner&&owner.standardPrice||14000);standard.hidden=!active;}
    if(copy){copy.textContent='';copy.hidden=true;}
  }
  function price(key){
    var offerOwner=offer();
    if(key==='group'&&offerOwner&&typeof offerOwner.currentPrice==='function')return Number(offerOwner.currentPrice())||0;
    var f=flow(),t=tariff(key);
    if(f&&f.prices&&Number.isFinite(Number(f.prices[key])))return Number(f.prices[key]);
    return Number(t&&t.price)||0;
  }
  function note(key){
    var t=tariff(key)||{};
    if(t.consultRequired)return 'Участие после предварительного созвона';
    var count=Number(t.installments&&t.installments.count)||6;
    var amount=Number(t.installments&&t.installments.amount)||Math.ceil(price(key)/count);
    return amount>0?'Рассрочка от '+rub(amount)+' × '+count:'';
  }
  function item(key){
    var t=tariff(key)||{};
    return {
      key:key,
      index:indices[key],
      name:t.name||'Участие',
      kicker:t.detailKicker||t.badge||'',
      difference:t.difference||t.forWhom||'',
      price:price(key),
      note:note(key),
      action:actionFallback[key]
    };
  }
  function write(root,selector,value){var node=root.querySelector(selector);if(node)node.textContent=value||'';}
  function updateCommercialNode(node,key){
    if(!node)return;
    node.setAttribute('data-plan',key);
    if(node.hasAttribute('data-bz-application-source')){
      node.removeAttribute('data-bzc-plan-open');
      return;
    }
    node.setAttribute('data-bzc-plan-open',key);
  }
  function track(name,extra,opts){
    var payload=Object.assign({
      component:'pricing_editorial_register',
      variant_id:'editorial-v03',
      source:'pricing-editorial-register',
      viewport:window.matchMedia('(max-width:760px)').matches?'mobile':'desktop'
    },extra||{});
    if(typeof window.__bzTrackEvent==='function')return window.__bzTrackEvent(name,payload,opts||{oncePerSession:false});
    window.dataLayer=window.dataLayer||[];
    window.dataLayer.push(Object.assign({event:name},payload));
    if(typeof window.ym==='function'){try{window.ym(110906734,'reachGoal',name,payload);}catch(_ymErr){}}
    return true;
  }
  function setActive(root,key,opts){
    opts=opts||{};
    if(keys.indexOf(key)<0)key='group';
    var previous=root.getAttribute('data-active-plan')||'group';
    if(previous===key&&opts.fromUser)return false;
    var data=item(key);
    root.setAttribute('data-active-plan',key);
    write(root,'[data-pricing-register-counter]','ОДИН ФОРМАТ');
    write(root,'[data-pricing-register-kicker]',data.kicker);
    write(root,'[data-pricing-register-name]',data.name);
    write(root,'[data-pricing-register-difference]',data.difference);
    write(root,'[data-pricing-register-price]',rub(data.price));
    write(root,'[data-pricing-register-note]',data.note);
    renderOffer(root,{animateDecisionWindowClose:!!opts.animateDecisionWindowClose});
    renderNearestStart(root,key);
    write(root,'[data-pricing-register-action-label]',data.action);
    renderCalculatorResult(root);
    var panel=root.querySelector('#pricing-register-panel');
    if(panel){panel.removeAttribute('aria-labelledby');panel.setAttribute('aria-label',data.name||'Участие в практикуме');}
    updateCommercialNode(root.querySelector('[data-pricing-register-details]'),key);
    updateCommercialNode(root.querySelector('[data-pricing-register-action]'),key);
    root.querySelectorAll('[data-pricing-register-plan]').forEach(function(tab){
      var selected=tab.getAttribute('data-pricing-register-plan')===key;
      tab.classList.toggle('is-active',selected);
      tab.setAttribute('aria-selected',selected?'true':'false');
      tab.tabIndex=selected?0:-1;
    });
    if(opts.animate&&!reduced.matches){
      root.classList.remove('is-switching');
      void root.offsetWidth;
      root.classList.add('is-switching');
      window.clearTimeout(root.__pricingRegisterTimer);
      root.__pricingRegisterTimer=window.setTimeout(function(){root.classList.remove('is-switching');},280);
    }
    if(opts.track){
      track('pricing_format_select',{format_id:key,format_name:data.name,format_price:data.price},{oncePerSession:false});
    }
    if(opts.focus){
      var activeTab=root.querySelector('[data-pricing-register-plan="'+key+'"]');
      if(activeTab)activeTab.focus({preventScroll:true});
    }
    return true;
  }
  function hydrate(root){
    renderOffer(root);
    renderNearestStart(root);
    keys.forEach(function(key){
      var data=item(key);
      write(root,'[data-pricing-register-tab-name="'+key+'"]',data.name);
      write(root,'[data-pricing-register-tab-short="'+key+'"]',data.difference);
      write(root,'[data-pricing-register-tab-price="'+key+'"]',rub(data.price));
    });
  }
  function renderNearestStart(root,key){
    var node=root.querySelector('[data-pricing-register-start]');
    if(!node)return;
    var label=node.querySelector('[data-pricing-register-start-label]');
    var value=node.querySelector('[data-pricing-register-start-value]');
    var deadline=node.querySelector('[data-pricing-register-start-deadline]');
    if(!label||!value)return;
    key=keys.indexOf(key)>=0?key:(root.getAttribute('data-active-plan')||'group');
    if(deadline)deadline.hidden=true;
    if(key==='personal'){
      label.textContent='Старт';
      value.textContent='по согласованию';
      if(deadline){deadline.textContent='';deadline.hidden=true;}
      node.hidden=false;
      return;
    }
    var starts=availableStarts();
    var start=starts[0];
    if(!start){node.hidden=true;label.textContent='';value.textContent='';if(deadline){deadline.textContent='';deadline.hidden=true;}return;}
    label.textContent='';
    label.hidden=true;
    value.textContent=String(start.label||'');
    var startTime=startUtc(start),today=moscowTodayUtc();
    var daysUntil=Number.isFinite(startTime)?Math.max(0,Math.round((startTime-today)/86400000)):null;
    if(deadline&&daysUntil!=null){
      var meta=daysUntil===0?'сегодня':daysUntil===1?'завтра':'через '+daysUntil+' '+pluralDays(daysUntil);
      deadline.textContent=meta;
      deadline.hidden=false;
    }
    node.hidden=false;
  }
  function parseNumber(value){
    if(value==null||String(value).trim()==='')return null;
    var number=Number(String(value).replace(/\s+/g,'').replace(',','.'));
    return Number.isFinite(number)?number:null;
  }
  function validCalcValue(name,value){
    var limits=calcFields[name];
    return !!limits&&Number.isFinite(value)&&value>=limits.min&&value<=limits.max;
  }
  function roundSpend(value,step){return Math.round(value/step)*step;}
  function formatSpend(value){return new Intl.NumberFormat('ru-RU').format(Math.round(value))+' ₽';}
  function pluralDays(value){
    var n=Math.abs(Math.round(value))%100,last=n%10;
    if(n>10&&n<20)return 'дней';
    if(last===1)return 'день';
    if(last>1&&last<5)return 'дня';
    return 'дней';
  }
  function calculationFor(root,overridePrice){
    var state=root&&root.__pricingCalculatorState||decisionState();
    var cigarettes=Number(state.cigarettesPerDay),pack=Number(state.packPrice);
    if(!state.calculationCompleted||!validCalcValue('cigarettesPerDay',cigarettes)||!validCalcValue('packPrice',pack))return null;
    var daily=(cigarettes/20)*pack;
    if(!Number.isFinite(daily)||daily<=0)return null;
    var key=root&&root.getAttribute('data-active-plan')||'group';
    var selectedPrice=Number.isFinite(Number(overridePrice))?Number(overridePrice):price(key);
    var monthly=daily*30,annual=daily*365,days=Math.max(1,Math.round(selectedPrice/daily));
    return {
      daily:daily,
      monthly:roundSpend(monthly,monthly<1000?10:100),
      annual:roundSpend(annual,annual<1000?10:1000),
      days:days,
      daysLabel:days+' '+pluralDays(days)
    };
  }
  function renderCalculatorToggleLabel(root){
    if(!root)return;
    var label=root.querySelector('[data-pricing-register-calculator-toggle-label]');
    if(!label)return;
    label.textContent='Сравнить с расходами на курение';
  }
  function renderCalculatorResult(root){
    if(!root)return;
    var result=root.querySelector('[data-pricing-register-calculator-result]');
    if(!result)return;
    var calculation=calculationFor(root);
    var currentPrice=price(root.getAttribute('data-active-plan')||'group');
    write(root,'[data-pricing-register-question-price]',rub(currentPrice));
    renderCalculatorToggleLabel(root,calculation);
    if(!calculation){result.hidden=true;return;}
    write(root,'[data-pricing-register-monthly]','≈ '+formatSpend(calculation.monthly)+' в месяц');
    write(root,'[data-pricing-register-annual]','≈ '+formatSpend(calculation.annual)+' в год');
    write(root,'[data-pricing-register-smoking-days]','примерно '+calculation.daysLabel+' курения');
    write(root,'[data-pricing-register-verdict-price]',rub(price(root.getAttribute('data-active-plan')||'group')));
    write(root,'[data-pricing-register-verdict-days]',calculation.days+' '+pluralDays(calculation.days).toUpperCase());
    result.hidden=false;
  }
  function setCalculatorValidity(root,name,show){
    var field=root.querySelector('[data-pricing-register-field="'+name+'"]');
    if(!field)return true;
    var input=field.querySelector('input'),error=field.querySelector('small');
    var value=parseNumber(input&&input.value),valid=validCalcValue(name,value);
    field.classList.toggle('is-invalid',show&&!valid);
    if(input)input.setAttribute('aria-invalid',show&&!valid?'true':'false');
    if(error)error.hidden=!(show&&!valid);
    return valid;
  }
  function persistCalculator(root){
    var state=root.__pricingCalculatorState;
    var complete=validCalcValue('cigarettesPerDay',state.cigarettesPerDay)&&validCalcValue('packPrice',state.packPrice);
    state.calculationCompleted=complete;
    updateDecisionState({
      cigarettesPerDay:Number.isFinite(state.cigarettesPerDay)?state.cigarettesPerDay:null,
      packPrice:Number.isFinite(state.packPrice)?state.packPrice:null,
      calculationCompleted:complete
    });
    renderCalculatorResult(root);
    window.dispatchEvent(new CustomEvent('bz-pricing-calculation-updated',{detail:{completed:complete}}));
    return complete;
  }
  function initCalculator(root){
    var toggle=root.querySelector('[data-pricing-register-calculator-toggle]');
    var panel=root.querySelector('[data-pricing-register-calculator-panel]');
    if(!toggle||!panel)return;
    var saved=decisionState();
    var state={
      cigarettesPerDay:saved.cigarettesPerDay!==null&&validCalcValue('cigarettesPerDay',Number(saved.cigarettesPerDay))?Number(saved.cigarettesPerDay):null,
      packPrice:saved.packPrice!==null&&validCalcValue('packPrice',Number(saved.packPrice))?Number(saved.packPrice):null,
      calculationCompleted:saved.calculationCompleted===true
    };
    root.__pricingCalculatorState=state;
    var cigarettes=root.querySelector('#pricing-register-cigarettes');
    var pack=root.querySelector('#pricing-register-pack-price');
    var editorialValues={
      cigarettesPerDay:root.querySelector('[data-pricing-register-editorial-value="cigarettesPerDay"]'),
      packPrice:root.querySelector('[data-pricing-register-editorial-value="packPrice"]')
    };
    var editorialRanges={
      cigarettesPerDay:root.querySelector('[data-pricing-register-range="cigarettesPerDay"]'),
      packPrice:root.querySelector('[data-pricing-register-range="packPrice"]')
    };
    var standardInputs={cigarettesPerDay:cigarettes,packPrice:pack};
    function clampRange(name,value){
      var range=editorialRanges[name];
      if(!range||!Number.isFinite(Number(value)))return;
      var min=Number(range.min),max=Number(range.max),next=Math.max(min,Math.min(max,Number(value)));
      range.value=String(next);
    }
    function syncCalculatorControl(name,value,source){
      var normal=standardInputs[name],editorial=editorialValues[name];
      if(normal&&normal!==source)normal.value=Number.isFinite(Number(value))?String(value):'';
      if(editorial&&editorial!==source)editorial.value=Number.isFinite(Number(value))?String(value):'';
      if(Number.isFinite(Number(value)))clampRange(name,value);
    }
    if(state.cigarettesPerDay!==null)syncCalculatorControl('cigarettesPerDay',state.cigarettesPerDay,null);
    if(state.packPrice!==null)syncCalculatorControl('packPrice',state.packPrice,null);
    var calculatorHideTimer=0;
    function setOpen(open,opts){
      opts=opts||{};
      toggle.setAttribute('aria-expanded',open?'true':'false');
      root.classList.toggle('is-calculator-open',open);
      if(calculatorHideTimer){clearTimeout(calculatorHideTimer);calculatorHideTimer=0;}
      panel.classList.remove('is-entering','is-leaving');
      if(open){
        panel.hidden=false;
        if(!reduced.matches&&!opts.instant){void panel.offsetWidth;panel.classList.add('is-entering');}
      }else if(reduced.matches||opts.instant){
        panel.hidden=true;
      }else{
        panel.classList.add('is-leaving');
        calculatorHideTimer=window.setTimeout(function(){
          if(toggle.getAttribute('aria-expanded')!=='true'){panel.hidden=true;panel.classList.remove('is-leaving');}
          calculatorHideTimer=0;
        },180);
      }
      if(opts.track!==false)track('pricing_calculator_toggle',{open:open},{oncePerSession:false});
    }
    root.__pricingCalculatorSetOpen=setOpen;
    root.__pricingSyncCalculatorDecision=function(){
      if(root.__pricingExpiryCalculatorTimer){clearTimeout(root.__pricingExpiryCalculatorTimer);root.__pricingExpiryCalculatorTimer=0;}
      root.__pricingExpiryCalculatorOpened=false;
      if(toggle.getAttribute('aria-expanded')==='true')setOpen(false,{track:false,instant:true});
    };
    setOpen(false,{track:false,instant:true});
    toggle.addEventListener('click',function(){setOpen(toggle.getAttribute('aria-expanded')!=='true');});

    function commitValue(name,value,source,validateStandard){
      state[name]=value;
      syncCalculatorControl(name,value,source);
      if(validateStandard!==false)setCalculatorValidity(root,name,true);
      var wasComplete=state.calculationCompleted;
      var complete=persistCalculator(root);
      if(complete&&!wasComplete)track('pricing_calculator_complete',{cigarettes_per_day:state.cigarettesPerDay,pack_price:state.packPrice},{oncePerSession:false});
      return complete;
    }

    [
      {name:'cigarettesPerDay',input:cigarettes},
      {name:'packPrice',input:pack}
    ].forEach(function(entry){
      if(!entry.input)return;
      entry.input.addEventListener('input',function(){
        var value=parseNumber(entry.input.value);
        commitValue(entry.name,value,entry.input,true);
      });
      entry.input.addEventListener('blur',function(){setCalculatorValidity(root,entry.name,true);});
    });

    Object.keys(editorialValues).forEach(function(name){
      var input=editorialValues[name];
      if(!input)return;
      input.addEventListener('focus',function(){try{input.select();}catch(_selectErr){}});
      input.addEventListener('input',function(){
        var value=parseNumber(input.value);
        var valid=validCalcValue(name,value);
        input.setAttribute('aria-invalid',valid?'false':'true');
        state[name]=value;
        if(valid){syncCalculatorControl(name,value,input);}
        var wasComplete=state.calculationCompleted;
        var complete=persistCalculator(root);
        if(complete&&!wasComplete)track('pricing_calculator_complete',{cigarettes_per_day:state.cigarettesPerDay,pack_price:state.packPrice},{oncePerSession:false});
      });
      input.addEventListener('blur',function(){
        var value=parseNumber(input.value);
        input.setAttribute('aria-invalid',validCalcValue(name,value)?'false':'true');
      });
    });

    Object.keys(editorialRanges).forEach(function(name){
      var range=editorialRanges[name];
      if(!range)return;
      range.addEventListener('input',function(){
        commitValue(name,Number(range.value),range,false);
      });
    });

    panel.querySelectorAll('[data-pricing-register-step]').forEach(function(button){
      button.addEventListener('click',function(){
        var name=button.getAttribute('data-pricing-register-step');
        var delta=Number(button.getAttribute('data-delta'))||0;
        var range=editorialRanges[name];
        var fallback=range?Number(range.value):(name==='packPrice'?250:20);
        var current=validCalcValue(name,Number(state[name]))?Number(state[name]):fallback;
        var next=current+delta;
        if(range){next=Math.max(Number(range.min),Math.min(Number(range.max),next));}
        commitValue(name,next,button,false);
      });
    });

    if(state.calculationCompleted){
      state.calculationCompleted=validCalcValue('cigarettesPerDay',state.cigarettesPerDay)&&validCalcValue('packPrice',state.packPrice);
    }
    renderCalculatorResult(root);
    root.__pricingSyncCalculatorDecision({animate:false});
  }
  function clearCloneSemantics(node){
    node.querySelectorAll('[id]').forEach(function(child){child.removeAttribute('id');});
    node.querySelectorAll('[aria-controls],[aria-labelledby],[aria-selected],[role],[tabindex]').forEach(function(child){
      child.removeAttribute('aria-controls');
      child.removeAttribute('aria-labelledby');
      child.removeAttribute('aria-selected');
      child.removeAttribute('role');
      child.removeAttribute('tabindex');
    });
  }
  function stabilizeLayout(root){
    var register=root.querySelector('.pricing-register__register');
    var activeSource=root.querySelector('.pricing-register__active');
    var actionSource=root.querySelector('.pricing-register__action');
    if(!register||!activeSource||!actionSource)return;
    var previous=register.querySelector('.pricing-register__measure');
    if(previous)previous.remove();

    var stage=document.createElement('div');
    stage.className='pricing-register__measure';
    stage.setAttribute('aria-hidden','true');
    stage.inert=true;
    stage.style.setProperty('--pricing-slot-kicker','0px');
    stage.style.setProperty('--pricing-slot-name','0px');
    stage.style.setProperty('--pricing-slot-difference','0px');
    stage.style.setProperty('--pricing-slot-note','0px');
    stage.style.setProperty('--pricing-slot-action','0px');
    stage.style.setProperty('--pricing-active-stable-height','0px');

    var active=activeSource.cloneNode(true);
    var action=actionSource.cloneNode(true);
    clearCloneSemantics(active);
    clearCloneSemantics(action);
    stage.appendChild(active);
    stage.appendChild(action);
    register.appendChild(stage);

    var kicker=active.querySelector('[data-pricing-register-kicker]');
    var name=active.querySelector('[data-pricing-register-name]');
    var difference=active.querySelector('[data-pricing-register-difference]');
    var priceNode=active.querySelector('[data-pricing-register-price]');
    var noteNode=active.querySelector('[data-pricing-register-note]');
    var actionLabel=action.querySelector('[data-pricing-register-action-label]');
    var maxima={kicker:0,name:0,difference:0,note:0,action:0,active:0};
    function height(node){return node?Math.ceil(node.getBoundingClientRect().height):0;}

    keys.forEach(function(key){
      var data=item(key);
      if(kicker)kicker.textContent=data.kicker;
      if(name)name.textContent=data.name;
      if(difference)difference.textContent=data.difference;
      if(priceNode)priceNode.textContent=rub(data.price);
      if(noteNode)noteNode.textContent=data.note;
      if(actionLabel)actionLabel.textContent=data.action;
      maxima.kicker=Math.max(maxima.kicker,height(kicker));
      maxima.name=Math.max(maxima.name,height(name));
      maxima.difference=Math.max(maxima.difference,height(difference));
      maxima.note=Math.max(maxima.note,height(noteNode));
      maxima.action=Math.max(maxima.action,height(actionLabel));
      maxima.active=Math.max(maxima.active,height(active));
    });

    root.style.setProperty('--pricing-slot-kicker',maxima.kicker+'px');
    root.style.setProperty('--pricing-slot-name',maxima.name+'px');
    root.style.setProperty('--pricing-slot-difference',maxima.difference+'px');
    root.style.setProperty('--pricing-slot-note',maxima.note+'px');
    root.style.setProperty('--pricing-slot-action',maxima.action+'px');
    root.style.setProperty('--pricing-active-stable-height',maxima.active+'px');
    stage.remove();
  }
  function bindStableLayout(root){
    var frame=0,lastWidth=-1;
    function schedule(force){
      window.cancelAnimationFrame(frame);
      frame=window.requestAnimationFrame(function(){
        var width=Math.round(root.getBoundingClientRect().width);
        if(!force&&width===lastWidth)return;
        lastWidth=width;
        stabilizeLayout(root);
      });
    }
    schedule(true);
    if(document.fonts&&document.fonts.ready){document.fonts.ready.then(function(){schedule(true);});}
    window.addEventListener('resize',function(){schedule(false);},{passive:true});
  }
  function initImpression(root){
    var sent=false;
    function send(){
      if(sent)return;
      sent=true;
      var key=root.getAttribute('data-active-plan')||'group',data=item(key);
      track('pricing_section_view',{format_id:key,format_name:data.name,format_price:data.price},{oncePerSession:true});
    }
    if(!('IntersectionObserver' in window)){send();return;}
    var observer=new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting&&entry.intersectionRatio>=.42){send();observer.disconnect();}
      });
    },{threshold:[0,.42,1]});
    observer.observe(root);
  }
  function initIntentTracking(root){
    function intent(node){
      if(!node)return;
      var key=root.getAttribute('data-active-plan')||'group',data=item(key);
      track(node.hasAttribute('data-pricing-register-details')?'pricing_details_open':'pricing_cta_click',{
        format_id:key,
        format_name:data.name,
        format_price:data.price,
        entry_type:'direct-plan'
      },{oncePerSession:false});
    }
    root.addEventListener('pointerdown',function(event){
      var node=event.target.closest('[data-pricing-register-details],[data-pricing-register-action]');
      if(node&&root.contains(node))intent(node);
    },{passive:true});
    root.addEventListener('keydown',function(event){
      if(event.key!=='Enter'&&event.key!==' ')return;
      var node=event.target.closest('[data-pricing-register-details],[data-pricing-register-action]');
      if(node&&root.contains(node))intent(node);
    });
  }
  function createLab(root){
    var params;try{params=new URLSearchParams(location.search);}catch(_paramsErr){return;}
    if(params.get('pricingEditorialLab')!=='1')return;
    var panel=document.createElement('aside');
    panel.className='pricing-register-lab';
    panel.setAttribute('aria-label','Настройки editorial-реестра');
    panel.innerHTML=''
      +'<div class="pricing-register-lab__head"><strong>EDITORIAL REGISTER · LAB</strong><button type="button" aria-label="Закрыть">×</button></div>'
      +'<label>Плотность<select data-pricing-lab="density"><option value="compact">compact</option><option selected value="balanced">balanced</option><option value="airy">airy</option></select></label>'
      +'<label>Активный маркер<select data-pricing-lab="marker"><option value="dark">dark</option><option selected value="copper">copper</option></select></label>'
      +'<label>Высота CTA<select data-pricing-lab="cta-height"><option value="compact">compact</option><option selected value="balanced">balanced</option></select></label>'
      +'<label>Масштаб цены<select data-pricing-lab="price-scale"><option selected value="equal">equal</option><option value="dominant">dominant</option></select></label>'
      +'<label>Высота строк<select data-pricing-lab="row-height"><option value="compact">compact</option><option selected value="balanced">balanced</option></select></label>'
      +'<label>Desktop layout<select data-pricing-lab="desktop-layout"><option selected value="split">split</option><option value="stacked">stacked</option></select></label>';
    document.body.appendChild(panel);
    panel.querySelector('button').addEventListener('click',function(){panel.remove();});
    panel.querySelectorAll('[data-pricing-lab]').forEach(function(control){
      control.addEventListener('input',function(){
        root.setAttribute('data-'+control.getAttribute('data-pricing-lab'),control.value);
        window.requestAnimationFrame(function(){stabilizeLayout(root);});
      });
    });
  }
  function initRoot(root){
    if(root.dataset.pricingRegisterReady==='1')return;
    root.dataset.pricingRegisterReady='1';
    hydrate(root);
    initCalculator(root);
    setActive(root,root.getAttribute('data-active-plan')||'group',{animate:false,track:false});
    bindStableLayout(root);
    root.querySelectorAll('[data-pricing-register-plan]').forEach(function(tab){
      tab.addEventListener('click',function(){
        setActive(root,tab.getAttribute('data-pricing-register-plan'),{fromUser:true,animate:true,track:true});
      });
      tab.addEventListener('keydown',function(event){
        var current=keys.indexOf(tab.getAttribute('data-pricing-register-plan')),next=null;
        if(event.key==='ArrowRight'||event.key==='ArrowDown')next=(current+1)%keys.length;
        if(event.key==='ArrowLeft'||event.key==='ArrowUp')next=(current-1+keys.length)%keys.length;
        if(event.key==='Home')next=0;
        if(event.key==='End')next=keys.length-1;
        if(next===null)return;
        event.preventDefault();
        setActive(root,keys[next],{fromUser:true,animate:true,track:true,focus:true});
      });
    });
    initIntentTracking(root);
    initImpression(root);
    createLab(root);
    if(!root.__pricingDecisionWindowTimer){
      var previousActive=!!(decisionWindow()&&decisionWindow().active&&decisionWindow().active());
      root.__pricingDecisionWindowTimer=window.setInterval(function(){
        if(!document.documentElement.contains(root)){clearInterval(root.__pricingDecisionWindowTimer);root.__pricingDecisionWindowTimer=0;return;}
        var owner=decisionWindow(),state=owner&&owner.state?owner.state():null,active=!!(state&&state.active);
        if(active!==previousActive){
          previousActive=active;
          if(window.BZFlowCalendar&&typeof window.BZFlowCalendar.refreshConfig==='function')window.BZFlowCalendar.refreshConfig(new Date());
          setActive(root,root.getAttribute('data-active-plan')||'group',{animate:false,track:false,animateDecisionWindowClose:!active});
        }else{
          renderDecisionWindow(root);
        }
      },15000);
    }
  }
  function initAll(){document.querySelectorAll(ROOT_SELECTOR).forEach(initRoot);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initAll,{once:true});else initAll();
  window.addEventListener('bz:priority-island-ready',initAll);
  window.addEventListener('bz:flow-calendar-updated',function(){
    document.querySelectorAll(ROOT_SELECTOR).forEach(function(root){
      if(root.dataset.pricingRegisterReady!=='1')return;
      setActive(root,root.getAttribute('data-active-plan')||'group',{animate:false,track:false});
    });
  });
  window.addEventListener('bz:decision-window-change',function(){
    if(window.BZFlowCalendar&&typeof window.BZFlowCalendar.refreshConfig==='function')window.BZFlowCalendar.refreshConfig(new Date());
    document.querySelectorAll(ROOT_SELECTOR).forEach(function(root){
      if(root.dataset.pricingRegisterReady!=='1')return;
      var state=decisionWindow()&&decisionWindow().state?decisionWindow().state():null;
      setActive(root,root.getAttribute('data-active-plan')||'group',{animate:false,track:false,animateDecisionWindowClose:!!(state&&!state.active)});
    });
  });
})();
