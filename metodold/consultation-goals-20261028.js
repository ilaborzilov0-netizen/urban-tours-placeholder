'use strict';
/* Individual consultation landing: non-sensitive funnel events. */
(function(){
 const COUNTER=112375829,seen=new Set();
 function goal(id,details,once){
  if(once&&seen.has(id))return;
  try{if(typeof window.ym==='function'){
   window.ym(COUNTER,'reachGoal',id,details||{});
   if(once)seen.add(id);
  }}catch(_){}
 }
 function init(){
  if(location.pathname!=='/'&&location.pathname!=='/index.html')return;
  const targets=[
   ['plan','consultation_how_view'],
   ['price','consultation_price_view'],
   ['faq','consultation_faq_view']
  ];
  if('IntersectionObserver' in window){
   const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
     if(!entry.isIntersecting)return;
     const event=entry.target.getAttribute('data-consultation-view-goal');
     if(event){goal(event,{},true);observer.unobserve(entry.target);}
    });
   },{threshold:0.15});
   targets.forEach(([id,event])=>{
    const element=document.getElementById(id);
    if(element){element.setAttribute('data-consultation-view-goal',event);observer.observe(element);}
   });
  }
  document.querySelectorAll('[data-booking]').forEach(button=>{
   button.addEventListener('click',()=>{
    const place=button.closest('.hero')?'hero':button.closest('.mobile-bar')?'mobile':button.closest('header')?'header':button.closest('.final-section')?'final':button.closest('#price')?'price':'other';
    goal('consultation_cta_click',{place},false);
   });
  });
  const form=document.getElementById('consultation-form');
  if(!form)return;
  form.addEventListener('input',()=>goal('consultation_form_start',{},true));
  form.querySelectorAll('input[name="contactType"]').forEach(input=>{
   input.addEventListener('change',()=>{if(input.checked){
    goal('consultation_form_start',{},true);
    goal('consultation_contact_method',{channel:input.value},false);
   }});
  });
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
})();
