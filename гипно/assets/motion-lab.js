/* HYPNO BREATH LAB — ten exclusive breathing studies, replacing the old 5-animation picker */
(function(){
'use strict';
var variants=[
{id:'b01',title:'Унисон',desc:'7,2с · ровно',t:7.2,core:17.5,rings:8,gap:5.1,rf:.87,rt:1.13,cf:.79,ct:1.2,light:.75,kind:'sync'},
{id:'b02',title:'Шёлковый прилив',desc:'12с · медленно',t:12,core:11.5,rings:9,gap:4.6,rf:.92,rt:1.08,cf:.88,ct:1.12,light:1.22,kind:'soft'},
{id:'b03',title:'Глубокий вдох',desc:'9с · широко',t:9,core:23.5,rings:7,gap:5.8,rf:.78,rt:1.21,cf:.76,ct:1.28,light:.7,kind:'deep'},
{id:'b04',title:'Частый пульс',desc:'4,6с · активно',t:4.6,core:13,rings:10,gap:4.3,rf:.84,rt:1.17,cf:.7,ct:1.32,light:.92,kind:'quick'},
{id:'b05',title:'Волна наружу',desc:'8,6с · из центра',t:8.6,core:15.5,rings:9,gap:4.8,rf:.83,rt:1.18,cf:.8,ct:1.23,light:.84,kind:'out'},
{id:'b06',title:'Волна внутрь',desc:'9,2с · к центру',t:9.2,core:12.5,rings:9,gap:5.1,rf:.84,rt:1.16,cf:.82,ct:1.23,light:.65,kind:'in'},
{id:'b07',title:'Противофаза',desc:'8с · навстречу',t:8,core:19.5,rings:8,gap:5,rf:.84,rt:1.15,cf:.75,ct:1.28,light:.79,kind:'counter'},
{id:'b08',title:'Хамелеон',desc:'7,8с · цвет и свет',t:7.8,core:16.5,rings:8,gap:5,rf:.85,rt:1.15,cf:.78,ct:1.27,light:1.06,kind:'chroma'},
{id:'b09',title:'Двойной вдох',desc:'10с · два пика',t:10,core:14.5,rings:8,gap:5.1,rf:.86,rt:1.13,cf:.81,ct:1.25,light:.93,kind:'double'},
{id:'b10',title:'Без ядра',desc:'11,5с · световая пустота',t:11.5,core:0,rings:11,gap:3.8,rf:.8,rt:1.18,cf:.82,ct:1.21,light:.82,kind:'void'}
];
var ids=variants.map(function(x){return x.id});
var KEY='hypno_breath_variant_v2';
function dust(){
 var s='<div class="ha-breath-dust">';
 for(var i=0;i<15;i++){
  s+='<i style="--x:'+((i*41+11)%98)+'%;--y:'+((i*31+21)%96)+'%;--sz:'+(i%5===0?2.3:1.2)+'px;--op:'+(.13+(i%4)*.14).toFixed(2)+'"></i>';
 }
 return s+'</div>';
}
function scene(v){
 var style='--bt:'+v.t+'s;--core-size:'+v.core+'%;--rf:'+v.rf+';--rt:'+v.rt+';--cf:'+v.cf+';--ct:'+v.ct+';--lum:'+v.light+';';
 var s='<div class="ha-stage ha-breath-scene ha-'+v.id+' ha-'+v.kind+'" style="'+style+'">';
 s+='<div class="ha-breath-ambient"></div>';
 for(var i=0;i<v.rings;i++){
  // Rings are indexed outside -> inside. Their phase offsets make real moving waves.
  var delay=0;
  if(v.kind==='out')delay=(v.rings-1-i)*.34;
  if(v.kind==='in')delay=i*.35;
  if(v.kind==='counter')delay=-v.t/2;
  var gap=3.7+i*v.gap;
  // Slightly variable ring widths to avoid mechanical blueprint regularity.
  var opacity=Math.min(.88,.19+i*.083).toFixed(2);
  s+='<i class="ha-breath-ring" style="--inset:'+gap.toFixed(2)+'%;--ring-opacity:'+opacity+';--delay:'+delay.toFixed(2)+'s"></i>';
 }
 s+=dust();
 s+='<div class="ha-breath-halo"></div>';
 if(v.core>0)s+='<div class="ha-breath-center"></div>';
 else s+='<div class="ha-empty-center"></div>';
 return s+'</div>';
}
function setup(){
 var target=document.querySelector('.hero .hero-visual, .hero .visual, .hero .scene');
 if(!target||document.getElementById('ha-motion-dock'))return;
 var host=document.createElement('div');
 host.className='ha-visual-host '+(target.classList.contains('hero-visual')?'ha-theme-green':'ha-theme-violet');
 host.setAttribute('aria-hidden','true');
 target.appendChild(host);
 document.body.classList.add('ha-enabled');
 var dock=document.createElement('div');
 dock.id='ha-motion-dock';
 var html='<div class="ha-panel" id="ha-breath-options"><div class="ha-heading"><strong>ДЫХАНИЕ · 10 ВЕРСИЙ</strong><small>Варианты центра и волн</small></div><div class="ha-list" role="group" aria-label="Десять вариантов дыхания">';
 for(var i=0;i<variants.length;i++){
  var v=variants[i];
  html+='<button class="ha-mode" type="button" data-ha-select="'+v.id+'" aria-pressed="false"><strong>'+String(i+1).padStart(2,'0')+' · '+v.title+'</strong><small>'+v.desc+'</small></button>';
 }
 html+='</div><div class="ha-tools"><button class="ha-tool" type="button" data-ha-pause aria-label="Остановить дыхание" title="Пауза">Ⅱ</button><button class="ha-tool" type="button" data-ha-close aria-label="Свернуть пульт" title="Свернуть">×</button></div></div>';
 html+='<button class="ha-mini" type="button" aria-controls="ha-breath-options" aria-expanded="false"><i aria-hidden="true"></i><strong>Дыхание: Унисон</strong><span>10 версий ▴</span></button>';
 dock.innerHTML=html;
 document.body.appendChild(dock);
 var mini=dock.querySelector('.ha-mini'),miniLabel=mini.querySelector('strong');
 var screen=window.matchMedia('(max-width:900px)');
 var chosen='b01',paused=false;
 try{
  var params=new URLSearchParams(window.location.search);
  var fromUrl=params.get('breath')||params.get('animation');
  var saved=window.localStorage.getItem(KEY);
  // Legacy ?animation=breath and earlier saved preferences fall back to b01.
  chosen=ids.indexOf(fromUrl)>=0?fromUrl:ids.indexOf(saved)>=0?saved:'b01';
 }catch(e){}
 function choose(id){
  var index=ids.indexOf(id);
  if(index<0)return;
  chosen=id;
  host.dataset.mode=id;
  // Replace the whole DOM subtree: zero hidden animations are left running.
  host.innerHTML=scene(variants[index]);
  var bs=dock.querySelectorAll('[data-ha-select]');
  for(var k=0;k<bs.length;k++)bs[k].setAttribute('aria-pressed',String(bs[k].getAttribute('data-ha-select')===id));
  miniLabel.textContent='Дыхание: '+variants[index].title;
  try{window.localStorage.setItem(KEY,id)}catch(e){}
  if(screen.matches){dock.classList.remove('ha-open');mini.setAttribute('aria-expanded','false')}
 }
 function pause(yes){
  paused=yes;
  document.body.classList.toggle('ha-paused',paused);
  var btn=dock.querySelector('[data-ha-pause]');
  btn.textContent=paused?'▶':'Ⅱ';
  btn.title=paused?'Продолжить':'Пауза';
  btn.setAttribute('aria-label',paused?'Продолжить дыхание':'Остановить дыхание');
 }
 function close(){
  dock.classList.remove('ha-open');
  if(!screen.matches)dock.classList.add('ha-collapsed');
  mini.setAttribute('aria-expanded','false');
 }
 dock.addEventListener('click',function(e){
  var b=e.target.closest('[data-ha-select]');
  if(b){choose(b.getAttribute('data-ha-select'));return}
  if(e.target.closest('[data-ha-pause]')){pause(!paused);return}
  if(e.target.closest('[data-ha-close]'))close();
 });
 mini.addEventListener('click',function(){
  if(screen.matches){
   var opened=!dock.classList.contains('ha-open');
   dock.classList.toggle('ha-open',opened);
   mini.setAttribute('aria-expanded',String(opened));
  }else{
   dock.classList.remove('ha-collapsed');
   mini.setAttribute('aria-expanded','true');
  }
 });
 document.addEventListener('keydown',function(e){if(e.key==='Escape'&&dock.classList.contains('ha-open'))close()});
 document.addEventListener('pointerdown',function(e){if(screen.matches&&dock.classList.contains('ha-open')&&!dock.contains(e.target))close()});
 if(screen.addEventListener)screen.addEventListener('change',function(){dock.classList.remove('ha-open','ha-collapsed');mini.setAttribute('aria-expanded','false')});
 if('IntersectionObserver' in window){
  new IntersectionObserver(function(entries){host.classList.toggle('ha-offscreen',!entries[0].isIntersecting)},{threshold:.01}).observe(target);
 }
 choose(chosen);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
})();