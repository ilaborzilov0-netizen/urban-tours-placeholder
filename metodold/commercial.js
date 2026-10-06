/* lazy commercial canonical module */
(function(){
  'use strict';
  if(window.__BZCommercialUltimate2011)return;
  window.__BZCommercialUltimate2011=true;

  var CONFIG=window.BZCommercialConfig;
  if(!CONFIG){console.error('BZCommercialConfig is required');return;}

  function ready(fn){if(document.readyState==='loading')fn();else fn();}
  function rub(n){return new Intl.NumberFormat('ru-RU').format(n)+' ₽';}
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];});}
  function devMode(){try{return new URLSearchParams(location.search).get('payment_dev')==='1';}catch(e){return false;}}

  ready(function(){
    var layer=document.getElementById('bz-commercial-layer'); if(!layer)return;
    var panel=layer.querySelector('.bz-commercial-panel');
    var scroller=layer.querySelector('[data-bzc-scroll]');
    var head=layer.querySelector('.bz-commercial-head');
    var headKicker=layer.querySelector('[data-bzc-head-kicker]');
    var headTitle=layer.querySelector('[data-bzc-head-title]');
    var headMeta=layer.querySelector('[data-bzc-head-meta]');
    var back=layer.querySelector('[data-bzc-back]');
    var views=[].slice.call(layer.querySelectorAll('[data-bzc-view]'));
    var tariffsHost=layer.querySelector('[data-bzc-tariffs]');
    var personalHost=layer.querySelector('[data-bzc-personal-host]');
    var productModeTabs=[].slice.call(layer.querySelectorAll('[data-bzc-product-mode]'));
    var productModePanels=[].slice.call(layer.querySelectorAll('[data-bzc-product-panel]'));
    var checkoutHost=layer.querySelector('[data-bzc-checkout]');
    var readinessHost=layer.querySelector('[data-bzc-readiness]');
    var paymentStateHost=layer.querySelector('[data-bzc-payment-state]');
    var decisionHost=layer.querySelector('[data-bzc-decision-host]'),decisionInline=layer.querySelector('[data-bzc-decision-inline]');
    var supportMenu=layer.querySelector('[data-bzc-support-menu]');
    var supportMenuHome=supportMenu?supportMenu.parentNode:null;
    var supportMenuNext=supportMenu?supportMenu.nextSibling:null;
    function isMobileSupportModal(){return matchMedia('(max-width:760px)').matches;}
    function mountSupportMenu(){
      if(!supportMenu)return;
      if(isMobileSupportModal()&&supportMenu.parentNode!==layer)layer.appendChild(supportMenu);
      else if(!isMobileSupportModal()&&supportMenuHome&&supportMenu.parentNode!==supportMenuHome)supportMenuHome.insertBefore(supportMenu,supportMenuNext);
    }
    function openSupportMenu(){
      if(!supportMenu)return;
      mountSupportMenu();
      supportMenu.hidden=false;
      layer.classList.toggle('is-support-modal-open',isMobileSupportModal());
      var toggle=layer.querySelector('[data-bzc-support-menu-toggle]');
      if(toggle)toggle.setAttribute('aria-expanded','true');
      setSupportPersonalExpanded(false);
    }
    function closeSupportMenu(){
      if(supportMenu)supportMenu.hidden=true;
      layer.classList.remove('is-support-modal-open');
      var toggle=layer.querySelector('[data-bzc-support-menu-toggle]');
      if(toggle)toggle.setAttribute('aria-expanded','false');
      setSupportPersonalExpanded(false);
      if(!isMobileSupportModal())mountSupportMenu();
    }

    var state={
      lifecycle:'closed',open:false,view:'checkout',previousView:'checkout',flowId:CONFIG.flows[0].id,
      plan:'group',planExplicit:true,productMode:'group',method:'full',paymentState:'before',source:'drawer',opener:null,scrollY:0,pushed:false,
      successType:'application',contactTarget:'team',supportTopic:'',requestMode:'',requestBlocker:'',seatsTrackKey:'',readiness:{time:false,sleep:false,tasks:false},paymentStarting:false,dirty:false,blocker:'',viewedBlockers:{},mobileDecisionOpen:false,mobileDecisionDetail:false,mobileDecisionSheet:false,tariffDetailsOpen:false,customer:{name:'',email:'',phone:''}
    };
    try{var restoredDecision=JSON.parse(localStorage.getItem('bz-commercial-decision-context')||'null');if(restoredDecision){if(CONFIG.tariffs[restoredDecision.plan])state.plan=restoredDecision.plan;if(restoredDecision.planExplicit===true)state.planExplicit=true;if(CONFIG.flows.some(function(x){return x.id===restoredDecision.flowId;}))state.flowId=restoredDecision.flowId;if(restoredDecision.method==='full'||restoredDecision.method==='installment')state.method=restoredDecision.method;if(restoredDecision.blocker)state.blocker=restoredDecision.blocker;if(restoredDecision.viewedBlockers&&typeof restoredDecision.viewedBlockers==='object')state.viewedBlockers=restoredDecision.viewedBlockers;}}catch(_restoreDecisionErr){}
    try{var restoredCommercialState=window.BZCommercialDecisionState&&window.BZCommercialDecisionState.read?window.BZCommercialDecisionState.read():null;if(restoredCommercialState&&CONFIG.flows.some(function(x){return x.id===restoredCommercialState.selectedStartId;}))state.flowId=restoredCommercialState.selectedStartId;}catch(_restoreCommercialStateErr){}
    if(state.plan==='extended'){state.plan='group';state.planExplicit=true;state.productMode='group';}

    function flow(){return CONFIG.flows.filter(function(x){return x.id===state.flowId;})[0]||availableFlows()[0]||CONFIG.flows[0];}
    var FINAL_BONUS_PRICE=14000;
    var FINAL_BONUS_END_MS=Date.parse('2026-08-30T12:00:00+03:00');
    var FINAL_BONUS_ID='final-14000-until-2026-08-30';
    function finalBonusActive(){return state.source==='pricing-final-payment'&&Date.now()<FINAL_BONUS_END_MS;}
    function tariffFor(key){
      var base=CONFIG.tariffs[key]||CONFIG.tariffs.group;
      var f=flow();
      var price=f&&f.prices&&Number.isFinite(Number(f.prices[key]))?Number(f.prices[key]):base.price;
      if(key==='group'&&finalBonusActive())price=FINAL_BONUS_PRICE;
      var result=Object.assign({},base,{price:price});
      if(base.installments){
        result.installments=Object.assign({},base.installments,{amount:key==='personal'?base.installments.amount:Math.ceil(price/6)});
      }
      return result;
    }
    function plan(){return tariffFor(state.plan);}
    function installmentFrom(p){return p&&p.installments&&p.installments.amount?p.installments.amount:Math.ceil((p&&p.price?p.price:0)/6);}
    function pluralRu(value,one,few,many){var n=Math.abs(Math.round(value))%100,last=n%10;if(n>10&&n<20)return many;if(last===1)return one;if(last>1&&last<5)return few;return many;}
    function pricingDecisionState(){var owner=window.BZCommercialDecisionState;return owner&&typeof owner.read==='function'?owner.read():{cigarettesPerDay:null,packPrice:null,calculationCompleted:false,selectedStartId:null};}
    function pricingCalculation(price){var saved=pricingDecisionState(),daily=Number(saved.cigarettesPerDay),pack=Number(saved.packPrice);if(saved.calculationCompleted!==true||!Number.isFinite(daily)||daily<1||daily>100||!Number.isFinite(pack)||pack<50||pack>2000)return null;var spend=(daily/20)*pack;if(!Number.isFinite(spend)||spend<=0)return null;var days=Math.max(1,Math.round(Number(price)/spend));return{days:days,label:'примерно '+days+' '+pluralRu(days,'день','дня','дней')+' курения'};}
    function pricingCalculationMarkup(price,extraClass){var calculation=pricingCalculation(price);return calculation?'<small class="bz-commercial-pricing-calc-note '+(extraClass||'')+'">По вашему расчёту — <strong>'+esc(calculation.label)+'</strong></small>':'';}
    function methodLabel(){return 'Через платёжный сервис';}
    function track(name,extra){var f=flow();var payload=Object.assign({event:name,flow:f.id,start_date:f.label,capacity:f.capacity,remaining_places:f.remaining,tariff:plan().name,payment_method:state.method,source_cta:state.source,device:matchMedia('(max-width:760px)').matches?'mobile':'desktop'},extra||{});window.dataLayer=window.dataLayer||[];window.dataLayer.push(payload);window.dispatchEvent(new CustomEvent('bz-commercial-analytics',{detail:payload}));}
    function sourceFromElement(el){
      if(!el)return'drawer';
      var explicit=el.getAttribute('data-bzc-source');if(explicit)return explicit;if(el.classList.contains('bz-mobile-nav-cta')||el.closest('.bz-mobile-nav-sheet')||(window.BZMobileNavigation&&window.BZMobileNavigation.isOpen&&window.BZMobileNavigation.isOpen()))return'mobile-menu';
      if(el.closest('#bz-hero'))return'hero-primary';
      if(el.classList.contains('bz-nav-btn'))return'navigation';
      if(el.classList.contains('bz-start-tag'))return'start-tag';
      if(el.classList.contains('bz244-start-floating'))return'floating-cta';
      var id=el.id?('id:'+el.id):'';
      var label=(el.textContent||'').replace(/\s+/g,' ').trim().slice(0,54);
      return id||('page-cta:'+(label||'conditions'));
    }


    /* The commercial layer is mounted outside #borzilov-lp, so it does not
       inherit the main page's class-scoped architecture selectors. Its
       content is rendered dynamically; assign the accepted pack-03 radius
       roles synchronously after each render, without observers or timers. */
    function applyCommercialArchitecture(){
      var scene=[
        '.bz-commercial-after-selection','.bz-commercial-contact-footer',
        '.bz-commercial-how','.bz-commercial-island','.bz-commercial-method-return',
        '.bz-commercial-payment-faq','.bz-commercial-service-row','.bz-commercial-shell'
      ].join(',');
      var inset=[
        '.bz-commercial-after-selection__flow','.bz-commercial-after-selection__head',
        '.bz-commercial-after-selection__route','.bz-commercial-after-selection__routes',
        '.bz-commercial-choice-summary','.bz-commercial-consult-note',
        '.bz-commercial-cost-body','.bz-commercial-cost-compare','.bz-commercial-error',
        '.bz-commercial-installment-note','.bz-commercial-overview-selection',
        '.bz-commercial-pay-error',
        '.bz-commercial-seat','.bz-commercial-seat-grid','.bz-commercial-seat-status',
        '.bz-commercial-selected-summary'
      ].join(',');
      var object=[
        '.bz-commercial-after-payment','.bz-commercial-checkout-card',
        '.bz-commercial-cost-inputs','.bz-commercial-cost-panel','.bz-commercial-cost-results',
        '.bz-commercial-difference','.bz-commercial-form',
        '.bz-commercial-form-card','.bz-commercial-head-kicker',
        '.bz-commercial-mobile-date-screen','.bz-commercial-plan-detail-kicker',
        '.bz-commercial-plan-details','.bz-commercial-price',
        '.bz-commercial-secondary-action','.bz-commercial-selected-kicker',
        '.bz-commercial-seats','.bz-commercial-state-card','.bz-commercial-tariff',
        '.bz-commercial-tariff-for','.bz-commercial-tariff-spacer',
        '.bz-commercial-tariff-title','.bz-commercial-warmup'
      ].join(',');
      var field=[
        '.bz-commercial-field','.bz-commercial-input','.bz-commercial-select',
        '.bz-commercial-textarea','.bz-commercial-cost-field',
        '.bz-commercial-cost-field input'
      ].join(',');
      var control=[
        '.bz-commercial-back','.bz-commercial-btn','.bz-commercial-close',
        '.bz-commercial-contact-call','.bz-commercial-contact-personal',
        '.bz-commercial-contact-primary','.bz-commercial-cost-toggle',
        '.bz-commercial-cost-mode button',
        '.bz-commercial-drag','.bz-commercial-link-btn',
        '.bz-commercial-number-stepper button','.bz-commercial-plan-details-toggle'
      ].join(',');
      var nodes=[].slice.call(layer.querySelectorAll('*'));
      nodes.forEach(function(el){
        if(el.closest('#author-video'))return;
        if(el.matches('script,style,link,meta,template,noscript,input[type="hidden"],input[type="radio"],input[type="checkbox"]'))return;
        var role='',mask='tl tr br bl';
        if(el.matches('.bz-commercial-panel')){
          role='overlay';
          mask=matchMedia('(max-width:760px)').matches?'tl tr':'tl tr br bl';
        }else if(el.matches('.bz-commercial-head')){
          role='object';mask='tl tr';
        }else if(el.matches('.bz-commercial-route'))role='navigation';
        else if(el.matches('.bz-commercial-badge'))role='status';
        else if(el.matches('.bz-commercial-payment-submit'))role='action-slab';
        else if(el.matches(field))role='field';
        else if(el.matches(control)||el.matches('button,[role="button"]'))role='control';
        else if(el.matches(inset))role='inset';
        else if(el.matches(scene))role='scene';
        else if(el.matches(object))role='object';
        else return;
        el.setAttribute('data-bz1119-radius-role',role);
        el.setAttribute('data-bz1119-mask',mask);
        var overflow=getComputedStyle(el).overflow;
        if(overflow==='hidden'||overflow==='clip')el.setAttribute('data-bz1119-clip','1');
        else el.removeAttribute('data-bz1119-clip');
      });
    }

    function moscowTodayUtc(){
      var parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Moscow',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
      var values={};parts.forEach(function(part){if(part.type!=='literal')values[part.type]=Number(part.value);});
      return Date.UTC(values.year,values.month-1,values.day);
    }
    function flowStartUtc(f){
      var parts=String(f.id||'').split('-').map(Number);
      return parts.length===3&&parts.every(Number.isFinite)?Date.UTC(parts[0],parts[1]-1,parts[2]):NaN;
    }
    function pluralDays(value){
      var n=Math.abs(value)%100,n1=n%10;
      if(n>10&&n<20)return 'дней';
      if(n1>1&&n1<5)return 'дня';
      if(n1===1)return 'день';
      return 'дней';
    }
    function pluralPlaces(value){
      var n=Math.abs(value)%100,n1=n%10;
      if(n>10&&n<20)return 'мест';
      if(n1===1)return 'место';
      if(n1>1&&n1<5)return 'места';
      return 'мест';
    }
    function flowTiming(f){
      var days=Math.round((flowStartUtc(f)-moscowTodayUtc())/86400000);
      var closed=f.available===false||!!f.closed||f.remaining<=0;
      if(closed)return{days:days,label:'Набор закрыт',selectable:false,action:'Набор закрыт'};
      if(days<=0)return{days:days,label:'Поток уже начался',selectable:false,action:'Поток начался'};
      if(days===1)return{days:days,label:'Старт завтра',selectable:true,action:'Выбрать →'};
      return{days:days,label:'До старта — '+days+' '+pluralDays(days),selectable:true,action:'Выбрать →'};
    }
    function availableFlows(){var source=window.BZFlowCalendar&&typeof window.BZFlowCalendar.upcoming==='function'?window.BZFlowCalendar.upcoming(2):CONFIG.flows;return source.filter(function(f){return flowTiming(f).selectable;}).sort(function(a,b){return flowStartUtc(a)-flowStartUtc(b);}).slice(0,2);}
    function flowTabsMarkup(){
      var available=availableFlows();
      if(!available.length)return '';
      if(!available.some(function(f){return f.id===state.flowId;}))state.flowId=available[0].id;
      if(window.BZCommercialDecisionState&&window.BZCommercialDecisionState.update)window.BZCommercialDecisionState.update({selectedStartId:state.flowId});
      return available.map(function(f,index){
        var timing=flowTiming(f),selected=f.id===state.flowId;
        var meta=timing.days===0?'сегодня':timing.days===1?'завтра':'через '+timing.days+' '+pluralDays(timing.days);
        return '<button type="button" role="tab" id="bzc-flow-tab-'+index+'" class="bz-commercial-flow-tab '+(selected?'is-selected':'')+'" data-bzc-flow="'+esc(f.id)+'" aria-selected="'+(selected?'true':'false')+'" aria-controls="bzc-monolith-detail-panel" tabindex="'+(selected?'0':'-1')+'"><strong>'+esc(f.label)+'</strong><small>'+esc(meta)+'</small></button>';
      }).join('');
    }
    function flowChoiceMarkup(){var tabs=flowTabsMarkup(),count=availableFlows().length;if(!tabs)return '';return '<section class="bz-commercial-start-choice" aria-label="Выберите поток"><span>ВЫБЕРИТЕ ПОТОК</span><div class="bz-commercial-flow-tabs '+(count===1?'is-single':'')+'" role="tablist" aria-label="Дата старта">'+tabs+'</div></section>';}
    function renderDates(){
      flowTabsMarkup();
    }


    function applyProductMode(opts){
      opts=opts||{};
      var mode=state.productMode==='personal'?'personal':'group';
      productModeTabs.forEach(function(tab){
        var active=tab.getAttribute('data-bzc-product-mode')===mode;
        tab.classList.toggle('is-active',active);
        tab.setAttribute('aria-selected',active?'true':'false');
        tab.tabIndex=active?0:-1;
      });
      productModePanels.forEach(function(panelNode){
        var active=panelNode.getAttribute('data-bzc-product-panel')===mode;
        panelNode.hidden=!active;
        panelNode.classList.toggle('is-active',active);
      });
      layer.setAttribute('data-bzc-product-mode',mode);
      if(!opts.keepScroll&&scroller&&state.view==='overview')scroller.scrollTop=0;
    }

    function setProductMode(mode,opts){
      var next=mode==='personal'?'personal':'group';
      if(state.productMode===next){applyProductMode(opts);return;}
      state.productMode=next;
      applyProductMode(opts);
      track('commercial_product_mode_changed',{product_mode:next});
    }

    function renderTariffs(){
      if(!tariffsHost)return;
      var groupKeys=['group'],f=flow();
      var activeKey=groupKeys.indexOf(state.plan)!==-1?state.plan:'group';
      var activePlan=tariffFor(activeKey);
      var personalPlan=tariffFor('personal');
      var floorDifference=function(){return '14 дней · мини-группа';};
      var buttonLabel='Войти в программу';

      var selector=groupKeys.map(function(key,index){
        var p=tariffFor(key),active=key===activeKey;
        return '<article class="bz-commercial-tariff-floor '+(active?'is-active ':'')+'" data-bzc-plan-floor="'+key+'">'
          +'<button class="bz-commercial-tariff-floor__summary" type="button" data-bzc-monolith-plan="'+key+'" aria-pressed="'+(active?'true':'false')+'" aria-controls="bzc-monolith-detail-panel">'
          +'<span class="bz-commercial-tariff-floor__index">'+String(index+1).padStart(2,'0')+'</span>'
          +'<span class="bz-commercial-tariff-floor__copy"><strong>'+esc(p.name)+'</strong><small>'+esc(floorDifference(key)+' · '+f.remaining+' '+pluralPlaces(f.remaining)+' в потоке')+'</small></span>'
          +'<span class="bz-commercial-tariff-floor__price-stack"><span class="bz-commercial-tariff-floor__price">'+esc(rub(p.price))+'</span><small class="bz-commercial-tariff-floor__installment">'+(active&&p.installments&&p.installments.amount?esc('от '+rub(p.installments.amount)+'/мес'):'&nbsp;')+'</small></span>'
          +'<i aria-hidden="true"></i>'
          +'</button></article>';
      }).join('');

      var detail='<section class="bz-commercial-tariff-detail-panel" id="bzc-monolith-detail-panel" role="tabpanel" aria-live="polite" data-bzc-active-plan="'+activeKey+'">'
        +'<div class="bz-commercial-tariff-floor__detail-head"><span class="bz-commercial-tariff-floor__badge">'+esc(activePlan.badge)+'</span></div>'
        +'<p class="bz-commercial-tariff-floor__lead">'+esc(activePlan.forWhom)+'</p>'
        +pricingCalculationMarkup(activePlan.price,'bz-commercial-pricing-calc-note--overview')
        +'<button class="bz-commercial-plan-details-toggle" type="button" data-bzc-plan-details="'+activeKey+'" aria-expanded="'+(state.tariffDetailsOpen?'true':'false')+'" aria-controls="bzc-monolith-differences"><span>'+(state.tariffDetailsOpen?'Свернуть состав':'Показать состав')+'</span><b aria-hidden="true">'+(state.tariffDetailsOpen?'↑':'↓')+'</b></button>'
        +'<div class="bz-commercial-plan-details" id="bzc-monolith-differences" '+(state.tariffDetailsOpen?'':'hidden')+'><span class="bz-commercial-plan-detail-kicker">'+esc(activePlan.detailKicker)+'</span><p class="bz-commercial-route-summary">'+esc(activePlan.routeSummary||'')+'</p><ul class="bz-commercial-feature-list">'+activePlan.features.map(function(x){return'<li>'+esc(x)+'</li>';}).join('')+'</ul></div>'
        +'<button class="bz-commercial-btn '+(activeKey==='group'?'is-copper':'')+'" data-bzc-select-plan="'+activeKey+'" type="button">'+esc(buttonLabel)+'</button>'
        +'</section>';

      var personal='<section class="bz-commercial-personal-field" aria-label="Личный формат">'
        +'<div class="bz-commercial-personal-field__head"><span class="bz-commercial-personal-field__index">03</span><div><span class="bz-commercial-personal-field__kicker">Личный формат</span><h3>'+esc(personalPlan.name)+'</h3><p>Индивидуальная работа один на один с более плотной обратной связью.</p></div><strong>'+rub(personalPlan.price)+'</strong></div>'
        +'<div class="bz-commercial-personal-field__meta"><span>Без привязки к потоку</span><span>Старт — по согласованию</span></div>'
        +'<div class="bz-commercial-personal-field__note"><strong>Участие подтверждается после короткого созвона.</strong><span>Сначала уточним задачу и убедимся, что этот формат действительно вам подходит.</span></div>'
        +'<button class="bz-commercial-personal-action" data-bzc-select-plan="personal" type="button"><span>Обсудить личное сопровождение</span><i aria-hidden="true">↗</i></button>'
        +'</section>';

      tariffsHost.innerHTML='<div class="bz-commercial-group-field">'
        +'<div class="bz-commercial-tariff-monolith" data-bzc-tariff-monolith>'
        +flowChoiceMarkup()
        +'<div class="bz-commercial-tariff-table-head"><span>УЧАСТИЕ</span></div>'
        +'<div class="bz-commercial-tariff-selector" role="radiogroup" aria-label="Групповой формат участия">'+selector+'</div>'
        +detail
        +'</div></div>';
      if(personalHost)personalHost.innerHTML=personal;
      applyProductMode({keepScroll:true});
      renderStickyRail();
    }

    function activateTariffFloor(key){
      if(!CONFIG.tariffs[key])return;
      var changed=state.plan!==key;
      state.plan=key;
      state.planExplicit=true;
      state.tariffDetailsOpen=false;
      if(changed)state.method='full';
      state.paymentState='before';
      state.seatsTrackKey='';
      state.readiness={time:false,sleep:false,tasks:false};
      track('tariff_floor_selected',{tariff:key,full_price:plan().price,requires_consultation:!!plan().consultRequired});
      renderTariffs();
    }

    function handleTariffToggle(btn){
      state.tariffDetailsOpen=!state.tariffDetailsOpen;
      track(state.tariffDetailsOpen?'tariff_differences_opened':'tariff_differences_closed',{tariff:state.plan,comparison_mode:'single-monolith'});
      renderTariffs();
    }


    function syncStickyRailTop(){
      var rail=layer.querySelector('[data-bzc-sticky-rail]');
      var header=layer.querySelector('.bz-commercial-head');
      if(!rail||!header)return;
      rail.style.top=Math.round(header.getBoundingClientRect().height)+'px';
    }
    function renderStickyRail(){
      var rail=layer.querySelector('[data-bzc-sticky-rail]');if(!rail)return;
      var desktop=rail.querySelector('[data-bzc-sticky-desktop]'),mobile=rail.querySelector('[data-bzc-sticky-mobile]');
      var keys=['group'];
      if(desktop)desktop.innerHTML='<div class="bz-commercial-sticky-segments">'+keys.map(function(key){
        var p=tariffFor(key),selected=state.planExplicit&&state.plan===key;
        var shortName=p.name;
        return '<button type="button" class="bz-commercial-sticky-segment '+(selected?'is-selected':'')+'" data-bzc-rail-plan="'+key+'" aria-pressed="'+(selected?'true':'false')+'"><span>'+esc(shortName)+'</span><strong>'+rub(p.price)+'</strong></button>';
      }).join('')+'</div><button type="button" class="bz-commercial-sticky-cta" data-bzc-rail-continue>Продолжить</button>';
      if(mobile){
        var copy='<strong>'+esc(tariffFor('group').name)+' · '+rub(tariffFor('group').price)+'</strong><span>'+esc(flow().label)+'</span>';
        mobile.innerHTML='<div class="bz-commercial-sticky-mobile-copy" data-bzc-rail-open>'+copy+'</div><button type="button" class="bz-commercial-sticky-cta" data-bzc-rail-continue>Продолжить</button>';
      }
    }
    function updateStickyRail(){
      syncStickyRailTop();
      var rail=layer.querySelector('[data-bzc-sticky-rail]');if(!rail)return;
      var tariffSection=layer.querySelector('[data-bzc-tariffs]'),scrollHost=layer.querySelector('[data-bzc-scroll]'),visible=false;
      if(state.open&&state.view==='overview'&&tariffSection&&scrollHost){
        var tariffRect=tariffSection.getBoundingClientRect(),scrollRect=scrollHost.getBoundingClientRect();
        visible=tariffRect.bottom<=scrollRect.top+8;
      }
      if(visible){renderStickyRail();if(rail.hidden){rail.hidden=false;requestAnimationFrame(function(){rail.classList.add('is-visible');});}else rail.classList.add('is-visible');}
      else{rail.classList.remove('is-visible');if(!rail.hidden)setTimeout(function(){if(!rail.classList.contains('is-visible'))rail.hidden=true;},190);}
    }

    /* owner:checkout-group-proof-controller-0317 */
    function seatInventoryVerified(f){
      f=f||flow();
      return !!(f&&f.demo!==true&&Number.isFinite(Number(f.capacity))&&Number(f.capacity)>0&&Number.isFinite(Number(f.remaining))&&Number(f.remaining)>=0&&Number(f.remaining)<=Number(f.capacity));
    }
    function seatMarkup(mode){
      var f=flow(),occupied=Math.max(0,Number(f.capacity)-Number(f.remaining)),out='';
      for(var i=0;i<Number(f.capacity);i++){
        var cls='bz-commercial-seat';
        if(i<occupied)cls+=' is-occupied';
        else if(i===occupied&&mode==='pending')cls+=' is-pending';
        else if(i===occupied&&mode==='confirmed')cls+=' is-confirmed';
        else cls+=' is-free';
        out+='<span class="'+cls+'" aria-hidden="true"></span>';
      }
      return out;
    }
    function seatHumanLayer(f){
      if(!f||f.participantsVerified!==true||!Array.isArray(f.participants)||!f.participants.length)return '';
      var names=f.participants.filter(function(name){return typeof name==='string'&&name.trim();}).slice(0,3);
      if(!names.length)return '';
      var extra=Math.max(0,f.participants.length-names.length);
      return '<p class="bz-commercial-seat-human"><span>Уже участвуют:</span> '+names.map(esc).join(' · ')+(extra?' · +'+extra:'')+'</p>';
    }
    function seatsHtml(mode){
      var f=flow();
      if(!seatInventoryVerified(f)){
        return '<section class="bz-commercial-group-proof is-inventory-unverified" data-bzc-group-proof="unverified"><span class="bz-commercial-selected-kicker">Мини-группа</span><p>Место закрепится после подтверждения оплаты.</p></section>';
      }
      var free=mode==='confirmed'?Math.max(0,Number(f.remaining)-1):Number(f.remaining);
      var title=mode==='pending'?'Подтверждаем оплату':mode==='confirmed'?'Место закреплено':'Свободно '+free+' '+pluralPlaces(free);
      var note=mode==='pending'?'Подтверждаем платёж. После подтверждения место будет закреплено.':mode==='confirmed'?'Место закреплено за вами.':'Место закрепится после подтверждения оплаты.';
      return '<section class="bz-commercial-group-proof" data-bzc-group-proof="verified"><div class="bz-commercial-seats-head"><span class="bz-commercial-selected-kicker">Мини-группа</span><strong class="bz-commercial-seats-count">'+esc(title)+'</strong></div><div class="bz-commercial-seat-grid" role="img" aria-label="'+esc(title)+'. Вместимость '+Number(f.capacity)+' мест.">'+seatMarkup(mode)+'</div><p class="bz-commercial-seat-status">'+esc(note)+'</p>'+seatHumanLayer(f)+'</section>';
    }
    function trackSeatVisualizationState(mode){
      var f=flow(),key=mode+':'+state.plan+':'+f.id;
      if(state.seatsTrackKey!==key){state.seatsTrackKey=key;track('seat_visualization_shown',{payment_state:mode,free_places:mode==='confirmed'?Math.max(0,f.remaining-1):f.remaining});}
    }

    /* owner:checkout-flow-controller-0317 */
    function checkoutButtonLabel(){
      return 'Перейти\nк оплате';
    }
    function checkoutOfferState(){
      var owner=window.BZCommercialOffer||null,p=plan();
      var standard=owner&&Number.isFinite(Number(owner.standardPrice))?Number(owner.standardPrice):14000;
      var active=!!(owner&&typeof owner.active==='function'&&owner.active()&&Number(p.price)<standard);
      return {active:active,current:Number(p.price),standard:standard};
    }
    function checkoutPriceMarkup(){
      var offer=checkoutOfferState();
      return '<strong class="bz-commercial-transaction-price">'+rub(offer.current)+'</strong>';
    }
    function checkoutInstallmentMarkup(){
      var p=plan(),count=Number(p&&p.installments&&p.installments.count)||6;
      var amount=Number(p&&p.installments&&p.installments.amount)||Math.ceil(Number(p&&p.price||0)/count);
      if(!amount||!count)return '';
      return '<div class="bz-commercial-confirmation-installment">Рассрочка от '+rub(amount)+' × '+esc(String(count))+'</div>';
    }
    /* owner:checkout-readiness-controller-0317 */
    function readinessComplete(){
      return !!(state.readiness.time&&state.readiness.sleep&&state.readiness.tasks);
    }
    function paymentGateComplete(){
      return readinessComplete();
    }
    function updateCheckoutGate(){
      var button=checkoutHost&&checkoutHost.querySelector('[data-bzc-pay]');
      if(!button)return;
      var enabled=!state.paymentStarting;
      button.disabled=!enabled;
      button.setAttribute('aria-disabled',enabled?'false':'true');
    }
    function updateReadinessGate(){
      var button=readinessHost&&readinessHost.querySelector('[data-bzc-readiness-pay]');
      if(!button)return;
      var enabled=readinessComplete()&&!state.paymentStarting;
      button.disabled=!enabled;
      button.setAttribute('aria-disabled',enabled?'false':'true');
    }
    function readinessCheckpointMarkup(){
      var items=(CONFIG.readiness||[]).map(function(item){
        var checked=!!state.readiness[item.id];
        return '<label class="bz-commercial-readiness-checkpoint-item '+(checked?'is-checked':'')+'"><input type="checkbox" data-bzc-ready-check="'+esc(item.id)+'" '+(checked?'checked':'')+'><span class="bz-commercial-readiness-box" aria-hidden="true"></span><span class="bz-commercial-readiness-checkpoint-copy"><strong>'+esc(item.label)+'</strong><small>'+esc(item.help||'')+'</small></span></label>';
      }).join('');
      return '<div class="bz-commercial-readiness-checkpoint-inner" aria-labelledby="bzc-readiness-title">'
        +'<span class="bz-commercial-selected-kicker">Перед оплатой</span>'
        +'<h2 id="bzc-readiness-title">Три вещи, которые важно проверить</h2>'
        +'<p class="bz-commercial-readiness-checkpoint-lead">Это последняя самопроверка перед переходом в платёжный сервис.</p>'
        +'<div class="bz-commercial-readiness-checkpoint-list">'+items+'</div>'
        +'<button type="button" class="bz-commercial-readiness-question" data-bzc-open-question data-bzc-question-source="readiness-checkpoint">Не можете подтвердить один из пунктов? Задать вопрос →</button>'
        +'<button class="bz-commercial-btn is-copper bz-commercial-payment-submit bz-commercial-readiness-submit" data-bzc-readiness-pay type="button" '+(readinessComplete()?'':'disabled')+' aria-disabled="'+(readinessComplete()?'false':'true')+'"><span>'+esc(checkoutButtonLabel())+'</span><i aria-hidden="true">↗</i></button>'
        +'<p class="bz-commercial-pay-error" data-bzc-pay-error hidden></p>'
        +'</div>';
    }
    function legalLinksMarkup(){
      return '<nav class="bz-commercial-legal-points" aria-label="Документы и согласия">'
        +'<button class="bz-commercial-legal-point" type="button" data-bzc-legal-target="bz-footer-offer">Оферта и условия участия ↗</button>'
        +'<div class="bz-commercial-legal-point-row"><button class="bz-commercial-legal-point" type="button" data-bzc-legal-target="bz-footer-consent">Согласие на обработку персональных данных ↗</button><button class="bz-commercial-legal-point is-secondary" type="button" data-bzc-legal-target="bz-footer-policy">Политика ↗</button></div>'
        +'</nav>';
    }

    function renderCheckout(){
      if(window.BZFlowCalendar&&typeof window.BZFlowCalendar.refreshConfig==='function')window.BZFlowCalendar.refreshConfig(new Date());
      var customer=state.customer;
      checkoutHost.innerHTML=''
        +'<section class="bz-commercial-confirmation-stage" aria-labelledby="bzc-confirmation-title">'
          +'<div class="bz-commercial-confirmation-head">'
            +'<span class="bz-commercial-selected-kicker">Оформление участия</span>'
            +'<h2 class="bz-commercial-checkout-title" id="bzc-confirmation-title">К оплате</h2>'
            +'<div class="bz-commercial-confirmation-price bz-commercial-confirmation-price--hero">'+checkoutPriceMarkup()+checkoutInstallmentMarkup()+'</div>'
          +'</div>'
          +'<section class="bz-commercial-after-payment" aria-labelledby="bzc-after-payment-title">'
            +'<span class="bz-commercial-after-payment-kicker">После оплаты</span>'
            +'<h3 id="bzc-after-payment-title">Что будет дальше</h3>'
            +'<div class="bz-commercial-after-payment-list">'
              +'<div class="bz-commercial-after-payment-item"><span>01</span><p><strong>Сразу после оплаты</strong> откроется первый материал программы.</p></div>'
              +'<div class="bz-commercial-after-payment-item"><span>02</span><p><strong>В течение 24 часов</strong> с вами свяжется координатор.</p></div>'
              +'<div class="bz-commercial-after-payment-item"><span>03</span><p><strong>Чек и подтверждение оплаты</strong> придут на вашу почту.</p></div>'
            +'</div>'
          +'</section>'
          +seatsHtml('before')
        +'</section>'
        +'<section class="bz-commercial-payment-contact" data-bzc-payment-contact aria-label="Данные участника">'
          +'<div class="bz-commercial-payment-contact-head"><span class="bz-commercial-selected-kicker">Данные участника</span></div>'
          +'<div class="bz-commercial-form-grid">'
            +'<div class="bz-commercial-field" data-bzc-field><label for="bzc-pay-name">Как вас зовут</label><input class="bz-commercial-input" id="bzc-pay-name" data-bzc-customer="name" name="name" autocomplete="off" value="'+esc(customer.name)+'" placeholder="Имя" required><span class="bz-commercial-error">Укажите имя</span></div>'
            +'<div class="bz-commercial-field" data-bzc-field><label for="bzc-pay-phone">Телефон</label><input class="bz-commercial-input" id="bzc-pay-phone" data-bzc-customer="phone" name="phone" autocomplete="off" inputmode="tel" value="'+esc(customer.phone)+'" placeholder="+7 900 000-00-00" required><span class="bz-commercial-error">Укажите корректный телефон</span></div>'
            +'<div class="bz-commercial-field bz-commercial-payment-email" data-bzc-field><label for="bzc-pay-email">Email для чека и подтверждения</label><input class="bz-commercial-input" id="bzc-pay-email" data-bzc-customer="email" name="email" autocomplete="off" inputmode="email" value="'+esc(customer.email)+'" placeholder="name@example.ru" required><span class="bz-commercial-error">Укажите корректный email</span></div>'
          +'</div>'
          +'<button class="bz-commercial-checkout-guarantee" type="button" data-bzc-legal-target="bz-footer-refund">Гарантия возврата денег — условия ↗</button>'
          +'<button class="bz-commercial-btn is-copper bz-commercial-payment-submit" data-bzc-pay type="button"><span>'+esc(checkoutButtonLabel())+'</span><i aria-hidden="true">↗</i></button>'
          +legalLinksMarkup()
          +'<button class="bz-commercial-checkout-support" type="button" data-bzc-open-question data-bzc-question-source="checkout">Есть вопрос перед оплатой?</button>'
        +'</section>';
      bindCustomerInputs();
      updateCheckoutGate();
    }

    function renderReadiness(){
      if(!readinessHost)return;
      readinessHost.innerHTML=readinessCheckpointMarkup();
      updateReadinessGate();
    }

    function renderPaymentState(kind){
      var p=plan(),f=flow(),html='';
      if(kind==='pending'){
        html='<span class="bz-commercial-selected-kicker">Статус оплаты</span><h2 class="bz-commercial-state-title">Подтверждаем оплату…</h2><p class="bz-commercial-state-copy">Проверяем статус платежа. Повторно нажимать кнопку не нужно.</p><div class="bz-commercial-selected-summary"><strong>'+esc(p.name)+'</strong><span>'+esc(f.label)+'</span></div>'+seatsHtml('pending')+'<div class="bz-commercial-state-actions"><button class="bz-commercial-btn" data-bzc-dev-state="success" '+(devMode()?'':'hidden')+'>DEV: подтвердить</button><button class="bz-commercial-link-btn" data-bzc-open-contact="MAX">Нужна помощь — написать в поддержку</button></div>';
      }else if(kind==='success'){
        html='<span class="bz-commercial-selected-kicker">Оплата подтверждена</span><h2 class="bz-commercial-state-title">Участие подтверждено</h2><p class="bz-commercial-state-copy">Старт — '+esc(f.label)+'.</p><div class="bz-commercial-pass"><span class="bz-commercial-pass-brand">Метод Борзилова</span><strong>Участие в практикуме</strong><span>'+esc(f.label)+'</span><dl><div><dt>Формат</dt><dd>14 дней · мини-группа</dd></div><div><dt>Сумма</dt><dd>'+rub(p.price)+'</dd></div></dl></div>'+seatsHtml('confirmed')+'<p class="bz-commercial-state-copy">'+esc(CONFIG.materialsTiming)+'</p><div class="bz-commercial-state-actions">'+(CONFIG.nextStepUrl?'<a class="bz-commercial-btn" href="'+esc(CONFIG.nextStepUrl)+'">'+esc(CONFIG.nextStepLabel)+'</a>':'<button class="bz-commercial-btn" data-bzc-close type="button">Вернуться на сайт</button>')+'<button class="bz-commercial-link-btn" data-bzc-open-contact="MAX">Организационный вопрос — поддержка</button></div>';
      }else if(kind==='cancelled'){
        html='<span class="bz-commercial-selected-kicker">Оплата не завершена</span><h2 class="bz-commercial-state-title">Оплата не завершена</h2><p class="bz-commercial-state-copy">Вы можете попробовать снова, выбрать другой способ оплаты или вернуться к условиям участия.</p><div class="bz-commercial-state-actions"><button class="bz-commercial-btn" data-bzc-back-checkout>Попробовать ещё раз</button><button class="bz-commercial-link-btn" data-bzc-back-checkout>Выбрать другой способ</button><button class="bz-commercial-link-btn" data-bzc-go-overview>Вернуться к условиям</button></div>';
      }else{
        html='<span class="bz-commercial-selected-kicker">Статус оплаты</span><h2 class="bz-commercial-state-title">Не удалось подтвердить оплату</h2><p class="bz-commercial-state-copy">Статус платежа не подтверждён. Попробуйте ещё раз или выберите другой способ оплаты.</p><div class="bz-commercial-state-actions"><button class="bz-commercial-btn" data-bzc-back-checkout>Попробовать ещё раз</button><button class="bz-commercial-link-btn" data-bzc-back-checkout>Выбрать другой способ</button><button class="bz-commercial-link-btn" data-bzc-open-contact="MAX">Нужна помощь — MAX</button></div>';
      }
      paymentStateHost.innerHTML=html;
    }

    function decisionContext(){var f=flow(),p=plan();return '<div class="bz-commercial-decision-context"><span class="bz-commercial-decision-context__label">Ваши условия</span><strong>'+esc(p.name)+' · '+esc(f.label)+' · '+rub(p.price)+' · '+esc(methodLabel())+'</strong><button class="bz-commercial-link-btn" data-bzc-go-overview type="button">Изменить</button></div>';}
    function blockerLabel(id){return{
      format:'Что входит в участие',
      installment:'Нужна рассрочка',
      date:'Не подходит дата',
      method:'Подходит ли мне метод',
      moment:'Сейчас ли подходящий момент',
      personal:'Задать личный вопрос',
      later:'Сохранить условия'
    }[id]||id;}
    function decisionTariffSelector(){return '';}
    function decisionDock(){return '';}

    function renderDecisionHelp(){if(!decisionHost)return;var allowedBlockers=['format','installment','date','method','moment','personal','later'];if(allowedBlockers.indexOf(state.blocker)===-1)state.blocker='format';var b=state.blocker;
      function answerFor(id){
        if(id==='format')return '<h3>Что входит в участие</h3><div class="bz-commercial-mini-compare"><div><strong>14 дней</strong>Собранный маршрут с последовательным прохождением.</div><div><strong>Мини-группа</strong>Общий контур и поддержка по ходу маршрута.</div></div>';
        if(id==='installment')return state.planExplicit?'<h3>Рассрочка участия</h3><p><strong>'+esc(plan().name)+' · '+rub(plan().price)+'</strong><br>Доступны варианты платежей, которые предлагает банк. Итоговая стоимость не меняется, а место закрепляется после подтверждения оплаты или рассрочки.</p>':'<h3>Рассрочка участия</h3><p>Конкретный график платежей будет показан перед подтверждением.</p>';
        if(id==='date')return '<h3>Выберите другую дату</h3><p>Вы можете продолжить с ближайшим удобным потоком. Если ни одна дата не подходит, можно оставить запрос на следующий набор и вернуться к решению позже.</p>';
        if(id==='method')return '<h3>Подходит ли вам этот маршрут</h3><p>Здесь не требуют держаться на силе воли и не обещают медицинский результат. Маршрут помогает разобрать механизм желания, пройти последнюю сигарету и адаптацию с поддержкой. Если есть вопрос о личной ситуации, его лучше задать отдельно и коротко.</p>';
        if(id==='moment')return '<h3>Подходящий момент редко появляется сам</h3><p>Ожидание идеальной точки обычно только продлевает прежнюю схему. Здесь отказ не начинается в первый день: сначала идёт подготовка, затем последняя сигарета и сопровождение уязвимого периода.</p>';
        if(id==='personal')return '<h3>Запрос на ответ перед оплатой</h3><p>Если вам нужен личный ответ, можно отправить один конкретный вопрос. Тариф, дата, стоимость и способ оплаты подставятся автоматически, чтобы не пересказывать всё заново.</p>';
        return state.planExplicit?'<h3>Сохранить условия и вернуться позже</h3><p>Выбранные дата и способ оплаты сохранятся в этом браузере.</p>':'<h3>Сохранить условия и вернуться позже</h3><p>Выберите дату. Мы сохраним её в этом браузере, чтобы при следующем открытии не пришлось искать условия заново.</p>';
      }
      var groups=[{label:'Перед решением',ids:['format','installment','date']},{label:'Решение',ids:['method','moment']},{label:'Личный шаг',ids:['personal','later']}];
      var orderedIds=['format','installment','date','method','moment','personal','later'];
      function blockerButton(id,extra){var active=b===id,viewed=!!state.viewedBlockers[id],num=String(orderedIds.indexOf(id)+1).padStart(2,'0');return '<button type="button" class="bz-commercial-blocker '+(active?'is-active ':'')+(viewed&&!active?'is-viewed ':'')+(extra||'')+'" data-bzc-blocker="'+id+'" data-bzc-blocker-index="'+num+'" aria-expanded="'+(active&&state.mobileDecisionOpen?'true':'false')+'"><span class="bz-commercial-blocker__state" aria-hidden="true">'+(active&&state.mobileDecisionOpen?'⌃':'⌄')+'</span><span class="bz-commercial-blocker__index">'+num+'</span><span class="bz-commercial-blocker__label">'+esc(blockerLabel(id))+'</span></button>';}
      var isMobile=matchMedia('(max-width:760px)').matches;
      if(!isMobile){decisionHost.setAttribute('data-bzc-console-variant','04');decisionHost.innerHTML='<span class="bz-commercial-selected-kicker">Перед решением</span><h2 class="bz-commercial-state-title">Что пока мешает принять решение?</h2><div class="bz-commercial-decision-workspace"><aside class="bz-commercial-blocker-panel"><div class="bz-commercial-blocker-panel__head"><strong>Пульт решения</strong><span>7 вопросов · 1 ответ</span></div><div class="bz-commercial-blocker-groups">'+groups.map(function(group){return '<section class="bz-commercial-blocker-group"><h3>'+group.label+'</h3><div class="bz-commercial-blockers">'+group.ids.map(function(id){return blockerButton(id,'');}).join('')+'</div></section>';}).join('')+'</div></aside><div class="bz-commercial-answer-panel"><div class="bz-commercial-decision-response" data-bzc-active-index="'+String(orderedIds.indexOf(b)+1).padStart(2,'0')+'"><div class="bz-commercial-decision-answer">'+answerFor(b)+'</div></div></div></div>';return;}
      decisionHost.setAttribute('data-bzc-console-variant','mobile-faq');
      decisionHost.innerHTML='<span class="bz-commercial-selected-kicker">Перед решением</span><h2>Что пока мешает принять решение?</h2><p>Нажмите на вопрос — ответ откроется прямо под ним.</p>'+groups.map(function(group){return '<section class="bz-mobile-faq-group"><h3>'+group.label+'</h3>'+group.ids.map(function(id){var open=state.mobileDecisionOpen&&b===id;return '<div class="bz-mobile-faq-item '+(open?'is-open':'')+'">'+blockerButton(id,'is-faq')+(open?'<div class="bz-mobile-faq-answer"><div class="bz-commercial-decision-answer">'+answerFor(id)+'</div></div>':'')+'</div>';}).join('')+'</section>';}).join('');
      
    }
    function setDecisionInlineOpen(open){if(!decisionInline)return;decisionInline.hidden=!open;decisionInline.classList.toggle('is-open',!!open);layer.querySelectorAll('[data-bzc-open-decision-help]').forEach(function(btn){btn.setAttribute('aria-expanded',open?'true':'false');});}
    function openDecisionHelp(trigger,opts){opts=opts||{};if(!decisionInline)return;var alreadyOpen=!decisionInline.hidden;if(alreadyOpen&&trigger&&!opts.force){setDecisionInlineOpen(false);return;}state.previousView=state.view;var allowedBlockers=['format','installment','date','method','moment','personal','later'];if(allowedBlockers.indexOf(state.blocker)===-1)state.blocker='format';state.viewedBlockers[state.blocker]=true;if(matchMedia('(max-width:760px)').matches)state.mobileDecisionOpen=false;renderDecisionHelp();setDecisionInlineOpen(true);track('decision_help_open',{inline:true,source_view:state.view});requestAnimationFrame(function(){decisionInline.scrollIntoView({behavior:opts.instant?'auto':'smooth',block:'start'});});}
    function setSupportPersonalExpanded(expanded){
      var route=layer.querySelector('[data-bzc-support-personal] > [data-bzc-support-topic="ilya"]');
      var channels=layer.querySelector('[data-bzc-support-channels]');
      var status=layer.querySelector('[data-bzc-support-channel-status]');
      if(route)route.hidden=!!expanded;
      if(channels)channels.hidden=!expanded;
      if(status){status.hidden=true;status.textContent='';}
    }
    function openPersonalChannel(channel){
      var url=channel==='telegram'?CONFIG.personalContactUrl:CONFIG.maxUrl;
      track('header_personal_channel_selected',{channel:channel,source:'header-support',source_view:state.view});
      if(url){window.open(url,'_blank','noopener');return;}
      var status=layer.querySelector('[data-bzc-support-channel-status]');
      if(status){status.hidden=false;status.textContent='Ссылка на этот канал пока не подключена в конфигурации.';}
    }
    function openPrepayTalkChannel(channel){
      var url=channel==='telegram'?CONFIG.personalContactUrl:CONFIG.maxUrl;
      track('prepay_talk_channel_selected',{channel:channel,source:'pricing-prepay-talk',source_view:state.view});
      if(url){window.open(url,'_blank','noopener');return;}
      var status=layer.querySelector('[data-bzc-prepay-talk-status]');
      if(status){status.hidden=false;status.textContent='Ссылка на этот канал пока не подключена.';}
    }
    function syncQuestionRoute(){
      var isTalk=state.requestMode==='prepay-talk';
      var isAuthorSituation=state.requestMode==='author-situation';
      var isSupport=!isTalk&&!isAuthorSituation&&state.supportTopic==='support';
      var kicker=layer.querySelector('[data-bzc-question-kicker]');
      var title=layer.querySelector('[data-bzc-question-title]');
      var copy=layer.querySelector('[data-bzc-question-copy]');
      var label=layer.querySelector('[data-bzc-question-label]');
      var textarea=layer.querySelector('#bzc-app-comment');
      var summary=layer.querySelector('[data-bzc-view="application"] .bz-commercial-selected-summary');
      var submit=layer.querySelector('[data-bzc-app-submit]');
      if(summary)summary.hidden=isTalk||!isSupport;
      if(isTalk){
        if(submit)submit.textContent='Попросить связаться';
        if(kicker)kicker.textContent='Перед оплатой';
        if(title)title.textContent='Попросить связаться';
        if(copy)copy.textContent='Оставьте контакт — я или команда свяжемся и спокойно разберём оставшиеся вопросы перед оплатой.';
        if(label)label.textContent='Комментарий';
        if(textarea)textarea.placeholder='Необязательно';
        return;
      }
      if(isAuthorSituation){
        if(submit)submit.textContent='Отправить описание';
        if(kicker)kicker.textContent='Подойдёт ли формат';
        if(title)title.textContent='Подойдёт ли практикум в вашей ситуации?';
        if(copy)copy.textContent='Коротко опишите ситуацию. Я посмотрю и скажу, подходит ли вам этот формат.';
        if(label)label.textContent='Коротко о вашей ситуации';
        if(textarea){textarea.placeholder='Как давно и сколько курите, что уже пробовали и что сейчас вызывает сомнение';textarea.required=true;}
        return;
      }
      if(textarea)textarea.required=false;
      if(submit)submit.textContent=isSupport?'Отправить запрос':'Отправить вопрос';
      if(kicker)kicker.textContent=isSupport?'Поддержка':'Личный вопрос';
      if(title)title.textContent=isSupport?'Помощь с оплатой':'Задать личный вопрос';
      if(copy)copy.textContent=isSupport?'Выберите Telegram или MAX и коротко опишите проблему. Дата, формат, сумма и текущий экран приложатся автоматически.':'Вопрос о методе, программе или участии. Дата старта и текущий экран приложатся автоматически.';
      if(label)label.textContent=isSupport?'Что произошло':'Ваш вопрос';
      if(textarea)textarea.placeholder=isSupport?'Например: ошибка платежа, рассрочка или не пришло подтверждение':'Коротко опишите вопрос о методе или участии';
    }
    function openRequest(blocker,opts){opts=opts||{};state.requestMode=opts.mode||'';state.requestBlocker=blocker||state.blocker||'personal';state.previousView=state.view;state.returnToDecisionInline=opts.returnToDecisionInline!==false;syncApplicationHidden();syncQuestionRoute();setDecisionInlineOpen(false);setView('application');}
    
    

    function syncApplicationContactField(){
      var channel=layer.querySelector('#bzc-app-channel');
      var input=layer.querySelector('#bzc-app-contact');
      var label=layer.querySelector('label[for="bzc-app-contact"]');
      if(!channel||!input)return;
      var value=String(channel.value||'Telegram').toLowerCase();
      var phoneMode=value==='телефон'||value==='max';
      if(label)label.textContent=phoneMode?'Телефон':'Контакт';
      input.placeholder=phoneMode?'+7 999 123-45-67':'@username или телефон';
      input.inputMode=phoneMode?'tel':'text';
      input.setAttribute('autocomplete','off');
    }

    function syncApplicationHidden(){
      var f=flow(),p=plan(),hasPlan=state.planExplicit===true;
      var planName=hasPlan?p.name:'Участие в практикуме',priceText=hasPlan?rub(p.price):'—';
      var planEl=layer.querySelector('[data-bzc-app-plan]'),priceEl=layer.querySelector('[data-bzc-app-price]');
      if(planEl)planEl.textContent=planName;if(priceEl)priceEl.textContent=priceText;
      var pi=layer.querySelector('[data-bzc-app-plan-input]'),pri=layer.querySelector('[data-bzc-app-price-input]'),di=layer.querySelector('[data-bzc-app-date-input]'),mi=layer.querySelector('[data-bzc-app-method-input]');
      if(pi)pi.value=hasPlan?p.name:'';if(pri)pri.value=hasPlan?p.price:'';if(di)di.value=f.label;if(mi)mi.value=hasPlan?state.method:'';
      syncApplicationContactField();
    }

    function renderContact(){
      var personal=state.contactTarget==='ilya';
      var call=state.contactTarget==='call';
      var personalCall=state.contactTarget==='personal-call';
      var kicker=layer.querySelector('[data-bzc-contact-kicker]');
      var title=layer.querySelector('[data-bzc-contact-title]');
      var copy=layer.querySelector('[data-bzc-contact-copy]');
      var target=layer.querySelector('[data-bzc-contact-target]');
      var label=layer.querySelector('[data-bzc-contact-label]');
      var input=layer.querySelector('[data-bzc-contact-input]');
      var submit=layer.querySelector('[data-bzc-contact-submit-label]');
      var timeField=layer.querySelector('[data-bzc-contact-time-field]');
      if(kicker)kicker.textContent=personalCall?'Личный формат':(call?'Обратный звонок':(personal?'Личная эскалация':'Сервисная помощь'));
      if(title)title.textContent=personalCall?'Обсудить личное сопровождение':(call?'Заказать звонок':(personal?'Написать Илье лично':'Написать команде'));
      if(copy)copy.textContent=personalCall?'Оставьте контакт и удобное время. Сначала коротко уточним задачу и убедимся, что личное сопровождение вам подходит.':(call?'Оставьте номер и удобное время — команда свяжется с вами.':(personal?'Личный вопрос о методе или участии. Этот маршрут отделён от сервисной поддержки.':'Формат, даты, оплата и технические вопросы.'));
      if(target)target.value=state.contactTarget;
      if(label)label.textContent=personalCall?'Телефон или Telegram':(call?'Номер телефона':'Где вам ответить');
      if(input){input.placeholder=personalCall?'+7 900 000-00-00 или @username':(call?'+7 900 000-00-00':'@username или телефон');input.inputMode=call?'tel':'text';input.setAttribute('autocomplete','off');}
      if(timeField)timeField.hidden=!(call||personalCall);
      if(submit)submit.textContent=personalCall?'Записаться на короткий созвон':(call?'Заказать звонок':(personal?'Передать Илье':'Передать команде'));
    }

    function setHead(name){
      var f=flow(),p=plan();
      headMeta.hidden=false;
      if(name==='dates'){headKicker.textContent='Ближайшие потоки';headTitle.textContent='Выберите дату старта';headMeta.textContent='Два варианта';}
      else if(name==='overview'){headKicker.textContent='Участие в практикуме';headTitle.textContent='Условия участия';headMeta.hidden=true;headMeta.textContent='';}
      else if(name==='checkout'){headKicker.textContent='Оформление участия';headTitle.textContent='Перед оплатой';headMeta.hidden=true;headMeta.textContent='';}
      else if(name==='readiness'){headKicker.textContent='Проверка готовности';headTitle.textContent='Перед оплатой';headMeta.textContent=p.name+' · '+f.label;}
      else if(name==='decision-help'){headKicker.textContent='Перед решением';headTitle.textContent='Разобраться перед оплатой';headMeta.textContent=p.name+' · '+f.label;}
      else if(name==='prepay-talk'){headKicker.textContent='Перед оплатой';headTitle.textContent='Обсудить участие';headMeta.hidden=true;headMeta.textContent='';}
      else if(name==='application'){if(state.requestMode==='prepay-talk'){headKicker.textContent='Перед оплатой';headTitle.textContent='Попросить связаться';headMeta.hidden=true;headMeta.textContent='';}else{headKicker.textContent='Запрос перед оплатой';headTitle.textContent=state.planExplicit?(p.name+' · '+rub(p.price)):'Личный вопрос об участии';headMeta.textContent=state.planExplicit?('Старт — '+f.label):('Старт '+f.label);}}
      else if(name==='contact'){var isCall=state.contactTarget==='call',isPersonalCall=state.contactTarget==='personal-call';headKicker.textContent=isPersonalCall?'Личный формат':(isCall?'Обратный звонок':(state.contactTarget==='ilya'?'Личный вопрос':'Связь'));headTitle.textContent=isPersonalCall?'Обсудить личное сопровождение':(isCall?'Заказать звонок':(state.contactTarget==='ilya'?'Написать Илье лично':'Написать команде'));headMeta.hidden=true;}
      else if(name==='application-success'){headKicker.textContent='Готово';headTitle.textContent=state.requestMode==='prepay-talk'?'Контакт отправлен':(state.successType==='contact'?'Контакт отправлен':'Заявка отправлена');headMeta.hidden=true;}
      else{headKicker.textContent='Оплата';headTitle.textContent=state.paymentState==='success'?'Участие подтверждено':'Статус оплаты';headMeta.textContent=f.label;}
    }

    function setView(name,opts){
      opts=opts||{};
      if(name==='overview'||name==='dates'||name==='decision-help')name='checkout';
      if(!opts.keepDecisionInline)setDecisionInlineOpen(false);state.view=name;state.lifecycle=name;layer.setAttribute('data-bzc-active-view',name);
      views.forEach(function(v){v.hidden=v.getAttribute('data-bzc-view')!==name;});
      var isMobile=matchMedia('(max-width:760px)').matches;
      back.hidden=name==='checkout'||(name==='payment-state'&&(state.paymentState==='pending'||state.paymentState==='success'));back.textContent=name==='payment-state'?'← К оплате':'← Назад';setHead(name);
      if(name==='dates')renderDates();
      else if(name==='overview'){renderDates();renderTariffs();applyProductMode({keepScroll:true});}
      else if(name==='checkout')renderCheckout();
      else if(name==='readiness')renderReadiness();
      else if(name==='decision-help')renderDecisionHelp();
      else if(name==='application')syncApplicationHidden();
      else if(name==='contact')renderContact();
      else if(name==='application-success'){
        var st=layer.querySelector('[data-bzc-success-title]'),sc=layer.querySelector('[data-bzc-success-copy]');
        if(state.requestMode==='prepay-talk'){if(st)st.textContent='Контакт отправлен';if(sc)sc.textContent='Получили ваш контакт. Свяжемся и спокойно разберём оставшиеся вопросы перед оплатой.';}else if(state.requestMode==='author-situation'){if(st)st.textContent='Описание отправлено';if(sc)sc.textContent='Я посмотрю ситуацию и отвечу в выбранный канал — подходит ли вам этот формат.';}else if(state.successType==='contact'){var isCall=state.contactTarget==='call',isPersonalCall=state.contactTarget==='personal-call';if(st)st.textContent=isPersonalCall?'Запрос на созвон сохранён':(isCall?'Звонок заказан':(state.contactTarget==='ilya'?'Запрос Илье сохранён':'Запрос команде сохранён'));if(sc)sc.textContent=isPersonalCall?'Команда увидит ваш контакт и удобное время, чтобы обсудить личное сопровождение.':(isCall?'Команда увидит ваш номер и выбранное время для связи.':(state.contactTarget==='ilya'?'Личный запрос отмечен отдельно. В production он должен уходить напрямую Илье.':'Команда получит вопрос по формату, датам, оплате или технической части.'));}
        else{if(st)st.textContent='Запрос отправлен';if(sc)sc.textContent='Мы получили выбранные условия и ваш вопрос. Ответ придёт в указанный канал.';var ss=layer.querySelector('[data-bzc-success-summary]');if(ss)ss.innerHTML='<strong>'+esc(plan().name)+' · '+esc(flow().label)+'</strong><span>'+rub(plan().price)+'</span>';}
      }else if(name==='payment-state')renderPaymentState(state.paymentState);
      applyCommercialArchitecture();
      var activeView=views.filter(function(v){return v.getAttribute('data-bzc-view')===name;})[0];
      if(activeView){activeView.classList.remove('is-entering');void activeView.offsetWidth;activeView.classList.add('is-entering');setTimeout(function(){activeView.classList.remove('is-entering');},360);}
      window.dispatchEvent(new CustomEvent('bz-commercial-view-change',{detail:{view:name}}));
      if(scroller&&!opts.keepScroll){
        if(name==='overview')resetOverviewScrollTop();
        else scroller.scrollTop=0;
      }
      syncCompactHead();
      renderStickyRail();
      requestAnimationFrame(function(){updateStickyRail();panel.focus({preventScroll:true});});
    }

    function syncCompactHead(){
      if(!head||!scroller)return;
      head.classList.toggle('is-compact',scroller.scrollTop>92);
      syncStickyRailTop();
    }
    if(scroller)scroller.addEventListener('scroll',syncCompactHead,{passive:true});
    window.addEventListener('resize',function(){applyCommercialArchitecture();if(state.open)setHead(state.view);},{passive:true});

    function selectFlow(id){
      var selectedFlow=CONFIG.flows.filter(function(f){return f.id===id;})[0];
      if(!selectedFlow||!flowTiming(selectedFlow).selectable)return;
      state.flowId=id;if(window.BZCommercialDecisionState&&window.BZCommercialDecisionState.update)window.BZCommercialDecisionState.update({selectedStartId:id});state.paymentState='before';state.seatsTrackKey='';state.readiness={time:false,sleep:false,tasks:false};
      renderDates();renderTariffs();applyCommercialArchitecture();setHead(state.view);track('flow_selected');
      
    }
    function selectPlan(key){
      if(!CONFIG.tariffs[key])key='group';var planChanged=state.plan!==key;state.plan=key;state.planExplicit=true;if(planChanged)state.method='full';state.paymentState='before';state.seatsTrackKey='';state.readiness={time:false,sleep:false,tasks:false};
      track('tariff_selected',{full_price:plan().price,requires_consultation:!!plan().consultRequired});
      if(plan().consultRequired){
        state.contactTarget='personal-call';state.previousView='overview';
        track('personal_consultation_click',{source_view:'overview',contact_target:'personal-call'});
        setView('contact');return;
      }
      setView('checkout');
    }
    function setPaymentState(kind){
      state.paymentState=kind;state.paymentStarting=false;trackSeatVisualizationState(kind==='success'?'confirmed':kind==='pending'?'pending':'before');renderPaymentState(kind);setView('payment-state');
      track(kind==='success'?'payment_success':kind==='pending'?'payment_pending':kind==='cancelled'?'payment_cancelled':'payment_error',{full_price:plan().price,first_payment:state.method==='installment'?plan().installments.amount:plan().price});
      if(kind==='success'){var f=flow();track('place_secured_screen',{free_places:Math.max(0,f.remaining-1)});track('place_confirmed');}
    }

    function openReadiness(){setView('readiness');}
    function validatePaymentCustomer(){
      var fields=[].slice.call(checkoutHost.querySelectorAll('[data-bzc-customer]')),ok=true,firstInvalid=null;
      fields.forEach(function(input){
        var value=String(input.value||'').trim(),kind=input.getAttribute('data-bzc-customer'),valid=true;
        if(kind==='name')valid=value.length>=2;
        else if(kind==='email')valid=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        else if(kind==='phone')valid=/^(?:\+?\d[\d\s()\-]{8,20})$/.test(value);
        if(kind&&Object.prototype.hasOwnProperty.call(state.customer,kind))state.customer[kind]=value;
        var field=input.closest('[data-bzc-field]');if(field)field.classList.toggle('is-invalid',!valid);
        if(!valid){ok=false;if(!firstInvalid)firstInvalid=input;}
      });
      if(!ok&&firstInvalid){firstInvalid.focus({preventScroll:true});firstInvalid.scrollIntoView({behavior:'smooth',block:'center'});}
      return ok;
    }
    async function startPayment(){
      if(state.paymentStarting)return;
      if(!paymentGateComplete())return;
      var paymentPlan=state.plan==='group'?'basic':state.plan;
      if(paymentPlan!=='basic'&&paymentPlan!=='extended')return;
      if(window.BZFlowCalendar&&typeof window.BZFlowCalendar.refreshConfig==='function')window.BZFlowCalendar.refreshConfig(new Date());
      state.paymentStarting=true;var p=plan();
      var err=(readinessHost&&readinessHost.querySelector('[data-bzc-pay-error]'))||(checkoutHost&&checkoutHost.querySelector('[data-bzc-pay-error]'));
      var continueBtn=(readinessHost&&readinessHost.querySelector('[data-bzc-readiness-pay]'))||(checkoutHost&&checkoutHost.querySelector('[data-bzc-pay]'));
      if(err){err.hidden=true;err.textContent='';}
      if(continueBtn){continueBtn.disabled=true;continueBtn.textContent='Открываем оплату…';}
      track('payment_start',{full_price:p.price,payment_route:'payment-service',installment_from:0});
      try{
        var response=await fetch(CONFIG.paymentCreateEndpoint,{
          method:'POST',
          headers:{'Content-Type':'application/json','Accept':'application/json'},
          body:JSON.stringify((function(){
            var decisionOwner=window.BZDecisionWindow||null,decisionState=decisionOwner&&decisionOwner.state?decisionOwner.state():null;
            return {plan:paymentPlan,name:state.customer.name,email:state.customer.email,phone:state.customer.phone,startId:flow().id,startDate:flow().value||flow().id,startLabel:flow().label,source:state.source,offerId:finalBonusActive()?FINAL_BONUS_ID:null,offerPrice:finalBonusActive()?FINAL_BONUS_PRICE:null,decisionAt:decisionState&&decisionState.decisionAt||null,decisionExpiresAt:decisionState&&decisionState.expiresAt||null,decisionWindowActive:!!(decisionState&&decisionState.active)};
          })())
        });
        var raw=await response.text(),data={};
        try{data=raw?JSON.parse(raw):{};}catch(parseError){throw new Error('Платёжный сервер вернул некорректный ответ.');}
        var paymentUrl=typeof data.paymentUrl==='string'?data.paymentUrl:'';
        if(!response.ok||!data.ok||!paymentUrl)throw new Error(data.error||'Не удалось создать платёж.');
        var returnedAmount=Number(data.amount);
        if(!Number.isFinite(returnedAmount)||returnedAmount!==Number(p.price)){
          throw new Error('Платёжная стоимость ещё не обновлена до '+rub(p.price)+'. Оплата не открыта.');
        }
        try{sessionStorage.setItem('bzLastPaymentOrder',JSON.stringify({orderId:data.orderId,paymentId:data.paymentId,plan:data.plan||paymentPlan,startId:flow().id,startDate:flow().value||flow().id,amount:data.amount,createdAt:new Date().toISOString()}));}catch(storageError){}
        track('payment_redirect',{order_id:data.orderId,payment_id:data.paymentId,charged_amount:data.amount});
        window.location.assign(paymentUrl);
      }catch(paymentError){
        state.paymentStarting=false;
        if(continueBtn){continueBtn.disabled=false;continueBtn.textContent=checkoutButtonLabel();}
        if(err){err.hidden=false;err.textContent=paymentError&&paymentError.message?paymentError.message:'Платёжный сервис временно недоступен. Попробуйте ещё раз.';}
        track('payment_error',{reason:'create_failed'});
      }
    }

    
    


    /* owner:payment-return-reconciliation-0321
       T-Bank redirect is never trusted as proof of payment. The browser asks the
       payment service for the authoritative order status and only then emits
       payment_success through the existing commercial analytics bridge. */
    function paymentStatusUrl(orderId){
      var endpoint=String(CONFIG.paymentStatusEndpoint||'').trim();
      if(!endpoint&&CONFIG.paymentCreateEndpoint)endpoint=String(CONFIG.paymentCreateEndpoint).replace(/\/create(?:\?.*)?$/,'/status');
      return endpoint+(endpoint.indexOf('?')>=0?'&':'?')+'orderId='+encodeURIComponent(orderId);
    }
    function cleanPaymentReturnUrl(){
      try{
        var url=new URL(location.href);
        url.searchParams.delete('payment_result');
        url.searchParams.delete('orderId');
        var next=url.pathname+(url.searchParams.toString()?'?'+url.searchParams.toString():'')+(url.hash||'');
        history.replaceState(history.state||{},'',next);
      }catch(_paymentReturnCleanErr){}
    }
    async function fetchPaymentStatus(orderId){
      var endpoint=paymentStatusUrl(orderId);
      if(!endpoint)throw new Error('Не настроен адрес проверки платежа.');
      var response=await fetch(endpoint,{method:'GET',headers:{'Accept':'application/json'},cache:'no-store'});
      var raw=await response.text(),data={};
      try{data=raw?JSON.parse(raw):{};}catch(_paymentStatusParseErr){throw new Error('Платёжный сервер вернул некорректный статус.');}
      if(!response.ok||!data.ok)throw new Error(data.error||'Не удалось проверить статус платежа.');
      return data;
    }
    async function reconcilePaymentReturn(){
      var params;
      try{params=new URLSearchParams(location.search);}catch(_paymentParamsErr){return;}
      var result=params.get('payment_result'),orderId=params.get('orderId');
      if(!result||!orderId)return;
      openDrawer({source:'payment-return',pushHistory:false});
      setPaymentState('pending');
      var finalData=null,lastError=null;
      for(var attempt=0;attempt<10;attempt++){
        try{
          var data=await fetchPaymentStatus(orderId);
          finalData=data;
          if(data.confirmed||data.failed)break;
          if(!data.pending)break;
        }catch(err){lastError=err;break;}
        await new Promise(function(resolve){setTimeout(resolve,attempt<3?1200:2200);});
      }
      if(finalData&&finalData.confirmed){
        track('payment_status_confirmed',{order_id:orderId,payment_id:finalData.paymentId||'',charged_amount:finalData.amount||null,status:finalData.status||'CONFIRMED'});
        setPaymentState('success');
        cleanPaymentReturnUrl();
        return;
      }
      if(finalData&&finalData.failed){
        track('payment_status_failed',{order_id:orderId,payment_id:finalData.paymentId||'',charged_amount:finalData.amount||null,status:finalData.status||'FAILED'});
        setPaymentState('cancelled');
        cleanPaymentReturnUrl();
        return;
      }
      if(lastError){
        state.paymentState='error';
        renderPaymentState('error');
        setView('payment-state');
        track('payment_error',{reason:'status_check_failed',order_id:orderId,message:lastError&&lastError.message||''});
        return;
      }
      setPaymentState('pending');
    }

    function focusable(){return [].slice.call(panel.querySelectorAll('a[href],button:not([disabled]):not([hidden]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')).filter(function(el){return !el.closest('[hidden]')&&el.offsetParent!==null;});}
    function lock(){state.scrollY=window.scrollY||window.pageYOffset||0;document.documentElement.classList.add('bz-commercial-lock');document.body.style.position='fixed';document.body.style.top='-'+state.scrollY+'px';document.body.style.left='0';document.body.style.right='0';document.body.style.width='100%';}
    function unlock(){document.documentElement.classList.remove('bz-commercial-lock');document.body.style.position='';document.body.style.top='';document.body.style.left='';document.body.style.right='';document.body.style.width='';window.scrollTo(0,state.scrollY);}
    function resetOverviewScrollTop(){
      if(!scroller||state.view!=='overview')return;
      scroller.scrollTop=0;
      requestAnimationFrame(function(){
        scroller.scrollTop=0;
        requestAnimationFrame(function(){scroller.scrollTop=0;});
      });
      setTimeout(function(){if(state.open&&state.view==='overview')scroller.scrollTop=0;},80);
      setTimeout(function(){if(state.open&&state.view==='overview')scroller.scrollTop=0;},220);
    }

    function openDrawer(opts){opts=opts||{};document.documentElement.classList.add('bz-commercial-open');document.body.classList.add('bz-commercial-open');if(!opts.mobileNavHandoff&&window.BZMobileNavigation&&window.BZMobileNavigation.isOpen()){window.BZMobileNavigation.close({restoreFocus:false,unlock:true,onComplete:function(){openDrawer(Object.assign({},opts,{mobileNavHandoff:true}));}});return;}state.source=opts.source||'drawer';if(layer&&layer.dataset)layer.dataset.bzcOrigin=state.source;if(!state.open){state.lifecycle='opening';state.opener=opts.opener||document.activeElement;lock();layer.setAttribute('aria-hidden','false');layer.classList.add('is-open');state.open=true;if(opts.pushHistory!==false&&history.pushState){history.pushState({bzCommercial:true},'','#conditions');state.pushed=true;}track('drawer_open',{source_cta:state.source||'drawer'});window.dispatchEvent(new CustomEvent('bz-commercial-state',{detail:{open:true}}));}if(opts.plan==='personal'){state.requestMode='';state.plan='personal';state.productMode='personal';state.planExplicit=true;state.contactTarget='personal-call';state.previousView='checkout';setView('contact');return;}state.plan='group';state.productMode='group';state.planExplicit=true;if(opts.view==='prepay-talk'){state.requestMode='prepay-talk';state.supportTopic='';state.previousView='checkout';state.returnToDecisionInline=false;setView('prepay-talk');track('prepay_talk_open',{source_cta:state.source});return;}state.requestMode='';setView('checkout');}
    function closeDrawer(opts){opts=opts||{};closeSupportMenu();setDecisionInlineOpen(false);mobileHeadCollapsed=false;layer.classList.remove('is-mobile-head-collapsed');document.documentElement.classList.remove('bz-commercial-open');document.body.classList.remove('bz-commercial-open');if(!state.open)return;state.lifecycle='closing';window.dispatchEvent(new CustomEvent('bz-commercial-before-close'));layer.classList.remove('is-open');layer.setAttribute('aria-hidden','true');state.open=false;if(layer&&layer.dataset)delete layer.dataset.bzcOrigin;window.dispatchEvent(new CustomEvent('bz-commercial-state',{detail:{open:false}}));unlock();track('drawer_close',{close_reason:opts.reason||'button',close_stage:state.view});if(!opts.fromPop&&state.pushed&&location.hash==='#conditions'){state.pushed=false;history.back();}else state.pushed=false;setTimeout(function(){state.readiness={time:false,sleep:false,tasks:false};state.requestMode='';setView('checkout');state.lifecycle='closed';if(state.opener&&state.opener.focus){var returnTarget=state.opener;requestAnimationFrame(function(){requestAnimationFrame(function(){if(returnTarget&&returnTarget.focus)returnTarget.focus({preventScroll:true});});});}},320);}

    function bindPage(){
      [].slice.call(document.querySelectorAll('[data-commercial-entry],#bz-hero .bz-hero-actions .bz-btn-primary,.bz-nav-btn,.bz-start-tag,.bz244-start-floating,a[href="#bz-form"]')).forEach(function(el){if(el.closest('#bz-form'))return;el.setAttribute('href','#conditions');el.setAttribute('data-bzc-open','checkout');el.setAttribute('aria-haspopup','dialog');});
      [].slice.call(document.querySelectorAll('.bz-tariff-7000-cta')).forEach(function(el){el.setAttribute('href','#conditions');el.setAttribute('data-bzc-plan-open','group');el.textContent='Войти в программу';});
      [].slice.call(document.querySelectorAll('.bz-consultation-cta')).forEach(function(el){el.setAttribute('href','#conditions');el.setAttribute('data-bzc-plan-open','personal');el.textContent='Обсудить личное сопровождение';});
    }

    window.addEventListener('bz-pricing-calculation-updated',function(){if(!state.open)return;if(state.view==='overview')renderTariffs();else if(state.view==='checkout')renderCheckout();applyCommercialArchitecture();});
    var checkoutOfferPrice=plan().price;
    setInterval(function(){
      if(!state.open||state.view!=='checkout')return;
      if(window.BZFlowCalendar&&typeof window.BZFlowCalendar.refreshConfig==='function')window.BZFlowCalendar.refreshConfig(new Date());
      var nextPrice=plan().price;
      if(nextPrice!==checkoutOfferPrice){checkoutOfferPrice=nextPrice;renderCheckout();setHead('checkout');applyCommercialArchitecture();}
    },30000);
    renderDates();applyCommercialArchitecture();syncStickyRailTop();
    var stickyScrollHost=layer.querySelector('[data-bzc-scroll]'),stickyRailFrame=0,mobileHeadCollapsed=false;
    function updateMobileHeadCollapse(){
      if(!stickyScrollHost)return;
      if(!matchMedia('(max-width:760px)').matches){mobileHeadCollapsed=false;layer.classList.remove('is-mobile-head-collapsed');return;}
      var y=stickyScrollHost.scrollTop||0;
      var next=mobileHeadCollapsed?y>18:y>54;
      if(next===mobileHeadCollapsed)return;
      mobileHeadCollapsed=next;
      layer.classList.toggle('is-mobile-head-collapsed',next);
    }
    if(stickyScrollHost)stickyScrollHost.addEventListener('scroll',function(){if(stickyRailFrame)return;stickyRailFrame=requestAnimationFrame(function(){stickyRailFrame=0;updateStickyRail();updateMobileHeadCollapse();});},{passive:true});
    window.addEventListener('resize',function(){updateStickyRail();updateMobileHeadCollapse();},{passive:true});
    updateMobileHeadCollapse();
    reconcilePaymentReturn();
    document.addEventListener('click',function(e){
      var passPreviewOpen=e.target.closest('[data-bz-mobile-pass-preview-open]');if(passPreviewOpen&&window.BZSharedPassPreview&&typeof window.BZSharedPassPreview.open==='function'&&window.BZSharedPassPreview.open(passPreviewOpen)){e.preventDefault();e.stopImmediatePropagation();return;}
      var talkOpen=e.target.closest('[data-bzc-open-talk]');if(talkOpen){e.preventDefault();e.stopImmediatePropagation();openDrawer({opener:talkOpen,view:'prepay-talk',source:talkOpen.getAttribute('data-bzc-source')||'pricing-prepay-talk'});return;}
      var planOpen=e.target.closest('[data-bzc-plan-open]');if(planOpen){e.preventDefault();e.stopImmediatePropagation();openDrawer({opener:planOpen,plan:planOpen.getAttribute('data-bzc-plan-open'),source:sourceFromElement(planOpen)});return;}
      var open=e.target.closest('[data-bzc-open],[data-commercial-entry],#bz-hero .bz-hero-actions .bz-btn-primary,.bz-nav-btn,.bz-start-tag,.bz244-start-floating,a[href="#conditions"],a[href="#bz-form"]');if(open&&!open.closest('#bz-commercial-layer')&&!open.closest('#bz-form')){e.preventDefault();e.stopImmediatePropagation();openDrawer({opener:open,view:'checkout',source:sourceFromElement(open)});}
    },true);

    layer.addEventListener('click',function(e){
      var t=e.target;
      var prepayChannel=t.closest('[data-bzc-prepay-talk-channel]');if(prepayChannel){e.preventDefault();openPrepayTalkChannel(prepayChannel.getAttribute('data-bzc-prepay-talk-channel'));return;}
      if(t.closest('[data-bzc-prepay-talk-callback]')){e.preventDefault();state.requestMode='prepay-talk';state.previousView='prepay-talk';state.returnToDecisionInline=false;syncApplicationHidden();syncQuestionRoute();setView('application');track('prepay_talk_callback_open',{source_view:'prepay-talk'});return;}
      var close=t.closest('[data-bzc-close]');if(close){e.preventDefault();if(close.classList.contains('bz-commercial-backdrop')&&state.dirty)return;closeDrawer({reason:close.classList.contains('bz-commercial-backdrop')?'backdrop':'button'});return;}
      var flowBtn=t.closest('[data-bzc-flow]');if(flowBtn){e.preventDefault();selectFlow(flowBtn.getAttribute('data-bzc-flow'));return;}
      var railPlan=t.closest('[data-bzc-rail-plan]');if(railPlan){e.preventDefault();var railKey=railPlan.getAttribute('data-bzc-rail-plan');if(CONFIG.tariffs[railKey]){var railChanged=state.plan!==railKey;state.plan=railKey;state.planExplicit=true;if(railChanged)state.method='full';state.paymentState='before';state.readiness={time:false,sleep:false,tasks:false};track('sticky_tariff_selected',{full_price:plan().price,requires_consultation:!!plan().consultRequired});renderTariffs();renderStickyRail();}return;}
      if(t.closest('[data-bzc-rail-open]')){e.preventDefault();var tariffHost=layer.querySelector('[data-bzc-tariffs]');if(tariffHost)tariffHost.scrollIntoView({behavior:'smooth',block:'start'});return;}
      if(t.closest('[data-bzc-rail-continue]')){e.preventDefault();if(!state.planExplicit){var tariffHostOpen=layer.querySelector('[data-bzc-tariffs]');if(tariffHostOpen)tariffHostOpen.scrollIntoView({behavior:'smooth',block:'start'});return;}selectPlan(state.plan);return;}
      var monolithPlan=t.closest('[data-bzc-monolith-plan]');if(monolithPlan){e.preventDefault();activateTariffFloor(monolithPlan.getAttribute('data-bzc-monolith-plan'));return;}
      var productMode=t.closest('button[data-bzc-product-mode]');if(productMode){e.preventDefault();setProductMode(productMode.getAttribute('data-bzc-product-mode'));return;}
      var tariffDetails=t.closest('[data-bzc-plan-details]');if(tariffDetails){e.preventDefault();handleTariffToggle(tariffDetails);return;}
      var p=t.closest('[data-bzc-select-plan]');if(p){e.preventDefault();selectPlan(p.getAttribute('data-bzc-select-plan'));return;}
      if(t.closest('[data-bzc-pay]')){e.preventDefault();if(!validatePaymentCustomer())return;openReadiness();return;}
      if(t.closest('[data-bzc-readiness-pay]')){e.preventDefault();if(!paymentGateComplete())return;startPayment();return;}
      var decisionTrigger=t.closest('[data-bzc-open-decision-help]');if(decisionTrigger){e.preventDefault();openDecisionHelp(decisionTrigger);return;}
      var dockPlan=t.closest('[data-bzc-pick-plan]');if(dockPlan){e.preventDefault();var dockKey=dockPlan.getAttribute('data-bzc-pick-plan');if(CONFIG.tariffs[dockKey]){var changed=state.plan!==dockKey;state.plan=dockKey;state.planExplicit=true;if(changed)state.method='full';track('decision_tariff_selected',{tariff:plan().name,blocker:state.blocker});renderDecisionHelp();}return;}
      if(t.closest('[data-bzc-clear-plan]')){e.preventDefault();state.planExplicit=false;state.method='full';renderDecisionHelp();return;}
      if(t.closest('[data-bzc-open-format]')){e.preventDefault();state.blocker='format';state.viewedBlockers.format=true;renderDecisionHelp();return;}
      if(t.closest('[data-bzc-open-date]')){e.preventDefault();state.blocker='date';state.viewedBlockers.date=true;renderDecisionHelp();return;}
      if(t.closest('[data-bzc-decision-continue-plan]')){e.preventDefault();if(!state.planExplicit)return;if(plan().consultRequired){state.contactTarget='personal-call';state.previousView='overview';setDecisionInlineOpen(false);setView('contact');}else{setDecisionInlineOpen(false);setView('checkout');}return;}
      if(t.closest('[data-bzc-save-conditions]')){e.preventDefault();if(!state.planExplicit)return;var saved={plan:state.plan,planExplicit:true,flowId:state.flowId,method:state.method,savedAt:new Date().toISOString()};try{localStorage.setItem('bz-commercial-saved-selection',JSON.stringify(saved));}catch(_e){}track('decision_conditions_saved',saved);var status=layer.querySelector('[data-bzc-save-status]');if(status){status.hidden=false;status.textContent='Условия сохранены в этом браузере. При следующем открытии шторки выбор будет восстановлен.';}setTimeout(function(){closeDrawer({reason:'conditions-saved'});},450);return;}
      var blocker=t.closest('[data-bzc-blocker]');if(blocker){e.preventDefault();var nextBlocker=blocker.getAttribute('data-bzc-blocker');var mobile=matchMedia('(max-width:760px)').matches;if(mobile&&state.blocker===nextBlocker&&state.mobileDecisionOpen){state.mobileDecisionOpen=false;}else{state.blocker=nextBlocker;state.viewedBlockers[state.blocker]=true;if(mobile)state.mobileDecisionOpen=true;}track('decision_blocker_selected',{blocker:state.blocker,variant:mobile?'mobile-faq':'04'});renderDecisionHelp();return;}
      if(t.closest('[data-bzc-choose-installment]')){e.preventDefault();state.method='installment';track('decision_help_return_checkout',{blocker:'installment'});setView('checkout');requestAnimationFrame(function(){var m=checkoutHost.querySelector('.bz-commercial-payment-section');if(m)m.scrollIntoView({block:'start'});});return;}
      var hf=t.closest('[data-bzc-help-flow]');if(hf){e.preventDefault();selectFlow(hf.getAttribute('data-bzc-help-flow'));if(state.planExplicit){track('decision_help_return_checkout',{blocker:'date'});setView('checkout');}else{state.blocker='format';state.viewedBlockers.format=true;renderDecisionHelp();}return;}
      if(t.closest('[data-bzc-open-existing-video]')){e.preventDefault();track('decision_help_method_video_open',{blocker:'method'});setView('overview');requestAnimationFrame(function(){if(window.BZCommercialCircle)window.BZCommercialCircle.open();});return;}
      var supportToggle=t.closest('[data-bzc-support-menu-toggle]');
      if(supportToggle){e.preventDefault();if(supportMenu&&supportMenu.hidden)openSupportMenu();else closeSupportMenu();return;}
      if(t.closest('[data-bzc-support-menu-close]')||t.closest('[data-bzc-support-modal-close]')){e.preventDefault();closeSupportMenu();return;}
      var supportRoute=t.closest('[data-bzc-support-topic]');
      if(supportRoute){e.preventDefault();state.supportTopic=supportRoute.getAttribute('data-bzc-support-topic')==='support'?'support':'ilya';state.source='header-support';track('header_support_route_selected',{recipient:state.supportTopic,source:'header-support',source_view:state.view});if(state.supportTopic==='ilya'){setSupportPersonalExpanded(true);return;}closeSupportMenu();openRequest('payment-support',{returnToDecisionInline:false});return;}
      var personalChannel=t.closest('[data-bzc-personal-channel]');if(personalChannel){e.preventDefault();openPersonalChannel(personalChannel.getAttribute('data-bzc-personal-channel'));return;}
      if(t.closest('[data-bzc-support-topic-back]')){e.preventDefault();setSupportPersonalExpanded(false);return;}
      var questionTrigger=t.closest('[data-bzc-open-question]');if(questionTrigger){if(questionTrigger.hasAttribute('data-bz-mobile-sheet-open')&&matchMedia('(max-width:980px)').matches)return;e.preventDefault();var questionSource=questionTrigger.getAttribute('data-bzc-question-source')||'decision-help';state.source=questionSource;state.supportTopic='ilya';track('decision_help_personal_question_open',{blocker:'personal',source:questionSource});openRequest('personal',{mode:questionSource==='author-situation'?'author-situation':''});return;}
      if(t.closest('[data-bzc-next-flow]')){e.preventDefault();openRequest('next-flow');return;}
      if(t.closest('[data-bzc-send-conditions]')){e.preventDefault();openRequest('need-time');return;}
      if(t.closest('[data-bzc-focus-blockers]')){e.preventDefault();var panel=decisionHost&&decisionHost.querySelector('.bz-commercial-blocker-panel');if(panel)panel.scrollIntoView({behavior:'smooth',block:'start'});return;}
      if(t.closest('[data-bzc-return-checkout]')){e.preventDefault();track('decision_help_return_checkout',{blocker:state.blocker});setDecisionInlineOpen(false);setView('checkout');return;}
      if(t.closest('[data-bzc-open-contact]')){e.preventDefault();var contactBtn=t.closest('[data-bzc-open-contact]');var target=contactBtn.getAttribute('data-bzc-open-contact');state.contactTarget=target==='ilya'?'ilya':(target==='call'?'call':'team');state.previousView=state.view;var contactClickEvent=state.contactTarget==='ilya'?'ilya_personal_click':(state.contactTarget==='call'?'call_request_click':'team_contact_click');track(contactClickEvent,{source_view:state.view,contact_target:state.contactTarget});if(state.contactTarget==='ilya'&&CONFIG.personalContactUrl){window.open(CONFIG.personalContactUrl,'_blank','noopener');return;}setView('contact');return;}
      if(t.closest('[data-bzc-open-video]')){e.preventDefault();track('video_from_readiness');setView('overview');requestAnimationFrame(function(){if(window.BZCommercialCircle)window.BZCommercialCircle.open();});return;}
      var dev=t.closest('[data-bzc-dev-state]');if(dev){e.preventDefault();setPaymentState(dev.getAttribute('data-bzc-dev-state'));return;}
      if(t.closest('[data-bzc-back-checkout]')){e.preventDefault();setView('checkout');return;}
      if(t.closest('[data-bzc-read-method]')){e.preventDefault();var savedContext={plan:state.plan,planExplicit:state.planExplicit,flowId:state.flowId,method:state.method,blocker:state.blocker,viewedBlockers:state.viewedBlockers,savedAt:new Date().toISOString()};try{localStorage.setItem('bz-commercial-decision-context',JSON.stringify(savedContext));localStorage.setItem('bz-commercial-saved-selection',JSON.stringify({plan:state.plan,flowId:state.flowId,method:state.method,savedAt:savedContext.savedAt}));}catch(_siteExitSaveErr){}var openerTarget=state.opener&&document.body.contains(state.opener)?state.opener:null;var genericSource=/^(hero-primary|navigation|start-tag|floating-cta|drawer)$/.test(state.source||'');var siteTarget=genericSource?document.getElementById('bz-method')||document.getElementById('bz-marathon-mechanics'):openerTarget||document.getElementById('bz-method')||document.getElementById('bz-marathon-mechanics');track('decision_help_read_method',{blocker:state.blocker,target:siteTarget&&siteTarget.id||'origin'});closeDrawer({reason:'decision-read-method'});setTimeout(function(){if(siteTarget&&siteTarget.scrollIntoView)siteTarget.scrollIntoView({behavior:'smooth',block:'start'});var toast=document.createElement('div');toast.className='bz-commercial-selection-toast';toast.textContent='Выбранные условия сохранены';document.body.appendChild(toast);requestAnimationFrame(function(){toast.classList.add('is-visible');});setTimeout(function(){toast.classList.remove('is-visible');setTimeout(function(){toast.remove();},240);},2400);},380);return;}
      if(t.closest('[data-bzc-go-overview]')){e.preventDefault();setView('overview');return;}
      var methodLink=t.closest('[data-bzc-method-link]');if(methodLink){e.preventDefault();var targetId=(methodLink.getAttribute('href')||'#bz-marathon-mechanics').replace(/^#/,'');closeDrawer({reason:'method-link'});setTimeout(function(){var m=document.getElementById(targetId);if(m)m.scrollIntoView({behavior:'smooth',block:'start'});},350);}
      var legalLink=t.closest('[data-bzc-legal-target]');if(legalLink){e.preventDefault();var legalTarget=legalLink.getAttribute('data-bzc-legal-target');closeDrawer({reason:'legal-link'});setTimeout(function(){var doc=document.getElementById(legalTarget)||document.getElementById('bz-footer-documents');if(doc)doc.scrollIntoView({behavior:'smooth',block:'center'});},350);return;}
    });

    layer.addEventListener('change',function(e){
      var check=e.target.closest('[data-bzc-ready-check]');if(check){var id=check.getAttribute('data-bzc-ready-check');if(Object.prototype.hasOwnProperty.call(state.readiness,id))state.readiness[id]=!!check.checked;var readinessItem=check.closest('.bz-commercial-readiness-checkpoint-item');if(readinessItem)readinessItem.classList.toggle('is-checked',!!check.checked);updateReadinessGate();state.dirty=true;return;}
      if(e.target&&e.target.id==='bzc-app-channel')syncApplicationContactField();
      if(e.target.matches('input,select,textarea'))state.dirty=true;
    });
    layer.addEventListener('input',function(e){var f=e.target.closest('[data-bzc-field]');if(f)f.classList.remove('is-invalid');var customerField=e.target.closest('[data-bzc-customer]');if(customerField){var customerKey=customerField.getAttribute('data-bzc-customer');if(customerKey&&Object.prototype.hasOwnProperty.call(state.customer,customerKey))state.customer[customerKey]=customerField.value;var payError=checkoutHost.querySelector('[data-bzc-pay-error]');if(payError)payError.hidden=true;}if(e.target.matches('input,select,textarea'))state.dirty=true;});

    back.addEventListener('click',function(){if(state.view==='application'&&state.returnToDecisionInline){var returnView=state.previousView||'overview';state.returnToDecisionInline=false;setView(returnView);requestAnimationFrame(function(){openDecisionHelp(null,{instant:true,force:true});});}else if(state.view==='application')setView(state.previousView||'overview');else if(state.view==='checkout')setView('checkout');else if(state.view==='readiness')setView('checkout');else if(state.view==='contact')setView(state.previousView||'checkout');else if(state.view==='prepay-talk')setView('checkout');else if(state.view==='payment-state')setView('checkout');else setView('overview');});
    [].slice.call(layer.querySelectorAll('.bz-commercial-payment-faq details')).forEach(function(item){item.addEventListener('toggle',function(){if(!item.open)return;[].slice.call(layer.querySelectorAll('.bz-commercial-payment-faq details')).forEach(function(other){if(other!==item)other.open=false;});});});
    layer.addEventListener('keydown',function(e){
      if(e.key!=='ArrowLeft'&&e.key!=='ArrowRight'&&e.key!=='Home'&&e.key!=='End')return;
      var routeTab=e.target&&e.target.closest?e.target.closest('button[role="tab"][data-bzc-product-mode]'):null;
      if(routeTab){
        var routeTabs=[].slice.call(layer.querySelectorAll('.bz-commercial-route-tabs button[role="tab"][data-bzc-product-mode]:not([disabled])'));
        if(!routeTabs.length)return;
        e.preventDefault();
        var routeIndex=routeTabs.indexOf(routeTab),routeNext=routeIndex;
        if(e.key==='Home')routeNext=0;
        else if(e.key==='End')routeNext=routeTabs.length-1;
        else if(e.key==='ArrowRight')routeNext=(routeIndex+1)%routeTabs.length;
        else routeNext=(routeIndex-1+routeTabs.length)%routeTabs.length;
        routeTabs[routeNext].focus();
        setProductMode(routeTabs[routeNext].getAttribute('data-bzc-product-mode'));
        return;
      }
      var tab=e.target&&e.target.closest?e.target.closest('[role="tab"][data-bzc-flow]'):null;
      if(!tab)return;
      var tabs=[].slice.call(layer.querySelectorAll('.bz-commercial-flow-tabs [role="tab"][data-bzc-flow]:not([disabled])'));
      if(!tabs.length)return;
      e.preventDefault();
      var index=tabs.indexOf(tab),next=index;
      if(e.key==='Home')next=0;
      else if(e.key==='End')next=tabs.length-1;
      else if(e.key==='ArrowRight')next=(index+1)%tabs.length;
      else next=(index-1+tabs.length)%tabs.length;
      tabs[next].focus();
      selectFlow(tabs[next].getAttribute('data-bzc-flow'));
    });
    document.addEventListener('keydown',function(e){if(!state.open)return;if(e.key==='Escape'){e.preventDefault();if(supportMenu&&!supportMenu.hidden){closeSupportMenu();return;}closeDrawer({reason:'escape'});return;}if(e.key!=='Tab')return;var items=focusable();if(!items.length)return;var first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}});
    window.addEventListener('popstate',function(){if(state.open)closeDrawer({fromPop:true,reason:'history'});});
    window.addEventListener('bz:flow-calendar-updated',function(){
      var available=availableFlows();
      if(!available.length)return;
      if(!available.some(function(f){return f.id===state.flowId;}))state.flowId=available[0].id;
      if(window.BZCommercialDecisionState&&window.BZCommercialDecisionState.update)window.BZCommercialDecisionState.update({selectedStartId:state.flowId});
      if(!state.open)return;
      renderDates();
      if(state.view==='checkout')renderCheckout();
      else if(state.view==='readiness')renderReadiness();
      else if(state.view==='payment-state')renderPaymentState(state.paymentState);
      setHead(state.view);
    });
    window.addEventListener('bz:decision-window-change',function(){
      if(window.BZFlowCalendar&&typeof window.BZFlowCalendar.refreshConfig==='function')window.BZFlowCalendar.refreshConfig(new Date());
      if(!state.open)return;
      if(state.view==='checkout')renderCheckout();
      else if(state.view==='payment-state')renderPaymentState(state.paymentState);
      setHead(state.view);
    });

    bindPage();
    window.BZCommercialPaymentPrototype={open:openDrawer,close:closeDrawer,setState:setPaymentState,setView:setView,config:CONFIG,state:state,track:track};
    if(location.hash==='#conditions'){history.replaceState(history.state,'',location.pathname+location.search);openDrawer({pushHistory:false,view:'checkout',source:'deep-link'});}
  });
})();

