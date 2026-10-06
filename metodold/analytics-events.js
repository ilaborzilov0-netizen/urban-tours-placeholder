/* owner:bz-site-analytics-goals-0190
   Yandex.Metrica counter: 109705214.
   Canonical goal contract for the stable master.

   Numeric goal IDs in Metrica (documentation only; reachGoal uses identifiers):
   594112358 engaged_visit
   594112375 deep_read
   594112478 full_read
   594112497 ux_interaction
   594113092 commercial_drawer_open
   594113195 tariff_selected
   594113231 checkout_started
   594113246 payment_started
   594113296 payment_redirected
   594113369 payment_success
   594113404 social_outbound_click
   594113408 payment_error
   594115490 active_15
   594116434 active_30
   594116447 active_60
   594116488 active_120
   594116620 scroll_25
   594116692 scroll_50
   594116779 scroll_75
   594116873 scroll_90
   594116907 site_end_reached

   Semantic funnel goals (their numeric Metrica IDs are assigned only after
   these JavaScript goals are created in the Metrica UI):
   funnel_contact_v1
   funnel_core_v1
   funnel_decision_v1
   funnel_cta_v1
   funnel_checkout_v1
   funnel_purchase_v1
   commercial_talk_v1

   Diagnostic New goals (created explicitly in Metrica):
   new_first_island_consumed_v1
   new_second_island_consumed_v1
   new_bento_50_consumed_v1
   new_bento_consumed_v1
   new_life_calendar_65_toggle_v1
   new_life_calendar_age_slider_v1
   new_life_calendar_birthdate_v1
   new_contact_author_click_v1
   new_contact_team_click_v1
   new_online_group_header_click_v1
   new_guarantee_open_v1
   new_application_header_click_v1
   new_application_bento_click_v1
   new_participate_firstscreen_click_v1
   new_question_firstscreen_click_v1
   new_channel_subscribe_click_v1
   new_channel_max_click_v1
   new_channel_telegram_click_v1
   new_author_message_bento_click_v1
   new_audio_anchor_play_click_v1
*/
(function(){
  'use strict';

  if(window.__BZSiteAnalyticsGoals0579Owner)return;
  window.__BZSiteAnalyticsGoals0579Owner=true;

  var METRIKA_ID=109705214;
  var SITE_VERSION='0190';
  var sentGoals=Object.create(null);
  var rawSequence=0;

  var GOALS={
    engaged_visit:1,
    deep_read:1,
    full_read:1,
    ux_interaction:1,
    commercial_drawer_open:1,
    tariff_selected:1,
    checkout_started:1,
    payment_started:1,
    payment_redirected:1,
    payment_success:1,
    social_outbound_click:1,
    payment_error:1,
    active_15:1,
    active_30:1,
    active_60:1,
    active_120:1,
    scroll_25:1,
    scroll_50:1,
    scroll_75:1,
    scroll_90:1,
    site_end_reached:1,

    /* Semantic business funnel. */
    funnel_contact_v1:1,
    funnel_core_v1:1,
    funnel_decision_v1:1,
    funnel_cta_v1:1,
    funnel_checkout_v1:1,
    funnel_purchase_v1:1,
    commercial_talk_v1:1,

    /* Diagnostic New layer. */
    new_first_island_consumed_v1:1,
    new_second_island_consumed_v1:1,
    new_bento_50_consumed_v1:1,
    new_bento_consumed_v1:1,
    new_life_calendar_65_toggle_v1:1,
    new_life_calendar_age_slider_v1:1,
    new_life_calendar_birthdate_v1:1,
    new_contact_author_click_v1:1,
    new_contact_team_click_v1:1,
    new_online_group_header_click_v1:1,
    new_guarantee_open_v1:1,
    new_application_header_click_v1:1,
    new_application_bento_click_v1:1,
    new_participate_firstscreen_click_v1:1,
    new_question_firstscreen_click_v1:1,
    new_channel_subscribe_click_v1:1,
    new_channel_max_click_v1:1,
    new_channel_telegram_click_v1:1,
    new_author_message_bento_click_v1:1,
    new_audio_anchor_play_click_v1:1
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
    return reach('ux_interaction',Object.assign({element_id:String(elementId),action:String(action)},extra||{}),{once:false});
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
     events stay as telemetry and may feed ux_interaction below. */
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
      reach('engaged_visit',{interaction_confirmed:true});
      /* BOR01 is a human-confirmed contact, not a bare foreground timer. */
      reach('funnel_contact_v1',{
        semantic_stage:'contact',
        source_goal:'engaged_visit',
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
      reach('active_'+seconds,{foreground_seconds:seconds,interaction_confirmed:true});
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
      reach('scroll_'+p,{
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
    reach('site_end_reached',{visible_ms:1000});
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
      reach('deep_read',{foreground_seconds:Math.round(activity.activeMs/1000),scroll_threshold:75});
    }
    if(activity.activeMs>=60000&&scrollState.reached90&&activity.hadTrustedInteraction){
      reach('full_read',{
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
       core-complete      -> funnel_core_v1
       decision           -> funnel_decision_v1

     Product bento has its own guarded consumption gates below:
       50%      -> TOP -> MID -> >=8s total active bento time;
       consumed -> TOP -> MID -> >=15s total active bento time -> END >=300ms.

     A generic stage counts only after >=50% of its compact marker is inside the
     visual viewport continuously for 600ms while the document is visible
     AND the visit has produced at least one trusted human interaction.
  -------------------------------------------------------------- */
  var SEMANTIC_STAGES={
    'core-complete':{goal:'funnel_core_v1',visibleMs:600,minRatio:0.5},
    'decision':{goal:'funnel_decision_v1',visibleMs:600,minRatio:0.5}
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

       first island  -> new_first_island_consumed_v1
                        TOP -> MID -> >=10s total island time -> END >=300ms
       second island -> new_second_island_consumed_v1
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
        goal:'new_first_island_consumed_v1',
        semanticStage:'first-island-consumed',
        definitionVersion:'top_mid_totalactive10_end300_v2',
        requiredActiveMs:10000
      }),
      second:installIslandConsumptionGate({
        key:'second',
        goal:'new_second_island_consumed_v1',
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
        publish('new_bento_checkpoint',{checkpoint:'top',goal_candidate:'new_bento_consumed_v1'});
      }
      if(state.topSeen&&!state.midSeen&&semanticIntersectsViewport(mid)){
        state.midSeen=true;
        publish('new_bento_checkpoint',{checkpoint:'mid',goal_candidate:'new_bento_consumed_v1'});
      }
    }

    function maybeConfirmHalf(){
      if(state.halfDone||!state.topSeen||!state.midSeen||state.activeMs<NEW_BENTO_GATE.halfActiveMs||
         document.visibilityState!=='visible'||!activity.hadTrustedInteraction)return;
      state.halfDone=true;
      var activeSeconds=Number((state.activeMs/1000).toFixed(1));
      reach('new_bento_50_consumed_v1',{
        semantic_stage:'new-bento-50-consumed',
        semantic_definition_version:'top_mid_totalactive8_v1',
        checkpoint_top:true,
        checkpoint_mid:true,
        bento_active_seconds:activeSeconds,
        required_bento_active_seconds:8,
        interaction_confirmed:true
      });
      publish('new_bento_50_consumption_gate_passed',{
        goal:'new_bento_50_consumed_v1',
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
      reach('new_bento_consumed_v1',{
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
        goal:'new_bento_consumed_v1',
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
         checkout data (see checkout_started below). */
      reach('commercial_drawer_open',d);
    }
    else if(name==='tariff_selected'||name==='sticky_tariff_selected'||name==='decision_tariff_selected'||name==='tariff_floor_selected')reach('tariff_selected',Object.assign({source_event:name},d));
    else if(name==='payment_start')reach('payment_started',d);
    else if(name==='payment_redirect')reach('payment_redirected',d);
    else if(name==='payment_success'){
      reach('payment_success',d);
      /* commercial.js emits payment_success only after authoritative server status CONFIRMED. */
      reach('funnel_purchase_v1',Object.assign({
        semantic_stage:'purchase',
        source_event:name,
        confirmation:'server_confirmed'
      },d));
    }
    else if(name==='payment_error')reach('payment_error',d,{once:false});
    else if(name==='prepay_talk_open')ux('pricing_prepay_talk','open',{source_event:name,source_cta:d.source_cta||'pricing-prepay-talk'});
    else if(name==='header_personal_channel_selected')reach('social_outbound_click',{platform:d.channel||'messenger',placement:'commercial_support',source_event:name},{once:false});
    else if(name==='ilya_personal_click')reach('social_outbound_click',{platform:'telegram',placement:'commercial_personal',source_event:name},{once:false});
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
        reach('new_life_calendar_age_slider_v1',{
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
        reach('new_life_calendar_birthdate_v1',{
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
      reach('new_life_calendar_65_toggle_v1',{
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
        reach('new_contact_author_click_v1',{
          component:'footer_contact',
          interaction:'route_click',
          route:'author',
          placement:'footer_contact'
        });
      }else if(contactRouteName==='team'){
        reach('new_contact_team_click_v1',{
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
      reach('new_online_group_header_click_v1',{
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
        reach('new_application_header_click_v1',{source_cta:'header',placement:'header'});
      }else if(newApplicationSource==='bento'||newApplicationSource==='bento-inline'){
        reach('new_application_bento_click_v1',{source_cta:newApplicationSource,placement:applicationPlacement||'product_bento'});
      }
      if(applicationPlacement==='bento-inline-firstscreen'){
        reach('new_participate_firstscreen_click_v1',{
          component:'firstscreen_cta',
          interaction:'participate_click',
          source_cta:'bento-inline-firstscreen',
          placement:'firstscreen'
        });
      }
    }

    var firstscreenQuestion=event.target.closest('[data-bzc-question-source="firstscreen-secondary-quiet"]');
    if(firstscreenQuestion){
      reach('new_question_firstscreen_click_v1',{
        component:'firstscreen_cta',
        interaction:'question_click',
        source_cta:'firstscreen-secondary-quiet',
        placement:'firstscreen'
      });
    }

    var channelSubscribe=event.target.closest('[data-analytics-channel-subscribe]');
    if(channelSubscribe){
      reach('new_channel_subscribe_click_v1',{
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
        reach('new_channel_max_click_v1',{
          component:'author_follow_step',
          interaction:'channel_choice_click',
          channel:'max',
          placement:'product_bento_author'
        });
      }else if(channelName==='telegram'){
        reach('new_channel_telegram_click_v1',{
          component:'author_follow_step',
          interaction:'channel_choice_click',
          channel:'telegram',
          placement:'product_bento_author'
        });
      }
    }

    var newAuthorMessage=event.target.closest('[data-analytics-new-author-message]');
    if(newAuthorMessage){
      reach('new_author_message_bento_click_v1',{
        source_cta:newAuthorMessage.getAttribute('data-analytics-new-author-message')||'bento',
        placement:'product_bento',
        intent:'author_situation_message'
      });
    }

    var newAudioAnchorPlay=event.target.closest('[data-analytics-new-audio-anchor-play]');
    if(newAudioAnchorPlay){
      reach('new_audio_anchor_play_click_v1',{
        source_cta:'audio-anchor-play',
        placement:'product_bento',
        audio_state:newAudioAnchorPlay.getAttribute('aria-disabled')==='true'?'placeholder':'live'
      });
    }

    var guaranteeOpen=event.target.closest('[data-bz-product-guarantee-open]');
    if(guaranteeOpen){
      reach('new_guarantee_open_v1',{source_cta:'bento-guarantee',placement:'product_bento'});
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
        reach('funnel_decision_v1',{
          semantic_stage:'decision',
          source_event:'commercial_cta_click_fallback',
          source_cta:commercialSource,
          decision_version:'0579'
        });
        reach('funnel_cta_v1',{
          semantic_stage:'cta',
          source_cta:commercialSource,
          cta_role:commercialRole
        });
      }
    }

    var commercialTalk=event.target.closest('[data-analytics-commercial-talk]');
    if(commercialTalk){
      reach('commercial_talk_v1',{
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
      reach('tariff_selected',{
        plan_id:planOpen.getAttribute('data-bzc-plan-open')||'group',
        source_cta:planOpen.getAttribute('data-bzc-source')||planOpen.getAttribute('data-commercial-source')||'page'
      });
    }

    var messenger=event.target.closest('a[href*="t.me/"],a[href*="telegram.me/"],a[href*="max.ru/"]');
    if(messenger){
      var href=messenger.getAttribute('href')||'';
      reach('social_outbound_click',{
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

  /* checkout_started = the person actually begins entering checkout data,
     not merely opening the commercial drawer. */
  document.addEventListener('focusin',function(event){
    if(!event.isTrusted||!event.target||!event.target.closest)return;
    var customer=event.target.closest('[data-bzc-customer]');
    if(customer){
      var layer=document.getElementById('bz-commercial-layer');
      var checkoutSource=layer&&layer.dataset&&layer.dataset.bzcOrigin||'checkout';
      var firstField=customer.getAttribute('data-bzc-customer')||customer.name||'field';
      reach('checkout_started',{first_field:firstField,source_cta:checkoutSource});
      /* BOR05 = actual start of checkout, not merely opening the drawer. */
      reach('funnel_checkout_v1',{
        semantic_stage:'checkout',
        source_event:'checkout_started',
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
