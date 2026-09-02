/* owner:bz-site-analytics-goals-0190
   Yandex.Metrica counter: 110906734.
   Canonical goal contract for the stable master.

   Goal identifiers for counter 110906734 are listed in GOALS below.
   Numeric Metrica goal IDs are intentionally not hard-coded because the new
   counter assigns them only after the JavaScript goals are created in the UI.

   Semantic funnel goals (their numeric Metrica IDs are assigned only after
   these JavaScript goals are created in the Metrica UI):
   ur-f-contact
   ur-f-core
   ur-f-decision
   ur-f-cta
   ur-f-checkout
   ur-f-purchase
   ur-talk

   Diagnostic New goals (created explicitly in Metrica):
   ur-island-1
   ur-island-2
   ur-bento-50
   ur-bento-full
   ur-life-65
   ur-life-age
   ur-life-birth
   ur-contact-author
   ur-contact-team
   ur-group-header
   ur-guarantee
   ur-app-header
   ur-app-bento
   ur-hero-join
   ur-hero-question
   ur-channel-sub
   ur-channel-max
   ur-channel-tg
   ur-author-bento
   ur-audio-play
*/
(function(){
  'use strict';

  if(window.__BZSiteAnalyticsGoals0579Owner)return;
  window.__BZSiteAnalyticsGoals0579Owner=true;

  var METRIKA_ID=110906734;
  var SITE_VERSION='0190';
  var sentGoals=Object.create(null);
  var rawSequence=0;

  var GOALS={
    'ur-engaged':1,
    'ur-deep-read':1,
    'ur-full-read':1,
    'ur-ux':1,
    'ur-drawer-open':1,
    'ur-tariff-select':1,
    'ur-checkout-start':1,
    'ur-pay-start':1,
    'ur-pay-redirect':1,
    'ur-pay-success':1,
    'ur-social-click':1,
    'ur-pay-error':1,
    'ur-active-15':1,
    'ur-active-30':1,
    'ur-active-60':1,
    'ur-active-120':1,
    'ur-scroll-25':1,
    'ur-scroll-50':1,
    'ur-scroll-75':1,
    'ur-scroll-90':1,
    'ur-site-end':1,

    /* Semantic business funnel. */
    'ur-f-contact':1,
    'ur-f-core':1,
    'ur-f-decision':1,
    'ur-f-cta':1,
    'ur-f-checkout':1,
    'ur-f-purchase':1,
    'ur-talk':1,

    /* Diagnostic New layer. */
    'ur-island-1':1,
    'ur-island-2':1,
    'ur-bento-50':1,
    'ur-bento-full':1,
    'ur-life-65':1,
    'ur-life-age':1,
    'ur-life-birth':1,
    'ur-contact-author':1,
    'ur-contact-team':1,
    'ur-group-header':1,
    'ur-guarantee':1,
    'ur-app-header':1,
    'ur-app-bento':1,
    'ur-hero-join':1,
    'ur-hero-question':1,
    'ur-channel-sub':1,
    'ur-channel-max':1,
    'ur-channel-tg':1,
    'ur-author-bento':1,
    'ur-audio-play':1
  };

  window.dataLayer=window.dataLayer||[];

  function deviceClass(){
    if(window.matchMedia&&window.matchMedia('(max-width:760px)').matches)return 'mobile';
    if(window.matchMedia&&window.matchMedia('(max-width:980px)').matches)return 'tablet';
    return 'desktop';
  }

  function pageContext(){
    return {
      site_version:SITE_VERSION,
      device:deviceClass(),
      page_path:location.pathname,
      active_seconds:Math.round(activity.activeMs/1000),
      scroll_percent:Math.round(scrollState.percent)
    };
  }

  function publish(name,params){
    var payload=Object.assign({
      event:name,
      event_source:'site',
      event_ts:Date.now(),
      event_seq:++rawSequence
    },pageContext(),params||{});
    window.dataLayer.push(payload);
    try{window.dispatchEvent(new CustomEvent('bz:analytics-event',{detail:payload}));}catch(_eventErr){}
    return payload;
  }

  function reach(goalId,params,options){
    options=options||{};
    if(!GOALS[goalId])return false;
    var once=options.once!==false;
    var key=options.dedupeKey||goalId;
    if(once&&sentGoals[key])return false;
    var payload=publish(goalId,params);
    if(typeof window.ym==='function'){
      try{window.ym(METRIKA_ID,'reachGoal',goalId,Object.assign({},pageContext(),params||{}));}catch(_ymErr){}
    }
    if(once)sentGoals[key]=true;
    try{window.dispatchEvent(new CustomEvent('bz:analytics-goal',{detail:payload}));}catch(_goalErr){}
    return true;
  }

  function ux(elementId,action,extra){
    if(!elementId||!action)return false;
    return reach('ur-ux',Object.assign({element_id:String(elementId),action:String(action)},extra||{}),{once:false});
  }

  function normalizeElementId(node,fallback){
    if(!node)return fallback||'unknown';
    return node.getAttribute('data-bz-analytics-element')||node.id||
      node.getAttribute('data-pricing-register-range')||
      node.getAttribute('data-bz-full-action')||
      node.getAttribute('data-bz-full-input')||
      node.getAttribute('data-bz-sharp-card-index')||fallback||
      (node.className&&typeof node.className==='string'?node.className.split(/\s+/).filter(Boolean)[0]:'unknown');
  }

  /* Existing components may call __bzTrackEvent with raw event names.
     Only identifiers registered in the GOALS contract are sent as goals; other component
     events stay as telemetry and may feed ur-ux below. */
  var UX_RAW_MAP={
    pricing_format_select:['pricing_register','format_select'],
    pricing_calculator_toggle:['pricing_calculator','toggle'],
    pricing_calculator_expiry_reveal:['pricing_calculator','expiry_reveal'],
    pricing_calculator_complete:['pricing_calculator','complete'],
    pricing_section_view:['pricing_register','section_view']
  };

  window.__bzTrackEvent=function(name,params,options){
    if(GOALS[name])return reach(name,params,{once:!(options&&options.oncePerSession===false)});
    publish(name,params);
    var map=UX_RAW_MAP[name];
    if(map)ux(map[0],map[1],Object.assign({source_event:name},params||{}));
    return true;
  };

  window.__bzAnalyticsGoals={
    reach:reach,
    ux:ux,
    goals:Object.keys(GOALS).slice(),
    counterId:METRIKA_ID
  };

  /* -------------------------------------------------------------
     Active foreground time.
     We count time only while the page is visible. This is deliberately
     independent of Metrica's built-in accurateTrackBounce metric.
  -------------------------------------------------------------- */
  var activity={
    activeMs:0,
    lastTick:performance.now(),
    hadTrustedInteraction:false,
    thresholds:[15,30,60,120],
    fired:Object.create(null),
    timer:0
  };

  function noteTrusted(event){
    if(event&&event.isTrusted===false)return;
    activity.hadTrustedInteraction=true;
    maybeEngaged();
    semanticEvaluators.slice().forEach(function(evaluate){
      try{evaluate();}catch(_semanticWakeErr){}
    });
  }

  function maybeEngaged(){
    if(activity.hadTrustedInteraction&&activity.activeMs>=15000){
      reach('ur-engaged',{interaction_confirmed:true});
      /* BOR01 is a human-confirmed contact, not a bare foreground timer. */
      reach('ur-f-contact',{
        semantic_stage:'contact',
        source_goal:'ur-engaged',
        foreground_seconds:Math.max(15,Math.round(activity.activeMs/1000)),
        interaction_confirmed:true
      });
    }
  }

  function tickActivity(){
    var now=performance.now();
    var elapsed=Math.min(Math.max(now-activity.lastTick,0),1000);
    activity.lastTick=now;
    if(document.visibilityState==='visible')activity.activeMs+=elapsed;

    activity.thresholds.forEach(function(seconds){
      if(activity.fired[seconds]||activity.activeMs<seconds*1000||!activity.hadTrustedInteraction)return;
      activity.fired[seconds]=true;
      reach('ur-active-'+seconds,{foreground_seconds:seconds,interaction_confirmed:true});
    });
    maybeEngaged();
    maybeDerivedGoals();
  }

  ['pointerdown','touchstart','keydown','wheel'].forEach(function(type){
    window.addEventListener(type,noteTrusted,{capture:true,passive:type!=='keydown'});
  });
  document.addEventListener('visibilitychange',function(){activity.lastTick=performance.now();});
  window.addEventListener('pageshow',function(){activity.lastTick=performance.now();},{passive:true});
  window.addEventListener('pagehide',function(){activity.lastTick=performance.now();},{passive:true});
  activity.timer=window.setInterval(tickActivity,250);

  /* -------------------------------------------------------------
     Scroll depth + actual end-of-site sentinel.
  -------------------------------------------------------------- */
  var scrollState={percent:0,reached75:false,reached90:false,endReached:false,raf:0,endSeenAt:0,endTimer:0};

  function currentScrollPercent(){
    var doc=document.documentElement;
    var top=Math.max(window.pageYOffset||0,doc.scrollTop||0);
    var viewport=(window.visualViewport&&window.visualViewport.height)||window.innerHeight||doc.clientHeight||0;
    var height=Math.max(doc.scrollHeight,document.body?document.body.scrollHeight:0);
    var range=Math.max(1,height-viewport);
    return Math.max(0,Math.min(100,(top/range)*100));
  }

  function emitScrollThresholds(){
    scrollState.percent=Math.max(scrollState.percent,currentScrollPercent());
    [25,50,75,90].forEach(function(p){
      if(scrollState.percent+0.0001<p)return;
      reach('ur-scroll-'+p,{
        threshold_percent:p,
        document_height:document.documentElement.scrollHeight,
        viewport_height:Math.round((window.visualViewport&&window.visualViewport.height)||window.innerHeight||0)
      });
    });
    if(scrollState.percent>=75)scrollState.reached75=true;
    if(scrollState.percent>=90)scrollState.reached90=true;
    maybeDerivedGoals();
  }

  function scheduleScrollCheck(){
    if(scrollState.raf)return;
    scrollState.raf=requestAnimationFrame(function(){scrollState.raf=0;emitScrollThresholds();});
  }
  window.addEventListener('scroll',scheduleScrollCheck,{passive:true});
  window.addEventListener('resize',scheduleScrollCheck,{passive:true});

  function confirmEndVisible(){
    if(!scrollState.endSeenAt||document.visibilityState!=='visible')return;
    if(performance.now()-scrollState.endSeenAt<1000)return;
    scrollState.endReached=true;
    reach('ur-site-end',{visible_ms:1000});
    maybeDerivedGoals();
  }

  function installEndSentinel(){
    if(document.getElementById('bz-analytics-end-sentinel'))return;
    var sentinel=document.createElement('span');
    sentinel.id='bz-analytics-end-sentinel';
    sentinel.setAttribute('aria-hidden','true');
    sentinel.style.cssText='display:block;width:1px;height:1px;pointer-events:none;opacity:0;';
    document.body.appendChild(sentinel);

    if('IntersectionObserver' in window){
      var observer=new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if(entry.target!==sentinel)return;
          if(entry.isIntersecting){
            if(!scrollState.endSeenAt)scrollState.endSeenAt=performance.now();
            if(!scrollState.endTimer)scrollState.endTimer=window.setInterval(confirmEndVisible,200);
          }else{
            scrollState.endSeenAt=0;
            if(scrollState.endTimer){clearInterval(scrollState.endTimer);scrollState.endTimer=0;}
          }
        });
      },{threshold:[0,1]});
      observer.observe(sentinel);
    }else{
      window.addEventListener('scroll',function(){
        var nearBottom=(window.pageYOffset+window.innerHeight)>=(document.documentElement.scrollHeight-4);
        if(nearBottom&&!scrollState.endSeenAt)scrollState.endSeenAt=performance.now();
        if(!nearBottom)scrollState.endSeenAt=0;
        confirmEndVisible();
      },{passive:true});
    }
  }

  function maybeDerivedGoals(){
    if(activity.activeMs>=60000&&scrollState.reached75){
      reach('ur-deep-read',{foreground_seconds:Math.round(activity.activeMs/1000),scroll_threshold:75});
    }
    if(activity.activeMs>=60000&&scrollState.reached90&&activity.hadTrustedInteraction){
      reach('ur-full-read',{
        foreground_seconds:Math.round(activity.activeMs/1000),
        scroll_threshold:90,
        interaction_confirmed:true,
        qualified_site_consumption:true
      });
    }
  }


  /* -------------------------------------------------------------
     Semantic funnel stages.
     These markers belong to meaning/function, never to section order,
     scroll percentage or visual CSS classes:
       core-complete      -> ur-f-core
       decision           -> ur-f-decision

     Product bento has its own guarded consumption gates below:
       50%      -> TOP -> MID -> >=8s total active bento time;
       consumed -> TOP -> MID -> >=15s total active bento time -> END >=300ms.

     A generic stage counts only after >=50% of its compact marker is inside the
     visual viewport continuously for 600ms while the document is visible
     AND the visit has produced at least one trusted human interaction.
  -------------------------------------------------------------- */
  var SEMANTIC_STAGES={
    'core-complete':{goal:'ur-f-core',visibleMs:600,minRatio:0.5},
    'decision':{goal:'ur-f-decision',visibleMs:600,minRatio:0.5}
  };
  var semanticEvaluators=[];

  function semanticVisibilityRatio(node){
    if(!node||!node.getBoundingClientRect)return 0;
    var rect=node.getBoundingClientRect();
    var vv=window.visualViewport||null;
    var left=vv?vv.offsetLeft:0;
    var top=vv?vv.offsetTop:0;
    var width=vv?vv.width:(window.innerWidth||document.documentElement.clientWidth||0);
    var height=vv?vv.height:(window.innerHeight||document.documentElement.clientHeight||0);
    var right=left+width;
    var bottom=top+height;
    var visibleW=Math.max(0,Math.min(rect.right,right)-Math.max(rect.left,left));
    var visibleH=Math.max(0,Math.min(rect.bottom,bottom)-Math.max(rect.top,top));
    var area=Math.max(1,Math.max(0,rect.width)*Math.max(0,rect.height));
    return Math.max(0,Math.min(1,(visibleW*visibleH)/area));
  }

  /* Checkpoint helper for long/short semantic markers. Unlike area-ratio gates,
     this only asks whether the marker is genuinely on screen. That avoids false
     negatives on tall responsive blocks while time-in-region still rejects
     fast scroll-throughs. */
  function semanticIntersectsViewport(node){
    if(!node||!node.getBoundingClientRect)return false;
    var rect=node.getBoundingClientRect();
    var vv=window.visualViewport||null;
    var left=vv?vv.offsetLeft:0;
    var top=vv?vv.offsetTop:0;
    var width=vv?vv.width:(window.innerWidth||document.documentElement.clientWidth||0);
    var height=vv?vv.height:(window.innerHeight||document.documentElement.clientHeight||0);
    var right=left+width;
    var bottom=top+height;
    return rect.right>left&&rect.left<right&&rect.bottom>top&&rect.top<bottom;
  }

  function installSemanticStageObservers(){
    var nodes=document.querySelectorAll('[data-analytics-stage]');
    Array.prototype.forEach.call(nodes,function(node){
      var stage=node.getAttribute('data-analytics-stage')||'';
      var cfg=SEMANTIC_STAGES[stage];
      if(!cfg)return;

      var done=false;
      var timer=0;
      var observer=null;

      function cancel(){
        if(timer){window.clearTimeout(timer);timer=0;}
      }

      function confirm(){
        timer=0;
        if(done||document.visibilityState!=='visible'||!activity.hadTrustedInteraction)return;
        var ratio=semanticVisibilityRatio(node);
        if(ratio+0.0001<cfg.minRatio)return;
        done=true;
        reach(cfg.goal,{
          semantic_stage:stage,
          semantic_definition_version:SITE_VERSION,
          visible_ms:cfg.visibleMs,
          visibility_ratio:Number(ratio.toFixed(3))
        });
        if(observer)observer.disconnect();
      }

      function evaluate(ratio){
        if(done)return;
        if(typeof ratio!=='number')ratio=semanticVisibilityRatio(node);
        if(document.visibilityState==='visible'&&activity.hadTrustedInteraction&&ratio+0.0001>=cfg.minRatio){
          if(!timer)timer=window.setTimeout(confirm,cfg.visibleMs);
        }else{
          cancel();
        }
      }
      semanticEvaluators.push(function(){evaluate(semanticVisibilityRatio(node));});

      if('IntersectionObserver' in window){
        observer=new IntersectionObserver(function(entries){
          entries.forEach(function(entry){
            if(entry.target===node)evaluate(entry.isIntersecting?entry.intersectionRatio:0);
          });
        },{threshold:[0,cfg.minRatio,1]});
        observer.observe(node);
      }else{
        var fallback=function(){evaluate(semanticVisibilityRatio(node));};
        window.addEventListener('scroll',fallback,{passive:true});
        window.addEventListener('resize',fallback,{passive:true});
        fallback();
      }

      document.addEventListener('visibilitychange',function(){
        if(done)return;
        if(document.visibilityState!=='visible')cancel();
        else evaluate(semanticVisibilityRatio(node));
      },{passive:true});
    });
  }

  /* -------------------------------------------------------------
     Editorial-island consumption gates.

     These are positional/consumption goals, not bare scroll-depth goals.
     Each island requires an ordered TOP -> MID -> END path plus a modest amount
     of foreground, human-confirmed time anywhere inside the island. Checkpoints
     use actual viewport intersection, not percentage-of-element area, so tall
     responsive blocks do not create false negatives. Time is counted from TOP,
     not only after MID, which preserves legitimate reading patterns.

       first island  -> ur-island-1
                        TOP -> MID -> >=10s total island time -> END >=300ms
       second island -> ur-island-2
                        TOP -> MID -> >=8s total island time -> END >=300ms
  -------------------------------------------------------------- */
  var ISLAND_CONSUMPTION_DEFAULTS={
    endVisibleMs:300,
    tickMs:200
  };

  function installIslandConsumptionGate(config){
    var top=document.querySelector('[data-bz-island-consumption="'+config.key+'-top"]');
    var mid=document.querySelector('[data-bz-island-consumption="'+config.key+'-mid"]');
    var end=document.querySelector('[data-bz-island-consumption="'+config.key+'-end"]');
    if(!top||!mid||!end)return null;

    var state={
      topSeen:false,
      midSeen:false,
      activeMs:0,
      lastTick:performance.now(),
      endSeenAt:0,
      done:false,
      timer:0,
      observer:null
    };
    var endVisibleMs=config.endVisibleMs||ISLAND_CONSUMPTION_DEFAULTS.endVisibleMs;
    var tickMs=config.tickMs||ISLAND_CONSUMPTION_DEFAULTS.tickMs;

    function visible(node){return semanticIntersectsViewport(node);}

    function viewportCenterInsideIsland(){
      var vv=window.visualViewport||null;
      var viewportTop=vv?vv.offsetTop:0;
      var viewportHeight=vv?vv.height:(window.innerHeight||document.documentElement.clientHeight||0);
      var centerY=viewportTop+(viewportHeight/2);
      var topRect=top.getBoundingClientRect();
      var endRect=end.getBoundingClientRect();
      return centerY>=topRect.top&&centerY<=endRect.bottom;
    }

    function recordCheckpoints(){
      if(state.done||document.visibilityState!=='visible')return;
      if(!state.topSeen&&visible(top)){
        state.topSeen=true;
        state.lastTick=performance.now();
        publish('island_consumption_checkpoint',{island:config.key,checkpoint:'top',goal_candidate:config.goal});
      }
      if(state.topSeen&&!state.midSeen&&visible(mid)){
        state.midSeen=true;
        publish('island_consumption_checkpoint',{island:config.key,checkpoint:'mid',goal_candidate:config.goal});
      }
    }

    function resetEndDwell(){state.endSeenAt=0;}

    function maybeConfirmEnd(now){
      if(state.done)return;
      var eligible=state.topSeen&&state.midSeen&&
        state.activeMs>=config.requiredActiveMs&&
        document.visibilityState==='visible'&&activity.hadTrustedInteraction;
      var endVisible=eligible&&visible(end);
      if(!endVisible){
        resetEndDwell();
        return;
      }
      if(!state.endSeenAt)state.endSeenAt=now;
      if(now-state.endSeenAt<endVisibleMs)return;

      state.done=true;
      var activeSeconds=Number((state.activeMs/1000).toFixed(1));
      reach(config.goal,{
        semantic_stage:config.semanticStage,
        semantic_definition_version:config.definitionVersion,
        island:config.key,
        checkpoint_top:true,
        checkpoint_mid:true,
        island_active_seconds:activeSeconds,
        required_island_active_seconds:Number((config.requiredActiveMs/1000).toFixed(1)),
        end_visible_ms:endVisibleMs,
        end_intersection:true,
        interaction_confirmed:true
      });
      publish('island_consumption_gate_passed',{
        goal:config.goal,
        island:config.key,
        island_active_seconds:activeSeconds,
        end_intersection:true
      });
      if(state.observer)state.observer.disconnect();
      if(state.timer){window.clearInterval(state.timer);state.timer=0;}
    }

    function tick(){
      if(state.done)return;
      var now=performance.now();
      var elapsed=Math.min(Math.max(now-state.lastTick,0),tickMs*2.5);
      state.lastTick=now;
      recordCheckpoints();
      if(state.topSeen&&document.visibilityState==='visible'&&activity.hadTrustedInteraction&&viewportCenterInsideIsland()){
        state.activeMs+=elapsed;
      }
      maybeConfirmEnd(now);
    }

    function evaluate(){
      if(state.done)return;
      recordCheckpoints();
      maybeConfirmEnd(performance.now());
    }

    semanticEvaluators.push(evaluate);

    if('IntersectionObserver' in window){
      state.observer=new IntersectionObserver(function(){evaluate();},{threshold:[0,0.01,1]});
      state.observer.observe(top);
      state.observer.observe(mid);
      state.observer.observe(end);
    }else{
      window.addEventListener('scroll',evaluate,{passive:true});
      window.addEventListener('resize',evaluate,{passive:true});
    }

    document.addEventListener('visibilitychange',function(){
      state.lastTick=performance.now();
      if(document.visibilityState!=='visible')resetEndDwell();
      else evaluate();
    },{passive:true});
    window.addEventListener('pageshow',function(){state.lastTick=performance.now();evaluate();},{passive:true});
    window.addEventListener('pagehide',function(){state.lastTick=performance.now();resetEndDwell();},{passive:true});

    state.timer=window.setInterval(tick,tickMs);
    evaluate();

    return {
      snapshot:function(){
        return {
          topSeen:state.topSeen,
          midSeen:state.midSeen,
          activeMs:Math.round(state.activeMs),
          endSeenAt:state.endSeenAt,
          done:state.done
        };
      }
    };
  }

  function installEditorialIslandConsumptionGates(){
    window.__bzEditorialIslandConsumptionGates={
      first:installIslandConsumptionGate({
        key:'first',
        goal:'ur-island-1',
        semanticStage:'first-island-consumed',
        definitionVersion:'top_mid_totalactive10_end300_v2',
        requiredActiveMs:10000
      }),
      second:installIslandConsumptionGate({
        key:'second',
        goal:'ur-island-2',
        semanticStage:'second-island-consumed',
        definitionVersion:'top_mid_totalactive8_end300_v2',
        requiredActiveMs:8000
      })
    };
  }

  /* -------------------------------------------------------------
     Primary product-bento consumption gates.

     The anti-fast-scroll guard is intentionally simple and robust:
       - ordered TOP -> MID -> END checkpoints must actually enter the viewport;
       - foreground time is accumulated while the viewport center is inside the
         product region and only after a trusted human interaction;
       - 50% bento requires MID + >=8s total bento time;
       - consumed bento requires MID + >=15s total bento time + END >=300ms.

     No checkpoint requires a percentage of a potentially tall DOM element to be
     visible. This avoids responsive false negatives while retaining protection
     against 3-4 second scroll-throughs and background-tab time.
  -------------------------------------------------------------- */
  var NEW_BENTO_GATE={
    halfActiveMs:8000,
    requiredActiveMs:15000,
    endVisibleMs:300,
    tickMs:200
  };

  function installNewBentoConsumedGate(){
    var top=document.querySelector('[data-bz-new-bento-checkpoint="top"]');
    var mid=document.querySelector('[data-bz-new-bento-checkpoint="mid"]');
    var end=document.querySelector('[data-bz-new-bento-checkpoint="end"]');
    if(!top||!mid||!end)return;

    var state={
      topSeen:false,
      midSeen:false,
      halfDone:false,
      activeMs:0,
      lastTick:performance.now(),
      endSeenAt:0,
      done:false,
      timer:0,
      observer:null
    };

    function viewportCenterInsideContentRegion(){
      var vv=window.visualViewport||null;
      var viewportTop=vv?vv.offsetTop:0;
      var viewportHeight=vv?vv.height:(window.innerHeight||document.documentElement.clientHeight||0);
      var centerY=viewportTop+(viewportHeight/2);
      var topRect=top.getBoundingClientRect();
      var endRect=end.getBoundingClientRect();
      return centerY>=topRect.top&&centerY<=endRect.bottom;
    }

    function maybeRecordOrderedCheckpoints(){
      if(state.done||document.visibilityState!=='visible')return;
      if(!state.topSeen&&semanticIntersectsViewport(top)){
        state.topSeen=true;
        state.lastTick=performance.now();
        publish('new_bento_checkpoint',{checkpoint:'top',goal_candidate:'ur-bento-full'});
      }
      if(state.topSeen&&!state.midSeen&&semanticIntersectsViewport(mid)){
        state.midSeen=true;
        publish('new_bento_checkpoint',{checkpoint:'mid',goal_candidate:'ur-bento-full'});
      }
    }

    function maybeConfirmHalf(){
      if(state.halfDone||!state.topSeen||!state.midSeen||state.activeMs<NEW_BENTO_GATE.halfActiveMs||
         document.visibilityState!=='visible'||!activity.hadTrustedInteraction)return;
      state.halfDone=true;
      var activeSeconds=Number((state.activeMs/1000).toFixed(1));
      reach('ur-bento-50',{
        semantic_stage:'new-bento-50-consumed',
        semantic_definition_version:'top_mid_totalactive8_v1',
        checkpoint_top:true,
        checkpoint_mid:true,
        bento_active_seconds:activeSeconds,
        required_bento_active_seconds:8,
        interaction_confirmed:true
      });
      publish('new_bento_50_consumption_gate_passed',{
        goal:'ur-bento-50',
        bento_active_seconds:activeSeconds
      });
    }

    function resetEndDwell(){state.endSeenAt=0;}

    function maybeConfirmEnd(now){
      if(state.done)return;
      var eligible=state.topSeen&&state.midSeen&&
        state.activeMs>=NEW_BENTO_GATE.requiredActiveMs&&
        document.visibilityState==='visible'&&activity.hadTrustedInteraction;
      if(!eligible||!semanticIntersectsViewport(end)){
        resetEndDwell();
        return;
      }
      if(!state.endSeenAt)state.endSeenAt=now;
      if(now-state.endSeenAt<NEW_BENTO_GATE.endVisibleMs)return;

      maybeConfirmHalf();
      state.done=true;
      var activeSeconds=Number((state.activeMs/1000).toFixed(1));
      reach('ur-bento-full',{
        semantic_stage:'new-bento-consumed',
        semantic_definition_version:'top_mid_totalactive15_end300_v3',
        checkpoint_top:true,
        checkpoint_mid:true,
        bento_active_seconds:activeSeconds,
        required_bento_active_seconds:15,
        end_visible_ms:NEW_BENTO_GATE.endVisibleMs,
        end_intersection:true,
        interaction_confirmed:true
      });
      publish('new_bento_consumption_gate_passed',{
        goal:'ur-bento-full',
        bento_active_seconds:activeSeconds,
        end_intersection:true
      });
      if(state.observer)state.observer.disconnect();
      if(state.timer){window.clearInterval(state.timer);state.timer=0;}
    }

    function tick(){
      if(state.done)return;
      var now=performance.now();
      var elapsed=Math.min(Math.max(now-state.lastTick,0),NEW_BENTO_GATE.tickMs*2.5);
      state.lastTick=now;
      maybeRecordOrderedCheckpoints();
      if(state.topSeen&&document.visibilityState==='visible'&&activity.hadTrustedInteraction&&viewportCenterInsideContentRegion()){
        state.activeMs+=elapsed;
      }
      maybeConfirmHalf();
      maybeConfirmEnd(now);
    }

    function evaluate(){
      if(state.done)return;
      maybeRecordOrderedCheckpoints();
      maybeConfirmHalf();
      maybeConfirmEnd(performance.now());
    }

    semanticEvaluators.push(evaluate);

    if('IntersectionObserver' in window){
      state.observer=new IntersectionObserver(function(){evaluate();},{threshold:[0,0.01,1]});
      state.observer.observe(top);
      state.observer.observe(mid);
      state.observer.observe(end);
    }else{
      window.addEventListener('scroll',evaluate,{passive:true});
      window.addEventListener('resize',evaluate,{passive:true});
    }

    document.addEventListener('visibilitychange',function(){
      state.lastTick=performance.now();
      if(document.visibilityState!=='visible')resetEndDwell();
      else evaluate();
    },{passive:true});
    window.addEventListener('pageshow',function(){state.lastTick=performance.now();evaluate();},{passive:true});
    window.addEventListener('pagehide',function(){state.lastTick=performance.now();resetEndDwell();},{passive:true});

    state.timer=window.setInterval(tick,NEW_BENTO_GATE.tickMs);
    evaluate();

    window.__bzNewBentoConsumptionGate={
      snapshot:function(){
        return {
          topSeen:state.topSeen,
          midSeen:state.midSeen,
          halfDone:state.halfDone,
          activeMs:Math.round(state.activeMs),
          endSeenAt:state.endSeenAt,
          done:state.done
        };
      }
    };
  }

  /* -------------------------------------------------------------
     Commercial funnel bridge. commercial.js publishes raw events through
     bz-commercial-analytics; here they are normalized to the registered goals.
  -------------------------------------------------------------- */
  window.addEventListener('bz-commercial-analytics',function(event){
    var d=event&&event.detail||{};
    var name=d.event||'';
    if(name==='drawer_open'){
      /* Opening the commercial drawer is useful telemetry, but is intentionally
         NOT BOR05. BOR05 starts only when the person actually begins entering
         checkout data (see ur-checkout-start below). */
      reach('ur-drawer-open',d);
    }
    else if(name==='tariff_selected'||name==='sticky_tariff_selected'||name==='decision_tariff_selected'||name==='tariff_floor_selected')reach('ur-tariff-select',Object.assign({source_event:name},d));
    else if(name==='payment_start')reach('ur-pay-start',d);
    else if(name==='payment_redirect')reach('ur-pay-redirect',d);
    else if(name==='payment_success'){
      reach('ur-pay-success',d);
      /* commercial.js emits payment_success only after authoritative server status CONFIRMED. */
      reach('ur-f-purchase',Object.assign({
        semantic_stage:'purchase',
        source_event:name,
        confirmation:'server_confirmed'
      },d));
    }
    else if(name==='payment_error')reach('ur-pay-error',d,{once:false});
    else if(name==='prepay_talk_open')ux('pricing_prepay_talk','open',{source_event:name,source_cta:d.source_cta||'pricing-prepay-talk'});
    else if(name==='header_personal_channel_selected')reach('ur-social-click',{platform:d.channel||'messenger',placement:'commercial_support',source_event:name},{once:false});
    else if(name==='ilya_personal_click')reach('ur-social-click',{platform:'telegram',placement:'commercial_personal',source_event:name},{once:false});
  });

  /* One-format production CTA: clicking the explicit plan CTA is the user's
     tariff choice even when the drawer opens directly on checkout. */
  /* -------------------------------------------------------------
     Life-calendar interaction goals.

     These are deliberately interaction goals, not mere viewport goals:
       - 65-year scenario: trusted click on the actual switch;
       - age slider: a trusted INPUT that really changes the age value;
       - birth date: a complete, valid date accepted by the calendar model.

     Every goal is once-per-visit through the canonical reach() dedupe.
     ------------------------------------------------------------- */
  var lifeCalendarSliderInitialValue=null;

  function validLifeCalendarBirthDate(raw){
    var value=String(raw||'').trim();
    var match=value.match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{2}|\d{4})$/);
    if(!match)return null;
    var day=Number(match[1]),month=Number(match[2]),year=Number(match[3]);
    var now=new Date();
    var nowYear=now.getFullYear();
    if(year<100){
      var century=Math.floor(nowYear/100)*100;
      var candidate=century+year;
      year=candidate>nowYear?candidate-100:candidate;
    }
    var date=new Date(year,month-1,day);
    if(date.getFullYear()!==year||date.getMonth()!==month-1||date.getDate()!==day)return null;
    var today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
    if(date>today)return null;
    var ageYears=(today-date)/(365.2425*24*60*60*1000);
    return {date:date,age_years:Math.max(0,Math.floor(ageYears))};
  }

  document.addEventListener('input',function(event){
    if(!event.isTrusted||!event.target)return;

    if(event.target.id==='bzlc-age-intro'){
      var current=Number(event.target.value);
      if(!Number.isFinite(current))return;
      if(lifeCalendarSliderInitialValue===null){
        var defaultValue=Number(event.target.defaultValue);
        lifeCalendarSliderInitialValue=Number.isFinite(defaultValue)?defaultValue:36;
      }
      if(current!==lifeCalendarSliderInitialValue){
        reach('ur-life-age',{
          component:'life_calendar',
          interaction:'age_slider',
          age_value:Math.round(current)
        });
      }
      return;
    }

    if(event.target.id==='bzlc-birthdate-intro'){
      var parsed=validLifeCalendarBirthDate(event.target.value);
      if(parsed){
        reach('ur-life-birth',{
          component:'life_calendar',
          interaction:'birthdate_valid',
          age_years:parsed.age_years
        });
      }
    }
  },true);

  document.addEventListener('click',function(event){
    if(!event.isTrusted||!event.target||!event.target.closest)return;

    var life65Toggle=event.target.closest('#bzlc-cut-toggle-intro');
    if(life65Toggle){
      var life65WasActive=life65Toggle.getAttribute('aria-checked')==='true';
      reach('ur-life-65',{
        component:'life_calendar',
        interaction:'65_year_scenario_toggle',
        previous_state:life65WasActive?'65':'80',
        new_state:life65WasActive?'80':'65'
      });
    }

    /* Footer contact branch: measure the intent choice itself, before messenger selection. */
    var contactToggle=event.target.closest('[data-bz-contact-toggle]');
    if(contactToggle){
      var contactRoute=contactToggle.closest('[data-bz-contact-route]');
      var contactRouteName=contactRoute&&contactRoute.getAttribute('data-bz-contact-route')||'';
      if(contactRouteName==='author'){
        reach('ur-contact-author',{
          component:'footer_contact',
          interaction:'route_click',
          route:'author',
          placement:'footer_contact'
        });
      }else if(contactRouteName==='team'){
        reach('ur-contact-team',{
          component:'footer_contact',
          interaction:'route_click',
          route:'team',
          placement:'footer_contact'
        });
      }
    }

    /* Header intent CTA. Kept distinct from generic commercial drawer telemetry. */
    var onlineGroupHeader=event.target.closest('[data-commercial-source="mobile-header-group"]');
    if(onlineGroupHeader){
      reach('ur-group-header',{
        component:'header',
        interaction:'online_group_click',
        source_cta:'mobile-header-group',
        placement:'header'
      });
    }

    /* Commercial controls are split into two layers:
       - every click is diagnostic UX telemetry with source/role;
       - BOR04 is only the first explicitly marked meaningful participation CTA,
         never navigation/start-tag/"formats and price" shortcuts (even if runtime
         later mutates those controls to data-bzc-open="checkout"). */
    var newApplication=event.target.closest('[data-analytics-new-application]');
    if(newApplication){
      var newApplicationSource=newApplication.getAttribute('data-analytics-new-application')||'';
      var applicationPlacement=newApplication.getAttribute('data-bz-application-source')||'';
      if(newApplicationSource==='header'){
        reach('ur-app-header',{source_cta:'header',placement:'header'});
      }else if(newApplicationSource==='bento'||newApplicationSource==='bento-inline'){
        reach('ur-app-bento',{source_cta:newApplicationSource,placement:applicationPlacement||'product_bento'});
      }
      if(applicationPlacement==='bento-inline-firstscreen'){
        reach('ur-hero-join',{
          component:'firstscreen_cta',
          interaction:'participate_click',
          source_cta:'bento-inline-firstscreen',
          placement:'firstscreen'
        });
      }
    }

    var firstscreenQuestion=event.target.closest('[data-bzc-question-source="firstscreen-secondary-quiet"]');
    if(firstscreenQuestion){
      reach('ur-hero-question',{
        component:'firstscreen_cta',
        interaction:'question_click',
        source_cta:'firstscreen-secondary-quiet',
        placement:'firstscreen'
      });
    }

    var channelSubscribe=event.target.closest('[data-analytics-channel-subscribe]');
    if(channelSubscribe){
      reach('ur-channel-sub',{
        component:'author_follow_step',
        interaction:'subscribe_channel_click',
        source_cta:channelSubscribe.getAttribute('data-analytics-channel-subscribe')||'follow-step',
        placement:'product_bento_author'
      });
    }

    var channelChoice=event.target.closest('[data-analytics-channel-choice]');
    if(channelChoice){
      var channelName=channelChoice.getAttribute('data-analytics-channel-choice')||'';
      if(channelName==='max'){
        reach('ur-channel-max',{
          component:'author_follow_step',
          interaction:'channel_choice_click',
          channel:'max',
          placement:'product_bento_author'
        });
      }else if(channelName==='telegram'){
        reach('ur-channel-tg',{
          component:'author_follow_step',
          interaction:'channel_choice_click',
          channel:'telegram',
          placement:'product_bento_author'
        });
      }
    }

    var newAuthorMessage=event.target.closest('[data-analytics-new-author-message]');
    if(newAuthorMessage){
      reach('ur-author-bento',{
        source_cta:newAuthorMessage.getAttribute('data-analytics-new-author-message')||'bento',
        placement:'product_bento',
        intent:'author_situation_message'
      });
    }

    var newAudioAnchorPlay=event.target.closest('[data-analytics-new-audio-anchor-play]');
    if(newAudioAnchorPlay){
      reach('ur-audio-play',{
        source_cta:'audio-anchor-play',
        placement:'product_bento',
        audio_state:newAudioAnchorPlay.getAttribute('aria-disabled')==='true'?'placeholder':'live'
      });
    }

    var guaranteeOpen=event.target.closest('[data-bz-product-guarantee-open]');
    if(guaranteeOpen){
      reach('ur-guarantee',{source_cta:'bento-guarantee',placement:'product_bento'});
    }

    var commercialControl=event.target.closest('[data-bzc-plan-open],[data-commercial-entry],[data-bzc-open="checkout"]');
    if(commercialControl&&!commercialControl.closest('#bz-commercial-layer')){
      var commercialSource=commercialControl.getAttribute('data-bzc-source')||
        commercialControl.getAttribute('data-commercial-source')||
        commercialControl.getAttribute('data-bzc-plan-open')||
        'commercial-entry';
      var commercialRole=commercialControl.getAttribute('data-analytics-cta-role')||
        (commercialControl.hasAttribute('data-bzc-plan-open')?'plan':
          commercialControl.getAttribute('data-bzc-open')==='checkout'?'checkout':'navigation');

      /* Repeatable: lets Metrica show which intermediate/final CTA was clicked. */
      ux('commercial_cta','click',{
        source_cta:commercialSource,
        cta_role:commercialRole
      });

      var funnelCta=(commercialControl.hasAttribute('data-bzc-plan-open')&&commercialControl.hasAttribute('data-analytics-cta-role'))?commercialControl:null;
      if(funnelCta){
        /* If a user clicks faster than the 600ms visibility observer, record
           BOR03 first so the semantic funnel remains monotonic. */
        reach('ur-f-decision',{
          semantic_stage:'decision',
          source_event:'commercial_cta_click_fallback',
          source_cta:commercialSource,
          decision_version:'0579'
        });
        reach('ur-f-cta',{
          semantic_stage:'cta',
          source_cta:commercialSource,
          cta_role:commercialRole
        });
      }
    }

    var commercialTalk=event.target.closest('[data-analytics-commercial-talk]');
    if(commercialTalk){
      reach('ur-talk',{
        semantic_stage:'cta',
        intent:'human_contact_before_payment',
        source_cta:commercialTalk.getAttribute('data-bzc-source')||'pricing-prepay-talk'
      });
    }

    var commercialQuestion=event.target.closest('[data-analytics-commercial-question]');
    if(commercialQuestion){
      ux('commercial_question','click',{
        intent:'concrete_question',
        platform:'max',
        source_cta:commercialQuestion.getAttribute('data-bzc-source')||'pricing-prepay-max'
      });
    }

    var salvageBot=event.target.closest('[data-analytics-salvage-bot]');
    if(salvageBot){
      ux('salvage_bot','click',{
        platform:salvageBot.getAttribute('data-analytics-salvage-bot')||'messenger',
        placement:'continuation_router'
      });
    }

    var planOpen=event.target.closest('[data-bzc-plan-open]');
    if(planOpen){
      reach('ur-tariff-select',{
        plan_id:planOpen.getAttribute('data-bzc-plan-open')||'group',
        source_cta:planOpen.getAttribute('data-bzc-source')||planOpen.getAttribute('data-commercial-source')||'page'
      });
    }

    var messenger=event.target.closest('a[href*="t.me/"],a[href*="telegram.me/"],a[href*="max.ru/"]');
    if(messenger){
      var href=messenger.getAttribute('href')||'';
      reach('ur-social-click',{
        platform:/max\.ru/i.test(href)?'max':'telegram',
        placement:messenger.getAttribute('data-bzc-source')||messenger.getAttribute('data-commercial-source')||(messenger.closest('[data-bz-tariff-salvage]')?'tariff_salvage':messenger.closest('footer')?'footer':'site')
      },{once:false});
    }

    var card=event.target.closest('[data-bz-sharp-questions] .bz-sharp-flip-card');
    if(card){
      ux('sharp_question_card','flip',{element_index:card.getAttribute('data-bz-sharp-card-index')||'',will_open:card.getAttribute('aria-pressed')!=='true'});
      return;
    }

    var explicit=event.target.closest('[data-bz-analytics-element]');
    if(explicit){
      ux(normalizeElementId(explicit,'custom_element'),explicit.getAttribute('data-bz-analytics-action')||'click');
      return;
    }

    var toggle=event.target.closest('[role="switch"],[data-pricing-register-calculator-toggle],[data-bz-full-action]');
    if(toggle){
      ux(normalizeElementId(toggle,'toggle'),'toggle',{control_role:toggle.getAttribute('role')||'',control_action:toggle.getAttribute('data-bz-full-action')||''});
    }
  },true);

  /* ur-checkout-start = the person actually begins entering checkout data,
     not merely opening the commercial drawer. */
  document.addEventListener('focusin',function(event){
    if(!event.isTrusted||!event.target||!event.target.closest)return;
    var customer=event.target.closest('[data-bzc-customer]');
    if(customer){
      var layer=document.getElementById('bz-commercial-layer');
      var checkoutSource=layer&&layer.dataset&&layer.dataset.bzcOrigin||'checkout';
      var firstField=customer.getAttribute('data-bzc-customer')||customer.name||'field';
      reach('ur-checkout-start',{first_field:firstField,source_cta:checkoutSource});
      /* BOR05 = actual start of checkout, not merely opening the drawer. */
      reach('ur-f-checkout',{
        semantic_stage:'checkout',
        source_event:'ur-checkout-start',
        first_field:firstField,
        source_cta:checkoutSource
      });
    }
  },true);

  document.addEventListener('change',function(event){
    if(!event.isTrusted||!event.target||!event.target.closest)return;
    var range=event.target.closest('input[type="range"]');
    if(range){
      ux(normalizeElementId(range,'range'),'commit',{control_type:'range'});
      return;
    }
    var fullInput=event.target.closest('[data-bz-full-input]');
    if(fullInput){
      ux('tariff_personalizer','commit',{field:fullInput.getAttribute('data-bz-full-input')||''});
    }
  },true);

  function init(){
    emitScrollThresholds();
    installEndSentinel();
    installSemanticStageObservers();
    installEditorialIslandConsumptionGates();
    installNewBentoConsumedGate();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
