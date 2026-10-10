'use strict';
(function(){
 const COUNTER=110906734,API='https://api.marafon-metod.ru/api/leads';
 const dialog=document.getElementById('booking-dialog'),form=document.getElementById('consultation-form'),phone=document.getElementById('consultation-phone'),submit=document.getElementById('consultation-submit'),status=document.getElementById('consultation-status');
 const entry=document.getElementById('booking-entry'),success=document.getElementById('booking-success');
 const customerName=document.getElementById('consultation-name'),telegram=document.getElementById('consultation-telegram'),telegramField=document.getElementById('consultation-telegram-field'),channelHelp=document.getElementById('consultation-channel-help'),successDescription=document.getElementById('booking-success-description');
 const channelLabels={max:'MAX',telegram:'Telegram',phone:'звонок'};
 const controls=Array.from(form.querySelectorAll('input'));
 function selectedChannel(){return form.querySelector('input[name=contactType]:checked')?.value||'';}
 function updateChannel(){const channel=selectedChannel();telegramField.hidden=channel!=='telegram';telegram.disabled=channel!=='telegram';channelHelp.textContent=channel==='max'?'Напишем в MAX по указанному номеру.':channel==='telegram'?'Напишем в Telegram по номеру или @username.':channel==='phone'?'Позвоним на указанный номер, чтобы согласовать время.':'Выберите удобный способ связи.';}
 form.querySelectorAll('input[name=contactType]').forEach(input=>input.addEventListener('change',()=>{updateChannel();status.hidden=true;}));
 form.addEventListener('input',()=>{status.hidden=true;});
 updateChannel();
 let sending=false,succeeded=false,openedAt=0,lastTrigger=null;
 phone.classList.add('ym-disable-keys');
 function goal(name,params){try{if(typeof window.ym==='function')window.ym(COUNTER,'reachGoal',name,params||{});}catch(_){}}
 function showError(message){status.textContent=message;status.hidden=false;}
 function open(event){lastTrigger=event.currentTarget;openedAt=Date.now();dialog.setAttribute('aria-labelledby',succeeded?'booking-success-title':'booking-title');dialog.setAttribute('aria-describedby',succeeded?'booking-success-description':'booking-description');dialog.showModal();document.body.classList.add('modal-open');if(succeeded)document.getElementById('booking-success-title').focus();else customerName.focus();goal('premium_50000_form_open');}
 function close(){dialog.close();}
 document.querySelectorAll('[data-booking]').forEach(button=>button.addEventListener('click',open));
 dialog.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',close));
 dialog.addEventListener('close',()=>{document.body.classList.remove('modal-open');if(lastTrigger)lastTrigger.focus();});
 dialog.addEventListener('click',event=>{if(event.target===dialog){const box=dialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)close();}});
 function normalizePhone(value){let digits=String(value).replace(/\D/g,'');if(digits.length===10)digits='7'+digits;if(digits.length===11&&digits[0]==='8')digits='7'+digits.slice(1);return digits.length>=10&&digits.length<=15?'+'+digits:'';}
 function attribution(){const query=new URLSearchParams(location.search),utm={};for(const key of ['source','medium','campaign','content','term']){const value=query.get('utm_'+key);if(value)utm[key]=value.slice(0,180);}return utm;}
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(sending||succeeded)return;status.hidden=true;
  const name=customerName.value.trim();if(name.length<2){showError('Укажите ваше имя.');customerName.focus();return;}
  const channel=selectedChannel();if(!channelLabels[channel]){showError('Выберите удобный способ связи.');form.querySelector('input[name=contactType]').focus();return;}
  const username=channel==='telegram'?telegram.value.trim().replace(/^@/,''):'';if(username&&!/^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(username)){showError('Укажите Telegram в формате @username — от 5 до 32 символов.');telegram.focus();return;}
  const contact=normalizePhone(phone.value);if(!contact){showError('Укажите телефон с кодом страны.');phone.focus();return;}
  const website=form.elements.website.value;if(website){showError('Не удалось отправить заявку.');return;}
  sending=true;submit.disabled=true;controls.forEach(input=>input.disabled=true);submit.textContent='Сохраняем заявку…';goal('premium_50000_form_submit');
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),30000);
  try{
   const params=new URLSearchParams(location.search);
   const payload={formType:'personal_contact',name,contactType:channel,contact:username?'@'+username:contact,phone:contact,plan:'Онлайн-сопровождение · 4 онлайн-сессии + месяц поддержки',price:'50 000 ₽',source:'marafon_arhiv1_personal_50000',sourceUrl:location.origin+location.pathname,referrer:document.referrer.slice(0,500),utm:attribution(),openedAt:openedAt,website:'',message:'Телефон: '+contact+'. Удобный способ связи: '+channelLabels[channel]+'. '+(username?'Telegram: @'+username+'. ':'')+'Заявка на личное сопровождение за 50 000 ₽ со страницы /arhiv1/. 4 индивидуальные онлайн-сессии по 50 минут и месяц сопровождения (4 недели) в MAX или Telegram: один личный ответ в рабочий день, с первой платной онлайн-сессии. Первый онлайн-созвон — 20 минут бесплатно. Согласовать время через выбранный канал. Заявка не является оплатой. Согласие на обработку контакта подтверждено нажатием кнопки; условия /arhiv1/privacy/.',yclid:(params.get('yclid')||'').slice(0,180)};
   const response=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:controller.signal});
   const result=await response.json().catch(()=>null);if(!response.ok||!result||result.ok!==true||result.received!==true)throw new Error(result?.error||'Не удалось подтвердить сохранение заявки. Попробуйте ещё раз.');
   successDescription.textContent=channel==='phone'?'Илья позвонит вам, чтобы согласовать время первого бесплатного онлайн-созвона.':'Илья напишет вам в '+channelLabels[channel]+', чтобы согласовать время первого бесплатного онлайн-созвона.';
   succeeded=true;entry.hidden=true;success.hidden=false;
   dialog.setAttribute('aria-labelledby','booking-success-title');dialog.setAttribute('aria-describedby','booking-success-description');document.getElementById('booking-success-title').focus();
   goal('premium_50000_lead_success');goal('lead_success',{form:'premium_50000_arhiv1',price:50000});
  }catch(error){showError(error.name==='AbortError'?'Ответ занял больше времени. Ваши данные остались в форме. Если Илья уже связался с вами, повторная заявка не нужна.':error.message||'Не удалось отправить заявку. Попробуйте ещё раз.');goal('premium_50000_lead_error');}
  finally{clearTimeout(timer);sending=false;submit.disabled=false;controls.forEach(input=>input.disabled=false);updateChannel();submit.textContent='Записаться на первый созвон';}
 });
})();


