(() => {
'use strict';
const modal=document.getElementById('order-dialog');
const goal=(name)=>{try{if(typeof window.ym==='function')window.ym(110906734,'reachGoal',name,{variant:'hypno_06_max'});}catch(_){/* telemetry must not break CTA */}};
document.querySelectorAll('[data-order]').forEach(button=>button.addEventListener('click',()=>{goal('hypno_max_cta');if(modal&&typeof modal.showModal==='function')modal.showModal();}));
document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>modal?.close()));
modal?.addEventListener('click',event=>{if(event.target===modal)modal.close();});
document.getElementById('mail-cta')?.addEventListener('click',()=>goal('hypno_max_contact'));
const motion=document.querySelector('[data-motion]');motion?.addEventListener('click',()=>{const paused=document.body.classList.toggle('still');motion.textContent=paused?'▶ Включить движение':'Ⅱ Остановить движение';motion.setAttribute('aria-pressed',String(paused));});
})();