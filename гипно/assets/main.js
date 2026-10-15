
(()=>{'use strict';
 const dialog=document.getElementById('order-dialog');
 document.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();if(dialog&&typeof dialog.showModal==='function')dialog.showModal()}));
 document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>dialog?.close()));
 dialog?.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
 document.querySelectorAll('[data-toggle-motion]').forEach(b=>b.addEventListener('click',()=>{document.body.classList.toggle('paused');const stopped=document.body.classList.contains('paused');b.textContent=stopped?'▶ Включить движение':'Ⅱ Остановить движение';b.setAttribute('aria-pressed',String(stopped));}));
 const path=document.getElementById('spiral-path');
 if(path){let d='';const cx=350,cy=350;const turns=6.3*Math.PI;for(let i=0;i<=1000;i++){const t=i/1000;const ang=turns*t;const r=5+310*t;const x=cx+r*Math.cos(ang),y=cy+r*Math.sin(ang);d+=(i===0?'M':' L')+x.toFixed(2)+' '+y.toFixed(2)}path.setAttribute('d',d);}
})();
