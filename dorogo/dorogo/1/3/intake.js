'use strict';
(function(){
 const COUNTER=110906734,API='https://api.marafon-metod.ru/api/leads';
 const dialog=document.getElementById('booking-dialog'),form=document.getElementById('consultation-form'),contactInput=document.getElementById('consultation-contact'),submit=document.getElementById('consultation-submit'),status=document.getElementById('consultation-status');
 const entry=document.getElementById('booking-entry'),success=document.getElementById('booking-success');
 const customerName=document.getElementById('consultation-name'),contactField=document.getElementById('consultation-contact-field'),contactLabel=document.getElementById('consultation-contact-label'),channelHelp=document.getElementById('consultation-channel-help'),successDescription=document.getElementById('booking-success-description');
 const invitation=document.getElementById('booking-success-invitation'),directContact=document.getElementById('booking-success-contact'),phoneLink=document.getElementById('booking-success-phone-link');
 const personalLinks={max:'https://max.ru/id312334031550_biz',telegram:'https://t.me/+79102247621'};
 let previousChannel='',savedContacts={};
 const channelLabels={max:'MAX',telegram:'Telegram',phone:'звонок'};
 const controls=Array.from(form.querySelectorAll('input'));
 function selectedChannel(){return form.querySelector('input[name=contactType]:checked')?.value||'';}
 function updateChannel(){
  const channel=selectedChannel();
  if(channel!==previousChannel){
   if(previousChannel){savedContacts[previousChannel]=contactInput.value;if(previousChannel==='max'||previousChannel==='phone'){savedContacts.max=contactInput.value;savedContacts.phone=contactInput.value;}}
   contactInput.value=savedContacts[channel]||'';previousChannel=channel;
  }
  contactField.hidden=!channel;contactInput.disabled=!channel;
  const isTelegram=channel==='telegram';
  contactLabel.textContent=isTelegram?'Ваш Telegram':channel==='max'?'Ваш телефон для связи в MAX':'Ваш телефон';
  contactInput.type=isTelegram?'text':'tel';contactInput.inputMode=isTelegram?'text':'tel';contactInput.autocomplete=isTelegram?'off':'tel';contactInput.maxLength=isTelegram?40:30;
  contactInput.placeholder=isTelegram?'@username или телефон':'+7 999 123-45-67';
  channelHelp.textContent=channel==='max'?'Укажите номер, к которому привязан MAX.':isTelegram?'Достаточно одного контакта: @username или номера телефона.':channel==='phone'?'Укажите номер, на который можно позвонить.':'Выберите удобный способ связи.';
 }
 form.querySelectorAll('input[name=contactType]').forEach(input=>input.addEventListener('change',()=>{updateChannel();status.hidden=true;}));
 form.addEventListener('input',()=>{status.hidden=true;});
 updateChannel();
 let sending=false,succeeded=false,openedAt=0,lastTrigger=null;
 function goal(name,params){try{if(typeof window.ym==='function')window.ym(COUNTER,'reachGoal',name,params||{});}catch(_){}}
 function showError(message){status.textContent=message;status.hidden=false;}
 function open(event){lastTrigger=event.currentTarget;openedAt=Date.now();dialog.setAttribute('aria-labelledby',succeeded?'booking-success-title':'booking-title');dialog.setAttribute('aria-describedby',succeeded?'booking-success-description':'booking-description');dialog.showModal();document.body.classList.add('modal-open');if(succeeded)document.getElementById('booking-success-title').focus();else customerName.focus();goal('premium_50000_form_open',{design:1});}
 function close(){dialog.close();}
 directContact.addEventListener('click',()=>goal('premium_50000_direct_contact',{channel:selectedChannel()}));
 phoneLink.addEventListener('click',()=>goal('premium_50000_direct_contact',{channel:'max'}));
 document.querySelectorAll('[data-booking]').forEach(button=>button.addEventListener('click',open));
 dialog.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',close));
 dialog.addEventListener('close',()=>{document.body.classList.remove('modal-open');if(lastTrigger)lastTrigger.focus();});
 dialog.addEventListener('click',event=>{if(event.target===dialog){const box=dialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)close();}});
 function normalizePhone(value){if(!/^[+\d\s().-]+$/.test(String(value).trim()))return '';let digits=String(value).replace(/\D/g,'');if(digits.length===10)digits='7'+digits;if(digits.length===11&&digits[0]==='8')digits='7'+digits.slice(1);return digits.length>=10&&digits.length<=15?'+'+digits:'';}
 function attribution(){const query=new URLSearchParams(location.search),utm={};for(const key of ['source','medium','campaign','content','term']){const value=query.get('utm_'+key);if(value)utm[key]=value.slice(0,180);}return utm;}
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(sending||succeeded)return;status.hidden=true;
  const name=customerName.value.trim();if(name.length<2){showError('Укажите ваше имя.');customerName.focus();return;}
  const channel=selectedChannel();if(!channelLabels[channel]){showError('Выберите удобный способ связи.');form.querySelector('input[name=contactType]').focus();return;}
  const rawContact=contactInput.value.trim();
  let contact=normalizePhone(rawContact),username='';
  if(channel==='telegram'&&!contact){
   username=rawContact.replace(/^@/,'');
   if(!/^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(username)){showError('Укажите @username в Telegram или телефон с кодом страны.');contactInput.focus();return;}
   contact='@'+username;
  }
  if(!contact){showError('Укажите телефон с кодом страны.');contactInput.focus();return;}
  const website=form.elements.website.value;if(website){showError('Не удалось отправить заявку.');return;}
  sending=true;submit.disabled=true;controls.forEach(input=>input.disabled=true);submit.textContent='Сохраняем заявку…';goal('premium_50000_form_submit');
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),30000);
  try{
   const params=new URLSearchParams(location.search);
   const payload={formType:'personal_contact',name,contactType:channel,contact,phone:username?'':contact,plan:'Онлайн-сопровождение · 4 онлайн-сессии + месяц поддержки',price:'50 000 ₽',source:'marafon_dorogo_dorogo_design_1_font_3_personal_50000',sourceUrl:location.origin+location.pathname,referrer:document.referrer.slice(0,500),utm:attribution(),openedAt:openedAt,website:'',message:'Контакт: '+contact+'. Удобный способ связи: '+channelLabels[channel]+'. '+'Заявка на личное сопровождение за 50 000 ₽ со страницы /dorogo/dorogo/1/3/. 4 индивидуальные онлайн-сессии по 50 минут и месяц сопровождения (4 недели) в MAX или Telegram: один личный ответ в рабочий день, с первой платной онлайн-сессии. Первый онлайн-созвон — 20 минут бесплатно. Согласовать время через выбранный канал. Заявка не является оплатой. Согласие на обработку контакта подтверждено нажатием кнопки; условия /dorogo/dorogo/1/privacy/.',yclid:(params.get('yclid')||'').slice(0,180)};
   const response=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:controller.signal});
   const result=await response.json().catch(()=>null);if(!response.ok||!result||result.ok!==true||result.received!==true)throw new Error(result?.error||'Не удалось подтвердить сохранение заявки. Попробуйте ещё раз.');
   successDescription.textContent=channel==='phone'?'Я позвоню вам, чтобы согласовать время первого бесплатного онлайн-созвона.':'Я напишу вам в '+channelLabels[channel]+', чтобы согласовать время первого бесплатного онлайн-созвона.';
   invitation.hidden=channel==='phone';phoneLink.hidden=channel!=='phone';
   if(personalLinks[channel]){directContact.href=personalLinks[channel];directContact.textContent='Написать Илье в '+channelLabels[channel];}
   dialog.scrollTop=0;
   succeeded=true;entry.hidden=true;success.hidden=false;
   dialog.setAttribute('aria-labelledby','booking-success-title');dialog.setAttribute('aria-describedby','booking-success-description');document.getElementById('booking-success-title').focus();
   goal('premium_50000_lead_success');goal('lead_success',{form:'premium_50000_dorogo_dorogo_design_1_font_3',price:50000});
  }catch(error){showError(error.name==='AbortError'?'Ответ занял больше времени. Ваши данные остались в форме. Если Илья уже связался с вами, повторная заявка не нужна.':error.message||'Не удалось отправить заявку. Попробуйте ещё раз.');goal('premium_50000_lead_error');}
  finally{clearTimeout(timer);sending=false;submit.disabled=false;controls.forEach(input=>input.disabled=false);updateChannel();submit.textContent='Записаться на первый созвон';}
 });
})();



