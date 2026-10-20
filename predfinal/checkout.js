/* /predfinal/ payment, question and verified bank return. Bank prices are server-owned. */
(()=>{'use strict';
const API='https://ilaborzilov0-netizen-metod-payment-test-0305.twc1.net';
const PLANS=Object.freeze({
 one:{id:'audio_pair_one',amount:199000,title:'1 стиль',price:'1 990 ₽'},
 all:{id:'audio_pair_all',amount:299000,title:'3 стиля',price:'2 990 ₽'},
 duo:{id:'audio_pair_duo',amount:449000,title:'3 стиля на двоих',price:'4 490 ₽'}
});
const GENRES=Object.freeze({author:'Под гитару',estrada:'Душевная эстрада',modern:'Современное звучание'});
const goal=(name,data={})=>{
 try{window.ym?.(110906734,'reachGoal','predfinal_'+name,data)}catch(_){}
 if(!/^\/ai\/?$/.test(location.pathname))return;
 try{
  const safe={};for(const key of ['genre','style','plan','location','type','notified']){
   if(Object.prototype.hasOwnProperty.call(data,key))safe[key]=data[key];
  }
  window.posthog?.capture?.('predfinal_'+name,safe);
  window.gtag?.('event','predfinal_'+name,safe);
 }catch(_){}
 try{window.aiGoals?.fromLegacy?.('predfinal_'+name,data||{})}catch(_){}
};
const qs=s=>document.querySelector(s);
const dialogs=[...document.querySelectorAll('dialog.predfinal-sheet')];
const orderDialog=qs('#predfinal-checkout-dialog');
const questionDialog=qs('#predfinal-question-dialog');
const resultDialog=qs('#predfinal-result-dialog');
const orderForm=qs('#predfinal-checkout-form');
const questionForm=qs('#predfinal-question-form');
const purchaseStatus=qs('#predfinal-checkout-status');
const questionStatus=qs('#predfinal-question-status');
const resultTitle=qs('#predfinal-result-heading');
const resultMessage=qs('#predfinal-result-message');
const orderTitle=qs('[data-checkout-title]');
const orderPrice=qs('[data-checkout-price]');
const orderSubmitPrice=qs('[data-checkout-submit-price]');
const checkoutGenres=qs('[data-checkout-genre]');
const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
let activePlan='all',paymentBusy=false,questionBusy=false,questionSent=false;
let questionOrigin='footer';
const showMessage=(target,message,success=false)=>{
 target.textContent=message;target.hidden=false;
 target.classList.toggle('is-success',success);
};
const clearMessage=target=>{target.textContent='';target.hidden=true;target.classList.remove('is-success')};
function openSheet(dialog){
 dialogs.forEach(other=>{if(other!==dialog&&other.open)other.close()});
 if(!dialog.open)dialog.showModal();
 document.body.classList.add('prefinal-modal-open');
 goal('sheet_open',{type:dialog.id});
}
dialogs.forEach(dialog=>{
 dialog.querySelectorAll('[data-sheet-close]').forEach(button=>button.addEventListener('click',()=>{
  if(dialog===orderDialog&&paymentBusy)return;
  dialog.close();
 }));
 dialog.addEventListener('close',()=>{
  if(!dialogs.some(d=>d.open))document.body.classList.remove('prefinal-modal-open');
 });
 dialog.addEventListener('cancel',event=>{if(dialog===orderDialog&&paymentBusy)event.preventDefault()});
 dialog.addEventListener('click',event=>{
  if(event.target!==dialog)return;
  const bounds=dialog.getBoundingClientRect();
  if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom){
   if(dialog!==orderDialog||!paymentBusy)dialog.close();
  }
 });
});
function currentGenre(){
 return qs('.tier-genre [data-style][aria-pressed="true"]')?.dataset.style || 'author';
}
function setPlan(plan){
 if(!PLANS[plan])return;
 activePlan=plan;
 const details=PLANS[plan];
 orderTitle.textContent=details.title;
 orderPrice.textContent=details.price;
 orderSubmitPrice.textContent=details.price;
 checkoutGenres.hidden=plan!=='one';
 const chosen=currentGenre();
 orderForm.querySelectorAll('input[name="genre"]').forEach(input=>{input.checked=input.value===chosen});
 clearMessage(purchaseStatus);
}
document.querySelectorAll('[data-select-plan]').forEach(button=>{
 button.addEventListener('click',()=>{
  if(paymentBusy)return;
  setPlan(button.dataset.selectPlan);
  openSheet(orderDialog);
  goal('checkout_open',{plan:PLANS[activePlan].id});
 });
});
orderForm.querySelectorAll('input[name="genre"]').forEach(input=>{
 input.addEventListener('change',()=>{
  if(!input.checked||!GENRES[input.value])return;
  const matching=qs('.tier-genre [data-style="'+input.value+'"]');
  if(matching){if(window.aiGoals)window.aiGoals.suppressPriceStyleOnce=true;matching.click();}
 });
});
document.querySelectorAll('[data-open-question]').forEach(button=>{
 button.addEventListener('click',()=>{
  questionOrigin=['pricing','faq','footer'].includes(button.dataset.questionLocation)?button.dataset.questionLocation:(button.closest('footer')?'footer':'pricing');
  clearMessage(questionStatus);
  openSheet(questionDialog);
  goal('question_open',{location:questionOrigin});
 });
});
const isPaymentUrlAllowed=raw=>{
 try{
  const url=new URL(raw);
  return url.protocol==='https:'&&(/(^|\.)(?:tinkoff\.ru|tbank\.ru)$/.test(url.hostname)||url.hostname==='pay.tbank-online.com');
 }catch(_){return false}
};
async function apiRequest(path,options={}){
 const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),30000);
 try{
  const response=await fetch(API+path,{
   ...options,
   signal:ctrl.signal,
   headers:{Accept:'application/json',...(options.headers||{})}
  });
  const payload=await response.json().catch(()=>null);
  if(!response.ok||!payload||payload.ok!==true){
   const problem=payload?.code==='UNKNOWN_PLAN'?'Не удалось создать заказ. Напишите мне, чтобы оформить покупку.':
    payload?.code==='INVALID_GENRE'?'Выберите одно музыкальное звучание.':
    payload?.code==='INVALID_CUSTOMER'?'Проверьте адрес электронной почты.':
    payload?.error||'Не удалось получить ответ сервера.';
   throw new Error(problem);
  }
  return payload;
 }finally{clearTimeout(timer)}
}
function minorAmount(data){
 if(data.amountMinor!==undefined&&data.amountMinor!==null)return Number(data.amountMinor);
 const amount=Number(data.amount);
 return amount>=10000?amount:Math.round(amount*100);
}
orderForm.addEventListener('submit',async event=>{
 event.preventDefault();if(paymentBusy)return;
 clearMessage(purchaseStatus);
 const details=PLANS[activePlan];
 if(!details)return;
 const emailInput=orderForm.elements.email;
 emailInput.removeAttribute('aria-invalid');
 const email=emailInput.value.trim();
 if(email.length>64||!emailPattern.test(email)){
  emailInput.setAttribute('aria-invalid','true');
  showMessage(purchaseStatus,'Укажите правильный адрес электронной почты.');
  emailInput.focus();return;
 }
 const genre=activePlan==='one'?orderForm.querySelector('input[name="genre"]:checked')?.value:'all';
 if(activePlan==='one'&&!GENRES[genre]){
  showMessage(purchaseStatus,'Выберите музыкальное звучание.');return;
 }
 paymentBusy=true;
 const submit=orderForm.querySelector('[type="submit"]');
 submit.disabled=true;
 const initial=submit.innerHTML;
 submit.textContent='Переходим к оплате…';
 goal('payment_create',{plan:details.id});
 try{
  const payload=await apiRequest('/api/payment/create',{
   method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({email,plan:details.id,genre,flowId:'predfinal-two-albums-20261020',source:'marafon_predfinal_checkout',returnUrl:location.origin+location.pathname})
  });
  if(payload.plan!==details.id||minorAmount(payload)!==details.amount||!payload.orderId||!payload.paymentUrl||!isPaymentUrlAllowed(payload.paymentUrl))throw new Error('Сумма или адрес страницы банка не прошли проверку. Оплата остановлена.');
  if(!String(payload.orderId).startsWith('MBT-'+details.id+'-'))throw new Error('Номер заказа не соответствует тарифу.');
  if(activePlan==='one'&&payload.genre!==genre)throw new Error('Сервер не подтвердил выбранное звучание.');
  try{sessionStorage.setItem('predfinal_last_payment',JSON.stringify({orderId:payload.orderId,plan:details.id,amount:details.amount,genre,createdAt:Date.now()}))}catch(_){}
  goal('payment_created',{plan:details.id});
  goal('bank_redirect',{plan:details.id});
  location.assign(payload.paymentUrl);
 }catch(error){
  showMessage(purchaseStatus,'Не удалось открыть оплату. Попробуйте ещё раз или напишите мне.');
  goal('payment_error',{plan:details.id});
  paymentBusy=false;submit.disabled=false;submit.innerHTML=initial;
 }
});
function validContact(raw){
 const value=String(raw||'').trim();
 if(value.includes('@'))return emailPattern.test(value)&&value.length<=64?{contact:value,channel:'email'}:null;
 let digits=value.replace(/\D/g,'');
 if(digits.length===10)digits='7'+digits;
 if(digits.length===11&&digits.startsWith('8'))digits='7'+digits.slice(1);
 return /^\d{11,15}$/.test(digits)?{contact:'+'+digits,channel:'phone'}:null;
}
questionForm.addEventListener('submit',async event=>{
 event.preventDefault();if(questionBusy||questionSent)return;
 clearMessage(questionStatus);
 const contactInput=questionForm.elements.contact,questionInput=questionForm.elements.question;
 [contactInput,questionInput].forEach(el=>el.removeAttribute('aria-invalid'));
 if(questionForm.elements.website.value)return;
 const contact=validContact(contactInput.value);
 const question=questionInput.value.trim();
 if(!contact){
  contactInput.setAttribute('aria-invalid','true');
  showMessage(questionStatus,'Укажите номер телефона с кодом страны или корректный email.');
  contactInput.focus();return;
 }
 if(question.length<5||question.length>1500){
  questionInput.setAttribute('aria-invalid','true');
  showMessage(questionStatus,'Напишите вопрос — не менее пяти символов.');
  questionInput.focus();return;
 }
 const submit=questionForm.querySelector('[type=submit]');
 submit.disabled=true;questionBusy=true;
 const originalLabel=submit.textContent;submit.textContent='Отправляем…';
 goal('question_send',{location:questionOrigin});
 try{
  const params=new URLSearchParams(location.search),utm={};
  for(const key of ['source','medium','campaign','content','term']){
   const val=params.get('utm_'+key);if(val)utm[key]=val.slice(0,120);
  }
  const response=await apiRequest('/api/leads',{
   method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({formType:'mobile_question',name:'',contactType:contact.channel,contact:contact.contact,message:question,source:'marafon_predfinal_question_'+questionOrigin,sourceUrl:location.origin+location.pathname,referrer:document.referrer.slice(0,500),utm,website:''})
  });
  if(response.received!==true)throw new Error('Сервер не подтвердил сохранение вопроса.');
  questionSent=true;
  submit.textContent='Вопрос принят';
  showMessage(questionStatus,response.notified?'Вопрос отправлен. Отвечу по указанному контакту.':'Вопрос сохранён, но доставка уведомления пока не подтверждена.',true);
  goal('question_success',{location:questionOrigin,notified:!!response.notified});
 }catch(error){
  showMessage(questionStatus,error.name==='AbortError'?'Сервер долго не отвечает. Данные остались в форме. Попробуйте ещё раз.':error.message);
  submit.disabled=false;submit.textContent=originalLabel;
  goal('question_error',{location:questionOrigin});
 }finally{questionBusy=false}
});
let lastResultPlan=null;
function showResult(title,message){
 resultTitle.textContent=title;resultMessage.textContent=message;
 if(!resultDialog.open)openSheet(resultDialog);
}
function cleanBankQuery(){
 const url=new URL(location.href);
 url.searchParams.delete('payment_result');
 url.searchParams.delete('orderId');
 history.replaceState({},'',url.pathname+url.search+url.hash);
}
async function verifyPayment(orderId,plan){
 const details=Object.values(PLANS).find(p=>p.id===plan);
 if(!details){showResult('Не удалось проверить заказ','Неизвестный тариф. Напишите вопрос через форму ниже.');return}
 showResult('Проверяем оплату…','Сверяем подтверждение с Т-Банком. Пожалуйста, подождите.');
 for(let attempt=0;attempt<8;attempt++){
  try{
   const reply=await apiRequest('/api/payment/status?orderId='+encodeURIComponent(orderId),{cache:'no-store'});
   if(reply.orderId!==orderId||reply.plan!==plan||minorAmount(reply)!==details.amount)throw new Error('Данные заказа не совпадают с выбранным тарифом.');
   if(reply.confirmed===true){
    const emailDelivery=reply.customerEmailSent===true?
     'Письмо о подтверждении покупки отправлено на указанный email.':
     'Отправка письма о подтверждении пока не подтверждена сервером.';
    showResult('Оплата подтверждена','Т-Банк подтвердил оплату '+details.price+'. '+emailDelivery+' Если доступ к аудиозаписям не пришёл, задайте вопрос через форму на сайте.');
    goal('payment_success',{plan});
    cleanBankQuery();return;
   }
   if(reply.failed===true){
    showResult('Оплата не завершена','Банк не подтвердил оплату. Вернитесь к тарифам и при необходимости повторите оформление.');
    goal('payment_failed',{plan});
    cleanBankQuery();return;
   }
  }catch(error){
   if(attempt===7)showResult('Не удалось проверить платёж',error.message+' Если деньги списались, не оплачивайте повторно, пока не выясните статус.');
  }
  if(attempt<7)await new Promise(resolve=>setTimeout(resolve,1800));
 }
 if(resultTitle.textContent==='Проверяем оплату…'){
  showResult('Платёж ещё проверяется','Подтверждение от банка пока не получено. Если деньги списались, не оформляйте повторную покупку до проверки статуса.');
 }
}
const query=new URLSearchParams(location.search);
const paymentResult=query.get('payment_result'),orderId=query.get('orderId');
if(paymentResult){
 const plan=Object.values(PLANS).find(p=>orderId?.startsWith('MBT-'+p.id+'-'))?.id;
 lastResultPlan=plan;
 if((paymentResult==='fail'||paymentResult==='success')&&plan){
  // Redirect parameters are not proof of bank outcome, including payment_result=fail.
  verifyPayment(orderId,plan);
 }else{
  showResult('Не удалось определить заказ','Ссылка возврата не содержит корректного номера. Свяжитесь с нами, если деньги списались.');
 }
}
})();
