/* Payment and question flow retained from /audioyakorya/. */
(() => {
'use strict';
const ALBUM_PRICE = 990;
const PAYMENT_API = 'https://ilaborzilov0-netizen-metod-payment-test-0305.twc1.net/api/payment/create';
const PAYMENT_STATUS_API = 'https://ilaborzilov0-netizen-metod-payment-test-0305.twc1.net/api/payment/status';
const LEADS_API = 'https://api.marafon-metod.ru/api/leads';
const purchaseDialog = document.getElementById('purchase-dialog');
const questionDialog = document.getElementById('question-dialog');
const resultDialog = document.getElementById('payment-result-dialog');
function albumGoal(name) { try { if(typeof window.ym === 'function') window.ym(110906734, 'reachGoal', name, {variant: window.audioConcept.current, experiment: 'audioyakorya_work_3'}); } catch (_) {} }
function openAlbumDialog(dialog) {
  document.querySelectorAll('.album-modal[open]').forEach(other => { if(other !== dialog) other.close(); });
  if(!dialog.open) dialog.showModal();
  document.body.classList.add('modal-open');
}
document.querySelectorAll('.album-modal').forEach(dialog => {
  dialog.querySelectorAll('[data-modal-close]').forEach(button => button.addEventListener('click', () => dialog.close()));
  dialog.addEventListener('close', () => {
    if(!document.querySelector('.album-modal[open]')) document.body.classList.remove('modal-open');
  });
  dialog.addEventListener('click', event => {
    if(event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if(event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });
});
document.querySelectorAll('[data-buy]').forEach(button => button.addEventListener('click', () => { openAlbumDialog(purchaseDialog); albumGoal('ai_purchase_form_open'); }));
document.querySelectorAll('[data-question]').forEach(button => button.addEventListener('click', () => { openAlbumDialog(questionDialog); albumGoal('ai_question_form_open'); }));
function normalizedPhone(value) {
  let digits = String(value).replace(/\D/g, '');
  if(digits.length === 10) digits = '7' + digits;
  if(digits.length === 11 && digits.startsWith('8')) digits = '7' + digits.slice(1);
  return digits.length >= 10 && digits.length <= 15 ? '+' + digits : '';
}
function statusMessage(element, message, success = false) { element.textContent = message; element.hidden = false; element.classList.toggle('success', success); }
function formCustomer(form, status) {
  const name = form.elements.name, phone = form.elements.phone, email = form.elements.email;
  [name,phone,email].forEach(field => field.removeAttribute('aria-invalid'));
  const value = {name:name.value.trim(),phone:normalizedPhone(phone.value),email:email.value.trim()};
  let field, message;
  if(value.name.length < 2) { field = name; message = 'Укажите имя — минимум два символа.'; }
  else if(!value.phone) { field = phone; message = 'Укажите телефон с кодом страны.'; }
  else if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)) { field = email; message = 'Укажите корректную почту, например name@mail.ru.'; }
  if(field) { field.setAttribute('aria-invalid','true');statusMessage(status,message);field.focus();return null; }
  if(form.elements.website.value) { statusMessage(status,'Не удалось отправить форму.');return null; }
  return value;
}
async function albumRequest(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(),30000);
  try {
    const response = await fetch(url,{...options,signal:controller.signal});
    const data = await response.json().catch(() => null);
    if(!response.ok || !data || data.ok !== true) throw new Error(data?.error || 'Не удалось получить подтверждение. Попробуйте ещё раз.');
    return data;
  } finally { clearTimeout(timer); }
}
const purchaseForm = document.getElementById('purchase-form');
const purchaseStatus = document.getElementById('purchase-status');
let paymentPending = false;
purchaseForm.addEventListener('submit', async event => {
  event.preventDefault();if(paymentPending) return;purchaseStatus.hidden = true;
  const customer = formCustomer(purchaseForm,purchaseStatus);if(!customer) return;
  const submit = purchaseForm.querySelector('[type=submit]');
  paymentPending = true;submit.disabled = true;submit.textContent = 'Открываем оплату…';albumGoal('ai_payment_create');
  try {
    const data = await albumRequest(PAYMENT_API,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({...customer,plan:'ai_album',flowId:'ai-anchor-album-990',source:'marafon_audioyakorya_work_'+window.audioConcept.current,returnUrl:window.audioConcept.returnUrl})});
    const returnedMinor = data.amountMinor != null ? Number(data.amountMinor) : (Number(data.amount)>=10000 ? Number(data.amount) : Math.round(Number(data.amount)*100));
    if(data.plan !== 'ai_album' || returnedMinor !== ALBUM_PRICE*100) throw new Error('Сумма оплаты не совпала с 990 ₽. Оплата остановлена.');
    if(!data.paymentUrl) throw new Error('Не получена ссылка на оплату. Попробуйте ещё раз.');
    const paymentUrl = new URL(data.paymentUrl);
    if(paymentUrl.protocol !== 'https:' || (!/(^|\.)(tinkoff\.ru|tbank\.ru)$/.test(paymentUrl.hostname) && paymentUrl.hostname !== 'pay.tbank-online.com')) throw new Error('Не удалось подтвердить страницу Т-Банка. Оплата остановлена.');
    try { sessionStorage.setItem('marafonAiLastPayment',JSON.stringify({orderId:data.orderId,paymentId:data.paymentId,amountRub:data.amount,amountMinor:data.amountMinor || 99000,createdAt:new Date().toISOString()})); } catch (_) {}
    albumGoal('ai_payment_created');location.assign(paymentUrl.href);
  } catch(error) {
    statusMessage(purchaseStatus,error.name === 'AbortError' ? 'Оплата открывается дольше обычного. Попробуйте ещё раз.' : error.message);
    albumGoal('ai_payment_error');paymentPending = false;submit.disabled = false;submit.textContent = 'Перейти к оплате · 990 ₽';
  }
});
const questionForm = document.getElementById('question-form');
const questionStatus = document.getElementById('question-status');
let questionPending = false, questionSaved = false;
questionForm.addEventListener('submit',async event => {
  event.preventDefault();if(questionPending || questionSaved) return;questionStatus.hidden = true;
  const customer = formCustomer(questionForm,questionStatus);if(!customer) return;
  const question = questionForm.elements.question.value.trim();
  if(question.length < 5) {statusMessage(questionStatus,'Напишите вопрос — минимум пять символов.');questionForm.elements.question.focus();return;}
  const submit = questionForm.querySelector('[type=submit]');questionPending = true;submit.disabled = true;submit.textContent = 'Отправляем вопрос…';
  try {
    const params = new URLSearchParams(location.search),utm = {};
    for(const key of ['source','medium','campaign','content','term']) {const v=params.get('utm_'+key);if(v)utm[key]=v.slice(0,180);}
    const result = await albumRequest(LEADS_API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({formType:'mobile_question',name:customer.name,contactType:'phone',contact:customer.phone,phone:customer.phone,email:customer.email,message:'Почта для ответа: '+customer.email+'\nВопрос: '+question,plan:'Альбом аудиоякорей «Без торга»',price:'990 ₽',source:'marafon_audioyakorya_work_question_'+window.audioConcept.current,sourceUrl:location.origin+location.pathname,referrer:document.referrer.slice(0,500),utm,website:''})});
    if(result.received !== true) throw new Error('Не удалось подтвердить сохранение вопроса. Попробуйте ещё раз.');
    questionSaved = true;statusMessage(questionStatus,'Вопрос отправлен. Илья ответит по указанным контактам.',true);submit.textContent = 'Вопрос отправлен';albumGoal('ai_question_success');
  } catch(error) {statusMessage(questionStatus,error.name === 'AbortError' ? 'Ответ занял больше времени. Данные остались в форме. Попробуйте ещё раз.' : error.message);submit.disabled = false;submit.textContent = 'Отправить вопрос';albumGoal('ai_question_error');}
  finally {questionPending = false;}
});
async function checkAlbumPaymentReturn() {
  const params = new URLSearchParams(location.search), result = params.get('payment_result'), orderId = params.get('orderId');
  if(!result || !orderId) return;
  const title = document.getElementById('payment-result-title'), description = document.getElementById('payment-result-description');
  openAlbumDialog(resultDialog);
  function clean() {const url = new URL(location.href);url.searchParams.delete('payment_result');url.searchParams.delete('orderId');history.replaceState({},'',url.pathname+url.search+url.hash);}
  if(result === 'fail') {title.textContent = 'Оплата не завершена.';description.textContent = 'Деньги могли не списаться. Можно повторить покупку или задать вопрос.';clean();return;}
  for(let attempt = 0;attempt < 8;attempt++) {
    try {
      const data = await albumRequest(PAYMENT_STATUS_API+'?orderId='+encodeURIComponent(orderId),{headers:{'Accept':'application/json'},cache:'no-store'});
      if(data.confirmed && data.plan === 'ai_album' && Number(data.amount) === 99000) {title.textContent = 'Оплата подтверждена.';description.textContent = 'Покупка альбома за 990 ₽ оформлена. Сейчас мы настраиваем техническую часть сайта. Ссылка на все треки придёт на указанную почту в течение 24 часов после оплаты.';clean();albumGoal('ai_payment_success');return;}
      if(data.failed) {title.textContent = 'Оплата не завершена.';description.textContent = 'Можно повторить покупку или задать вопрос.';clean();return;}
    } catch(_) {if(attempt === 7) break;}
    await new Promise(resolve => setTimeout(resolve,1500));
  }
  title.textContent = 'Платёж ещё проверяется.';description.textContent = 'Если деньги списались, задайте вопрос об оплате. О результате без подтверждения Т-Банка мы не сообщаем.';
}
checkAlbumPaymentReturn();


})();
