
(()=>{'use strict';
const root=document.body, variant=root.dataset.variant||'1';
const API='https://ilaborzilov0-netizen-metod-payment-test-0305.twc1.net/api/payment/create';
const STATUS_API='https://ilaborzilov0-netizen-metod-payment-test-0305.twc1.net/api/payment/status';
const LEADS_API='https://api.marafon-metod.ru/api/leads';
const price=99000;
// Do not count embedded preview sessions as visitors in the campaign analytics.
if(window.self===window.top && !new URLSearchParams(location.search).has('preview')){
 try{
  (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r)return;}k=e.createElement(t);a=e.getElementsByTagName(t)[0];k.async=1;k.src=r;a.parentNode.insertBefore(k,a)})(window,document,'script','https://mc.yandex.ru/metrika/tag.js?id=110906734','ym');
  window.ym(110906734,'init',{ssr:true,webvisor:true,clickmap:true,accurateTrackBounce:true,trackLinks:true});
 }catch(_){}
}
const goals=(event)=>{try{if(typeof window.ym==='function'){window.ym(110906734,'reachGoal','ai_gemini_'+variant+'_'+event)}}catch(_){}};
const dialogs={buy:document.getElementById('purchase-dialog'),ask:document.getElementById('question-dialog'),result:document.getElementById('payment-result-dialog')};
function openDialog(d){if(!d)return;Object.values(dialogs).forEach(x=>{if(x&&x!==d&&x.open)x.close()});if(!d.open&&d.showModal)d.showModal()}
Object.values(dialogs).forEach(d=>{if(!d)return;d.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>d.close()));d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close()}})});
document.querySelectorAll('[data-buy]').forEach(b=>b.addEventListener('click',()=>{goals('checkout_open');openDialog(dialogs.buy)}));
document.querySelectorAll('[data-ask]').forEach(b=>b.addEventListener('click',()=>{goals('question_open');openDialog(dialogs.ask)}));
function normalizePhone(raw){let n=String(raw||'').replace(/\D/g,'');if(n.length===10)n='7'+n;if(n.length===11&&n[0]==='8')n='7'+n.slice(1);return n.length>=10&&n.length<=15?'+'+n:''}
function display(el,text,success=false){el.textContent=text;el.hidden=false;el.classList.toggle('success',success)}
function customer(form,status){
 const name=form.elements.name,phone=form.elements.phone,email=form.elements.email;
 [name,phone,email].forEach(el=>el.removeAttribute('aria-invalid'));
 const data={name:name.value.trim(),phone:normalizePhone(phone.value),email:email.value.trim()};
 let el=null,msg='';
 if(data.name.length<2){el=name;msg='Укажите имя — минимум два символа.'}
 else if(!data.phone){el=phone;msg='Укажите телефон с кодом страны.'}
 else if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)||data.email.length>160){el=email;msg='Введите корректную электронную почту.'}
 if(el){el.setAttribute('aria-invalid','true');display(status,msg);el.focus();return null}
 if(form.elements.website.value){display(status,'Не удалось отправить форму.');return null}
 return data
}
async function request(url,opts={}){
 const ac=new AbortController(),timer=setTimeout(()=>ac.abort(),30000);
 try{const response=await fetch(url,{...opts,signal:ac.signal});const data=await response.json().catch(()=>null);
 if(!response.ok||!data||data.ok!==true)throw new Error(data?.error||'Сервис временно не отвечает.');
 return data}finally{clearTimeout(timer)}
}
const headers={'Content-Type':'application/json','Accept':'application/json'};
const pay=document.getElementById('purchase-form'),ps=document.getElementById('purchase-status');
let paying=false;
pay.addEventListener('submit',async e=>{
 e.preventDefault();if(paying)return;ps.hidden=true;
 const buyer=customer(pay,ps);if(!buyer)return;
 if(window.self!==window.top){
  display(ps,'Для оплаты откройте эту версию в отдельной вкладке.');
  window.open(location.origin+location.pathname,'_blank','noopener');
  return;
 }
 const button=pay.querySelector('[type="submit"]');paying=true;button.disabled=true;button.textContent='Открываем Т-Банк…';
 goals('payment_create');
 try{
 const data=await request(API,{method:'POST',headers,body:JSON.stringify({...buyer,plan:'ai_album',flowId:'audio-gemini-'+variant,source:'marafon_audioyakorya_gemini_'+variant,returnUrl:location.origin+location.pathname})});
 const minor=data.amountMinor!=null?Number(data.amountMinor):(Number(data.amount)>=10000?Number(data.amount):Math.round(Number(data.amount)*100));
 if(data.plan!=='ai_album'||minor!==price||!data.orderId)throw new Error('Неверная сумма или тариф. Переход остановлен.');
 if(!data.paymentUrl)throw new Error('Банк не предоставил адрес оплаты.');
 const url=new URL(data.paymentUrl);
 if(url.protocol!=='https:'||(!/(^|\.)(tinkoff\.ru|tbank\.ru)$/.test(url.hostname)&&url.hostname!=='pay.tbank-online.com'))throw new Error('Адрес оплаты не прошёл проверку безопасности.');
 try{sessionStorage.setItem('audio_pult_last_order',data.orderId)}catch(_){}
 goals('payment_created');
 location.assign(url.href);
 }catch(err){display(ps,err.name==='AbortError'?'Сервис отвечает дольше обычного. Повторите попытку.':err.message);goals('payment_error');button.disabled=false;button.textContent='Перейти к оплате · 990 ₽';paying=false}
});
const question=document.getElementById('question-form'),qs=document.getElementById('question-status');let asking=false,asked=false;
question.addEventListener('submit',async e=>{
 e.preventDefault();if(asking||asked)return;qs.hidden=true;
 const buyer=customer(question,qs);if(!buyer)return;
 const msg=question.elements.question.value.trim();
 if(msg.length<5){display(qs,'Напишите вопрос — хотя бы пять символов.');question.elements.question.focus();return}
 asking=true;const button=question.querySelector('[type="submit"]');button.disabled=true;button.textContent='Отправляем…';
 try{
 const params=new URLSearchParams(location.search),utm={};
 for(const k of ['source','medium','campaign','content','term']){const val=params.get('utm_'+k);if(val)utm[k]=val.slice(0,180)}
 const data=await request(LEADS_API,{method:'POST',headers,body:JSON.stringify({formType:'mobile_question',name:buyer.name,phone:buyer.phone,email:buyer.email,contactType:'phone',contact:buyer.phone,message:'Email для ответа: '+buyer.email+'\nВопрос об аудиоякорях: '+msg,plan:'Альбом аудиоякорей «Без торга»',price:'990 ₽',source:'marafon_audioyakorya_gemini_'+variant+'_question',sourceUrl:location.origin+location.pathname,referrer:document.referrer.slice(0,500),utm,website:''})});
 if(data.received!==true)throw new Error('Не удалось подтвердить получение вопроса.');
 asked=true;display(qs,'Ваш вопрос сохранён. Ответим по указанным контактам.',true);button.textContent='Вопрос отправлен';goals('question_success');
 }catch(err){display(qs,err.name==='AbortError'?'Сервер долго не отвечает. Повторите отправку.':err.message);asking=false;button.disabled=false;button.textContent='Отправить вопрос';goals('question_error')}
});
const situations={
 coffee:['«Без сигареты кофе уже не тот»','«Кофе остаётся. Пауза — моя»','Вкус кофе и время для себя не обязаны принадлежать сигарете.'],
 stress:['«Мне тяжело. Надо покурить»','«Мне нужна пауза, а не сигарета»','Отдых нужен по-настоящему. Сигарета — не единственный способ остановиться.'],
 one:['«Всего одну — и потом точно брошу»','«Желание — не приказ»','Можно заметить внутренний торг и выбрать другое действие.']
};
document.querySelectorAll('[data-situation]').forEach(button=>button.addEventListener('click',()=>{
 const item=situations[button.dataset.situation];if(!item)return;
 document.querySelectorAll('[data-situation]').forEach(x=>x.setAttribute('aria-pressed',String(x===button)));
 document.getElementById('thought-old').textContent=item[0];
 document.getElementById('thought-new').textContent=item[1];
 document.getElementById('thought-detail').textContent=item[2];
}));
async function checkReturn(){
 const p=new URLSearchParams(location.search),result=p.get('payment_result'),id=p.get('orderId');
 if(!result||!id||!/^MBT-ai_album-[a-zA-Z0-9-]+$/.test(id))return;
 const title=document.getElementById('result-title'),copy=document.getElementById('result-copy');openDialog(dialogs.result);
 const clean=()=>{const url=new URL(location.href);url.searchParams.delete('payment_result');url.searchParams.delete('orderId');history.replaceState({},'',url.pathname+url.search+url.hash)};
 if(result==='fail'){title.textContent='Оплата не завершена';copy.textContent='Банк не подтвердил платёж. Можно повторить покупку.';clean();return}
 for(let i=0;i<8;i++){
 try{const data=await request(STATUS_API+'?orderId='+encodeURIComponent(id),{headers:{Accept:'application/json'},cache:'no-store'});
 if(data.confirmed&&data.plan==='ai_album'&&Number(data.amount)===price){title.textContent='Оплата подтверждена';copy.textContent='Спасибо! Ссылку на 12 треков отправим на указанную почту в течение 24 часов после оплаты. Если не успеем — полностью вернём деньги.';goals('payment_success');clean();return}
 if(data.failed){title.textContent='Платёж не завершён';copy.textContent='Банк не подтвердил оплату.';clean();return}
 }catch(_){}
 await new Promise(ok=>setTimeout(ok,1500));
 }
 title.textContent='Проверяем платёж';copy.textContent='Результат ещё не подтверждён. Если деньги списались, сохраните подтверждение банка и свяжитесь с нами через форму вопроса.';
}
checkReturn();

