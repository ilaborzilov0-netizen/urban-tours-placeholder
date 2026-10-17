
/* /инструкция/: two inline email-only album checkouts; payment and questions never use a drawer. */
(()=>{'use strict';
const API='https://ilaborzilov0-netizen-metod-payment-test-0305.twc1.net/api/payment/create';
const STATUS_API='https://ilaborzilov0-netizen-metod-payment-test-0305.twc1.net/api/payment/status';
const LEADS_API='https://api.marafon-metod.ru/api/leads';
const PLAN='ai_album',PRICE_MINOR=99000;
const forms=[...document.querySelectorAll('[data-checkout-form]')];
const goal=(event,extra={})=>{try{window.ym?.(110906734,'reachGoal','instruction_'+event,extra)}catch(_){}};
const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const formFor=where=>document.querySelector('[data-checkout-position="'+where+'"]');
const focusForm=where=>{const form=formFor(where)||formFor('hero');if(!form)return;form.scrollIntoView({behavior:'smooth',block:'center'});setTimeout(()=>form.elements.email.focus({preventScroll:true}),350)};
document.querySelectorAll('[data-focus-checkout]').forEach(b=>b.addEventListener('click',()=>focusForm(b.dataset.focusCheckout||'hero')));
document.querySelectorAll('[data-question]').forEach(b=>b.addEventListener('click',()=>{
 const d=document.getElementById('question-details');d.open=true;
 d.scrollIntoView({behavior:'smooth',block:'start'});
 goal('question_open');
}));
let busy=false;
const setButtons=(disabled)=>forms.forEach(f=>{f.querySelector('[type=submit]').disabled=disabled});
for(const form of forms){
 const position=form.dataset.checkoutPosition;
 const emailField=form.elements.email,submit=form.querySelector('[type=submit]'),title=submit.querySelector('.checkout-button-text'),status=form.querySelector('[role=status]');
 form.addEventListener('submit',async event=>{
 event.preventDefault();if(busy)return;status.hidden=true;emailField.removeAttribute('aria-invalid');
 const email=emailField.value.trim();
 if(!emailPattern.test(email)||email.length>160){emailField.setAttribute('aria-invalid','true');status.textContent='Введите правильный email для чека и получения треков.';status.hidden=false;emailField.focus();return}
 busy=true;setButtons(true);title.textContent='Открываем оплату…';goal('inline_payment_create',{position});
 const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),30000);
 try{
 const response=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({email,plan:PLAN,flowId:'ai-anchor-instruction-990',source:'marafon_audioyakorya_instruction_'+position,returnUrl:location.origin+location.pathname}),signal:ctrl.signal});
 const data=await response.json().catch(()=>null);
 if(!response.ok||!data||data.ok!==true){
   if(data?.code==='INVALID_CUSTOMER'&&(data.fields?.name||data.fields?.phone)){
     throw new Error('Платёжный сервис ещё обновляется для покупки по email. Попробуйте немного позже.');
   }
   if(data?.code==='INVALID_CUSTOMER'&&data.fields?.email){
     throw new Error('Проверьте написание электронной почты.');
   }
   throw new Error(data?.error||'Не удалось создать платёж.');
 }
 const minor=data.amountMinor!=null?Number(data.amountMinor):(Number(data.amount)>=10000?Number(data.amount):Math.round(Number(data.amount)*100));
 if(data.plan!==PLAN||minor!==PRICE_MINOR||!data.orderId||!data.paymentUrl)throw new Error('Не удалось подтвердить заказ на 990 ₽.');
 const bank=new URL(data.paymentUrl);
 if(bank.protocol!=='https:'||(!/(^|\.)(tinkoff\.ru|tbank\.ru)$/.test(bank.hostname)&&bank.hostname!=='pay.tbank-online.com'))throw new Error('Банковская ссылка не прошла проверку.');
 try{sessionStorage.setItem('marafonAiLastPayment',JSON.stringify({orderId:data.orderId,paymentId:data.paymentId,amountMinor:PRICE_MINOR,createdAt:new Date().toISOString()}))}catch(_){}
 goal('inline_payment_created',{position});location.assign(bank.href);
 }catch(error){status.textContent=error.name==='AbortError'?'Банк отвечает слишком долго. Попробуйте ещё раз.':error.message;status.hidden=false;goal('inline_payment_error',{position});busy=false;setButtons(false);title.textContent='Получить альбом'}
 finally{clearTimeout(timer)}
 });
}
const questionForm=document.getElementById('question-form'),questionStatus=document.getElementById('question-status');
function normalizePhone(text){let digits=String(text).replace(/\D/g,'');if(digits.length===10)digits='7'+digits;if(digits.length===11&&digits[0]==='8')digits='7'+digits.slice(1);return digits.length>=10&&digits.length<=15?'+'+digits:''}
let questionBusy=false,questionSent=false;
questionForm.addEventListener('submit',async e=>{
 e.preventDefault();if(questionBusy||questionSent)return;questionStatus.hidden=true;
 const f=questionForm.elements,name=f.name.value.trim(),phone=normalizePhone(f.phone.value),email=f.email.value.trim(),message=f.question.value.trim();
 for(const el of [f.name,f.phone,f.email,f.question])el.removeAttribute('aria-invalid');
 const invalid=!name||name.length<2?f.name:!phone?f.phone:!emailPattern.test(email)?f.email:message.length<5?f.question:null;
 if(invalid){invalid.setAttribute('aria-invalid','true');questionStatus.textContent='Проверьте имя, телефон, email и текст вопроса (не менее пяти символов).';questionStatus.hidden=false;invalid.focus();return}
 if(f.website.value)return;
 questionBusy=true;const btn=questionForm.querySelector('[type=submit]');btn.disabled=true;btn.textContent='Отправляем…';
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),30000);
 try{
 const response=await fetch(LEADS_API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({formType:'mobile_question',name,phone,email,contactType:'phone',contact:phone,message:'Почта: '+email+'\nВопрос: '+message,source:'marafon_audioyakorya_instruction_question',sourceUrl:location.origin+location.pathname,website:''}),signal:controller.signal});
 const data=await response.json().catch(()=>null);
 if(!response.ok||data?.ok!==true||data?.received!==true)throw new Error(data?.error||'Не удалось отправить вопрос.');
 questionSent=true;questionStatus.textContent='Вопрос отправлен. Ответ придёт по указанным контактам.';questionStatus.hidden=false;questionStatus.classList.add('success');btn.textContent='Вопрос отправлен';goal('question_sent');
 }catch(error){questionStatus.textContent=error.name==='AbortError'?'Ответ занял много времени. Попробуйте ещё раз.':error.message;questionStatus.hidden=false;btn.disabled=false;btn.textContent='Отправить вопрос'}
 finally{clearTimeout(timer);questionBusy=false}
});
async function checkReturn(){
 const query=new URLSearchParams(location.search),result=query.get('payment_result'),orderId=query.get('orderId');
 if(!result||!orderId)return;
 const panel=document.getElementById('payment-result-inline');panel.hidden=false;panel.textContent='Проверяем платёж в Т-Банке…';
 const clear=()=>{const url=new URL(location.href);url.searchParams.delete('payment_result');url.searchParams.delete('orderId');history.replaceState({},'',url.pathname+url.search+url.hash)};
 if(result==='fail'){panel.textContent='Оплата не завершена. Попробуйте ещё раз или напишите вопрос ниже.';clear();return}
 for(let n=0;n<8;n++){try{
 const response=await fetch(STATUS_API+'?orderId='+encodeURIComponent(orderId),{headers:{'Accept':'application/json'},cache:'no-store'});
 const data=await response.json();
 if(response.ok&&data?.ok===true&&data.confirmed&&data.plan===PLAN&&Number(data.amount)===PRICE_MINOR){
 panel.textContent='Оплата подтверждена. Ссылка на все 12 треков придёт на email в течение 24 часов. Если не отправим вовремя — вернём деньги.';clear();goal('payment_success');return;
 }
 if(response.ok&&data?.failed){panel.textContent='Оплата не завершена. Попробуйте ещё раз.';clear();return}
 }catch(_){}
 if(n<7)await new Promise(resolve=>setTimeout(resolve,1500));
 }
 panel.textContent='Платёж ещё проверяется. Если деньги списались, напишите вопрос через форму ниже. Без подтверждения банка мы не показываем оплату успешной.';
}
checkReturn();
})();