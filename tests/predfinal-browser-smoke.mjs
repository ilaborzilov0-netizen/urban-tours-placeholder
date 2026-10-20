// Browser-level no-charge checkout and question smoke test for /predfinal/.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const SITE='http://127.0.0.1:18765';
const PAYMENT_HOST='ilaborzilov0-netizen-metod-payment-test-0305.twc1.net';
const PRICE={audio_pair_one:199000,audio_pair_all:299000,audio_pair_duo:449000};
let purchases=[],leads=[];
const server=spawn('python3',['-m','http.server','18765','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function ready(){
 for(let i=0;i<50;i++){
  try{
   const response=await fetch(SITE+'/predfinal/');
   if(response.ok)return;
  }catch(_){}
  await delay(100);
 }
 throw new Error('Static server did not become ready.');
}
try{
 await ready();
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:390,height:844}});
 await context.route('**/mc.yandex.ru/**',r=>r.abort());
 await context.route('https://securepay.tinkoff.ru/mock/demo',r=>r.fulfill({
  status:200,contentType:'text/html',body:'<html><body>Mock bank, no charge</body></html>'
 }));
 await context.route('https://'+PAYMENT_HOST+'/**',async route=>{
  const req=route.request(),url=new URL(req.url());
  const headers={
   'access-control-allow-origin':SITE,
   'access-control-allow-methods':'GET,POST,OPTIONS',
   'access-control-allow-headers':'Content-Type,Accept',
   'content-type':'application/json'
  };
  const json=(payload,status=200)=>route.fulfill({status,headers,body:JSON.stringify(payload)});
  if(req.method()==='OPTIONS')return route.fulfill({status:204,headers,body:''});
  if(url.pathname==='/api/payment/plans')return json({
   ok:true,service:'audio-pair-checkout',testMode:false,build:'predfinal-three-tiers-20261020-v2',tariffs:PRICE
  });
  if(url.pathname==='/api/payment/create'){
   const data=req.postDataJSON();purchases.push(data);
   const amount=PRICE[data.plan];
   if(!amount)return json({ok:false,code:'UNKNOWN_PLAN',error:'Неизвестный тариф'},400);
   return json({ok:true,plan:data.plan,amount,orderId:'MBT-'+data.plan+'-20261020-demo',
    paymentUrl:'https://securepay.tinkoff.ru/mock/demo',genre:data.plan==='audio_pair_one'?data.genre:'all'});
  }
  if(url.pathname==='/api/payment/status'){
   const id=url.searchParams.get('orderId')||'';
   const plan=Object.keys(PRICE).find(p=>id.startsWith('MBT-'+p+'-'));
   return json({ok:true,orderId:id,plan,amount:PRICE[plan],confirmed:true,
    failed:false,customerEmailSent:true});
  }
  if(url.pathname==='/api/leads'){
   const data=req.postDataJSON();leads.push(data);
   return json({ok:true,received:true,notified:true,leadId:'MBL-mock'});
  }
  return json({ok:false,error:'unmocked route'},404);
 });
 async function load(){const p=await context.newPage();await p.goto(SITE+'/predfinal/',{waitUntil:'domcontentloaded'});return p}
 const page=await load();
 assert.equal(await page.locator('[data-select-plan]').count(),3,'Three price cards required');
 assert.equal(await page.locator('[data-open-question]').count(),3,'Pricing, FAQ and footer question CTAs required');
 assert.equal(await page.locator('.author-contact-title').textContent(),'Есть вопрос? Напишите мне, разберёмся.');
 const lastInvitation=page.locator('#start-today');
 assert.equal(await lastInvitation.count(),1);
 assert.equal((await lastInvitation.locator('h2').innerText()).replace(/\\s+/g,' ').trim(),'Ещё десять лет с сигаретой начинаются с «брошу потом».');
 assert.equal(await lastInvitation.locator('p').innerText(),'Начните с прослушивания сегодня.');
 assert.equal(await lastInvitation.locator('a').count(),1,'The final section must have only one CTA');
 assert.equal(await lastInvitation.locator('a').innerText().then(t=>t.replace('↗','').trim()),'Послушать фрагменты');
 assert.equal(await lastInvitation.locator('a').getAttribute('href'),'#sounds');
 const blockOrder=await page.locator('main > section, main + footer').evaluateAll(nodes=>nodes.map(e=>e.id||e.className));
 assert.ok(blockOrder.indexOf('start-today')>blockOrder.findIndex(v=>v.includes('section')),'CTA must be within the main after other content');
 const faqBottom=await page.locator('.predfinal-faq-contact').evaluate(e=>e.getBoundingClientRect().bottom+scrollY);
 const finalTop=await lastInvitation.evaluate(e=>e.getBoundingClientRect().top+scrollY);
 assert.ok(finalTop>=faqBottom,'The final invitation should be after FAQ');
 await lastInvitation.locator('a').click();
 assert.equal(new URL(page.url()).hash,'#sounds','Final CTA should navigate back to demo');

 const orderedNodes=await page.locator('#pricing').locator('#smoking-savings, .pricing, .predfinal-pricing-contact, .copyright-under-pricing').evaluateAll(nodes=>nodes.map(node=>node.id||node.className));
 assert.deepEqual(orderedNodes,['smoking-savings','pricing','predfinal-pricing-contact','copyright-under-pricing']);
 const equivalents=page.locator('[data-smoking-equivalent]');
 assert.equal(await equivalents.count(),3);
 const days=async()=>await equivalents.locator('[data-smoking-days]').allTextContents();
 assert.deepEqual(await days(),['8','12','18']);
 assert.equal(await page.locator('[data-calc-daily]').textContent(),'250 ₽ в день');
 const cigarettes=page.locator('#smoking-calc-cigarettes');
 const packPrice=page.locator('#smoking-calc-pack');
 await cigarettes.fill('10');
 assert.deepEqual(await days(),['16','24','36'],'All three tariffs must recalculate from 10 cigarettes/day');
 await packPrice.fill('200');
 assert.deepEqual(await days(),['20','30','45'],'Tariff days must recompute from the user-entered pack price');
 assert.equal(await page.locator('[data-calc-daily]').textContent(),'100 ₽ в день');
 await page.locator('[data-calc-adjust="cigarettes"][data-step="1"]').click();
 assert.deepEqual(await days(),['19','28','41'],'Plus button must recalculate without submit');
 await cigarettes.fill('');
 assert.deepEqual(await days(),['—','—','—'],'Empty input should never leave misleading comparison values');
 await cigarettes.fill('20');
 await packPrice.fill('250');
 assert.deepEqual(await days(),['8','12','18'],'Defaults return after editing');
 const calcBox=await page.locator('#smoking-savings').boundingBox();
 assert.ok(calcBox&&calcBox.width<=391,'Compact calculator must fit 390px viewport');
 await page.locator('[data-style="estrada"]').click();
 await page.locator('[data-select-plan="one"]').click();
 const checkout=page.locator('#predfinal-checkout-dialog');
 await checkout.waitFor({state:'visible'});
 assert.equal(await checkout.evaluate(el=>el.open),true);
 const checkoutText=(await checkout.innerText()).replace(/\\s+/g,' ');
 assert.ok(checkoutText.includes('Получить')&&checkoutText.includes('аудиоякоря.'));
 assert.ok(checkoutText.includes('Один платёж. Без подписки.'));
 assert.ok(checkoutText.includes('Ваш комплект'));
 assert.ok(!/тестовый|демоверсия|заглушка|создаём заказ|тарифы на сервере|информация о доступе отправляется отдельно/i.test(checkoutText),'No technical or temporary content in public checkout');
 assert.equal(await checkout.locator('input[name=email]').getAttribute('placeholder'),'Укажите ваш email');
 assert.equal(await checkout.locator('.predfinal-order-recap').evaluate(el=>getComputedStyle(el).backgroundColor),'rgba(0, 0, 0, 0)','Checkout recap must be open text, not a green card');
 assert.equal(await checkout.evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(17, 19, 18)','The payment sheet must use the minimal dark design');
 await page.waitForFunction(()=>!document.querySelector('#predfinal-checkout-form [type=submit]').disabled);
 const payButtonRect=await checkout.locator('[type=submit]').boundingBox();
 assert.ok(payButtonRect&&payButtonRect.y+payButtonRect.height<844,'Primary CTA must be visible on a 390x844 mobile screen');
 const headerRect=await checkout.locator('h2').boundingBox();
 const priceRect=await checkout.locator('.predfinal-order-recap').boundingBox();
 assert.ok(headerRect&&priceRect&&headerRect.y+headerRect.height<priceRect.y,'Checkout hierarchy must be title then pricing');
 assert.equal(await page.locator('[data-checkout-price]').textContent(),'1 990 ₽');
 assert.equal(await page.locator('[name=genre][value=estrada]').isChecked(),true);
 const geometry=await checkout.boundingBox();
 assert.ok(geometry&&geometry.x>=-1&&geometry.width<=391,'Mobile sheet must fit viewport');
 await page.locator('#predfinal-checkout-email').fill('buyer@example.org');
 await page.locator('#predfinal-checkout-form [type=submit]').click();
 await page.waitForURL('**/mock/demo');
 assert.equal(purchases.length,1);
 assert.equal(purchases[0].plan,'audio_pair_one');
 assert.equal(purchases[0].genre,'estrada');
 assert.equal(purchases[0].email,'buyer@example.org');
 await page.close();
 const pageAll=await load();
 await pageAll.locator('[data-select-plan="all"]').click();
 await pageAll.locator('#predfinal-checkout-dialog').waitFor({state:'visible'});
 await pageAll.waitForFunction(()=>!document.querySelector('#predfinal-checkout-form [type=submit]').disabled);
 assert.equal(await pageAll.locator('[data-checkout-price]').textContent(),'2 990 ₽');
 assert.equal(await pageAll.locator('[data-checkout-genre]').isHidden(),true);
 await pageAll.keyboard.press('Escape');
 assert.equal(await pageAll.locator('#predfinal-checkout-dialog').evaluate(el=>el.open),false);
 await pageAll.locator('.predfinal-faq-contact [data-open-question]').click();
 assert.equal(await pageAll.locator('#predfinal-question-dialog').evaluate(el=>el.open),true);
 await pageAll.keyboard.press('Escape');
 assert.equal(await pageAll.locator('#predfinal-question-dialog').evaluate(el=>el.open),false);
 await pageAll.locator('footer [data-open-question]').click();
 await pageAll.locator('#predfinal-question-dialog').waitFor({state:'visible'});
 await pageAll.locator('#predfinal-question-contact').fill('buyer@example.org');
 await pageAll.locator('#predfinal-question-message').fill('Подойдёт ли программа при большом стаже?');
 await pageAll.locator('#predfinal-question-form [type=submit]').click();
 await pageAll.locator('#predfinal-question-status').getByText('Вопрос отправлен.',{exact:false}).waitFor();
 assert.equal(leads.length,1);
 assert.equal(leads[0].formType,'mobile_question');
 assert.equal(leads[0].contact,'buyer@example.org');
 await pageAll.close();
 const pageDuo=await load();
 await pageDuo.locator('[data-select-plan="duo"]').click();
 await pageDuo.waitForFunction(()=>!document.querySelector('#predfinal-checkout-form [type=submit]').disabled);
 assert.equal(await pageDuo.locator('[data-checkout-price]').textContent(),'4 490 ₽');
 await pageDuo.locator('#predfinal-checkout-email').fill('duo@example.org');
 await pageDuo.locator('#predfinal-checkout-form [type=submit]').click();
 await pageDuo.waitForURL('**/mock/demo');
 assert.equal(purchases.length,2);
 assert.equal(purchases[1].plan,'audio_pair_duo');
 await pageDuo.close();
 const returned=await context.newPage();
 await returned.goto(SITE+'/predfinal/?payment_result=success&orderId=MBT-audio_pair_all-20261020-demo',{waitUntil:'domcontentloaded'});
 await returned.locator('#predfinal-result-heading').getByText('Оплата подтверждена').waitFor();
 assert.match(await returned.locator('#predfinal-result-message').textContent(),/Письмо.*отправлено/);
 await returned.close();
 const narrow=await browser.newPage({viewport:{width:320,height:640}});
 await narrow.route('https://'+PAYMENT_HOST+'/**',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,service:'audio-pair-checkout',build:'predfinal-three-tiers-20261020-v2',testMode:false,tariffs:PRICE})}));
 await narrow.goto(SITE+'/predfinal/',{waitUntil:'domcontentloaded'});
 await narrow.locator('[data-select-plan="one"]').click();
 const narrowDialog=narrow.locator('#predfinal-checkout-dialog');
 await narrowDialog.waitFor({state:'visible'});
 assert.ok(await narrowDialog.locator('button[data-sheet-close]').isVisible(),'Close button should be visible on narrow screens');
 const layout=await narrowDialog.evaluate(el=>({sheetWidth:el.getBoundingClientRect().width,viewportWidth:innerWidth,scrollWidth:el.scrollWidth,clientWidth:el.clientWidth,scrollHeight:el.scrollHeight,clientHeight:el.clientHeight}));
 assert.ok(layout.sheetWidth<=321&&layout.scrollWidth<=layout.clientWidth+2,'320px drawer must have no horizontal overflow');
 assert.ok(layout.scrollHeight>=layout.clientHeight,'Short screen needs vertical scrolling, never clipped inaccessible form content');
 await narrow.close();
 console.log('PASS: clean dark payment drawer, no temporary copy, legible pricing and CTA on mobile, 1990/2990/4490 tiers and verified bank-return stub. No real charges.');
}catch(error){
 console.error('FAIL:',error.stack||error);
 process.exitCode=1;
}finally{
 await browser?.close();
 server.kill('SIGTERM');
}
