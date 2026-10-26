/* Live T-Bank checkout for the 12-track digital album.
   Reuses the server-owned ai_album_1990 price. No card data touches this site. */
(() => {
  'use strict';
  const API='https://ilaborzilov0-netizen-metod-payment-test-0305.twc1.net';
  const PLAN='ai_album_1990';
  const AMOUNT=199000;
  // Until the payment backend explicitly supports this deep return URL,
  // use the already supported /ai/ receipt page with verified bank status.
  const RETURN_URL=location.origin+'/ai/';
  const dialog=document.getElementById('order-modal');
  const form=document.getElementById('author-checkout-form');
  const status=document.getElementById('author-checkout-status');
  const submit=form?.querySelector('[type="submit"]');
  if(!dialog||!form||!status||!submit) return;
  let pending=false;
  const goal=(event)=>{
    const id='studio_'+event;
    if(typeof window.studioTrack==='function')window.studioTrack(event,{section:'checkout'});
    else try{window.ym?.(110906734,'reachGoal',id,{variant:'studio',section:'checkout'})}catch(_){}
  };
  const showError=(msg)=>{status.textContent=msg;status.hidden=false;status.setAttribute('role','alert')};
  const safeAmount=(data)=>{
    // Compatible with both deployed backend formats: rubles (1990) and kopecks (199000).
    const raw=Number(data?.amount);
    const minor=raw===1990 ? 199000 : raw===AMOUNT ? AMOUNT : NaN;
    if(data?.amountMinor!=null && Number(data.amountMinor)!==minor)return NaN;
    return minor;
  };
  const safePaymentUrl=(raw)=>{
    const value=new URL(raw);
    if(value.protocol!=='https:')throw new Error('Банковская ссылка недействительна.');
    const host=value.hostname.toLowerCase();
    if(!(/(^|\.)(tinkoff\.ru|tbank\.ru)$/.test(host)||host==='pay.tbank-online.com')){
      throw new Error('Адрес страницы оплаты не принадлежит Т-Банку.');
    }
    return value.href;
  };
  async function requestJson(path,options,timeout=30000){
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),timeout);
    try{
      const response=await fetch(API+path,{...options,signal:controller.signal,cache:'no-store'});
      const data=await response.json().catch(()=>null);
      if(!response.ok||!data||data.ok!==true)throw new Error(data?.error||'Платёжный сервис не ответил. Попробуйте ещё раз.');
      return data;
    } finally{clearTimeout(timer)}
  }
  function getMetrikaClientId(){
    return new Promise(resolve=>{
      let finished=false;
      const done=v=>{if(finished)return;finished=true;resolve(typeof v==='string'?v:'')};
      const timer=setTimeout(()=>done(''),650);
      try{
        if(typeof window.ym==='function')window.ym(110906734,'getClientID',id=>{clearTimeout(timer);done(id)});
        else{clearTimeout(timer);done('')}
      }catch(_){clearTimeout(timer);done('')}
    });
  }
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    if(pending)return;
    status.hidden=true;
    const emailInput=form.elements.namedItem('email');
    const email=String(emailInput?.value||'').trim();
    if(email.length>64||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
      emailInput?.setAttribute('aria-invalid','true');
      showError('Укажите корректную почту для подтверждения заказа.');
      emailInput?.focus();
      return;
    }
    emailInput.removeAttribute('aria-invalid');
    pending=true;submit.disabled=true;submit.textContent='Открываем Т-Банк…';
    goal('pay_click');
    try{
      const params=new URLSearchParams(location.search);
      const metrikaClientId=await getMetrikaClientId();
      const data=await requestJson('/api/payment/create',{
        method:'POST',
        headers:{'Content-Type':'application/json','Accept':'application/json'},
        body:JSON.stringify({
          email,plan:PLAN,flowId:'ai-author-album-1990',
          source:location.pathname==='/ai/'?'marafon_ai_studio':'marafon_ai_avtor_60_test_1',
          returnUrl:RETURN_URL,
          metrikaClientId,
          yclid:(params.get('yclid')||'').slice(0,80)
        })
      });
      if(data.plan!==PLAN||safeAmount(data)!==AMOUNT||!data.orderId||!data.paymentId){
        throw new Error('Цена или реквизиты заказа не совпали с 1 990 ₽. Платёж остановлен.');
      }
      const url=safePaymentUrl(data.paymentUrl);
      try{sessionStorage.setItem('marafonAiLastPayment',JSON.stringify({
        orderId:data.orderId,paymentId:data.paymentId,amountRub:1990,amountMinor:AMOUNT,
        createdAt:new Date().toISOString(),source:'ai_author_60_test_1'
      }))}catch(_){}
      goal('order_created');
      goal('bank_redirect');
      location.assign(url);
    }catch(error){
      const message=error?.name==='AbortError'
        ?'Сервис оплаты отвечает слишком долго. Попробуйте ещё раз.'
        :(error?.message||'Не удалось открыть оплату.');
      showError(message);
      goal('payment_error');
      pending=false;submit.disabled=false;submit.textContent='Перейти к оплате · 1 990 ₽';
    }
  });
  // Future-proof a direct return to this page if backend allowlist gets updated.
  async function checkBankReturn(){
    const params=new URLSearchParams(location.search);
    const result=params.get('payment_result'),orderId=params.get('orderId');
    if(!result||!orderId)return;
    const resultBox=document.getElementById('author-payment-return');
    if(!resultBox)return;
    resultBox.hidden=false;resultBox.textContent='Проверяем оплату в Т-Банке…';
    resultBox.scrollIntoView({block:'center'});
    const clean=()=>{const url=new URL(location.href);url.searchParams.delete('payment_result');url.searchParams.delete('orderId');history.replaceState(null,'',url.pathname+url.search+url.hash)};
    if(result==='fail'){
      resultBox.textContent='Оплата не завершена. Можете повторить покупку.';
      goal('payment_failed');
      clean();return;
    }
    for(let i=0;i<8;i++){
      try{
        const info=await requestJson('/api/payment/status?orderId='+encodeURIComponent(orderId),{headers:{Accept:'application/json'}},10000);
        if(info.confirmed&&info.plan===PLAN&&safeAmount(info)===AMOUNT){
          resultBox.textContent='Оплата 1 990 ₽ подтверждена Т-Банком. Подтверждение придёт на указанную почту. Информация о получении аудиозаписей направляется отдельно.';
          goal('paid');clean();return;
        }
        if(info.failed){resultBox.textContent='Оплата не завершена. Попробуйте ещё раз.';goal('payment_failed');clean();return}
      }catch(_){}
      await new Promise(resolve=>setTimeout(resolve,1500));
    }
    resultBox.textContent='Платёж пока проверяется. Если деньги списаны, не оплачивайте повторно, свяжитесь с поддержкой.';
    clean();
  }
  checkBankReturn();
})();