(function(){
  'use strict';

  var layer=document.getElementById('bz-commercial-layer');
  if(!layer)return;

  var panel=layer.querySelector('.bz-commercial-panel');
  var backdrop=layer.querySelector('.bz-commercial-backdrop');
  var scroller=layer.querySelector('[data-bzc-scroll]');
  if(!panel||!scroller)return;

  var g={
    active:false,
    dragging:false,
    touchId:null,
    startX:0,
    startY:0,
    startTime:0,
    dy:0,
    fromHandle:false,
    closing:false,
    snapTimer:0,
    closeTimer:0
  };

  var interactive='button,a,input,select,textarea,label,[role="button"],[contenteditable="true"],details,summary';

  function mobile(){return matchMedia('(max-width:760px)').matches;}

  function clearTimer(name){
    if(g[name]){
      clearTimeout(g[name]);
      g[name]=0;
    }
  }

  function touchById(list,id){
    for(var i=0;i<list.length;i++){
      if(list[i].identifier===id)return list[i];
    }
    return null;
  }

  function resetGesture(){
    g.active=false;
    g.dragging=false;
    g.touchId=null;
    g.dy=0;
    g.fromHandle=false;
  }

  function clearVisuals(){
    clearTimer('snapTimer');
    clearTimer('closeTimer');
    panel.classList.remove('is-dragging');
    panel.style.removeProperty('transition');
    panel.style.removeProperty('transform');
    panel.style.removeProperty('will-change');
    if(backdrop){
      backdrop.style.removeProperty('opacity');
      backdrop.style.removeProperty('transition');
    }
  }

  function canStart(event){
    if(!mobile()||!layer.classList.contains('is-open')||g.closing||g.active)return false;
    if(event.touches.length!==1)return false;

    var fromHandle=!!event.target.closest('[data-bzc-drag]');

    /*
      По контенту swipe-to-close разрешён только в верхней точке скролла,
      чтобы не красть обычную прокрутку. Верхняя ручка — отдельный явный
      drag-контрол: она обязана закрывать шторку из любой позиции контента.
    */
    if(scroller.scrollTop>1&&!fromHandle)return false;
    if(event.target.closest(interactive)&&!fromHandle)return false;
    return true;
  }

  function snapBack(){
    if(g.closing)return;

    panel.style.setProperty('will-change','transform');
    panel.style.setProperty('transition','transform 250ms cubic-bezier(.22,1,.36,1)','important');
    panel.style.setProperty('transform','translate3d(0,0,0)','important');

    if(backdrop){
      backdrop.style.setProperty('transition','opacity 210ms ease','important');
      backdrop.style.setProperty('opacity','1','important');
    }

    g.snapTimer=setTimeout(function(){
      if(g.closing)return;
      clearVisuals();
      resetGesture();
    },270);
  }

  function invokeCanonicalClose(){
    if(!g.closing)return;
    clearTimer('closeTimer');

    if(window.BZCommercialPaymentPrototype&&typeof window.BZCommercialPaymentPrototype.close==='function'){
      window.BZCommercialPaymentPrototype.close({reason:'swipe'});
    }
  }

  function closeBySwipe(){
    if(g.closing)return;

    g.closing=true;
    g.active=false;
    g.dragging=false;
    panel.classList.remove('is-dragging');

    /*
      В файле есть несколько исторических transform-деклараций панели,
      включая !important. Поэтому канонический gesture-owner обязан
      на время жеста владеть transform через inline important, а не
      надеяться на порядок каскада.
    */
    panel.style.setProperty('will-change','transform');
    panel.style.setProperty('transition','transform 235ms cubic-bezier(.22,1,.36,1)','important');
    panel.style.setProperty('transform','translate3d(0,calc(100% + 32px),0)','important');

    if(backdrop){
      backdrop.style.setProperty('transition','opacity 190ms ease','important');
      backdrop.style.setProperty('opacity','0','important');
    }

    var completed=false;
    function complete(event){
      if(completed)return;
      if(event&&event.target!==panel)return;
      if(event&&event.propertyName!=='transform')return;
      completed=true;
      panel.removeEventListener('transitionend',complete);
      invokeCanonicalClose();
    }

    panel.addEventListener('transitionend',complete);
    g.closeTimer=setTimeout(function(){complete();},280);
  }

  function onTouchStart(event){
    if(!canStart(event))return;

    var touch=event.touches[0];
    g.active=true;
    g.dragging=false;
    g.touchId=touch.identifier;
    g.startX=touch.clientX;
    g.startY=touch.clientY;
    g.startTime=performance.now();
    g.dy=0;
    g.fromHandle=!!event.target.closest('[data-bzc-drag]');
  }

  function onTouchMove(event){
    if(!g.active||g.closing)return;

    var touch=touchById(event.touches,g.touchId);
    if(!touch)return;

    var dx=touch.clientX-g.startX;
    var dy=touch.clientY-g.startY;

    if(!g.dragging){
      if(Math.abs(dx)<7&&Math.abs(dy)<7)return;

      if(Math.abs(dx)>Math.abs(dy)||dy<=0||(!g.fromHandle&&scroller.scrollTop>1)){
        resetGesture();
        return;
      }

      g.dragging=true;
      panel.classList.add('is-dragging');
      panel.style.setProperty('will-change','transform');
      panel.style.setProperty('transition','none','important');
      if(backdrop)backdrop.style.setProperty('transition','none','important');
    }

    if(event.cancelable)event.preventDefault();
    event.stopPropagation();

    g.dy=Math.max(0,dy);
    panel.style.setProperty('transform','translate3d(0,'+g.dy.toFixed(1)+'px,0)','important');

    if(backdrop){
      var ratio=Math.min(.82,g.dy/Math.max(210,panel.clientHeight*.68));
      backdrop.style.setProperty('opacity',String(1-ratio),'important');
    }
  }

  function onTouchEnd(event){
    if(!g.active||g.closing)return;

    var ended=touchById(event.changedTouches,g.touchId);
    if(!ended)return;

    if(!g.dragging){
      resetGesture();
      return;
    }

    if(event.cancelable)event.preventDefault();
    event.stopPropagation();

    var elapsed=Math.max(1,performance.now()-g.startTime);
    var velocity=g.dy/elapsed;
    var threshold=Math.min(132,panel.clientHeight*.14);

    g.active=false;
    g.touchId=null;

    if(g.dy>=threshold||(g.dy>=34&&velocity>=.38))closeBySwipe();
    else snapBack();
  }

  function onTouchCancel(){
    if(g.closing)return;
    if(!g.active)return;
    if(g.dragging)snapBack();
    else resetGesture();
  }

  panel.addEventListener('touchstart',onTouchStart,{passive:true});
  panel.addEventListener('touchmove',onTouchMove,{passive:false});
  panel.addEventListener('touchend',onTouchEnd,{passive:false});
  panel.addEventListener('touchcancel',onTouchCancel,{passive:true});

  window.addEventListener('bz-commercial-state',function(event){
    if(!event.detail||!event.detail.open){
      clearVisuals();
      resetGesture();
      g.closing=false;
    }
  });
})();