/* Genuine demo fragment from the existing 2026-10-08 MP3.
 Only the first ten seconds are unlocked. Other titles remain unavailable. */
const demoAudio=document.getElementById('g-demo-audio');
const demoButtons=[...document.querySelectorAll('[data-demo-play]')];
const demoLimit=10;
let demoRunning=false;
function renderDemo(){
 if(!demoAudio)return;
 const sec=Math.min(demoLimit,Math.max(0,demoAudio.currentTime||0));
 document.querySelectorAll('[data-demo-time]').forEach(n=>n.textContent=String(Math.floor(sec)).padStart(2,'0')+' / 10');
 document.querySelectorAll('[data-demo-progress]').forEach(n=>n.style.width=(sec/demoLimit*100).toFixed(1)+'%');
 demoButtons.forEach(b=>{
  b.setAttribute('aria-pressed',String(demoRunning));
  const txt=b.querySelector('[data-play-label]');if(txt)txt.textContent=demoRunning?'Пауза':'▶ Послушать 10 секунд';
 });
 const ring=document.querySelector('[data-sound-ring]');if(ring)ring.classList.toggle('playing',demoRunning);
}
if(demoAudio){
 demoAudio.addEventListener('timeupdate',()=>{
  if(demoAudio.currentTime>=demoLimit-0.02){demoAudio.pause();demoAudio.currentTime=0;demoRunning=false}
  renderDemo()
 });
 demoAudio.addEventListener('pause',()=>{demoRunning=false;renderDemo()});
 demoAudio.addEventListener('play',()=>{demoRunning=true;renderDemo()});
 demoAudio.addEventListener('ended',()=>{demoRunning=false;renderDemo()});
 demoAudio.addEventListener('error',()=>{
  demoRunning=false;demoButtons.forEach(b=>{b.disabled=true;const t=b.querySelector('[data-play-label]');if(t)t.textContent='Демо недоступно'});
 });
 demoButtons.forEach(b=>b.addEventListener('click',async()=>{
  if(!demoAudio.paused){demoAudio.pause();return}
  if(demoAudio.currentTime>=demoLimit)demoAudio.currentTime=0;
  try{await demoAudio.play();goals('demo_play')}catch(_){const el=document.querySelector('[data-audio-error]');if(el)el.hidden=false}
 }));
 renderDemo();
}
const calc=document.getElementById('savings-calc');
if(calc){
 const packs=calc.querySelector('[name="packs"]'),priceInput=calc.querySelector('[name="price"]');
 const out=calc.querySelector('[data-savings]'),perDay=calc.querySelector('[data-daily]'),perYear=calc.querySelector('[data-yearly]');
 const fmt=new Intl.NumberFormat('ru-RU',{maximumFractionDigits:0});
 function updateCalc(){
  const p=Math.min(5,Math.max(0,Number(packs.value)||0)),c=Math.min(1500,Math.max(0,Number(priceInput.value)||0));
  out.textContent=fmt.format(p*c*30)+' ₽';perDay.textContent=fmt.format(p*c)+' ₽';perYear.textContent=fmt.format(p*c*365)+' ₽';
 }
 [packs,priceInput].forEach(el=>el.addEventListener('input',updateCalc));updateCalc();
}
document.querySelectorAll('[data-moment]').forEach(b=>b.addEventListener('click',()=>{
 const moment=b.dataset.moment;
 const copy={
 coffee:{name:'Кофе остаётся',desc:'«Без сигареты кофе не тот» → «Кофе остаётся. Пауза — моя»',num:'02'},
 stress:{name:'Мне нужна пауза',desc:'Трек о напряжении после работы и разрешении себе отдыхать без перекура.',num:'04'},
 company:{name:'Компания остаётся',desc:'Беседа и люди важны сами по себе. Сигарета не обязана быть частью встречи.',num:'06'}
 }[moment];
 if(!copy)return;
 document.querySelectorAll('[data-moment]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
 document.querySelectorAll('[data-moment-title]').forEach(x=>x.textContent=copy.name);
 document.querySelectorAll('[data-moment-description]').forEach(x=>x.textContent=copy.desc);
 document.querySelectorAll('[data-moment-index]').forEach(x=>x.textContent=copy.num);
}));

})();
