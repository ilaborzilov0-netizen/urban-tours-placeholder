/* Single selected hypnosis animation: 07 / Antiphase. No animation picker. */
(function(){
"use strict";
function init(){
 const hero=document.querySelector(".hero"),visual=hero&&hero.querySelector(".hero-visual, .visual, .scene");
 if(!hero||!visual||hero.querySelector(".ha-visual-host"))return;
 const green=visual.classList.contains("hero-visual");
 hero.classList.add("ha-seamless-hero");
 document.body.classList.add("ha-enabled");
 const host=document.createElement("div");
 host.className="ha-visual-host "+(green?"ha-theme-green":"ha-theme-violet");
 host.setAttribute("aria-hidden","true");
 let mark='<div class="ha-atmosphere"></div><div class="ha-stage"><div class="ha-mist"></div>';
 for(let i=0;i<9;i++){
  let inset=(4.8+i*4.75).toFixed(2),alpha=(.14+i*.074).toFixed(3);
  mark+='<i class="ha-wave" style="--inset:'+inset+'%;--alpha:'+alpha+'"></i>';
 }
 mark+='<div class="ha-glow"></div><div class="ha-void"></div>';
 for(let i=0;i<16;i++)mark+='<i class="ha-star" style="--x:'+((i*37+12)%96)+'%;--y:'+((i*47+15)%98)+'%;--a:'+(.14+(i%5)*.1).toFixed(2)+'"></i>';
 host.innerHTML=mark+'</div>';
 hero.insertBefore(host,hero.firstChild);
 function layout(){
  const a=hero.getBoundingClientRect(),b=visual.getBoundingClientRect();
  if(!a.width||!b.width)return;
  const mobile=window.matchMedia("(max-width:780px)").matches;
  let x=b.left-a.left+b.width*.5,y=b.top-a.top+b.height*(mobile?.43:.47);
  let diameter=mobile?Math.max(490,Math.min(660,window.innerWidth*1.42)):Math.min(910,Math.max(650,b.width*1.65));
  host.style.setProperty("--ha-x",x.toFixed(1)+"px");
  host.style.setProperty("--ha-y",y.toFixed(1)+"px");
  host.style.setProperty("--ha-size",diameter.toFixed(1)+"px");
 }
 layout();
 if("ResizeObserver" in window){const r=new ResizeObserver(layout);r.observe(hero);r.observe(visual);}
 else window.addEventListener("resize",layout,{passive:true});
 window.addEventListener("orientationchange",layout,{passive:true});
 if("IntersectionObserver" in window)new IntersectionObserver(e=>host.classList.toggle("ha-offscreen",!e[0].isIntersecting),{threshold:0}).observe(hero);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();