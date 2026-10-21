import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
const config=JSON.parse(await readFile('ai/goals.json','utf8'));
assert.equal(config.goals.length,68);
const expectedIds=new Set(config.goals.map(x=>x.id));
assert.equal(expectedIds.size,68);
assert.equal(new Set(config.goals.map(x=>x.name)).size,68);
for(const p of ['ai/goal-tracking.js','predfinal/offer.js','predfinal/checkout.js'])new Function(await readFile(p,'utf8'));
const markup=await readFile('ai/index.html','utf8');
assert.match(markup,/\/ai\/goal-tracking\.js\?v=20261020-semantic-v2/);
const child=spawn('python3',['-m','http.server','18770','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 let ready=false;
 for(let i=0;i<65;i++){
  try{if((await fetch('http://127.0.0.1:18770/ai/')).ok){ready=true;break}}catch(_){}
  await new Promise(resolve=>setTimeout(resolve,100));
 }
 assert.ok(ready,'test server unavailable');
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:390,height:844}});
 const failures=[];
 page.on('pageerror',err=>failures.push(err.message));
 await page.route(/https:\/\/(eu-assets\.i\.posthog\.com|www\.clarity\.ms|mc\.yandex\.ru|www\.googletagmanager\.com)\//,route=>route.fulfill({status:200,contentType:'application/javascript',body:'/* test analytics stub; no real network events */'}));
 await page.goto('http://127.0.0.1:18770/ai/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>!!window.aiGoals);
 await page.evaluate(()=>{
  window.__goals=[];
  window.ym=(counter,verb,id,props)=>{if(verb==='reachGoal')window.__goals.push({id,props})};
  window.gtag=()=>{};
  window.posthog={capture:()=>{}};
 });
 const occurred=async id=>{
  try{
   await page.waitForFunction(target=>window.__goals.some(x=>x.id===target),id,{timeout:2000});
   return true;
  }catch(_){return false}
 };
 const counts=async id=>page.evaluate(target=>window.__goals.filter(x=>x.id===target).length,id);

 // Real DOM interactions from every visible section.
 await page.locator('.album-tracklist-details[data-album="1"] summary').click();
 assert.ok(await occurred('ai_album1_tracks'),'Tracklist goal not emitted');
 await page.locator('[data-favorite-genre="author"]').click();
 assert.ok(await occurred('ai_guitar_like'),'Favorite goal missing');
 await page.locator('[data-favorite-genre="author"]').click();
 assert.ok(await occurred('ai_guitar_unlike'),'Unfavorite missing');
 await page.locator('.faq details').first().locator('summary').click();
 assert.ok(await occurred('ai_faq_how'),'FAQ open missing');
 // Default is illustrative (20 cigarettes, 200 rubles/pack), then sticky personalization.
 const savings=page.locator('[data-smoking-equivalent]');
 const readDays=async()=>await savings.locator('[data-smoking-days]').allTextContents();
 const annual=page.locator('[data-annual-savings]');
 const annualRubles=async()=>String(await annual.locator('[data-annual-savings-amount]').textContent()).replace(/[\s\u00A0\u202F]+/g,' ').trim();
 const cigarettes=page.locator('#smoking-calc-cigarettes');
 const pack=page.locator('#smoking-calc-pack');
 assert.equal(await cigarettes.inputValue(),'20');
 assert.equal(await pack.inputValue(),'200');
 assert.deepEqual(await readDays(),['10','15','23'],'Default payback periods must reflect 200 RUB/day');
 assert.ok((await savings.first().innerText()).includes('В среднем за ≈'));
 assert.equal(await annualRubles(),'73 000 ₽');
 assert.match(await annual.locator('[data-annual-savings-title]').innerText(),/В среднем/);
 assert.equal(await page.locator('#smoking-savings h2').textContent(),'Расчётный пример расходов на сигареты');
 await page.locator('#smoking-savings [data-calc-adjust="pack"][data-step="1"]').click();
 await page.waitForTimeout(60);
 assert.ok(await occurred('ai_calculator_changed'),'Calculator change missing');
 assert.equal(await pack.inputValue(),'210');
 assert.equal(await page.locator('#smoking-savings h2').textContent(),'Ваши расходы на сигареты');
 assert.deepEqual(await readDays(),['10','15','22'],'Adjusting pack price must update every tier');
 assert.equal(await annualRubles(),'76 650 ₽');
 assert.ok((await savings.first().innerText()).startsWith('За ≈'),'First edit must switch payback copy to personal');
 assert.match(await annual.locator('[data-annual-savings-title]').innerText(),/ваших расходах/);
 await cigarettes.fill('10');
 await pack.fill('200');
 assert.deepEqual(await readDays(),['20','30','45'],'Personalized card values must recompute at 10 cigarettes/day');
 assert.equal(await annualRubles(),'36 500 ₽');
 await cigarettes.fill('');
 assert.deepEqual(await readDays(),['—','—','—'],'Invalid inputs must not show fictitious saving periods');
 assert.equal(await annualRubles(),'—');
 await cigarettes.fill('20');
 assert.deepEqual(await readDays(),['10','15','23']);
 assert.equal(await annualRubles(),'73 000 ₽');
 assert.ok((await savings.first().innerText()).startsWith('За ≈'),'Wording must remain personal even after restoring defaults');
 assert.doesNotMatch(await annual.locator('[data-annual-savings-title]').innerText(),/В среднем/);
 const rect=await annual.boundingBox();
 assert.ok(rect&&rect.width<391,'Yearly savings panel fits mobile viewport');
 await page.locator('.sound-showcase-action a').click();
 assert.ok(await occurred('ai_to_pricing_demo'),'Demo CTA missing');
 await page.locator('[data-select-plan="all"]').click();
 assert.ok(await occurred('ai_plan_2990_click'),'2990 plan not captured');
 assert.ok(await occurred('ai_checkout_open'),'Checkout open missing');
 await page.locator('#predfinal-checkout-email').fill('smoke@example.invalid');
 await page.locator('#predfinal-checkout-email').blur();
 assert.ok(await occurred('ai_checkout_email_valid'),'Valid email boolean missing');
 await page.locator('#predfinal-checkout-dialog [data-sheet-close]').click();
 assert.ok(await occurred('ai_checkout_closed'),'Close without purchase not emitted');
 await page.locator('[data-select-plan="one"]').click();
 assert.ok(await occurred('ai_plan_1990_click'),'1990 plan not emitted');
 await page.locator('input[name="genre"][value="estrada"]').check();
 assert.ok(await occurred('ai_checkout_genre_estrada'),'Checkout genre missing');
 await page.locator('#predfinal-checkout-dialog [data-sheet-close]').click();
 await page.locator('[data-select-plan="duo"]').click();
 assert.ok(await occurred('ai_plan_4490_click'),'4490 plan not emitted');
 await page.locator('#predfinal-checkout-dialog [data-sheet-close]').click();

 // Seeking instantly to 90% MUST NOT produce either listened milestone.
 await page.evaluate(()=>{
  const a=document.querySelector('[data-audio-preview="author"] audio');
  let time=0;
  Object.defineProperty(a,'currentTime',{configurable:true,get:()=>time,set:v=>{time=v}});
  Object.defineProperty(a,'paused',{configurable:true,get:()=>false});
  a.dispatchEvent(new Event('play'));
  a.dispatchEvent(new Event('seeking'));
  time=35;
  a.dispatchEvent(new Event('seeked'));
  a.dispatchEvent(new Event('timeupdate'));
 });
 assert.equal(await counts('ai_guitar_50'),0,'Seeking wrongly counted as 50%');
 assert.equal(await counts('ai_guitar_90'),0,'Seeking wrongly counted as 90%');
 await page.evaluate(()=>{
  const a=document.querySelector('[data-audio-preview="author"] audio');
  a.dispatchEvent(new Event('seeking'));
  a.currentTime=0;
  a.dispatchEvent(new Event('seeked'));
  a.dispatchEvent(new Event('play'));
  for(let x=0.3;x<36;x+=0.3){
   a.currentTime=x;
   a.dispatchEvent(new Event('timeupdate'));
  }
 });
 assert.ok(await occurred('ai_guitar_50'),'Natural continuous playback missing 50%');
 assert.ok(await occurred('ai_guitar_90'),'Natural continuous playback missing 90%');
 assert.equal(await counts('ai_guitar_50'),1,'50% should only be counted once');
 assert.equal(await counts('ai_guitar_90'),1,'90% should only be counted once');

 // Backend-confirmed events are mapped to unique plan goals (without calling a real bank).
 await page.evaluate(()=>{
  window.aiGoals.fromLegacy('predfinal_payment_create',{plan:'audio_pair_all'});
  window.aiGoals.fromLegacy('predfinal_payment_created',{plan:'audio_pair_all'});
  window.aiGoals.fromLegacy('predfinal_bank_redirect',{plan:'audio_pair_all'});
  window.aiGoals.fromLegacy('predfinal_payment_success',{plan:'audio_pair_all'});
  window.aiGoals.fromLegacy('predfinal_payment_failed',{plan:'audio_pair_all'});
  window.aiGoals.fromLegacy('predfinal_payment_error',{plan:'audio_pair_all'});
  window.aiGoals.fromLegacy('predfinal_question_success',{location:'faq'});
 });
 for(const key of ['ai_pay_click_2990','ai_order_created_2990','ai_bank_redirect_2990',
   'ai_purchase_2990','ai_bank_payment_failed','ai_order_create_error','ai_question_sent']){
  assert.ok(await occurred(key),'Missing semantic goal '+key);
 }
 // Metadata names and the event list must align, no unexpected goal IDs.
 const emitted=await page.evaluate(()=>window.__goals.filter(x=>x.id.startsWith('ai_')).map(x=>x.id));
 assert.ok(emitted.length>15,'Unusually few events captured');
 for(const id of emitted)assert.ok(expectedIds.has(id),'Unknown goal '+id);
 assert.deepEqual(failures,[],'Browser threw an error');
 console.log('PASS: 68 catalog entries; DOM, UX, all tiers, checkout, bank verification mapping, 50/90 real-playback-seeking guard; no external analytics or payments.');
}finally{
 await browser?.close();
 child.kill('SIGTERM');
}
