/* /ai/ live hypnosis checkout + question form. No fabricated payment confirmations. */
(()=>{'use strict';
const PLAN='hypno_audio',PRICE_MINOR=99000,COUNTER=110906734;
const PAYMENT_API='https://ilaborzilov0-netizen-metod-payment-test-0305.twc1.net/api/payment/create';
const STATUS_API='https://ilaborzilov0-netizen-metod-payment-test-0305.twc1.net/api/payment/status';
const LEADS_API='https://api.marafon-metod.ru/api/leads';
const purchase=document.getElementById('purchase-dialog'),question=document.getElementById('question-dialog'),result=document.getElementById('payment-result-dialog');
const payForm=document.getElementById('purchase-form'),questionForm=document.getElementById('question-form');
const goal=name=>{try{if(typeof window.ym==='function')window.ym(COUNTER,'reachGoal',name)}catch(_){}};
function open(dialog){
 if(!dialog)return;
 document.querySelectorAll('.hypno-dialog[open]').forEach(d=>{if(d!==dialog)d.close()});
 if(!dialog.open&&typeof dialog.showModal==='function')dialog.showModal();
}
document.querySelectorAll('.hypno-dialog').forEach(dialog=>{
 dialog.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>dialog.close()));
 dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()});
});
document.querySelectorAll('[data-order]').forEach(b=>b.addEventListener('click',()=>{goal('hypno_purchase_form_open');open(purchase)}));
document.querySelectorAll('[data-question]').forEach(b=>b.addEventListener('click',()=>{goal('hypno_question_form_open');open(question)}));
function normalizedPhone(value){
 let digits=String(value||'').replace(/\D/g,'');
 if(digits.length===10)digits='7'+digits;
 if(digits.length===11&&digits[0]==='8')digits='7'+digits.slice(1);
 return digits.length>=10&&digits.length<=15?'+'+digits:'';
}
function showStatus(element,text,success=false){element.hidden=false;element.textContent=text;element.classList.toggle('success',success)}
function readCustomer(form,status){
 const n=form.elements.name,p=form.elements.phone,e=form.elements.email;
 [n,p,e].forEach(x=>x.removeAttribute('aria-invalid'));
 const data={name:n.value.trim(),phone:normalizedPhone(p.value),email:e.value.trim()};
 let field,error;
 if(data.name.length<2){field=n;error='Укажите имя — минимум два символа.'}
 else if(!data.phone){field=p;error='Введите телефон с кодом страны.'}
 else if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)){field=e;error='Введите корректную почту.'}
 if(field){field.setAttribute('aria-invalid','true');showStatus(status,error);field.focus();return null}
 if(form.elements.website.value){showStatus(status,'Не удалось отправить форму.');return null}
 return data;
}
async function request(url,options={}){
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),30000);
 try{
  const response=await fetch(url,{...options,signal:controller.signal});
  const data=await response.json().catch(()=>null);
  if(!response.ok||!data||data.ok!==true)throw new Error(data?.error||'Не удалось получить ответ сервера. Попробуйте ещё раз.');
  return data;
 }finally{clearTimeout(timeout)}
}
const jsonHeaders={'Content-Type':'application/json','Accept':'application/json'};
let busyPay=false;
payForm?.addEventListener('submit',async ev=>{
 ev.preventDefault();if(busyPay)return;
 const status=document.getElementById('purchase-status');status.hidden=true;
 const customer=readCustomer(payForm,status);if(!customer)return;
 busyPay=true;const btn=payForm.querySelector('[type=submit]');btn.disabled=true;btn.firstChild.textContent='Открываем оплату… ';
 goal('hypno_payment_create');
 try{
  const data=await request(PAYMENT_API,{method:'POST',headers:jsonHeaders,body:JSON.stringify({...customer,plan:PLAN,flowId:'hypnosis-990',source:'marafon_ai_hypnosis',returnUrl:location.origin+location.pathname})});
  if(data.plan!==PLAN||Number(data.amount)!==PRICE_MINOR)throw new Error('Сумма или тариф не совпадает. Платёж остановлен.');
  if(!data.paymentUrl||!data.orderId)throw new Error('Сервер не предоставил ссылку на оплату.');
  const url=new URL(data.paymentUrl);
  if(url.protocol!=='https:'||!/(^|\.)(tinkoff\.ru|tbank\.ru)$/.test(url.hostname)&&url.hostname!=='pay.tbank-online.com')
    throw new Error('Адрес страницы оплаты не прошёл проверку безопасности.');
  try{sessionStorage.setItem('hypnoLastOrder',data.orderId)}catch(_){}
  goal('hypno_payment_created');
  location.assign(url.href);
 }catch(error){
  showStatus(status,error.name==='AbortError'?'Платёжный сервис отвечает дольше обычного. Попробуйте ещё раз.':error.message);
  goal('hypno_payment_error');busyPay=false;btn.disabled=false;btn.firstChild.textContent='Перейти к оплате · 990 ₽ ';
 }
});
let busyQuestion=false,sentQuestion=false;
questionForm?.addEventListener('submit',async ev=>{
 ev.preventDefault();if(busyQuestion||sentQuestion)return;
 const status=document.getElementById('question-status');status.hidden=true;
 const customer=readCustomer(questionForm,status);if(!customer)return;
 const text=questionForm.elements.question.value.trim();
 if(text.length<5){showStatus(status,'Напишите вопрос — минимум пять символов.');questionForm.elements.question.focus();return}
 const btn=questionForm.querySelector('[type=submit]');
 busyQuestion=true;btn.disabled=true;btn.firstChild.textContent='Отправляем… ';
 const utm={},params=new URLSearchParams(location.search);
 for(const k of ['source','medium','campaign','content','term']){const v=params.get('utm_'+k);if(v)utm[k]=v.slice(0,180)}
 try{
  const data=await request(LEADS_API,{method:'POST',headers:jsonHeaders,body:JSON.stringify({
   formType:'mobile_question',name:customer.name,contactType:'phone',contact:customer.phone,
   phone:customer.phone,email:customer.email,
   message:'Email для ответа: '+customer.email+'\nВопрос по гипнозу: '+text,
   plan:'Аудиогипноз 990 ₽',price:'990 ₽',source:'marafon_ai_hypnosis_question',
   sourceUrl:location.origin+location.pathname,referrer:document.referrer.slice(0,500),
   utm,website:''
  })});
  if(data.received!==true)throw new Error('Сервер не подтвердил получение заявки.');
  sentQuestion=true;
  showStatus(status,'Ваш вопрос получен, номер заявки: '+data.leadId+'. Ответим по указанным контактам.',true);
  btn.firstChild.textContent='Вопрос отправлен ';goal('hypno_question_success');
 }catch(error){
  showStatus(status,error.name==='AbortError'?'Сервер отвечает дольше обычного. Данные остались в форме.':error.message);
  busyQuestion=false;btn.disabled=false;btn.firstChild.textContent='Отправить вопрос ';goal('hypno_question_error');
 }
});
async function checkReturn(){
 const params=new URLSearchParams(location.search),paymentResult=params.get('payment_result'),id=params.get('orderId');
 if(!paymentResult||!id||!/^MBT-hypno_audio-[a-zA-Z0-9-]+$/.test(id))return;
 const title=document.getElementById('payment-result-title'),copy=document.getElementById('payment-result-description');
 open(result);
 const clean=()=>{const url=new URL(location.href);url.searchParams.delete('payment_result');url.searchParams.delete('orderId');history.replaceState({},'',url.pathname+url.search+url.hash)};
 if(paymentResult==='fail'){title.textContent='Оплата не завершена.';copy.textContent='Можете повторить оплату или задать вопрос.';clean();return}
 for(let i=0;i<8;i++){
  try{
   const d=await request(STATUS_API+'?orderId='+encodeURIComponent(id),{headers:{Accept:'application/json'},cache:'no-store'});
   if(d.confirmed&&d.plan===PLAN&&Number(d.amount)===PRICE_MINOR){
    title.textContent='Оплата подтверждена.';
    copy.textContent=d.customerEmailSent?'Письмо с подтверждением отправлено на вашу почту. Информацию о получении записей мы направим отдельно.':'Платёж подтверждён. Если письмо задерживается, свяжитесь с нами через форму вопроса.';
    clean();goal('hypno_payment_success');return;
   }
   if(d.failed){title.textContent='Оплата не завершена.';copy.textContent='Банк не подтвердил оплату. Можно повторить покупку.';clean();return}
  }catch(_){}
  await new Promise(resolve=>setTimeout(resolve,1500));
 }
 title.textContent='Платёж проверяется.';
 copy.textContent='Если сумма списалась, сохраните подтверждение банка. Задайте вопрос, если результат не появится.';
}
checkReturn();
})();