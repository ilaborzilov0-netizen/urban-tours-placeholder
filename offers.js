
'use strict';
(function(){
  const form=document.querySelector('[data-offer-form]');if(!form)return;
  const root=document.body,source=root.dataset.source,plan=root.dataset.plan,price=root.dataset.price;
  const counter=110906734,api='https://api.marafon-metod.ru/api/leads';
  const selected=()=>form.querySelector('input[name="contactType"]:checked')?.value||'';
  const contact=form.querySelector('input[name="contact"]'),note=form.querySelector('[data-contact-note]'),status=form.querySelector('[data-form-error]'),submit=form.querySelector('[type="submit"]');
  let sending=false;
  function update(){
    const ch=selected(),isTG=ch==='telegram';
    contact.type=isTG?'text':'tel';contact.inputMode=isTG?'text':'tel';
    contact.placeholder=isTG?'@username или +7 999 123-45-67':'+7 999 123-45-67';
    contact.autocomplete=isTG?'off':'tel';
    note.textContent=ch==='max'?'Укажите телефон, на который зарегистрирован MAX.':isTG?'Укажите Telegram @username или номер телефона.':'Укажите телефон, по которому можно позвонить.';
  }
  form.querySelectorAll('input[name="contactType"]').forEach(el=>el.addEventListener('change',update));update();
  function goal(id,params){try{window.ym?.(counter,'reachGoal',id,params||{});}catch(_){}}
  const utm=()=>{const u=new URLSearchParams(location.search),res={};['source','medium','campaign','content','term'].forEach(k=>{if(u.has('utm_'+k))res[k]=u.get('utm_'+k).slice(0,120)});return res;};
  function normalize(v,channel){
    let digits=v.replace(/\D/g,'');if(digits.length===10)digits='7'+digits;if(digits.length===11&&digits[0]==='8')digits='7'+digits.slice(1);
    if(/^\+?[\d\s().-]+$/.test(v)&&digits.length>=10&&digits.length<=15)return '+'+digits;
    if(channel==='telegram'&&/^@?[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(v))return '@'+v.replace(/^@/,'');
    return '';
  }
  form.addEventListener('submit',async e=>{
    e.preventDefault();if(sending)return;status.hidden=true;
    const name=form.elements.name.value.trim(),channel=selected(),raw=form.elements.contact.value.trim(),clean=normalize(raw,channel);
    if(name.length<2){status.textContent='Укажите имя (не менее 2 символов).';status.hidden=false;return;}
    if(!clean){status.textContent='Укажите корректный телефон или Telegram @username.';status.hidden=false;return;}
    if(form.elements.website.value)return;
    if(!form.elements.agree.checked){status.textContent='Подтвердите согласие на обработку контакта.';status.hidden=false;return;}
    const question=form.elements.question.value.trim().slice(0,450);
    const u=new URLSearchParams(location.search);
    const payload={formType:'personal_contact',name,contactType:channel,contact:clean,
      plan,price,source,sourceUrl:location.origin+location.pathname,referrer:document.referrer.slice(0,400),
      utm:utm(),yclid:(u.get('yclid')||'').slice(0,100),website:'',
      message:'Оффер: '+plan+'. Цена: '+price+'. Заявка с лендинга '+source+'. '+(question?'Комментарий: '+question:'')};
    sending=true;submit.disabled=true;submit.textContent='Отправляем заявку…';goal('offer_form_submit',{offer:source});
    const abort=new AbortController(),timeout=setTimeout(()=>abort.abort(),25000);
    try{
      const response=await fetch(api,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:abort.signal});
      const result=await response.json().catch(()=>null);
      if(!response.ok||!result||result.ok!==true||result.received!==true)throw new Error(result?.error||'Сервер не подтвердил приём заявки.');
      form.hidden=true;const box=document.querySelector('[data-offer-success]');box.hidden=false;box.focus();
      goal('offer_'+source+'_lead',{offer:source});goal('lead_success',{form:source});
    }catch(err){status.textContent=err.name==='AbortError'?'Ответ сервера занял слишком много времени. Проверьте связь перед повторной отправкой.':(err.message||'Ошибка отправки. Попробуйте ещё раз.');status.hidden=false;goal('offer_lead_error',{offer:source});}
    finally{clearTimeout(timeout);sending=false;submit.disabled=false;submit.textContent=root.dataset.buttonLabel||'Отправить заявку';}
  });
})();
