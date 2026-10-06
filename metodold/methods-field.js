/* owner:methods-field-0672
   Single production motion: scroll-driven inertial cascade.
   No tuner, no variant selector, no persistent controls. */
(function(){
  'use strict';
  if(window.__BZMethodsField0672)return;
  window.__BZMethodsField0672=true;

  var root=document.querySelector('[data-methods-field]');
  if(!root)return;

  var viewport=root.querySelector('[data-methods-viewport]');
  var groups={
    a:root.querySelector('[data-methods-group="a"]'),
    b:root.querySelector('[data-methods-group="b"]'),
    c:root.querySelector('[data-methods-group="c"]')
  };
  if(!viewport || !groups.a || !groups.b || !groups.c)return;

  function row(items,align,size){return {items:items,align:align||'left',size:size||5};}

  var preset={
    slot:'4',
    name:'Спокойная стенка',
    flavor:'methods-field--catalog',
    a:[
      row(['СИЛА ВОЛИ','АЛЛЕН КАРР'],'left',2),
      row(['ТАБЕКС'],'left',3),
      row(['НИКОТИНОВЫЙ ПЛАСТЫРЬ'],'left',3),
      row(['НИКОТИНОВАЯ ЖВАЧКА'],'left',4),
      row(['ЧАМПИКС'],'left',4)
    ],
    b:[
      row(['СОКРАЩЕНИЕ','ВЕЙП','IQOS'],'left',5),
      row(['НИКОТИНОВЫЙ СПРЕЙ'],'left',5),
      row(['ВРАЧ / НАРКОЛОГ','СТАТЬИ И РОЛИКИ'],'left',6),
      row(['СЧЁТЧИК ДНЕЙ','СПОРТ'],'left',6),
      row(['ПСИХОТЕРАПИЯ'],'left',7)
    ],
    c:[
      row(['ПАРИ','ИЗБЕГАНИЕ ТРИГГЕРОВ','СЕМЕЧКИ'],'left',8),
      row(['ГРУППЫ ПОДДЕРЖКИ','ГИПНОЗ'],'left',9),
      row(['ИГЛОУКАЛЫВАНИЕ','КОДИРОВАНИЕ'],'left',9),
      row(['ЛАЗЕР','НЕВИДИМАЯ СИГАРЕТА'],'left',10)
    ]
  };

  function buildRow(config,rowIndex,groupKey){
    var li=document.createElement('li');
    li.className='methods-field__row mf-align-'+config.align+' mf-size-'+config.size;
    li.dataset.methodsRow=String(rowIndex);
    li.dataset.methodsSize=String(config.size);
    li.dataset.methodsGroup=groupKey;

    config.items.forEach(function(label,index){
      var span=document.createElement('span');
      span.className='methods-field__item';
      span.textContent=label;
      li.appendChild(span);
      if(index<config.items.length-1){
        var sep=document.createElement('span');
        sep.className='methods-field__sep';
        sep.textContent='·';
        li.appendChild(sep);
      }
    });
    return li;
  }

  function render(container,rows,groupKey,offset){
    container.innerHTML='';
    rows.forEach(function(config,index){container.appendChild(buildRow(config,offset+index,groupKey));});
    return offset+rows.length;
  }

  root.classList.add(preset.flavor);
  root.setAttribute('data-methods-layout',preset.slot);
  root.setAttribute('data-methods-layout-name',preset.name);

  var offset=0;
  offset=render(groups.a,preset.a,'a',offset);
  offset=render(groups.b,preset.b,'b',offset);
  render(groups.c,preset.c,'c',offset);

  var rows=[].slice.call(root.querySelectorAll('.methods-field__row'));
  var rowMetas=rows.map(function(row,index){
    return {
      el:row,
      index:index,
      items:[].slice.call(row.querySelectorAll('.methods-field__item')),
      seps:[].slice.call(row.querySelectorAll('.methods-field__sep'))
    };
  });

  function clamp(v,min,max){return Math.max(min,Math.min(max,v));}
  function easeOutCubic(t){t=clamp(t,0,1);return 1-Math.pow(1-t,3);}

  function renderCascade(progress){
    rowMetas.forEach(function(meta){
      var local=easeOutCubic(clamp((progress-meta.index*0.038)/0.72,0,1));
      var inv=1-local;
      var direction=meta.index%2===0?-1:1;
      var x=direction*(24-meta.index*.9)*inv;
      var y=(10+meta.index*1.6)*inv;
      meta.el.style.transform='translate3d('+x.toFixed(2)+'px,'+y.toFixed(2)+'px,0)';
      meta.el.style.opacity=(.46+.54*local).toFixed(3);
      meta.items.forEach(function(item){
        item.style.transform='translate3d(0,0,0) scale(1)';
        item.style.opacity='1';
        item.style.textShadow='none';
        item.style.filter='none';
      });
      meta.seps.forEach(function(sep){sep.style.opacity=(.25+.75*local).toFixed(3);});
    });
  }

  var revealRoot=document.querySelector('#bz-author-poster-second-screen');
  var revealChunks=revealRoot?[].slice.call(revealRoot.querySelectorAll('[data-post-methods-reveal]')):[];
  if(revealRoot&&revealChunks.length){
    var revealReduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(revealReduced||!('IntersectionObserver' in window)){
      revealChunks.forEach(function(chunk){chunk.classList.add('is-revealed');});
    }else{
      revealRoot.classList.add('bz-post-methods-reveal-ready');
      var revealObserver=new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if(!entry.isIntersecting)return;
          entry.target.classList.add('is-revealed');
          revealObserver.unobserve(entry.target);
        });
      },{threshold:.12,rootMargin:'0px 0px -10% 0px'});
      revealChunks.forEach(function(chunk){revealObserver.observe(chunk);});
    }
  }

  var reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var active=false;
  var listening=false;
  var raf=0;
  var io=null;

  function sceneProgress(){
    var rect=viewport.getBoundingClientRect();
    var vh=window.innerHeight||document.documentElement.clientHeight||1;
    var start=vh*.88;
    var end=vh*.22;
    return clamp((start-rect.top)/Math.max(1,rect.height+start-end),0,1);
  }
  function renderFromScroll(){raf=0;renderCascade(sceneProgress());}
  function requestRender(){if(raf)return;raf=window.requestAnimationFrame(renderFromScroll);}
  function addListeners(){
    if(listening)return;
    listening=true;
    window.addEventListener('scroll',requestRender,{passive:true});
    window.addEventListener('resize',requestRender,{passive:true});
    window.addEventListener('orientationchange',requestRender,{passive:true});
  }
  function removeListeners(){
    if(!listening)return;
    listening=false;
    window.removeEventListener('scroll',requestRender);
    window.removeEventListener('resize',requestRender);
    window.removeEventListener('orientationchange',requestRender);
    if(raf){window.cancelAnimationFrame(raf);raf=0;}
  }
  function setActive(next){
    if(active===next)return;
    active=next;
    if(active){addListeners();requestRender();}
    else{removeListeners();renderCascade(sceneProgress());}
  }

  root.classList.add('is-enhanced');
  if(reduced){
    root.classList.add('is-visible','is-reduced-motion');
    renderCascade(1);
  }else if('IntersectionObserver' in window){
    io=new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.target!==root)return;
        if(entry.isIntersecting){root.classList.add('is-visible');setActive(true);}
        else setActive(false);
      });
    },{threshold:0,rootMargin:'30% 0px 30% 0px'});
    io.observe(root);
    requestRender();
  }else{
    root.classList.add('is-visible');
    setActive(true);
    requestRender();
  }
})();
