/* Five distinct, exclusive cinematic animations for the hypnosis hero. */
(function(){
'use strict';
var modes=[
{id:'breath',title:'Дыхание',subtitle:'Breathing Portal'},
{id:'spiral',title:'Спираль',subtitle:'Slow Spiral'},
{id:'pulse',title:'Импульс',subtitle:'Magnetic Pulse'},
{id:'liquid',title:'Жидкий свет',subtitle:'Liquid Glow'},
{id:'focus',title:'Фокус',subtitle:'Focus Lock'}
];
var valid=modes.map(function(m){return m.id});
function dots(){
 var s='<div class="ha-dust">';
 for(var i=0;i<19;i++){s+='<i style="--x:'+((i*37+14)%99)+'%;--y:'+((i*47+11)%96)+'%;--s:'+(i%6===0?3:1.4)+'px;--o:'+(.15+(i%5)*.14).toFixed(2)+'"></i>'}
 return s+'</div>';
}
function core(){
 return '<div class="ha-core"><svg class="ha-headphone" viewBox="0 0 100 100" aria-hidden="true"><path d="M18 55V45a32 32 0 0 1 64 0v10M18 55h13v29H18c-7 0-10-4-10-11v-8c0-7 3-10 10-10Zm64 0H69v29h13c7 0 10-4 10-11v-8c0-7-3-10-10-10Z"/></svg></div>';
}
function breath(){
 var s='<div class="ha-cloud"></div>';
 for(var i=0;i<8;i++){
 s+='<i class="ha-ring" style="--i:'+(5+i*5.1).toFixed(1)+'%;--o:'+(.18+i*.085).toFixed(2)+';--dur:'+(7+i*.7).toFixed(1)+'s;--delay:-'+(i*.83).toFixed(2)+'s"></i>';
 }
 return s+dots()+core();
}
function spiralPath(offset){
 var p='';
 for(var i=0;i<=565;i++){
 var ratio=i/565,angle=ratio*Math.PI*12+offset,rad=17+255*Math.pow(ratio,1.13);
 var x=300+Math.cos(angle)*rad,y=300+Math.sin(angle)*rad;
 p+=(i?'L':'M')+x.toFixed(2)+','+y.toFixed(2);
 }
 return p;
}
function spiral(){
 var s='<div class="ha-spiral-field"></div><svg class="ha-spiral-svg" viewBox="0 0 600 600" aria-hidden="true"><defs><linearGradient id="ha-spiral-gradient" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f3dbff" stop-opacity=".16"/><stop offset=".44" stop-color="#dbb2ff" stop-opacity=".97"/><stop offset="1" stop-color="#ba81e6" stop-opacity=".37"/></linearGradient></defs><g class="ha-rotor">';
 for(var i=0;i<3;i++){s+='<path class="ha-spiral-line" d="'+spiralPath(i*Math.PI*2/3)+'" style="animation-delay:-'+(i*3)+'s"></path>';}
 s+='</g><g class="ha-rotor-back">';
 for(var j=0;j<2;j++){s+='<path class="ha-spiral-line echo" d="'+spiralPath(.5+j*2.5)+'"></path>';}
 return s+'</g></svg>'+dots()+core();
}
function pulse(){
 var s='<div class="ha-static-ring" style="--inset:16%;--opacity:.25"></div><div class="ha-static-ring" style="--inset:26%;--opacity:.38"></div>';
 for(var i=0;i<5;i++){s+='<i class="ha-ripple" style="--delay:-'+(i*1.28).toFixed(2)+'s"></i>';}
 for(var j=0;j<3;j++){s+='<i class="ha-satellite" style="--dur:'+(22+j*5)+'s;--delay:-'+(j*7)+'s"></i>';}
 s+=dots()+core()+'<div class="ha-bars">';
 for(var k=0;k<23;k++){s+='<i style="--h:'+(7+((k*17+11)%42))+';--dur:'+(1.6+(k%7)*.17).toFixed(2)+'s;--delay:-'+(k*.19).toFixed(2)+'s"></i>';}
 return s+'</div>';
}
function liquid(){
 var configs=[[58,47,8,.38,17,0],[49,62,17,.36,23,-7],[68,43,25,.26,28,-16],[35,53,7,.46,21,-11]];
 var s='';
 for(var i=0;i<configs.length;i++){var x=configs[i];s+='<i class="ha-blob" style="--w:'+x[0]+'%;--h:'+x[1]+'%;--blur:'+x[2]+'px;--opacity:'+x[3]+';--dur:'+x[4]+'s;--delay:'+x[5]+'s"></i>';}
 return s+'<div class="ha-film"></div>'+dots()+core();
}
function focus(){
 var s='<div class="ha-iris"></div>';
 for(var i=0;i<5;i++){s+='<i class="ha-beam" style="--angle:'+(i*72)+'deg;--delay:-'+(i*1.6).toFixed(1)+'s"></i>';}
 s+='<svg class="ha-focus-svg" viewBox="0 0 600 600" aria-hidden="true">';
 var radii=[255,216,178,142,106];
 for(var j=0;j<radii.length;j++){
 var dash=(42+j*15)+' '+(19+j*8),dashArc=(23+j*9)+' '+(45+j*19),className='ha-focus-rotor'+(j%2?' rev':'');
 s+='<g class="'+className+'" style="--turn:'+(43+j*8)+'s;--dash:'+dash+';--delay:-'+(j*1.7).toFixed(1)+'s"><circle cx="300" cy="300" r="'+radii[j]+'" stroke-dashoffset="'+(j*47)+'"/><circle class="ha-arc" cx="300" cy="300" r="'+radii[j]+'" style="--dash:'+dashArc+'"/></g>';
 }
 return s+'</svg>'+dots()+core();
}
var render={breath:breath,spiral:spiral,pulse:pulse,liquid:liquid,focus:focus};
function init(){
 var target=document.querySelector('.hero .hero-visual, .hero .visual, .hero .scene');
 if(!target||document.getElementById('ha-motion-dock'))return;
 var host=document.createElement('div');
 host.className='ha-visual-host '+(target.classList.contains('hero-visual')?'ha-theme-green':'ha-theme-violet');
 host.setAttribute('aria-hidden','true');
 target.appendChild(host);
 document.body.classList.add('ha-enabled');
 var dock=document.createElement('div');dock.id='ha-motion-dock';
 var markup='<div class="ha-panel" id="ha-control-panel"><div class="ha-heading"><strong>ГИПНО-АНИМАЦИЯ</strong><small>5 отдельных режимов</small></div><div class="ha-list" role="group" aria-label="Выберите анимацию">';
 for(var i=0;i<modes.length;i++){
 var m=modes[i];markup+='<button class="ha-mode" type="button" data-ha-select="'+m.id+'" aria-pressed="false"><strong>0'+(i+1)+' · '+m.title+'</strong><small>'+m.subtitle+'</small></button>';
 }
 markup+='</div><div class="ha-tools"><button class="ha-tool" type="button" data-ha-pause aria-label="Пауза" title="Пауза">Ⅱ</button><button class="ha-tool" type="button" data-ha-close aria-label="Свернуть пульт" title="Свернуть">×</button></div></div>';
 markup+='<button class="ha-mini" type="button" aria-expanded="false" aria-controls="ha-control-panel"><i aria-hidden="true"></i><strong>Анимация: Дыхание</strong><span>5 режимов ▴</span></button>';
 dock.innerHTML=markup;
 document.body.appendChild(dock);
 var mini=dock.querySelector('.ha-mini'),miniName=mini.querySelector('strong'),screen=window.matchMedia('(max-width:900px)');
 var mode='breath',paused=false;
 try{
 var urlId=new URLSearchParams(window.location.search).get('animation');
 var saved=window.localStorage.getItem('hypno_motion_mode_v1');
 mode=valid.indexOf(urlId)>=0?urlId:valid.indexOf(saved)>=0?saved:'breath';
 }catch(e){}
 function choose(id){
 if(valid.indexOf(id)<0)return;
 mode=id;
 host.dataset.mode=id;
 // Replacing this subtree discards the other four animations, rather than running them invisibly.
 host.innerHTML='<div class="ha-stage ha-'+id+'">'+render[id]()+'</div>';
 var buttons=dock.querySelectorAll('[data-ha-select]');
 for(var i=0;i<buttons.length;i++){buttons[i].setAttribute('aria-pressed',String(buttons[i].getAttribute('data-ha-select')===id));}
 for(var j=0;j<modes.length;j++){if(modes[j].id===id){miniName.textContent='Анимация: '+modes[j].title;break;}}
 try{window.localStorage.setItem('hypno_motion_mode_v1',id);}catch(e){}
 if(screen.matches){dock.classList.remove('ha-open');mini.setAttribute('aria-expanded','false');}
 }
 function pause(yes){
 paused=yes;
 document.body.classList.toggle('ha-paused',paused);
 var b=dock.querySelector('[data-ha-pause]');
 b.textContent=paused?'▶':'Ⅱ';
 b.setAttribute('aria-label',paused?'Запустить анимацию':'Остановить анимацию');
 b.title=paused?'Запустить':'Пауза';
 }
 function close(){dock.classList.remove('ha-open');if(!screen.matches)dock.classList.add('ha-collapsed');mini.setAttribute('aria-expanded','false');}
 dock.addEventListener('click',function(e){
 var selected=e.target.closest('[data-ha-select]');
 if(selected){choose(selected.getAttribute('data-ha-select'));return;}
 if(e.target.closest('[data-ha-pause]')){pause(!paused);return;}
 if(e.target.closest('[data-ha-close]'))close();
 });
 mini.addEventListener('click',function(){
 if(screen.matches){var opened=!dock.classList.contains('ha-open');dock.classList.toggle('ha-open',opened);mini.setAttribute('aria-expanded',String(opened));}
 else{dock.classList.remove('ha-collapsed');mini.setAttribute('aria-expanded','true');}
 });
 document.addEventListener('keydown',function(e){if(e.key==='Escape'&&dock.classList.contains('ha-open'))close();});
 document.addEventListener('pointerdown',function(e){if(screen.matches&&dock.classList.contains('ha-open')&&!dock.contains(e.target))close();});
 if(screen.addEventListener)screen.addEventListener('change',function(){dock.classList.remove('ha-open','ha-collapsed');mini.setAttribute('aria-expanded','false');});
 if('IntersectionObserver' in window){
 var observer=new IntersectionObserver(function(entries){host.classList.toggle('ha-offscreen',!entries[0].isIntersecting);},{threshold:.01});
 observer.observe(target);
 }
 choose(mode);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();