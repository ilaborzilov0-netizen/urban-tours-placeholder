import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
const config=JSON.parse(await readFile('ai/goals.json','utf8'));
assert.equal(config.goals.length,68);
const expectedIds=new Set(config.goals.map(x=>x.id));
assert.equal(expectedIds.size,68);
assert.equal(new Set(config.goals.map(x=>x.name)).size,68);
for(const p of ['ai/goal-tracking.js','ai/player-progress.js','predfinal/checkout.js'])new Function(await readFile(p,'utf8'));
const markup=await readFile('ai/index.html','utf8');
assert.match(markup,/\/ai\/goal-tracking\.js\?v=20261020-semantic-v2/);
 assert.match(markup,/\/ai\/player-progress\.js\?v=20261021-percent-no-seek-v1/);
 assert.equal((markup.match(/<progress class="sound-progress"/g)||[]).length,3);
 assert.ok(!markup.includes('class="sound-seek"'), 'Original must have no seek input');
 assert.ok(!markup.includes('0:00 /'), 'Original must show percent instead of elapsed time');
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
 assert.equal(await savings.count(),1,'Only featured 2990 package can show days-to-savings');
 assert.equal(await page.locator('[data-price-card="one"] .tier-smoking-equivalent').count(),0,'No payback box in first package');
 assert.equal(await page.locator('[data-price-card="duo"] .tier-smoking-equivalent').count(),0,'No payback box in third package');
 assert.equal(await page.locator('[data-price-card="all"] .tier-smoking-equivalent').count(),1,'Keep dynamic payback in featured package');
 assert.deepEqual(await readDays(),['15'],'Default featured payback must reflect 200 RUB/day');
 assert.match(await savings.first().innerText(),/^Комплект окупится за ≈15 дней без сигарет\.$/);
 assert.equal(await annualRubles(),'73 000 ₽');
 assert.match(await annual.locator('[data-annual-savings-title]').innerText(),/В среднем/);
 assert.equal(await page.locator('#smoking-savings h2').textContent(),'Расчётный пример расходов на сигареты');
 await page.locator('#smoking-savings [data-calc-adjust="pack"][data-step="1"]').click();
 await page.waitForTimeout(60);
 assert.ok(await occurred('ai_calculator_changed'),'Calculator change missing');
 assert.equal(await pack.inputValue(),'210');
 assert.equal(await page.locator('#smoking-savings h2').textContent(),'Ваши расходы на сигареты');
 assert.deepEqual(await readDays(),['15'],'Adjusting pack price must update only the featured tier');
 assert.equal(await annualRubles(),'76 650 ₽');
 assert.match(await savings.first().innerText(),/^Комплект окупится за ≈15 дней без сигарет\.$/,'Text must not change after editing; only the number changes');
 assert.match(await annual.locator('[data-annual-savings-title]').innerText(),/ваших расходах/);
 await cigarettes.fill('10');
 await pack.fill('200');
 assert.deepEqual(await readDays(),['30'],'Personalized featured payback must recompute at 10 cigarettes/day');
 assert.match(await savings.first().innerText(),/^Комплект окупится за ≈30 дней без сигарет\.$/);
 assert.equal(await annualRubles(),'36 500 ₽');
 await cigarettes.fill('');
 assert.deepEqual(await readDays(),['—'],'Invalid input must not show a fictitious featured saving period');
 assert.equal(await annualRubles(),'—');
 await cigarettes.fill('20');
 assert.deepEqual(await readDays(),['15']);
 assert.equal(await annualRubles(),'73 000 ₽');
 assert.match(await savings.first().innerText(),/^Комплект окупится за ≈15 дней без сигарет\.$/,'Returning to defaults preserves concise copy');
 assert.doesNotMatch(await annual.locator('[data-annual-savings-title]').innerText(),/В среднем/);
 const rect=await annual.boundingBox();
 assert.ok(rect&&rect.width<391,'Yearly savings panel fits mobile viewport');
 // Both contact paths are two lines. Only the second line opens the question sheet.
 assert.equal(await page.locator('.predfinal-faq-contact').count(),0,'FAQ must end without the redundant contact block');
 assert.equal(await page.locator('.author-contact-title').innerText(),'Есть вопрос? Напишите мне, разберёмся.','Author section must remain unchanged');
 for(const selector of ['.predfinal-pricing-contact','.predfinal-final-contact']){
  const block=page.locator(selector);
  assert.equal(await block.locator('.ai-question-prompt').innerText(),'Есть вопрос?');
  assert.equal(await block.locator('[data-open-question]').innerText(),'Напишите мне — разберёмся.');
  assert.equal(await block.locator('button').count(),1,'Only the second line should be clickable');
  const styles=await block.locator('[data-open-question]').evaluate(el=>({align:getComputedStyle(el).textAlign,underline:getComputedStyle(el).textDecorationLine}));
  assert.equal(styles.align,'center','Question link must be centered');
  assert.ok(styles.underline.includes('underline'),'Question link must be underlined');
 }
 // Refund reassurance must be visible in all four placements and actually explain how to request it.
 const guarantee=page.locator('#guarantee');
 assert.equal(await page.locator('.hero-refund-guarantee').count(),1,'First screen refund reassurance');
 assert.match(await page.locator('.hero-refund-guarantee').innerText(),/100%.*30 дней/);
 assert.equal(await page.locator('.price-refund-note').count(),3,'Every plan needs the same two-line note');
 for(const note of await page.locator('.price-refund-note').all()){
  assert.equal(await note.locator('.price-access-note').innerText(),'Доступ сразу после оплаты');
  assert.equal(await note.locator('.price-return-note').innerText(),'Возврат 100% в течение 30 дней');
  assert.ok((await note.locator('.price-access-note').evaluate(el=>getComputedStyle(el).display))==='block');
  assert.ok((await note.locator('.price-return-note').evaluate(el=>getComputedStyle(el).display))==='block');
 }
 assert.equal(await guarantee.count(),1);
 assert.match(await guarantee.locator('h3').innerText(),/30 дней гарантии.*100%/);
 assert.match(await guarantee.innerText(),/Без вопросов и объяснений/);
 const guaranteeRect=await guarantee.boundingBox();
 assert.ok(guaranteeRect && guaranteeRect.width<=391,'Guarantee block fits a 390px mobile screen');
 const guaranteeOrder=await page.locator('#pricing').locator('.pricing, #guarantee, [data-annual-savings]').evaluateAll(elements=>elements.map(e=>e.id||e.className));
 assert.deepEqual(guaranteeOrder,['pricing','guarantee','annual-savings-panel'],'Guarantee must be directly below all price cards');
 assert.equal(await page.locator('#guarantee-faq').count(),1);
 assert.equal(await page.locator('#guarantee-faq').evaluate(e=>e.open),false);
 await guarantee.locator('.ai-refund-more').click();
 assert.equal(await page.locator('#guarantee-faq').evaluate(e=>e.open),true,'How-to-refund link must expand FAQ');
 assert.equal(new URL(page.url()).hash,'#guarantee-faq');
 assert.match(await page.locator('#guarantee-faq').innerText(),/30 календарных дней/);
 assert.match(await page.locator('#guarantee-faq').innerText(),/100% стоимости комплекта/);
 assert.equal(await page.locator('#guarantee-faq a[href="https://t.me/metodborzilova"]').count(),1);
 assert.equal(await page.locator('#guarantee-faq a[href^="https://max.ru/"]').count(),1);
 const footerQuestion=page.locator('.predfinal-final-contact');
 const finalButton=page.locator('.predfinal-final-invitation-cta');
 const positions=await Promise.all([finalButton,footerQuestion,page.locator('footer')].map(el=>el.evaluate(node=>{const r=node.getBoundingClientRect();return {top:r.top+scrollY,bottom:r.bottom+scrollY}})));
 assert.ok(positions[0].bottom<=positions[1].top && positions[1].bottom<=positions[2].top,'Question must be below final CTA and above the footer');
 await footerQuestion.locator('[data-open-question]').click();
 assert.equal(await page.locator('#predfinal-question-dialog').evaluate(el=>el.open),true,'Final question opens existing drawer');
 assert.ok(await occurred('ai_question_open_faq'),'Keep the tracked after-FAQ question goal');
 await page.locator('#predfinal-question-dialog [data-sheet-close]').click();
 await page.locator('.predfinal-pricing-contact [data-open-question]').click();
 assert.equal(await page.locator('#predfinal-question-dialog').evaluate(el=>el.open),true,'Pricing question opens existing drawer');
 assert.ok(await occurred('ai_question_open_pricing'),'Keep pricing question goal');
 await page.locator('#predfinal-question-dialog [data-sheet-close]').click();
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

 // Read-only progress cannot be dragged, typed into, or clicked to seek; only the play/stop button controls the track.
 assert.equal(await page.locator('[data-audio-preview] progress.sound-progress').count(),3);
 assert.equal(await page.locator('[data-audio-preview] input[type="range"]').count(),0);
 for(const block of await page.locator('[data-audio-preview]').all()){
  const progress=block.locator('progress.sound-progress');
  assert.equal(await progress.getAttribute('max'),'100');
  assert.equal(await progress.getAttribute('value'),'0');
  assert.equal((await block.locator('.sound-elapsed').innerText()).trim(),'0%');
 }
 await page.evaluate(()=>{
  const audio=document.querySelector('[data-audio-preview="author"] audio');
  let current=0;
  Object.defineProperty(audio,'currentTime',{configurable:true,get:()=>current,set:v=>{current=v}});
  current=18.8;
  audio.dispatchEvent(new Event('timeupdate'));
 });
 assert.equal(await page.locator('[data-audio-preview="author"] progress').evaluate(e=>e.value),50);
 assert.equal(await page.locator('[data-audio-preview="author"] .sound-elapsed').innerText(),'50%');
 await page.evaluate(()=>{
  const audio=document.querySelector('[data-audio-preview="author"] audio');
  audio.currentTime=0;
  audio.dispatchEvent(new Event('timeupdate'));
 });
 assert.equal(await page.locator('[data-audio-preview="author"] .sound-elapsed').innerText(),'0%');
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
 console.log('PASS: 68 catalog entries; DOM, UX, all tiers, checkout, bank verification mapping, 50/90 real-playback-seeking guard and noninteractive percentage demo; no external analytics or payments.');
}finally{
 await browser?.close();
 child.kill('SIGTERM');
}
