'use strict';
(function(){
 const COUNTER=110906734,API='https://api.marafon-metod.ru/api/leads';
 const BONUS_START=Date.parse('2026-10-08T00:00:00+03:00'),BONUS_END=Date.parse('2026-10-12T00:00:00+03:00');
 const dialog=document.getElementById('booking-dialog'),form=document.getElementById('consultation-form'),phone=document.getElementById('consultation-phone'),submit=document.getElementById('consultation-submit'),status=document.getElementById('consultation-status');
 const entry=document.getElementById('booking-entry'),success=document.getElementById('booking-success'),confirmation=document.getElementById('bonus-confirmation');
 let sending=false,succeeded=false,openedAt=0,lastTrigger=null;
 phone.classList.add('ym-disable-keys');
 function goal(name,params){try{if(typeof window.ym==='function')window.ym(COUNTER,'reachGoal',name,params||{});}catch(_){}}
 function bonusActive(time){return time>=BONUS_START&&time<BONUS_END;}
 function updateOffer(){if(!bonusActive(Date.now())){document.querySelectorAll('.calls-bonus-teaser,.calls-bonus-package,[data-support-offer]').forEach(el=>el.hidden=true);document.querySelectorAll('details').forEach(el=>{if(el.querySelector('summary')?.textContent.includes('Что за поддержка между сессиями'))el.hidden=true;});}}
 function showError(message){status.textContent=message;status.hidden=false;}
 function open(event){lastTrigger=event.currentTarget;openedAt=Date.now();updateOffer();dialog.setAttribute('aria-labelledby',succeeded?'booking-success-title':'booking-title');dialog.setAttribute('aria-describedby',succeeded?'booking-success-description':'booking-description');dialog.showModal();document.body.classList.add('modal-open');if(succeeded)document.getElementById('booking-success-title').focus();else phone.focus();goal('consultation_form_open');}
 function close(){dialog.close();}
 document.querySelectorAll('[data-booking]').forEach(button=>button.addEventListener('click',open));
 dialog.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',close));
 dialog.addEventListener('close',()=>{document.body.classList.remove('modal-open');if(lastTrigger)lastTrigger.focus();});
 dialog.addEventListener('click',event=>{if(event.target===dialog){const box=dialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)close();}});
 function normalizePhone(value){let digits=String(value).replace(/\D/g,'');if(digits.length===10)digits='7'+digits;if(digits.length===11&&digits[0]==='8')digits='7'+digits.slice(1);return digits.length>=10&&digits.length<=15?'+'+digits:'';}
 function serverTime(leadId){const m=/^MBL-(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})-/.exec(String(leadId||''));return m?Date.UTC(+m[1],+m[2]-1,+m[3],+m[4],+m[5],+m[6]):NaN;}
 function attribution(){const query=new URLSearchParams(location.search),utm={};for(const key of ['source','medium','campaign','content','term']){const value=query.get('utm_'+key);if(value)utm[key]=value.slice(0,180);}return utm;}
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(sending||succeeded)return;status.hidden=true;
  const contact=normalizePhone(phone.value);if(!contact){showError('Укажите телефон с кодом страны.');phone.focus();return;}
  const website=form.elements.website.value;if(website){showError('Не удалось отправить заявку.');return;}
  sending=true;submit.disabled=true;phone.disabled=true;submit.textContent='Сохраняем заявку…';goal('consultation_form_submit');
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),30000);
  try{
   const params=new URLSearchParams(location.search);
   const payload={formType:'personal_contact',contactType:'phone',contact,phone:contact,plan:'Бесплатный индивидуальный разбор · 20 минут',price:'Бесплатно; продолжение: 4 × 50 минут — 11 900 ₽',source:'marafon_home_free_consultation',sourceUrl:location.origin+location.pathname,referrer:document.referrer.slice(0,500),utm:attribution(),openedAt:openedAt,website:'',message:'Запись на бесплатный личный разбор. Согласовать время и способ связи. Покупка пакета необязательна. Заявки с 8 по 11 октября включительно по Москве сохраняют при последующей покупке пакета четыре недели переписки в MAX или Telegram: один ответ в рабочий день, с первой платной сессии. Согласие на обработку контакта подтверждено нажатием кнопки; условия /consultation-privacy/.',yclid:(params.get('yclid')||'').slice(0,180)};
   const response=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:controller.signal});
   const result=await response.json().catch(()=>null);if(!response.ok||!result||result.ok!==true||result.received!==true)throw new Error(result?.error||'Не удалось подтвердить сохранение заявки. Попробуйте ещё раз.');
   succeeded=true;entry.hidden=true;success.hidden=false;confirmation.hidden=!bonusActive(serverTime(result.leadId));
   dialog.setAttribute('aria-labelledby','booking-success-title');dialog.setAttribute('aria-describedby','booking-success-description');document.getElementById('booking-success-title').focus();
   goal('consultation_lead_success',{bonus:!confirmation.hidden});goal('lead_success',{form:'free_consultation'});
  }catch(error){showError(error.name==='AbortError'?'Ответ занял больше времени. Телефон остался в форме. Если Илья уже связался с вами, повторная заявка не нужна.':error.message||'Не удалось отправить заявку. Попробуйте ещё раз.');goal('consultation_lead_error');}
  finally{clearTimeout(timer);sending=false;submit.disabled=false;phone.disabled=false;submit.textContent='Записаться на бесплатный разбор';}
 });
 updateOffer();document.addEventListener('visibilitychange',()=>{if(!document.hidden)updateOffer();});
})();
