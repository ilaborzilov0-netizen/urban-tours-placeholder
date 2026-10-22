// Synthetic checkout / analytics smoke. ALL API requests are intercepted; no real order or payment.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
const html=await readFile('ai/index.html','utf8'),script=await readFile('ai/classic-goals.js','utf8');
const manifest=JSON.parse(await readFile('ai/classic-goals.json','utf8'));
assert.equal(manifest.goals.length,36);
const defined=new Set(manifest.goals.map(x=>x.id));
for(const id of ['hero_view','scroll_50','buy_hero','buy_order','buy_final','buy_demo','demo_play','demo_50','demo_90','demo_complete','checkout_open','pay_click','order_created','bank_redirect','paid','question_open','question_sent']){
 assert.ok(defined.has('ai_classic_'+id),id);
}
new Function(script);
assert.ok(html.includes('name="ai-landing-variant" content="classic-990-20261022"'));
assert.ok(html.includes('/ai/classic-goals.js?v=20261022-990-v1'));
assert.ok(html.includes('G-J076WS14NV')&&html.includes('/ai/posthog-init.js')&&html.includes('/analytics.js'));
assert.ok(html.includes('110906734')&&html.includes('aiClassicTracker.legacy'));
assert.ok(html.includes("Number(data.amount) !== ALBUM_PRICE * 100"));
const server=spawn('python3',['-m','http.server','18772','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 let ready=false;
 for(let i=0;i<50;i++){try{if((await fetch('http://127.0.0.1:18772/ai/')).ok){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,100))}
 assert.ok(ready);
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:390,height:844}});
 let captured=[],paymentRequest=null,questionRequest=null;
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.exposeBinding('__testGoal',(_source,counter,verb,name)=>{
  if(counter===110906734&&verb==='reachGoal')captured.push(name);
 });
 await page.addInitScript(()=>{
  window.ym=(...args)=>{if(typeof window.__testGoal==='function')window.__testGoal(...args);};
  window.posthog={__loaded:true,capture:()=>{}};
 });
 await page.route('https://**',route=>route.fulfill({status:200,contentType:'application/javascript',body:''}));
 await page.route('https://ilaborzilov0-netizen-metod-payment-test-0305.twc1.net/api/payment/create',async route=>{
  paymentRequest=route.request().postDataJSON();
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
   ok:true,plan:'ai_album',amount:99000,
   paymentUrl:'https://pay.tbank-online.com/mock',orderId:'MBT-ai_album-MOCK',paymentId:'MOCK'
  })});
 });
 await page.route('https://api.marafon-metod.ru/api/leads',async route=>{
  questionRequest=route.request().postDataJSON();
  await route.fulfill({status:200,contentType:'application/json',body:'{"ok":true,"received":true}'});
 });
 await page.goto('http://127.0.0.1:18772/ai/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>!!window.aiClassicTracker&&typeof window.aiClassicTracker.legacy==='function');
 await page.waitForTimeout(950);
 assert.ok(captured.includes('ai_classic_hero_view'),'hero view goal');
 // Check button provenance in real click path and email-only drawer.
 await page.locator('.hero [data-buy]').first().click();
 assert.ok(await page.locator('#purchase-dialog').evaluate(x=>x.open));
 assert.equal(await page.locator('#purchase-form [name=phone]').count(),0);
 assert.equal(await page.locator('#purchase-form [name=name]').count(),0);
 assert.ok(captured.includes('ai_classic_buy_hero'));
 assert.ok(captured.includes('ai_classic_checkout_open'));
 await page.locator('#purchase-form [name=email]').fill('mock@example.com');
 await page.locator('#purchase-form [name=email]').blur();
 assert.ok(captured.includes('ai_classic_email_valid'));
 await page.locator('#purchase-form button[type=submit]').click();
 await page.waitForTimeout(600);
 assert.ok(paymentRequest,'Payment POST must have been safely intercepted');
 assert.equal(paymentRequest.plan,'ai_album');
 assert.equal(paymentRequest.email,'mock@example.com');
 assert.equal(paymentRequest.name,undefined);
 assert.equal(paymentRequest.phone,undefined);
 assert.ok(captured.includes('ai_classic_pay_click'));
 assert.ok(captured.includes('ai_classic_order_created'));
 assert.ok(captured.includes('ai_classic_bank_redirect'));
 assert.ok(!captured.includes('ai_classic_paid'),'Never count purchase without verified bank return');
 console.log('MOCK_PAYMENT_SUCCESS',JSON.stringify({plan:paymentRequest.plan,amount:99000,hasEmail:true,neverBankCharged:true}));
 // Verify scroll-depth goals and actual listened-time milestones, including replays.
 const audioPage=await browser.newPage({viewport:{width:390,height:844}});
 let audioGoals=[];
 await audioPage.exposeBinding('__testGoal',(_source,counter,verb,name)=>{
  if(counter===110906734&&verb==='reachGoal')audioGoals.push(name);
 });
 await audioPage.addInitScript(()=>{window.ym=(...args)=>window.__testGoal(...args);window.posthog={__loaded:true,capture:()=>{}};});
 await audioPage.route('https://**',route=>route.fulfill({status:200,contentType:'application/javascript',body:''}));
 await audioPage.goto('http://127.0.0.1:18772/ai/',{waitUntil:'domcontentloaded'});
 await audioPage.waitForFunction(()=>!!window.aiClassicTracker);
 await audioPage.evaluate(()=>{
  const a=document.querySelector('#demo-audio');
  let current=0;
  Object.defineProperty(a,'currentTime',{configurable:true,get:()=>current,set:v=>{current=v}});
  Object.defineProperty(a,'paused',{configurable:true,get:()=>false});
  a.dispatchEvent(new Event('play'));
  for(let i=1;i<=60;i++){a.currentTime=i*.5;a.dispatchEvent(new Event('timeupdate'))}
  a.dispatchEvent(new Event('ended'));
  a.currentTime=0;a.dispatchEvent(new Event('play'));
  window.scrollTo(0,document.documentElement.scrollHeight);
 });
 await audioPage.waitForTimeout(300);
 for(const id of ['ai_classic_demo_play','ai_classic_demo_50','ai_classic_demo_90','ai_classic_demo_complete','ai_classic_scroll_25','ai_classic_scroll_50','ai_classic_scroll_75','ai_classic_scroll_90','ai_classic_scroll_100']){
  assert.ok(audioGoals.includes(id),'Missing playback or scroll goal: '+id);
 }
 assert.equal(audioGoals.filter(x=>x==='ai_classic_demo_play').length,2,'Repeated listens must be counted');
 assert.equal(audioGoals.filter(x=>x==='ai_classic_demo_50').length,1,'Half-heard reach should be one per session');
 assert.equal(audioGoals.filter(x=>x==='ai_classic_demo_90').length,1,'90%-heard reach should be one per session');
 console.log('DEMO_AND_SCROLL_GOALS_PASS',JSON.stringify({plays:2,realCoverageMilestones:[50,90],maxScrollDepth:100}));

 // Question request on separate page, also fully mocked.
 const q=await browser.newPage({viewport:{width:390,height:844}});
 let qCaptured=[];
 await q.exposeBinding('__testGoal',(_source,counter,verb,name)=>{if(counter===110906734&&verb==='reachGoal')qCaptured.push(name)});
 await q.addInitScript(()=>{window.ym=(...a)=>window.__testGoal(...a);window.posthog={__loaded:true,capture:()=>{}}});
 await q.route('https://**',route=>route.fulfill({status:200,contentType:'application/javascript',body:''}));
 await q.route('https://api.marafon-metod.ru/api/leads',async route=>{
  questionRequest=route.request().postDataJSON();
  await route.fulfill({status:200,contentType:'application/json',body:'{"ok":true,"received":true}'});
 });
 await q.goto('http://127.0.0.1:18772/ai/',{waitUntil:'domcontentloaded'});
 await q.waitForFunction(()=>!!window.aiClassicTracker);
 await q.locator('footer [data-question]').click();
 await q.locator('#question-form [name=email]').fill('mock@example.com');
 await q.locator('#question-form [name=question]').fill('Тестовый вопрос — запрос перехвачен');
 await q.locator('#question-form button[type=submit]').click();
 await q.waitForTimeout(250);
 assert.ok(questionRequest,'Question API must be intercepted');
 assert.equal(questionRequest.contactType,'email');
 assert.equal(questionRequest.contact,'mock@example.com');
 assert.equal(questionRequest.name,undefined);
 assert.equal(questionRequest.phone,undefined);
 assert.ok(qCaptured.includes('ai_classic_question_open'));
 assert.ok(qCaptured.includes('ai_classic_question_sent'));
 assert.equal(errors.length,0,errors.join('\n'));
 console.log('MOCK_QUESTION_SUCCESS',JSON.stringify({emailOnly:true,contactType:questionRequest.contactType,neverSubmittedLive:true}));
 console.log('CLASSIC_990_BROWSER_SMOKE_SUCCESS');
}finally{if(browser)await browser.close();server.kill();}
