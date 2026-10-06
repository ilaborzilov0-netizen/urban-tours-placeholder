/* owner:0723-meaning-thread-scroll-causal
   Single production owner for the meaning-island causal thread.
   Quiet guide -> settled past -> scroll-driven live segment/head -> asymmetric knot -> three foreground excerpts -> CTA handoff.
   Scroll is mapped in document coordinates against a stable layout viewport so mobile Chrome toolbar changes cannot move the semantic playhead.
*/
(function(){
  'use strict';
  if(window.__BZMeaningCausalThread0723)return;
  window.__BZMeaningCausalThread0723=true;

  var docRoot=document.documentElement;
  var island=document.querySelector('[data-bz-support-bento]');
  if(!island)return;

  var card=island.querySelector('[data-bz-support-unravel]');
  var unravel=card?card.querySelector('.bz-support-bento__unravel'):null;
  var card01=island.querySelector('.bz-support-bento__card--01');
  var card02=island.querySelector('.bz-support-bento__card--02');
  var card04=island.querySelector('.bz-support-bento__card--04');
  var finalSection=island.querySelector('.bz-support-bento__final');
  var cta=island.querySelector('#bz-application-request');
  var ctaToggle=cta?cta.querySelector('[data-bz-inline-application-toggle]'):null;
  var contourSvg=cta?cta.querySelector('[data-bz-thread-contour]'):null;
  var contourPath=contourSvg?contourSvg.querySelector('[data-bz-thread-contour-path]'):null;

  var svg=island.querySelector('[data-bz-live-thread]');
  var geometryPath=svg?svg.querySelector('[data-bz-thread-base]'):null;
  var guidePath=svg?svg.querySelector('[data-bz-thread-guide]'):null;
  var pastPath=svg?svg.querySelector('[data-bz-thread-past]'):null;
  var livePath=svg?svg.querySelector('[data-bz-thread-live]'):null;
  var head=svg?svg.querySelector('[data-bz-thread-head]'):null;

  var frontSvg=island.querySelector('[data-bz-live-thread-front]');
  var frontPath=frontSvg?frontSvg.querySelector('[data-bz-thread-front]'):null;
  var frontMaskBase=frontSvg?frontSvg.querySelector('[data-bz-thread-front-mask-base]'):null;
  var frontMaskCuts=frontSvg?frontSvg.querySelector('[data-bz-thread-front-mask-cuts]'):null;

  var items=card?Array.prototype.slice.call(card.querySelectorAll('.bz-support-bento__unravel-items span')):[];
  var separators=card?Array.prototype.slice.call(card.querySelectorAll('.bz-support-bento__unravel-items i')):[];
  var tools=card?Array.prototype.slice.call(card.querySelectorAll('.bz-support-bento__tools article')):[];
  var reduceMotion=window.matchMedia?window.matchMedia('(prefers-reduced-motion: reduce)'):null;

  if(!svg||!geometryPath||!guidePath||!pastPath||!livePath||!head||!frontSvg||!frontPath||!frontMaskBase||!frontMaskCuts||!card||!unravel||!cta)return;

  var active=false;
  var raf=0;
  var lastFrame=0;
  var currentLength=0;
  var targetLength=0;
  var velocity=0;
  var totalLength=1;
  var trailLength=96;
  var samples=[];
  var geometryDirty=true;
  var observer=null;
  var sizeObserver=null;
  var resizeTimer=0;
  var knotStartLength=0;
  var knotEndLength=0;
  var foregroundRanges=[];
  var handoffFired=false;
  var handoffTimer=0;
  var layoutWidth=0;
  var layoutHeight=0;
  var stableViewportHeight=Math.max(1,document.documentElement.clientHeight||window.innerHeight||720);
  var islandPageTop=0;
  var lastViewportWidth=Math.max(1,document.documentElement.clientWidth||window.innerWidth||1);

  function clamp(v,min,max){return Math.max(min,Math.min(max,v));}
  function smooth(v){v=clamp(v,0,1);return v*v*(3-2*v);}
  function fixed(v){return Number(v).toFixed(3);}
  function px(v){return Math.round(v*10)/10;}
  function localRect(element,rootRect){
    var r=element.getBoundingClientRect();
    return {
      left:r.left-rootRect.left,right:r.right-rootRect.left,
      top:r.top-rootRect.top,bottom:r.bottom-rootRect.top,
      width:r.width,height:r.height,
      cx:r.left-rootRect.left+r.width/2,cy:r.top-rootRect.top+r.height/2
    };
  }

  function buildContour(){
    if(!contourSvg||!contourPath)return;
    var r=cta.getBoundingClientRect();
    var w=Math.max(1,r.width),h=Math.max(1,r.height);
    var inset=1.25;
    var radius=Math.min(10,Math.max(6,Math.min(w,h)*.06));
    var right=w-inset,bottom=h-inset,left=inset,top=inset,y0=h*.5;
    var d=[
      'M',px(right),px(y0),
      'L',px(right),px(bottom-radius),
      'Q',px(right),px(bottom),px(right-radius),px(bottom),
      'L',px(left+radius),px(bottom),
      'Q',px(left),px(bottom),px(left),px(bottom-radius),
      'L',px(left),px(top+radius),
      'Q',px(left),px(top),px(left+radius),px(top),
      'L',px(right-radius),px(top),
      'Q',px(right),px(top),px(right),px(top+radius),
      'L',px(right),px(y0)
    ].join(' ');
    contourSvg.setAttribute('viewBox','0 0 '+px(w)+' '+px(h));
    contourSvg.setAttribute('width',px(w));
    contourSvg.setAttribute('height',px(h));
    contourPath.setAttribute('d',d);
  }

  function buildMask(){
    var root=island.getBoundingClientRect();
    while(frontMaskCuts.firstChild)frontMaskCuts.removeChild(frontMaskCuts.firstChild);
    if(root.width<=760)return;
    items.forEach(function(item){
      var r=item.getBoundingClientRect();
      var cut=document.createElementNS('http://www.w3.org/2000/svg','rect');
      cut.setAttribute('x',px(r.left-root.left+3));
      cut.setAttribute('y',px(r.top-root.top+3));
      cut.setAttribute('width',px(Math.max(1,r.width-6)));
      cut.setAttribute('height',px(Math.max(1,r.height-6)));
      cut.setAttribute('rx','3');
      cut.setAttribute('fill','#000');
      frontMaskCuts.appendChild(cut);
    });
  }

  function nearestLengthForY(targetY,from,to){
    var best=from,bestDist=Infinity;
    for(var i=0;i<samples.length;i++){
      var s=samples[i];
      if(s.len<from||s.len>to)continue;
      var d=Math.abs(s.y-targetY);
      if(d<bestDist){bestDist=d;best=s.len;}
    }
    return best;
  }

  function segmentD(start,end,steps){
    start=clamp(start,0,totalLength);
    end=clamp(end,0,totalLength);
    if(end<=start+.5)return '';
    steps=steps||Math.max(8,Math.round((end-start)/6));
    var d='';
    for(var i=0;i<=steps;i++){
      var l=start+(end-start)*(i/steps);
      var p=geometryPath.getPointAtLength(l);
      d+=(i?' L ':'M ')+px(p.x)+' '+px(p.y);
    }
    return d;
  }

  function buildPath(){
    if(!island.isConnected)return;
    var rr=island.getBoundingClientRect();
    var width=Math.max(1,rr.width);
    var height=Math.max(1,island.scrollHeight);
    var mobile=width<=760;
    var headBox=localRect(island.querySelector('.bz-support-bento__head'),rr);
    var one=localRect(card01,rr);
    var two=localRect(card02,rr);
    var three=localRect(card,rr);
    var knot=localRect(unravel,rr);
    var four=localRect(card04,rr);
    var fin=localRect(finalSection,rr);
    var button=localRect(cta,rr);

    /* On mobile the calm thread hugs the island seam instead of reading as an in-card progress rail. */
    /* Keep the mobile rail visibly inside the clipped island seam. 2px was swallowed by the island border/clip on real devices. */
    var edge=mobile?10.5:11.5;
    var left=edge,right=width-edge;
    var cx=knot.cx,cy=knot.cy;
    var kw=Math.min(knot.width*(mobile?.78:.66),mobile?300:540);
    var kh=Math.min(knot.height*(mobile?.64:.70),mobile?250:270);
    var enterY=clamp(knot.top+knot.height*.16,three.top+80,cy-48);
    var exitY=clamp(knot.top+knot.height*.84,cy+46,three.bottom-96);
    var startY=Math.max(28,headBox.top+Math.min(72,headBox.height*.24));
    var preOne=Math.max(startY+60,one.top+Math.min(70,one.height*.20));
    var preTwo=Math.max(preOne+80,two.top+Math.min(80,two.height*.18));
    var postThree=Math.max(exitY+34,three.bottom-Math.min(70,three.height*.08));
    var fourY=Math.max(postThree+60,four.top+Math.min(80,four.height*.22));
    var finalY=Math.max(fourY+100,fin.top+Math.min(90,fin.height*.18));
    var endX=clamp(button.right-2,width*.62,right);
    var endY=button.top+button.height*.52;

    /* Intentionally asymmetric knot: big upper-right loop, left return, inner hook, lower escape. */
    var d=[
      'M',px(left),px(startY),
      'L',px(left),px(preOne),
      'C',px(left),px(preOne+34),px(left+(mobile?4:10)),px(preTwo-36),px(left),px(preTwo),
      'L',px(left),px(enterY-34),
      'C',px(left),px(enterY),px(cx-kw*.46),px(cy-kh*.34),px(cx-kw*.10),px(cy-kh*.22),
      'C',px(cx+kw*.52),px(cy-kh*.46),px(cx+kw*.40),px(cy+kh*.08),px(cx+kw*.13),px(cy+kh*.02),
      'C',px(cx-kw*.43),px(cy-kh*.13),px(cx-kw*.49),px(cy+kh*.34),px(cx-kw*.08),px(cy+kh*.25),
      'C',px(cx+kw*.49),px(cy+kh*.45),px(cx+kw*.55),px(cy-kh*.10),px(cx+kw*.20),px(cy-kh*.18),
      'C',px(cx-kw*.24),px(cy-kh*.41),px(cx-kw*.35),px(cy+kh*.02),px(cx+kw*.02),px(cy+kh*.10),
      'C',px(cx+kw*.36),px(cy+kh*.29),px(cx+kw*.18),px(cy+kh*.42),px(cx-kw*.18),px(cy+kh*.34),
      'C',px(cx+kw*.03),px(cy+kh*.13),px(cx+kw*.48),px(exitY-20),px(right),px(exitY),
      'C',px(right),px(exitY+34),px(right-(mobile?3:9)),px(postThree-28),px(right),px(postThree),
      'L',px(right),px(fourY),
      'C',px(right),px(fourY+42),px(right-(mobile?4:10)),px(finalY-40),px(right),px(finalY),
      'L',px(right),px(Math.max(finalY+30,endY-80)),
      'C',px(right),px(endY-28),px(endX+18),px(endY),px(endX),px(endY)
    ].join(' ');

    svg.setAttribute('viewBox','0 0 '+px(width)+' '+px(height));
    svg.setAttribute('width',px(width));
    svg.setAttribute('height',px(height));
    geometryPath.setAttribute('d',d);
    pastPath.setAttribute('d',d);
    livePath.setAttribute('d',d);

    frontSvg.setAttribute('viewBox','0 0 '+px(width)+' '+px(height));
    frontSvg.setAttribute('width',px(width));
    frontSvg.setAttribute('height',px(height));
    frontMaskBase.setAttribute('x','0');
    frontMaskBase.setAttribute('y','0');
    frontMaskBase.setAttribute('width',px(width));
    frontMaskBase.setAttribute('height',px(height));

    totalLength=Math.max(1,geometryPath.getTotalLength());
    trailLength=clamp(stableViewportHeight*.145,mobile?62:84,mobile?108:148);
    islandPageTop=(window.pageYOffset||document.documentElement.scrollTop||0)+rr.top;
    layoutWidth=width;
    layoutHeight=height;
    samples=[];
    var count=mobile?440:620;
    for(var i=0;i<=count;i++){
      var len=totalLength*(i/count);
      var pt=geometryPath.getPointAtLength(len);
      samples.push({len:len,x:pt.x,y:pt.y,t:i/count});
    }

    /* Detect the actual knot span spatially, not just by matching Y: self-crossings contain the same Y many times. */
    var startHit=samples.find(function(s){
      return s.t>.08 && s.x>left+22 && s.y>=enterY-24;
    });
    knotStartLength=startHit?startHit.len:nearestLengthForY(enterY-4,totalLength*.08,totalLength*.55);
    var endHit=samples.find(function(s){
      return s.len>knotStartLength+24 && s.x>right-26 && s.y>=exitY-28;
    });
    knotEndLength=endHit?endHit.len:nearestLengthForY(exitY+4,knotStartLength+20,totalLength*.78);
    if(knotEndLength<=knotStartLength+20){
      knotStartLength=totalLength*.24;
      knotEndLength=totalLength*.60;
    }
    var span=knotEndLength-knotStartLength;
    foregroundRanges=[
      [knotStartLength+span*.20,knotStartLength+span*.27],
      [knotStartLength+span*.48,knotStartLength+span*.56],
      [knotStartLength+span*.72,knotStartLength+span*.80]
    ];

    /* Quiet guide exists on calm sides; inside the knot it almost disappears instead of revealing the trick. */
    guidePath.setAttribute('d',[
      segmentD(0,Math.max(0,knotStartLength-18),70),
      segmentD(Math.min(totalLength,knotEndLength+20),totalLength,90)
    ].filter(Boolean).join(' '));

    buildMask();
    buildContour();
    geometryDirty=false;

    var wanted=findTargetLength();
    if(!Number.isFinite(currentLength)||currentLength<=0||currentLength>totalLength){currentLength=wanted;velocity=0;}
    targetLength=wanted;
    paintThread();
  }

  function findTargetLength(){
    if(geometryDirty||!samples.length)return 0;
    if(handoffFired&&cta.classList.contains('is-expanded'))return totalLength;

    /* Document-space mapping is the important mobile fix. The browser toolbar may resize the visual viewport,
       but scrollY + a stable layout attention line remains monotonic and does not jump. */
    var vh=stableViewportHeight;
    var attention=vh*.54;
    var scrollY=window.pageYOffset||document.documentElement.scrollTop||0;
    var rr=island.getBoundingClientRect();
    var observedPageTop=scrollY+rr.top;
    /* Track genuine layout shifts above the island, but do not use a changing visualViewport height. */
    if(Math.abs(observedPageTop-islandPageTop)>.5)islandPageTop=observedPageTop;
    var localY=(scrollY+attention)-islandPageTop;
    var expected=clamp(localY/Math.max(1,island.scrollHeight),0,1);
    var center=Math.round(expected*(samples.length-1));
    var radius=Math.max(44,Math.round(samples.length*.16));
    var from=Math.max(0,center-radius),to=Math.min(samples.length-1,center+radius);
    var best=samples[center]||samples[0],bestScore=Infinity;
    for(var i=from;i<=to;i++){
      var s=samples[i];
      var yDist=Math.abs(s.y-localY);
      var progressPenalty=Math.abs(s.t-expected)*vh*.42;
      var score=yDist+progressPenalty;
      if(score<bestScore){bestScore=score;best=s;}
    }
    return clamp(best.len,0,totalLength);
  }

  function setPathProgress(path,end,start){
    start=start||0;
    var length=Math.max(0,end-start);
    path.style.strokeDasharray=fixed(Math.max(.01,length))+' '+fixed(totalLength+12);
    path.style.strokeDashoffset=fixed(-start);
  }

  function paintForeground(len){
    var parts=[];
    foregroundRanges.forEach(function(range){
      var start=range[0],end=Math.min(range[1],len);
      if(end>start+1)parts.push(segmentD(start,end,18));
    });
    frontPath.setAttribute('d',parts.join(' '));
    frontPath.style.opacity=parts.length?'0.92':'0';
  }

  function triggerHandoff(){
    if(handoffFired||!ctaToggle)return;
    handoffFired=true;
    cta.classList.remove('is-thread-handoff');
    ctaToggle.classList.remove('is-thread-handoff');
    void ctaToggle.offsetWidth;
    cta.classList.add('is-thread-handoff');
    ctaToggle.classList.add('is-thread-handoff');
    clearTimeout(handoffTimer);
    handoffTimer=setTimeout(function(){
      cta.classList.remove('is-thread-handoff');
      ctaToggle.classList.remove('is-thread-handoff');
    },980);
  }

  function paintThread(){
    var len=clamp(currentLength,0,totalLength);
    var norm=len/totalLength;
    var liveStart=Math.max(0,len-trailLength);
    var point=geometryPath.getPointAtLength(len);

    /* Clear visual hierarchy: faint future -> settled past -> bright short live segment.
       This makes the thread visibly respond to scroll without making the whole section look like a progress bar. */
    setPathProgress(pastPath,Math.max(0,liveStart-trailLength*.16),0);
    setPathProgress(livePath,len,liveStart);
    head.setAttribute('cx',fixed(point.x));
    head.setAttribute('cy',fixed(point.y));
    paintForeground(len);

    var finished=norm>=.985;
    island.classList.toggle('is-thread-at-end',finished);
    if(norm>=.965)triggerHandoff();
  }

  function paintUnravel(){
    if(!card)return;
    var rect=card.getBoundingClientRect();
    var vh=stableViewportHeight;
    var raw=(vh*.82-rect.top)/Math.max(1,rect.height+vh*.62);
    var p=clamp(raw,0,1);
    card.style.setProperty('--bz-unravel',fixed(p));
    separators.forEach(function(separator){
      separator.style.opacity=fixed(.42+.58*p);
      separator.style.transform='translate3d(0,'+fixed(2*(1-p))+'px,0)';
    });
    tools.forEach(function(tool){
      var start=parseFloat(tool.style.getPropertyValue('--bz-stage'))||0;
      var q=smooth(clamp((p-start)/.2,0,1));
      tool.style.opacity=fixed(.34+.66*q);
      tool.style.transform='translate3d(0,'+fixed(8*(1-q))+'px,0)';
    });
  }

  function frame(time){
    raf=0;
    if(!active)return;
    if(geometryDirty)buildPath();
    targetLength=findTargetLength();

    var dt=lastFrame?Math.min(.032,(time-lastFrame)/1000):.016;
    lastFrame=time;
    var stiffness=48,damping=14.6;
    var delta=targetLength-currentLength;
    velocity+=delta*stiffness*dt;
    velocity*=Math.exp(-damping*dt);
    currentLength+=velocity*dt;
    currentLength=clamp(currentLength,0,totalLength);

    paintThread();
    paintUnravel();

    var unsettled=Math.abs(targetLength-currentLength)>.24||Math.abs(velocity)>.18;
    if(unsettled)raf=requestAnimationFrame(frame);
    else{
      velocity=0;
      currentLength=targetLength;
      paintThread();
      paintUnravel();
    }
  }

  function requestFrame(){if(active&&!raf){lastFrame=0;raf=requestAnimationFrame(frame);}}
  function onScroll(){requestFrame();}
  function onResize(force){
    var viewportWidth=Math.max(1,document.documentElement.clientWidth||window.innerWidth||1);
    var widthChanged=Math.abs(viewportWidth-lastViewportWidth)>1;
    if(force===true||widthChanged){
      lastViewportWidth=viewportWidth;
      stableViewportHeight=Math.max(1,document.documentElement.clientHeight||window.innerHeight||stableViewportHeight);
      geometryDirty=true;
      clearTimeout(resizeTimer);
      resizeTimer=setTimeout(function(){geometryDirty=true;requestFrame();},90);
    }
    requestFrame();
  }
  function onOrientationChange(){onResize(true);}
  function revealAll(){
    island.querySelectorAll('[data-bz-support-reveal]').forEach(function(el){el.classList.add('is-visible');});
    island.classList.add('is-thread-visible');
  }
  function start(){
    if(active)return;
    active=true;
    window.addEventListener('scroll',onScroll,{passive:true});
    window.addEventListener('resize',onResize,{passive:true});
    window.addEventListener('orientationchange',onOrientationChange,{passive:true});
    requestFrame();
  }
  function stop(){
    if(!active)return;
    active=false;
    window.removeEventListener('scroll',onScroll);
    window.removeEventListener('resize',onResize);
    window.removeEventListener('orientationchange',onOrientationChange);
    if(raf){cancelAnimationFrame(raf);raf=0;}
  }

  if(reduceMotion&&reduceMotion.matches){
    revealAll();
    buildPath();
    currentLength=totalLength;
    targetLength=totalLength;
    paintThread();
    paintUnravel();
    island.classList.add('is-thread-reduced');
    return;
  }

  try{
    var revealObserver=new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(!entry.isIntersecting)return;
        entry.target.classList.add('is-visible');
        if(entry.target.getAttribute('data-bz-support-reveal')==='head')island.classList.add('is-thread-visible');
        revealObserver.unobserve(entry.target);
      });
    },{root:null,rootMargin:'0px 0px -20% 0px',threshold:.01});
    docRoot.classList.add('bz-support-bento-motion');
    island.querySelectorAll('[data-bz-support-reveal]').forEach(function(el){revealObserver.observe(el);});

    observer=new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.target!==island)return;
        if(entry.isIntersecting)start(); else stop();
      });
    },{root:null,rootMargin:'35% 0px 35% 0px',threshold:0});
    observer.observe(island);

    if('ResizeObserver' in window){
      sizeObserver=new ResizeObserver(function(){
        var rr=island.getBoundingClientRect();
        var h=Math.max(1,island.scrollHeight);
        if(Math.abs(rr.width-layoutWidth)>.75||Math.abs(h-layoutHeight)>1){geometryDirty=true;}
        requestFrame();
      });
      sizeObserver.observe(island);
      sizeObserver.observe(cta);
    }
    if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){geometryDirty=true;requestFrame();});
    geometryDirty=true;
  }catch(error){
    docRoot.classList.remove('bz-support-bento-motion');
    revealAll();
    buildPath();
    currentLength=totalLength;
    targetLength=totalLength;
    paintThread();
    paintUnravel();
  }
})();
