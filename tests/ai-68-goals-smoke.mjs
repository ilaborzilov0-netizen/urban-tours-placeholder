// Optimized production /ai/ funnel: browser interactions with analytics and bank fully mocked.
// This never creates a real Metrika hit or a payment.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';

const catalog=JSON.parse(await readFile('ai/goals.json','utf8'));
assert.equal(catalog.counter_id,110906734);
assert.equal(catalog.goals.length,103);
const goalIds=new Set(catalog.goals.map(g=>g.id));
for(const id of [
 'ai_demo_view','ai_guitar_play','ai_guitar_50','ai_guitar_90','ai_guitar_complete',
 'ai_estrada_play','ai_estrada_50','ai_estrada_90',
 'ai_modern_play','ai_modern_50','ai_modern_90','ai_pricing_view',
 'ai_hero_tariffs_click','ai_checkout_open','ai_plan_2990_click',
 'ai_pay_click_2990','ai_order_created_2990','ai_bank_redirect_2990','ai_purchase_2990'
])assert.ok(goalIds.has(id),'Yandex goal missing from approved catalog: '+id);
for(const name of ['ai/goal-tracking.js','ai/оптимайз/pult.js','predfinal/checkout.js','ai/player-progress.js','analytics.js',
'ai/journey-core.js','ai/journey-views.js','ai/journey-actions.js'])new Function(await readFile(name,'utf8'));
const html=await readFile('ai/index.html','utf8');
assert.ok(html.includes('110906734')&&html.includes('G-J076WS14NV'));
assert.ok(html.includes('/ai/goal-tracking.js?v=20261022-new-player-v1'));
assert.ok(html.includes('id="opt-demo"'));
assert.ok(html.includes('href="#pricing"'));
assert.ok(html.includes('data-price-card="all"'));

const server=spawn('python3',['-m','http.server','18770','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try {
 let ready=false;
 for(let i=0;i<60;i++){try{if((await fetch('http://127.0.0.1:18770/ai/')).ok){ready=true;break}}catch(_){}await new Promise(r=>setTimeout(r,100));}
 assert.ok(ready,'Local test server unavailable');
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:390,height:844}});
 const pageErrors=[];
 page.on('pageerror',e=>pageErrors.push(e.message));
 // No real analytics requests, CDN traffic or real payments.
 await page.route('https://**',route=>route.fulfill({status:200,contentType:'application/javascript',body:'/* offline test */'}));
 await page.addInitScript(()=>{
  window.__goals=[];
  window.ym=(counter,verb,id,payload)=>{
   if(counter===110906734&&verb==='reachGoal')window.__goals.push({id,payload});
  };
  class MockAudio extends EventTarget{
   constructor(){super();this.currentTime=0;this.ended=false;this.paused=true;this.preload='none';this.src='';window.__mockDemoAudio=this;}
   load(){this.currentTime=0;this.ended=false;}
   play(){this.paused=false;this.dispatchEvent(new Event('play'));return Promise.resolve();}
   pause(){if(this.paused)return;this.paused=true;this.dispatchEvent(new Event('pause'));}
  }
  window.Audio=MockAudio;
 });
 await page.goto('http://127.0.0.1:18770/ai/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>typeof window.aiGoals?.emit==='function'&&typeof window.aiJourneyTrack==='function');
 await page.waitForSelector('[data-opt-play="author"]');
 assert.equal(await page.locator('#opt-demo .opt-line').count(),3);
 assert.equal(await page.locator('#opt-demo .opt-like').count(),0);
 const ids=async()=>page.evaluate(()=>window.__goals.map(x=>x.id));
 const occurs=async id=>(await ids()).includes(id);
 await page.locator('[data-opt-play="author"]').click();
 assert.ok(await occurs('ai_guitar_play'),'Real demo play must fire on confirmed play event');
 await page.evaluate(()=>{
  const a=window.__mockDemoAudio;
  for(let i=1;i<=38;i++){a.currentTime=i;a.dispatchEvent(new Event('timeupdate'));}
  a.ended=true;a.paused=true;a.dispatchEvent(new Event('ended'));
 });
 for(const id of ['ai_guitar_50','ai_guitar_90','ai_guitar_complete'])
  assert.ok(await occurs(id),'Guitar milestone missing: '+id);
 await page.locator('[data-opt-play="estrada"]').click();
 assert.ok(await occurs('ai_estrada_play'),'Estrada play goal missing');
 await page.locator('[data-opt-play="modern"]').click();
 assert.ok(await occurs('ai_modern_play'),'Modern play goal missing');
 assert.equal((await ids()).filter(x=>x==='ai_purchase_2990').length,0,'No purchase goal before a verified bank return');

 await page.locator('.hero-buy-cta').click();
 assert.ok(await occurs('ai_hero_tariffs_click'),'Main CTA click goal missing');
 await page.waitForTimeout(700);
 assert.ok(await occurs('ai_pricing_view'),'Pricing in-view goal missing');
 await page.locator('[data-select-plan="all"]').first().click();
 assert.ok(await occurs('ai_plan_2990_click'),'2990 tier click goal missing');
 assert.ok(await occurs('ai_checkout_open'),'Checkout-open goal missing');
 assert.equal(await page.locator('#predfinal-checkout-dialog').evaluate(el=>el.open),true);
 // Adapter sequence only: mocked messages, not a real bank or real purchase.
 await page.evaluate(()=>{
  for(const name of ['predfinal_payment_create','predfinal_payment_created','predfinal_bank_redirect','predfinal_payment_success'])
   window.aiGoals.fromLegacy(name,{plan:'audio_pair_all'});
 });
 const events=await ids();
 for(const id of ['ai_pay_click_2990','ai_order_created_2990','ai_bank_redirect_2990','ai_purchase_2990'])
  assert.ok(events.includes(id),'Missing ordered checkout signal: '+id);
 const ordered=['ai_plan_2990_click','ai_checkout_open','ai_pay_click_2990','ai_order_created_2990','ai_bank_redirect_2990','ai_purchase_2990'];
 for(let i=1;i<ordered.length;i++)assert.ok(events.indexOf(ordered[i-1])<events.indexOf(ordered[i]),'Wrong event order: '+ordered[i]);
 assert.deepEqual(pageErrors,[],'Browser JavaScript exceptions');
 console.log('PASS: three real UI demos + 50/90 milestones + hero CTA + pricing + checkout + mock verified-return adapter, in order. No external traffic.');
} finally {
 await browser?.close();
 server.kill('SIGTERM');
}