(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else fn();
  }
  ready(function () {
    var layer = document.getElementById('bz-commercial-layer');
    if (!layer || layer.dataset.wheelBridge2005 === '1') return;
    layer.dataset.wheelBridge2005 = '1';
    var scroller = layer.querySelector('[data-bzc-scroll]');
    if (!scroller) return;

    layer.addEventListener('wheel', function (event) {
      if (!layer.classList.contains('is-open')) return;
      if (!event.target || !event.target.closest('.bz-commercial-panel')) return;
      var factor = event.deltaMode === 1 ? 18 : (event.deltaMode === 2 ? scroller.clientHeight : 1);
      scroller.scrollTop += event.deltaY * factor;
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
    }, { capture: true, passive: false });
  });
})();

(function(){
  'use strict';
  var layer=document.getElementById('bz-commercial-layer');if(!layer)return;
  var raf=0;
  function sync(){
    cancelAnimationFrame(raf);
    raf=requestAnimationFrame(function(){
      var mobile=matchMedia('(max-width:760px)').matches;
      var island=document.querySelector('#borzilov-lp #bz-hero.bz-hero');
      var ir=island&&island.getBoundingClientRect?island.getBoundingClientRect():null;

      if(!mobile){
        if(ir&&ir.width>0){
          layer.style.setProperty('--bzc-desktop-left',Math.round(ir.left)+'px');
          layer.style.setProperty('--bzc-desktop-width',Math.round(ir.width)+'px');
        }else{
          layer.style.removeProperty('--bzc-desktop-left');
          layer.style.removeProperty('--bzc-desktop-width');
        }
        return;
      }

      layer.style.removeProperty('--bzc-desktop-left');
      layer.style.removeProperty('--bzc-desktop-width');
      layer.style.removeProperty('--bzc-mobile-sheet-top');
    });
  }
  sync();window.addEventListener('resize',sync,{passive:true});
  if(window.visualViewport)window.visualViewport.addEventListener('resize',sync,{passive:true});
  window.addEventListener('bz-commercial-state',sync);
})();

