/* Approved calculator variant 04, test page only (/ai/оптимайз/). */
(()=>{
 'use strict';
 const root=document.getElementById('calc-showcase');
 if(!root)return;
 const fmt=new Intl.NumberFormat('ru-RU',{maximumFractionDigits:0});
 const bounds={cigarettes:{min:1,max:100,step:1},pack:{min:1,max:10000,step:10}};
 const fields=Object.fromEntries(Object.keys(bounds).map(k=>[k,root.querySelector('[data-calc-input="'+k+'"]')]));
 const result=root.querySelector('[data-calc-result]');
 if(!result||Object.values(fields).some(x=>!x))return;
 const values={cigarettes:20,pack:200};
 const format=n=>fmt.format(n).replace(/[\u00a0\u202f]/g,' ');
 const clamp=(k,n)=>Math.max(bounds[k].min,Math.min(bounds[k].max,Math.round(n)));
 const annual=()=>Math.round(values.cigarettes*values.pack*365/20);
 const unit=days=>{
  const n=days%100,k=days%10;
  return n>=11&&n<=14?'дней':k===1?'день':k>=2&&k<=4?'дня':'дней';
 };
 function render(preserveEditing=false){
  result.textContent=format(annual())+' ₽ за год';
  Object.entries(fields).forEach(([k,input])=>{
   if(!preserveEditing||document.activeElement!==input)input.value=String(values[k]);
   input.setAttribute('aria-invalid','false');
  });
  root.querySelectorAll('[data-calc-adjust]').forEach(b=>{
   const k=b.dataset.calcAdjust,dir=Number(b.dataset.dir);
   b.disabled=dir<0?values[k]<=bounds[k].min:values[k]>=bounds[k].max;
  });
  // Tariff payback is calculated from the same inputs.
  const costs={one:1990,all:2990,duo:4490};
  document.querySelectorAll('[data-smoking-equivalent]').forEach(row=>{
   const price=costs[row.dataset.smokingEquivalent];
   if(!price)return;
   const days=Math.ceil(price/(values.cigarettes*values.pack/20));
   const number=row.querySelector('[data-smoking-days]');
   const word=row.querySelector('[data-smoking-unit]');
   if(number)number.textContent=format(days);
   if(word)word.textContent=unit(days);
  });
 }
 root.addEventListener('click',event=>{
  const button=event.target.closest('[data-calc-adjust]');
  if(!button)return;
  const key=button.dataset.calcAdjust;
  if(!bounds[key])return;
  values[key]=clamp(key,values[key]+Number(button.dataset.dir)*bounds[key].step);
  render();
 });
 root.addEventListener('input',event=>{
  const input=event.target.closest('[data-calc-input]');
  if(!input)return;
  const key=input.dataset.calcInput,n=Number(input.value);
  if(!bounds[key]||!input.value.trim()||!Number.isFinite(n))return;
  values[key]=clamp(key,n);
  render(true);
 });
 root.addEventListener('change',event=>{
  const input=event.target.closest('[data-calc-input]');
  if(!input)return;
  const key=input.dataset.calcInput,n=Number(input.value);
  if(!bounds[key])return;
  values[key]=clamp(key,input.value.trim()===''||!Number.isFinite(n)?bounds[key].min:n);
  render();
 });
 render();
})();