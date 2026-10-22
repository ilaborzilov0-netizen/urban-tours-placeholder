/* /ai/оптимайз/: five LIVE minimalist calculator prototypes.
 * Standalone test-only module. Production /ai/ remains untouched. */
(() => {
  'use strict';
  const root=document.getElementById('calc-showcase');
  if(!root)return;
  const stage=root.querySelector('[data-calc-stage]');
  const tabs=[...root.querySelectorAll('[data-calc-variant]')];
  if(!stage||tabs.length!==5)return;
  const settings={
    cigarettes:{label:'Сигарет в день',min:1,max:100,step:1},
    pack:{label:'Цена пачки, ₽',min:1,max:10000,step:10}
  };
  const values={cigarettes:20,pack:200};
  const numberFormat=new Intl.NumberFormat('ru-RU',{maximumFractionDigits:0});
  let selected='1';
  const annual=()=>Math.round(values.cigarettes*values.pack/20*365);
  const clamp=(key,n)=>Math.max(settings[key].min,Math.min(settings[key].max,Math.round(n)));
  const money=()=>numberFormat.format(annual()).replace(/[\u00a0\u202f]/g,' ')+' ₽ за год';
  const stepper=(key)=>{
    const item=settings[key],v=values[key];
    return '<div class="cc-stepper" role="group" aria-label="'+item.label+'">'
      +'<button type="button" data-calc-adjust="'+key+'" data-dir="-1" aria-label="Уменьшить: '+item.label+'">−</button>'
      +'<input type="number" inputmode="numeric" data-calc-input="'+key+'" min="'+item.min+'" max="'+item.max+'" step="1" value="'+v+'" aria-label="'+item.label+'">'
      +'<button type="button" data-calc-adjust="'+key+'" data-dir="1" aria-label="Увеличить: '+item.label+'">+</button>'
      +'</div>';
  };
  const field=(key)=>'<div class="cc-field"><label>'+settings[key].label+'</label>'+stepper(key)+'</div>';
  const result=(cls='')=>'<div class="cc-result '+cls+'"><strong data-calc-result aria-live="polite">'+money()+'</strong><span>Экономия без сигарет</span></div>';
  const layouts={
    1:()=>'<article class="cc-card cc-v1"><h3>Ваши расходы на сигареты</h3><div class="cc-controls cc-stacked">'
      +field('cigarettes')+field('pack')+'</div>'+result()+'</article>',
    2:()=>'<article class="cc-card cc-v2"><h3>Сколько стоят сигареты?</h3><div class="cc-controls cc-two">'
      +field('cigarettes')+field('pack')+'</div>'+result()+'</article>',
    3:()=>'<article class="cc-card cc-v3"><h3>Ваши расходы на сигареты</h3><div class="cc-controls cc-rows">'
      +'<div class="cc-pill"><span>Сигарет в день</span>'+stepper('cigarettes')+'</div>'
      +'<div class="cc-pill"><span>Цена пачки, ₽</span>'+stepper('pack')+'</div></div>'
      +result()+'</article>',
    4:()=>'<article class="cc-card cc-v4"><h3>Ваша экономия без сигарет</h3>'+result()
      +'<div class="cc-controls cc-rows"><div class="cc-pill"><span>Сигарет в день</span>'+stepper('cigarettes')+'</div>'
      +'<div class="cc-pill"><span>Цена пачки, ₽</span>'+stepper('pack')+'</div></div></article>',
    5:()=>'<article class="cc-card cc-v5"><h3>Сколько вы тратите?</h3><div class="cc-controls cc-two">'
      +field('cigarettes')+field('pack')+'</div>'+result()+'</article>'
  };
  function updateValues(rewriteInputs=true){
    const label=money();
    const result=stage.querySelector('[data-calc-result]');
    if(result)result.textContent=label;
    const all=stage.querySelectorAll('[data-calc-input]');
    for(const input of all){
      const key=input.dataset.calcInput;
      if(rewriteInputs||document.activeElement!==input)input.value=String(values[key]);
      input.setAttribute('aria-invalid','false');
    }
    stage.querySelectorAll('[data-calc-adjust]').forEach(button=>{
      const key=button.dataset.calcAdjust,dir=Number(button.dataset.dir);
      button.disabled=dir<0?values[key]<=settings[key].min:values[key]>=settings[key].max;
    });
    // Existing pricing payoff labels stay synchronized with the selected inputs.
    const plan={one:1990,all:2990,duo:4490};
    document.querySelectorAll('[data-smoking-equivalent]').forEach(row=>{
      const amount=plan[row.dataset.smokingEquivalent];
      if(!amount)return;
      const days=Math.ceil(amount/(values.cigarettes*values.pack/20));
      const unit=days%100>=11&&days%100<=14?'дней':days%10===1?'день':days%10>=2&&days%10<=4?'дня':'дней';
      const out=row.querySelector('[data-smoking-days]');
      const suffix=row.querySelector('[data-smoking-unit]');
      if(out)out.textContent=numberFormat.format(days);
      if(suffix)suffix.textContent=unit;
    });
  }
  function render(){
    stage.innerHTML=layouts[selected]();
    root.dataset.activeVariant=selected;
    stage.setAttribute('aria-labelledby','calc-option-'+selected);
    tabs.forEach(tab=>{
      const isActive=tab.dataset.calcVariant===selected;
      tab.setAttribute('aria-selected',String(isActive));
      tab.tabIndex=isActive?0:-1;
    });
    updateValues();
  }
  function setVariant(id,focusTab=false){
    if(!layouts[id])return;
    selected=id;render();
    if(focusTab)tabs.find(t=>t.dataset.calcVariant===id)?.focus({preventScroll:true});
  }
  root.addEventListener('click',event=>{
    const tab=event.target.closest('[data-calc-variant]');
    if(tab){setVariant(tab.dataset.calcVariant);return;}
    const button=event.target.closest('[data-calc-adjust]');
    if(!button)return;
    const key=button.dataset.calcAdjust;
    if(!settings[key])return;
    values[key]=clamp(key,values[key]+settings[key].step*Number(button.dataset.dir));
    updateValues();
  });
  root.addEventListener('input',event=>{
    const input=event.target.closest('[data-calc-input]');
    if(!input)return;
    const key=input.dataset.calcInput;
    if(!settings[key]||input.value.trim()==='')return;
    const n=Number(input.value);
    if(!Number.isFinite(n))return;
    values[key]=clamp(key,n);
    updateValues(false);
  });
  root.addEventListener('change',event=>{
    const input=event.target.closest('[data-calc-input]');
    if(!input)return;
    const key=input.dataset.calcInput;
    if(!settings[key])return;
    const n=Number(input.value);
    values[key]=clamp(key,input.value.trim()===''||!Number.isFinite(n)?settings[key].min:n);
    updateValues();
  });
  root.querySelector('[role="tablist"]')?.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    const index=tabs.findIndex(t=>t.dataset.calcVariant===selected);
    let next=index;
    if(event.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;
    if(event.key==='ArrowRight')next=(index+1)%tabs.length;
    if(event.key==='Home')next=0;
    if(event.key==='End')next=tabs.length-1;
    event.preventDefault();
    setVariant(tabs[next].dataset.calcVariant,true);
  });
  render();
})();