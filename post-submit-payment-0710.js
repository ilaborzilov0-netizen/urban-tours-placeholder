/* owner:0710-post-submit-direct-payment
   Application success -> direct 14 000 ₽ hosted checkout.
   No site scroll, no commercial drawer, no repeated tariff confirmation.
   The redirect happens only after the payment API confirms the expected 14 000 ₽ amount.
*/
(function(){
  'use strict';
  if(window.__BZPostSubmitPayment0710)return;
  window.__BZPostSubmitPayment0710=true;

  var EXPECTED_AMOUNT=14000;
  var STANDARD_AMOUNT=14000;
  var busy=false;

  function text(value,max){return String(value==null?'':value).trim().slice(0,max||500);}
  function config(){return window.BZCommercialConfig||null;}
  function flow(){
    if(window.BZFlowCalendar&&typeof window.BZFlowCalendar.upcoming==='function'){
      var upcoming=window.BZFlowCalendar.upcoming(1,new Date());
      if(upcoming&&upcoming[0])return upcoming[0];
    }
    var c=config();
    return c&&Array.isArray(c.flows)&&c.flows[0]||null;
  }
  function lead(){return window.BZLastApplicationLead||null;}
  function analytics(name,extra){
    var detail=Object.assign({event:name,source_cta:'post-submit-application',full_price:EXPECTED_AMOUNT,payment_route:'payment-service-direct'},extra||{});
    window.dataLayer=window.dataLayer||[];
    window.dataLayer.push(detail);
    try{window.dispatchEvent(new CustomEvent('bz-commercial-analytics',{detail:detail}));}catch(_e){}
  }
  function customerFromLead(record){
    var payload=record&&record.payload||{};
    var contact=text(payload.contact,180);
    var kind=text(payload.contactType,40).toLowerCase();
    var phone='';
    var email='';
    if(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact))email=contact;
    if(kind==='call'||kind==='phone'||/^(?:\+?\d[\d\s()\-]{8,20})$/.test(contact))phone=contact;
    return {name:text(payload.name,100),email:email,phone:phone,contact:contact,contactType:kind};
  }
  function errorNode(button){
    var scope=button.closest('.bz-post-submit-success')||button.parentElement;
    return scope&&scope.querySelector('[data-bz-post-submit-pay-error]');
  }
  function setError(button,message){
    var node=errorNode(button);
    if(!node)return;
    node.textContent=message||'';
    node.hidden=!message;
  }
  function setBusy(button,on){
    if(!button)return;
    var span=button.querySelector('span');
    if(on){
      button.dataset.bzPostSubmitLabel=span?span.textContent:button.textContent;
      if(span)span.textContent='Открываем оплату…'; else button.textContent='Открываем оплату…';
      button.disabled=true;
      button.setAttribute('aria-busy','true');
    }else{
      var label=button.dataset.bzPostSubmitLabel||'Оплатить участие';
      if(span)span.textContent=label; else button.textContent=label;
      button.disabled=false;
      button.removeAttribute('aria-busy');
    }
  }
  async function pay(button){
    if(busy)return;
    setError(button,'');
    var c=config(),record=lead(),f=flow();
    if(!c||!c.PAYMENT_ENABLED||!c.paymentCreateEndpoint){
      setError(button,'Оплата сейчас недоступна. Заявка уже отправлена — ничего больше делать не нужно.');
      return;
    }
    if(!record||!record.payload){
      setError(button,'Не удалось восстановить данные заявки. Заявка уже отправлена — я свяжусь с вами.');
      return;
    }
    if(!f){
      setError(button,'Не удалось определить ближайший поток. Заявка уже отправлена — я свяжусь с вами.');
      return;
    }

    busy=true;
    setBusy(button,true);
    var customer=customerFromLead(record);
    var decisionAt=Date.now();
    var duration=(window.BZDecisionWindow&&Number(window.BZDecisionWindow.durationMs))||3*60*60*1000;
    var decisionExpiresAt=decisionAt+duration;
    analytics('payment_start',{lead_id:text(record.leadId,80),start_date:f.value||f.id,post_submit_offer:false});

    try{
      var response=await fetch(c.paymentCreateEndpoint,{
        method:'POST',
        headers:{'Content-Type':'application/json','Accept':'application/json'},
        body:JSON.stringify({
          plan:'basic',
          name:customer.name,
          email:customer.email,
          phone:customer.phone,
          startId:f.id,
          startDate:f.value||f.id,
          startLabel:f.label,
          decisionAt:null,
          decisionExpiresAt:null,
          decisionWindowActive:false,
          source:'post-submit-application',
          leadId:text(record.leadId,80),
          postSubmitOffer:false
        })
      });
      var raw=await response.text(),data={};
      try{data=raw?JSON.parse(raw):{};}catch(_parse){throw new Error('Платёжный сервер вернул некорректный ответ.');}
      var paymentUrl=typeof data.paymentUrl==='string'?data.paymentUrl:'';
      var amount=Number(data.amount);
      if(!response.ok||!data.ok||!paymentUrl)throw new Error(data.error||'Не удалось создать платёж.');
      if(!Number.isFinite(amount)||amount!==EXPECTED_AMOUNT){
        analytics('payment_error',{reason:'post_submit_amount_mismatch',returned_amount:Number.isFinite(amount)?amount:null,expected_amount:EXPECTED_AMOUNT});
        throw new Error('Не удалось подтвердить стоимость 14 000 ₽. Заявка уже отправлена — я свяжусь с вами.');
      }
      try{
        sessionStorage.setItem('bzLastPaymentOrder',JSON.stringify({
          orderId:data.orderId,
          paymentId:data.paymentId,
          plan:data.plan||'basic',
          startId:f.id,
          startDate:f.value||f.id,
          amount:amount,
          source:'post-submit-application',
          leadId:text(record.leadId,80),
          createdAt:new Date().toISOString()
        }));
      }catch(_storage){}
      analytics('payment_redirect',{order_id:data.orderId,payment_id:data.paymentId,charged_amount:amount,lead_id:text(record.leadId,80),post_submit_offer:false});
      window.location.assign(paymentUrl);
    }catch(error){
      busy=false;
      setBusy(button,false);
      setError(button,error&&error.message?error.message:'Не удалось открыть оплату. Заявка уже отправлена — ничего больше делать не нужно.');
      analytics('payment_error',{reason:'post_submit_create_failed',message:error&&error.message||''});
    }
  }

  document.addEventListener('click',function(event){
    var button=event.target&&event.target.closest?event.target.closest('[data-bz-post-submit-pay]'):null;
    if(!button)return;
    event.preventDefault();
    event.stopPropagation();
    if(typeof event.stopImmediatePropagation==='function')event.stopImmediatePropagation();
    pay(button);
  },true);

  window.BZPostSubmitPayment={pay:pay,expectedAmount:EXPECTED_AMOUNT,standardAmount:STANDARD_AMOUNT};
})();
