/* owner:bz-commercial-config-canonical
   Shared production source of truth for flows, formats, prices, installment rules and commercial links.
*/
(function(){
  'use strict';
  if(!window.BZCommercialDecisionState){
    var decisionStorageKey='bz-commercial-decision-state-v1';
    var decisionDefaults={cigarettesPerDay:null,packPrice:null,calculationCompleted:false,selectedStartId:null};
    function readDecisionState(){
      var stored=null;
      try{stored=JSON.parse(sessionStorage.getItem(decisionStorageKey)||'null');}catch(_decisionReadErr){}
      stored=stored&&typeof stored==='object'?stored:{};
      return {
        cigarettesPerDay:stored.cigarettesPerDay!==null&&stored.cigarettesPerDay!==''&&Number.isFinite(Number(stored.cigarettesPerDay))?Number(stored.cigarettesPerDay):null,
        packPrice:stored.packPrice!==null&&stored.packPrice!==''&&Number.isFinite(Number(stored.packPrice))?Number(stored.packPrice):null,
        calculationCompleted:stored.calculationCompleted===true,
        selectedStartId:typeof stored.selectedStartId==='string'&&stored.selectedStartId?stored.selectedStartId:null
      };
    }
    function updateDecisionState(patch){
      var next=Object.assign({},decisionDefaults,readDecisionState(),patch||{});
      try{sessionStorage.setItem(decisionStorageKey,JSON.stringify(next));}catch(_decisionWriteErr){}
      return next;
    }
    window.BZCommercialDecisionState={key:decisionStorageKey,read:readDecisionState,update:updateDecisionState};
  }
  if(window.BZCommercialConfig)return;

  /* owner:bz-personal-decision-window-v1
     Client-persisted bridge for the personal 3-hour window. The API is intentionally
     isolated so a server-issued decisionAt/expiresAt can replace localStorage later
     without rebuilding the commercial scene. */
  if(!window.BZDecisionWindow){
    var decisionWindowStorageKey='bz-personal-decision-window-v1';
    var decisionWindowMs=3*60*60*1000;
    var decisionWindowExpiryTimer=0;
    function normalizeDecisionWindow(raw){
      if(!raw||typeof raw!=='object')return null;
      var decisionAt=Number(raw.decisionAt),expiresAt=Number(raw.expiresAt);
      if(!Number.isFinite(decisionAt)||!Number.isFinite(expiresAt)||expiresAt<=decisionAt)return null;
      return {version:1,decisionAt:decisionAt,expiresAt:expiresAt,source:String(raw.source||'browser')};
    }
    function readDecisionWindow(){
      var server=normalizeDecisionWindow(window.BZDecisionWindowServerState);
      if(server)return server;
      try{return normalizeDecisionWindow(JSON.parse(localStorage.getItem(decisionWindowStorageKey)||'null'));}catch(_decisionWindowReadErr){return null;}
    }
    function writeDecisionWindow(value){
      try{localStorage.setItem(decisionWindowStorageKey,JSON.stringify(value));}catch(_decisionWindowWriteErr){}
    }
    function decisionWindowState(now){
      var record=readDecisionWindow(),time=now instanceof Date?now.getTime():Number(now)||Date.now();
      if(!record)return {locked:false,active:false,expired:false,decisionAt:null,expiresAt:null,progress:0,remainingMs:0};
      var span=Math.max(1,record.expiresAt-record.decisionAt);
      var progress=Math.max(0,Math.min(1,(time-record.decisionAt)/span));
      var active=time<record.expiresAt;
      return {locked:true,active:active,expired:!active,decisionAt:record.decisionAt,expiresAt:record.expiresAt,progress:progress,remainingMs:Math.max(0,record.expiresAt-time),source:record.source};
    }
    function dispatchDecisionWindow(name,state){
      try{window.dispatchEvent(new CustomEvent(name,{detail:state||decisionWindowState()}));}catch(_decisionWindowDispatchErr){}
    }
    function scheduleDecisionWindowExpiry(record){
      if(decisionWindowExpiryTimer){clearTimeout(decisionWindowExpiryTimer);decisionWindowExpiryTimer=0;}
      record=normalizeDecisionWindow(record||readDecisionWindow());
      if(!record)return;
      var delay=record.expiresAt-Date.now();
      if(delay<=0)return;
      decisionWindowExpiryTimer=setTimeout(function(){
        decisionWindowExpiryTimer=0;
        dispatchDecisionWindow('bz:decision-window-change',decisionWindowState());
      },Math.min(delay+50,2147483000));
    }
    function lockDecisionWindow(now){
      var existing=readDecisionWindow();
      if(existing)return existing;
      var date=now instanceof Date?new Date(now.getTime()):new Date(now||Date.now());
      date.setSeconds(0,0);
      var record={version:1,decisionAt:date.getTime(),expiresAt:date.getTime()+decisionWindowMs,source:'browser'};
      writeDecisionWindow(record);
      scheduleDecisionWindowExpiry(record);
      dispatchDecisionWindow('bz:decision-window-change',decisionWindowState(date));
      return record;
    }
    window.BZDecisionWindow={
      key:decisionWindowStorageKey,
      durationMs:decisionWindowMs,
      read:readDecisionWindow,
      state:function(now){var s=decisionWindowState(now);s.active=false;s.expired=false;return s;},
      active:function(){return false;},
      lock:lockDecisionWindow,
      currentPrice:function(){return 14000;}
    };
    scheduleDecisionWindowExpiry(readDecisionWindow());
  }

  /* owner:bz-flow-calendar-canonical-v2
     On a flow start date, that flow is no longer offered to a new visitor.
     The nearest selectable flow becomes +14 days; the second option is +28 days. */
  var FLOW_DAY_MS=86400000;
  var FLOW_INTERVAL_DAYS=14;
  var FLOW_INTERVAL_MS=FLOW_INTERVAL_DAYS*FLOW_DAY_MS;
  var FLOW_ANCHOR_UTC=Date.UTC(2026,7,30);
  var GROUP_STANDARD_PRICE=14000;
  var GROUP_TODAY_PRICE=14000;
  var FLOW_TEMPLATES=[
    {id:'2026-08-30',label:'30 августа',value:'2026-08-30',available:true,title:'Поток 30 августа',status:'Набор открыт',capacity:15,remaining:5,demo:true,prices:{group:14000,extended:14000,personal:14000}}
  ];
  function flowMoscowTodayUtc(now){
    var d=now instanceof Date?now:new Date(now||Date.now());
    var parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Moscow',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d);
    var values={};parts.forEach(function(part){if(part.type!=='literal')values[part.type]=Number(part.value);});
    return Date.UTC(values.year,values.month-1,values.day);
  }
  function groupOfferActive(){return false;}
  function currentGroupPrice(now){return groupOfferActive(now)?GROUP_TODAY_PRICE:GROUP_STANDARD_PRICE;}
  function flowIdFromUtc(value){return new Date(value).toISOString().slice(0,10);}
  function flowLabelFromUtc(value){return new Intl.DateTimeFormat('ru-RU',{timeZone:'UTC',day:'numeric',month:'long'}).format(new Date(value));}
  function strictNextFlowUtc(now){
    var today=flowMoscowTodayUtc(now);
    if(today<FLOW_ANCHOR_UTC)return FLOW_ANCHOR_UTC;
    return FLOW_ANCHOR_UTC+(Math.floor((today-FLOW_ANCHOR_UTC)/FLOW_INTERVAL_MS)+1)*FLOW_INTERVAL_MS;
  }
  function templateForFlow(value){
    var id=flowIdFromUtc(value),exact=FLOW_TEMPLATES.find(function(item){return item.id===id;});
    if(exact)return exact;
    var sorted=FLOW_TEMPLATES.slice().sort(function(a,b){return String(a.id).localeCompare(String(b.id));});
    var eligible=sorted.filter(function(item){return item.id<=id;});
    return eligible[eligible.length-1]||sorted[sorted.length-1];
  }
  function materializeFlow(value,now){
    var base=templateForFlow(value),id=flowIdFromUtc(value),label=flowLabelFromUtc(value);
    var copy=Object.assign({},base,{id:id,label:label,value:id,title:'Поток '+label,available:true,closed:false,demo:base&&base.id===id?!!base.demo:false});
    if(base&&base.prices)copy.prices=Object.assign({},base.prices);
    copy.prices=Object.assign({},copy.prices||{},{group:currentGroupPrice(now)});
    return copy;
  }
  function upcomingFlows(count,now){
    count=Math.max(1,Number(count)||2);
    var first=strictNextFlowUtc(now),out=[];
    for(var i=0;i<count;i++)out.push(materializeFlow(first+i*FLOW_INTERVAL_MS,now));
    return out;
  }
  function nextFlowState(now){
    var today=flowMoscowTodayUtc(now),next=strictNextFlowUtc(now);
    return {days:Math.round((next-today)/FLOW_DAY_MS),dateUtc:next,dateId:flowIdFromUtc(next),dateLabel:flowLabelFromUtc(next)};
  }

  window.BZCommercialConfig={
    PAYMENT_ENABLED:true,
    paymentCreateEndpoint:'https://ilaborzilov0-netizen-metod-payment-test-0305.twc1.net/api/payment/create',
    paymentStatusEndpoint:'https://ilaborzilov0-netizen-metod-payment-test-0305.twc1.net/api/payment/status',
    flows:upcomingFlows(4),
    nextStepUrl:'',
    nextStepLabel:'Открыть инструкции',
    maxUrl:'https://max.ru/id312334031550_biz',
    personalContactUrl:'https://t.me/metodborzilovabot?start=site',
    materialsTiming:'Инструкции будут отправлены после подтверждения участия.',
    readiness:[
      {id:'time',label:'У меня есть в среднем 15–25 минут в день',help:'Если сейчас сложно выделить даже 15 минут, лучше сначала уточнить формат.'},
      {id:'sleep',label:'Обычно я сплю больше 6 часов',help:'Если сон регулярно меньше 6 часов, лучше обсудить старт отдельно.'},
      {id:'tasks',label:'Я готов(а) выполнять необходимые задания и рекомендации',help:'Если пока не готовы включаться в задания, лучше сначала уточнить, подходит ли сейчас момент.'}
    ],
    tariffs:{
      group:{name:'Участие',badge:'14 дней · мини-группа',price:currentGroupPrice(),paymentEnabled:true,installments:{count:6,amount:Math.ceil(currentGroupPrice()/6),months:[3,6],placeRule:'after_bank_confirmation'},forWhom:'14-дневный маршрут в небольшой группе с поддержкой внутри общего контура.',difference:'Один маршрут в мини-группе',detailKicker:'Участие в практикуме',routeSummary:'Подготовка вместо ожидания идеального момента, поддержка вместо одиночного терпения и конкретный следующий шаг каждый день.',features:['14-дневный маршрут','прохождение в небольшой группе','поддержка внутри общего контура']},
      extended:{name:'Группа + личный разбор',badge:'Расширенный формат',price:14000,paymentEnabled:true,installments:{count:6,amount:2334,months:[3,6],placeRule:'after_bank_confirmation'},forWhom:'Всё из мини-группы + отдельный разбор вашей схемы курения.',difference:'Общий маршрут плюс персональная настройка ключевых сложностей',detailKicker:'Всё из мини-группы, плюс',routeSummary:'Все опоры маршрута сохраняются; к ним добавляется личная настройка ключевых сложностей.',features:['индивидуальный разбор вашей схемы курения','разбор ключевых сложностей и триггеров','персональные рекомендации для дальнейшего прохождения']},
      personal:{name:'Личное сопровождение',badge:'Личный формат',price:14000,paymentEnabled:false,installments:{count:4,amount:3500,placeRule:'after_confirmation'},forWhom:'Отдельный формат работы один на один с более плотной обратной связью.',difference:'Персональный маршрут под вашу ситуацию',detailKicker:'Отдельный личный формат',routeSummary:'Те же опоры маршрута собираются один на один под вашу ситуацию и темп прохождения.',features:['работа один на один','персональный маршрут под вашу ситуацию','более плотная обратная связь','индивидуальная настройка следующего шага','участие подтверждается после предварительного созвона'],consultRequired:true}
    }
  };
  window.BZFlowCalendar={
    anchorUtc:FLOW_ANCHOR_UTC,
    intervalDays:FLOW_INTERVAL_DAYS,
    nextState:nextFlowState,
    upcoming:function(count,now){return upcomingFlows(count,now);},
    refreshConfig:function(now){
      if(window.BZCommercialConfig){
        window.BZCommercialConfig.flows=upcomingFlows(4,now);
        if(window.BZCommercialConfig.tariffs&&window.BZCommercialConfig.tariffs.group){
          window.BZCommercialConfig.tariffs.group.price=currentGroupPrice(now);
          if(window.BZCommercialConfig.tariffs.group.installments)window.BZCommercialConfig.tariffs.group.installments.amount=Math.ceil(currentGroupPrice(now)/6);
        }
      }
      return window.BZCommercialConfig&&window.BZCommercialConfig.flows||[];
    }
  };
  window.BZCommercialOffer={standardPrice:GROUP_STANDARD_PRICE,todayPrice:GROUP_TODAY_PRICE,active:groupOfferActive,currentPrice:currentGroupPrice,window:window.BZDecisionWindow};
})();
