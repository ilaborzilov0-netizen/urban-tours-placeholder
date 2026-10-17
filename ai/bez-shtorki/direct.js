/* Live inline-email experiment; payment never begins without buyer email for receipt. */
(()=>{'use strict';
const FORM=document.getElementById('direct-email-form'), INPUT=document.getElementById('direct-email'), STATUS=document.getElementById('direct-email-status');
const API='https://ilaborzilov0-netizen-metod-payment-test-0305.twc1.net/api/payment/create';
const PLAN='hypno_audio',EXPECTED_MINOR=99000;
const goal=(name)=>{try{window.ym?.(110906734,'reachGoal',name)}catch(_){}};
document.querySelectorAll('[data-direct-focus]').forEach(b=>b.addEventListener('click',()=>{
  goal('hypno_inline_payment_focus');
  FORM.scrollIntoView({behavior:'smooth',block:'center'});
  setTimeout(()=>INPUT.focus({preventScroll:true}),450);
}));
let busy=false;
FORM.addEventListener('submit',async (event)=>{
 event.preventDefault();if(busy)return;
 STATUS.hidden=true;INPUT.removeAttribute('aria-invalid');
 const email=INPUT.value.trim();
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>160){
  INPUT.setAttribute('aria-invalid','true');STATUS.textContent='Введите корректную почту для чека и получения записи.';STATUS.hidden=false;INPUT.focus();return;
 }
 busy=true;const button=document.getElementById('direct-pay');button.disabled=true;button.firstChild.textContent='Открываем Т-Банк… ';
 goal('hypno_inline_payment_create');
 const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),30000);
 try{
  const res=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},
  body:JSON.stringify({email,plan:PLAN,source:'marafon_ai_no_drawer_test',flowId:'hypnosis-990-inline',returnUrl:location.origin+location.pathname}),signal:ctrl.signal});
  const data=await res.json().catch(()=>null);
  if(!res.ok||!data||data.ok!==true)throw new Error(data?.error||'Не удалось создать платёж.');
  const minor=data.amountMinor!=null?Number(data.amountMinor):(Number(data.amount)>=10000?Number(data.amount):Math.round(Number(data.amount)*100));
  if(data.plan!==PLAN||minor!==EXPECTED_MINOR||!data.orderId)throw new Error('Не удалось подтвердить сумму заказа.');
  if(!data.paymentUrl)throw new Error('Банк не вернул ссылку на оплату.');
  const url=new URL(data.paymentUrl);
  if(url.protocol!=='https:'||(!/(^|\.)(tinkoff\.ru|tbank\.ru)$/.test(url.hostname)&&url.hostname!=='pay.tbank-online.com'))throw new Error('Адрес банковской страницы не прошёл проверку.');
  try{sessionStorage.setItem('hypnoLastOrder',data.orderId)}catch(_){}
  goal('hypno_inline_payment_created');
  location.assign(url.href);
 }catch(e){
  goal('hypno_inline_payment_error');
  STATUS.textContent=e.name==='AbortError'?'Платёжный сервис отвечает дольше обычного. Попробуйте ещё раз.':e.message;
  STATUS.hidden=false;button.disabled=false;button.firstChild.textContent='Оплатить · 990 ₽ ';busy=false;
 }finally{clearTimeout(timer)}
});
})();