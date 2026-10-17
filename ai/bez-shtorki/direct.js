/* /ai/bez-shtorki/ - two email-only checkout forms; payment never starts without email for the receipt. */
(()=>{'use strict';
const API='https://ilaborzilov0-netizen-metod-payment-test-0305.twc1.net/api/payment/create';
const PLAN='hypno_audio',EXPECTED_MINOR=99000;
const goal=(name)=>{try{window.ym?.(110906734,'reachGoal',name)}catch(_){}};
const forms=Array.from(document.querySelectorAll('[data-checkout-form]'));
const focusCheckout=(where)=>{
 const target=where==='price'?document.getElementById('price-email-form'):document.getElementById('direct-email-form');
 const email=target?.elements.email;
 if(!target||!email)return;
 goal('hypno_inline_payment_focus');
 target.scrollIntoView({behavior:'smooth',block:'center'});
 setTimeout(()=>email.focus({preventScroll:true}),450);
};
document.querySelectorAll('[data-direct-focus]').forEach(button=>button.addEventListener('click',()=>focusCheckout(button.getAttribute('data-direct-focus'))));
let activePayment=false;
for(const form of forms){
 const position=form.getAttribute('data-checkout-position')==='price'?'price':'hero';
 const emailField=form.elements.email;
 const status=form.querySelector('[role="status"]');
 const button=form.querySelector('[type="submit"]');
 const buttonText=button.querySelector('.checkout-button-text');
 form.addEventListener('submit',async(event)=>{
  event.preventDefault();
  if(activePayment)return;
  status.hidden=true;emailField.removeAttribute('aria-invalid');
  const email=emailField.value.trim();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>160){
   emailField.setAttribute('aria-invalid','true');
   status.textContent='Введите корректную почту для чека и получения записи.';
   status.hidden=false;emailField.focus();return;
  }
  activePayment=true;
  for(const f of forms){f.querySelector('[type="submit"]').disabled=true;}
  buttonText.textContent='Открываем Т-Банк…';
  goal('hypno_inline_payment_create');
  goal('hypno_inline_payment_create_'+position);
  const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),30000);
  try{
   const res=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},
   body:JSON.stringify({email,plan:PLAN,source:'marafon_ai_no_drawer_'+position,flowId:'hypnosis-990-inline',returnUrl:location.origin+location.pathname}),signal:ctrl.signal});
   const data=await res.json().catch(()=>null);
   if(!res.ok||!data||data.ok!==true)throw new Error(data?.error||'Не удалось создать платёж.');
   const minor=data.amountMinor!=null?Number(data.amountMinor):(Number(data.amount)>=10000?Number(data.amount):Math.round(Number(data.amount)*100));
   if(data.plan!==PLAN||minor!==EXPECTED_MINOR||!data.orderId)throw new Error('Не удалось подтвердить сумму заказа.');
   if(!data.paymentUrl)throw new Error('Банк не вернул ссылку на оплату.');
   const url=new URL(data.paymentUrl);
   if(url.protocol!=='https:'||(!/(^|\.)(tinkoff\.ru|tbank\.ru)$/.test(url.hostname)&&url.hostname!=='pay.tbank-online.com'))throw new Error('Адрес банковской страницы не прошёл проверку.');
   try{sessionStorage.setItem('hypnoLastOrder',data.orderId)}catch(_){}
   goal('hypno_inline_payment_created');goal('hypno_inline_payment_created_'+position);
   location.assign(url.href);
  }catch(e){
   goal('hypno_inline_payment_error');goal('hypno_inline_payment_error_'+position);
   status.textContent=e.name==='AbortError'?'Платёжный сервис отвечает дольше обычного. Попробуйте ещё раз.':e.message;
   status.hidden=false;buttonText.textContent='Бросить курить';
   for(const f of forms){f.querySelector('[type="submit"]').disabled=false;}
   activePayment=false;
  }finally{clearTimeout(timer)}
 });
}
})();