(function(){
  'use strict';
  function getVideo(){return document.querySelector('#bz-commercial-layer #author-video video.author-video-media');}
  function getWidget(){return document.querySelector('#bz-commercial-layer #author-video [data-video-widget]');}
  function stopAndReset(){
    var widget=getWidget(),collapse=widget&&widget.querySelector('[data-video-collapse]');
    if(widget&&widget.getAttribute('data-state')!=='collapsed'&&collapse){try{collapse.click();}catch(e){}}
    var video=getVideo();if(video){try{video.pause();video.currentTime=0;video.loop=false;}catch(e){}}
  }
  function restorePoster(){var video=getVideo(),widget=getWidget();if(!video||!widget)return;if(widget.getAttribute('data-machine-state')==='anchor_idle'){try{video.pause();video.currentTime=0;}catch(e){}video.muted=true;video.loop=false;video.playsInline=true;video.removeAttribute('autoplay');}}
  function openCircle(){var section=document.querySelector('#bz-commercial-layer #author-video');var orb=section&&section.querySelector('[data-video-orb]');if(!section)return;section.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'center'});requestAnimationFrame(function(){var widget=getWidget();if(orb&&widget&&widget.getAttribute('data-state')==='collapsed')orb.click();});}
  window.BZCommercialCircle={open:openCircle,close:stopAndReset,stop:stopAndReset};
  window.addEventListener('bz-commercial-before-close',stopAndReset);
  window.addEventListener('bz-commercial-view-change',function(e){if(e.detail&&e.detail.view==='overview')requestAnimationFrame(restorePoster);else stopAndReset();});
  window.addEventListener('bz-commercial-state',function(e){if(e.detail&&e.detail.open)requestAnimationFrame(restorePoster);else stopAndReset();});
  var layer=document.getElementById('bz-commercial-layer');if(layer&&!layer.classList.contains('is-open'))stopAndReset();
})();


/* analysis block interaction owner */
(function(){
  var host=document.querySelector('.bz-commercial-analysis-entry');
  if(!host)return;
  document.addEventListener('click',function(e){
    var reveal=e.target.closest('[data-analysis-reveal]');
    if(reveal&&host.contains(reveal)){
      var picker=host.querySelector('[data-analysis-picker]');
      if(picker)picker.classList.remove('bz-analysis-hidden');
      reveal.classList.add('bz-analysis-hidden');
      return;
    }
    var ch=e.target.closest('[data-analysis-channel]');
    if(ch&&host.contains(ch)){
      if(ch.tagName!=='A')e.preventDefault();
      var channel=ch.getAttribute('data-analysis-channel');
      try{localStorage.setItem('bz-analysis-channel',channel);}catch(_){}
      document.dispatchEvent(new CustomEvent('bz:analysis-channel',{detail:{channel:channel}}));
      var old=ch.textContent;
      ch.textContent='Выбрано: '+channel;
      setTimeout(function(){ch.textContent=old;},1300);
    }
  });
})();

