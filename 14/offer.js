(()=>{'use strict';
const counter=110906734;
const goal=(name,details)=>{try{window.ym?.(counter,'reachGoal',name,details||{})}catch(e){}};
const styles={
  author:{title:'Авторская песня',subtitle:'Гитара и взрослый мужской голос'},
  estrada:{title:'Душевная эстрада',subtitle:'Оркестровая мелодия и сильный припев'},
  modern:{title:'Современное звучание',subtitle:'Тёплый поп и живой ритм'}
};
let selectedStyle='author',selectedPlan='one',isSending=false,isSent=false;
const styleButtons=[...document.querySelectorAll('[data-style]')];
const planButtons=[...document.querySelectorAll('[data-select-plan]')];
const priceChoice=document.querySelector('#selected-price-choice');
const priceName=document.querySelector('#selected-price-name');
const form=document.querySelector('#release-form');
const status=document.querySelector('#release-status');
const sampleLabel=document.querySelector('#sample-selection');
const sample=document.querySelector('#sample-audio');
function updateState(){
 styleButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.style===selectedStyle)));
 document.querySelectorAll('[data-price-card]').forEach(c=>c.classList.toggle('is-selected',c.dataset.priceCard===selectedPlan));
 planButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.selectPlan===selectedPlan)));
 const planTitle=selectedPlan==='all'?'Все шесть альбомов · 1 990 ₽':'Оба этапа · '+styles[selectedStyle].title+' · 990 ₽';
 priceChoice.textContent=planTitle;
 priceName.value=selectedPlan==='all'?'all-six':selectedStyle;
 sampleLabel.textContent=selectedStyle==='author'?'Демо текущих аудиоякорей':'Демо исходного альбома (не выбранной аранжировки)';
}
styleButtons.forEach(button=>button.addEventListener('click',()=>{
 selectedStyle=button.dataset.style;
 updateState();goal('ai14_style_select',{style:selectedStyle});
}));
planButtons.forEach(button=>button.addEventListener('click',()=>{
 selectedPlan=button.dataset.selectPlan;
 updateState();goal('ai14_plan_select',{plan:selectedPlan});
 document.getElementById('request').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'});
 document.getElementById('email').focus({preventScroll:true});
}));
document.querySelectorAll('[data-scroll-request]').forEach(button=>button.addEventListener('click',()=>{
 goal('ai14_request_click',{location:button.dataset.scrollRequest});
 document.getElementById('pricing').scrollIntoView({behavior:'smooth',block:'start'});
}));
let played=false,played75=false;
sample.addEventListener('play',()=>{goal('ai14_demo_play');played=true;});
sample.addEventListener('timeupdate',()=>{
 if(!played75 && sample.duration>0 && Number.isFinite(sample.duration) && sample.currentTime/sample.duration>=.75){
  played75=true;goal('ai14_demo_75');
 }
});
document.querySelectorAll('[data-direct-contact]').forEach(a=>a.addEventListener('click',()=>goal('ai14_author_contact',{channel:a.dataset.directContact})));
form.addEventListener('submit',async e=>{
 e.preventDefault();if(isSending||isSent)return;
 status.hidden=true;status.classList.remove('error');
 const email=String(form.elements.email.value).trim();
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
  status.textContent='Укажите корректный email.';status.classList.add('error');status.hidden=false;form.elements.email.focus();return;
 }
 if(form.elements.website.value)return;
 isSending=true;const button=form.querySelector('[type="submit"]');button.disabled=true;button.textContent='Отправляем…';
 goal('ai14_release_request_start',{plan:selectedPlan,style:selectedStyle});
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),18000);
 try{
  const utm={},params=new URLSearchParams(location.search);
  for(const k of ['source','medium','campaign','content','term']){const v=params.get('utm_'+k);if(v)utm[k]=v.slice(0,120)}
  const payload={
   formType:'commercial_contact',name:'',contactType:'email',contact:email,
   message:'Интерес к выпуску двухэтапной музыкальной программы. Тариф: '+(selectedPlan==='all'?'все 6 альбомов':'один стиль')+'. Звучание: '+styles[selectedStyle].title+'. Без оплаты.',
   plan:selectedPlan==='all'?'six-albums-all-styles':'two-albums-'+selectedStyle,
   price:selectedPlan==='all'?'1990 ₽ (планируемая)':'990 ₽ (планируемая)',
   source:'marafon_14_two_stage_waitlist',sourceUrl:location.origin+location.pathname,
   referrer:document.referrer.slice(0,250),utm,website:''
  };
  const response=await fetch('https://api.marafon-metod.ru/api/leads',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:controller.signal});
  const data=await response.json().catch(()=>null);
  if(!response.ok||data?.ok!==true||data?.received!==true)throw new Error(data?.error||'Не удалось отправить заявку. Повторите позже.');
  isSent=true;status.textContent='Записали ваш интерес. Оплаты сейчас нет. Напишем на email, когда комплекты будут доступны.';status.hidden=false;
  button.textContent='Заявка отправлена ✓';goal('ai14_release_request_success',{plan:selectedPlan,style:selectedStyle});
 }catch(err){
  status.textContent=err.name==='AbortError'?'Сервер долго отвечает. Попробуйте ещё раз.':err.message;
  status.classList.add('error');status.hidden=false;
  button.disabled=false;button.textContent='Узнать о выпуске →';
  goal('ai14_release_request_error',{plan:selectedPlan,style:selectedStyle});
 }finally{clearTimeout(timeout);isSending=false}
});
updateState();
})();