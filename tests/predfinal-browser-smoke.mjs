// Browser-level no-charge checkout and question smoke test for /predfinal/.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const SITE='http://127.0.0.1:18765';
const PAYMENT_HOST='ilaborzilov0-netizen-metod-payment-test-0305.twc1.net';
const PRICE={audio_pair_one:99000,audio_pair_all:149000,audio_pair_duo:249000};
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
   ok:true,service:'audio-pair-checkout',testMode:false,tariffs:PRICE
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
 const orderedNodes=await page.locator('#pricing').locator('.predfinal-pricing-contact, .copyright-under-pricing, #smoking-savings').evaluateAll(nodes=>nodes.map(node=>node.className));
 assert.deepEqual(orderedNodes,['predfinal-pricing-contact','copyright-under-pricing','smoking-savings']);
 await page.locator('[data-style="estrada"]').click();
 await page.locator('[data-select-plan="one"]').click();
 const checkout=page.locator('#predfinal-checkout-dialog');
 await checkout.waitFor({state:'visible'});
 assert.equal(await checkout.evaluate(el=>el.open),true);
 await page.waitForFunction(()=>!document.querySelector('#predfinal-checkout-form [type=submit]').disabled);
 assert.equal(await page.locator('[data-checkout-price]').textContent(),'990 ₽');
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
 assert.equal(await pageAll.locator('[data-checkout-price]').textContent(),'1 490 ₽');
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
 assert.equal(await pageDuo.locator('[data-checkout-price]').textContent(),'2 490 ₽');
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
 console.log('PASS: mobile 390px, 990/1490/2490 tiers, selected genre, bank navigation stub, question receipt, Escape close, verified return. No real charges.');
}catch(error){
 console.error('FAIL:',error.stack||error);
 process.exitCode=1;
}finally{
 await browser?.close();
 server.kill('SIGTERM');
}
