(()=>{
'use strict';
const root=document.getElementById('hp-compare');if(!root)return;
const launch=root.querySelector('.hp-launch');
const collapse=root.querySelector('.hp-collapse');
const panel=root.querySelector('.hp-panel');
const mq=window.matchMedia('(max-width:880px)');
const close=()=>{root.classList.remove('hp-open');if(!mq.matches)root.classList.add('hp-collapsed');launch?.setAttribute('aria-expanded','false');};
launch?.addEventListener('click',()=>{if(mq.matches){const open=!root.classList.contains('hp-open');root.classList.toggle('hp-open',open);launch.setAttribute('aria-expanded',String(open));}else{root.classList.toggle('hp-collapsed',false);launch.setAttribute('aria-expanded','true');}});
collapse?.addEventListener('click',close);
document.addEventListener('keydown',e=>{if(e.key==='Escape' && (root.classList.contains('hp-open')||root.classList.contains('hp-collapsed')===false)){if(mq.matches && !root.classList.contains('hp-open'))return;close();}});
document.addEventListener('pointerdown',e=>{if(mq.matches && root.classList.contains('hp-open') && !root.contains(e.target))close();});
mq.addEventListener?.('change',()=>{root.classList.remove('hp-open','hp-collapsed');launch?.setAttribute('aria-expanded','false');});
})();