import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
const root='http://127.0.0.1:18773';
const test=await readFile('ai/test/index.html','utf8');
const original=await readFile('ai/index.html','utf8');
assert.ok(original.includes('Научная логика подхода'),'Original /ai/ must stay untouched');
assert.ok(!test.includes('Научная логика подхода'),'Test first screen must not contain science kicker');
assert.ok(test.includes('href="https://marafon-metod.ru/ai/test/"'),'Test canonical must be unique');
assert.ok(test.includes('name="robots" content="noindex,nofollow"'),'Test variant should remain out of search indexing');
for(const p of ['ai/test/checkout.js','ai/test/offer.js','ai/test/goal-tracking.js']){
 new Function(await readFile(p,'utf8'));
}
assert.match(await readFile('ai/test/checkout.js','utf8'),/returnUrl:location\.origin\+'\/ai\/'/,'Bank return must use a backend-allowlisted URL');
const server=spawn('python3',['-m','http.server','18773','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 let ready=false;
 for(let i=0;i<60;i++){
  try{if((await fetch(root+'/ai/test/')).ok){ready=true;break}}catch(_){}
  await new Promise(r=>setTimeout(r,150));
 }
 assert.ok(ready,'Local static server did not start');
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const width of [360,390,1366]){
  const page=await browser.newPage({viewport:{width,height:844}});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route(/https:\/\/(?:eu-assets\.i\.posthog\.com|eu\.i\.posthog\.com|www\.clarity\.ms|mc\.yandex\.ru|www\.googletagmanager\.com|d2ol7oe51mr4n9\.cloudfront\.net)\//,route=>route.fulfill({status:200,contentType:'application/javascript',body:'/* stub */'}));
  await page.goto(root+'/ai/test/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.aiGoals));
  assert.equal(await page.locator('.ai-test-hero h1').count(),1);
  assert.match(await page.locator('.ai-test-hero h1').innerText(),/Бросьте курить,\s*просто слушая аудио\./);
  assert.match(await page.locator('.ai-test-hero .hero-priority').innerText(),/40 лет и больше/);
  assert.equal(await page.locator('.ai-test-audience').innerText(),'Для тех, кто курит много лет');
  assert.equal(await page.locator('.ai-test-simple').innerText(),'Без таблеток, пластырей и силы воли. Просто слушаете.');
  assert.equal(await page.locator('.ai-test-contents').innerText(),'Два альбома · 20 коротких аудиозаписей');
  assert.equal(await page.locator('.ai-test-price-from').innerText(),'от');
  assert.equal(await page.locator('.ai-test-price strong').innerText(),'1 990 ₽');
  assert.equal(await page.locator('.ai-test-price-context').count(),0);
  assert.match((await page.locator('.ai-test-access').innerText()).replace(/\s+/g,' ').trim(),/^✓ Доступ сразу после оплаты$/);
  assert.equal(await page.locator('.ai-test-access strong').innerText(),'сразу');
  assert.equal(await page.locator('.ai-test-guarantee strong').innerText(),'30 дней');
  assert.match(await page.locator('.ai-test-guarantee').innerText(),/30 дней/);
  const fontInfo=await page.evaluate(()=>{
   const size=selector=>parseFloat(getComputedStyle(document.querySelector(selector)).fontSize);
   return {mechanism:size('.ai-test-mechanism'),access:size('.ai-test-access'),guarantee:size('.ai-test-guarantee'),tariffLink:size('.ai-test-look-at-tiers a')};
  });
  if(width<=390)assert.ok(Object.values(fontInfo).every(v=>v>=17), 'All mobile trust copy and tariff link must be readable: '+JSON.stringify(fontInfo));
  const heroTop=await page.locator('.ai-test-hero h1').evaluate(e=>e.getBoundingClientRect().top);
  assert.ok(heroTop>=75,'Header needs 1–2 lines of breathing room above it: '+heroTop);
  assert.match(await page.locator('.ai-test-mechanism').innerText(),/курить больше не хочется/);
  assert.ok((await page.locator('.ai-test-mechanism').innerText()).length<175,'Keep mechanism short enough to reveal cover earlier');
  assert.equal(await page.locator('.album-cover img').count(),2,'Keep album covers');
  assert.equal(await page.locator('[data-price-card]').count(),3,'Keep all tariffs');
  assert.equal(await page.locator('[data-annual-savings]').count(),1,'Keep yearly savings panel');
  assert.equal(await page.locator('.ai-test-look-at-tiers').count(),1,'No duplicate quiet links');
  assert.equal(await page.locator('.ai-test-hero .ai-test-look-at-tiers a').innerText(),'Смотреть тарифы →');
  assert.equal(await page.locator('.ai-test-look-at-tiers a').evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(0, 0, 0, 0)','The first-screen journey link must have no colored CTA background');
  const offsets=await page.evaluate(()=>{
   const top=x=>document.querySelector(x).getBoundingClientRect().top+scrollY;
   return {link:top('.ai-test-look-at-tiers'),cover:top('.album-display--one .album-cover'),mechanism:top('.ai-test-mechanism')};
  });
  console.log('Hero layout',width,JSON.stringify(offsets));
  assert.ok(offsets.mechanism<offsets.link && offsets.link<offsets.cover,'Quiet link must come directly after mechanism and before cover');
  if(width<=390)assert.ok(offsets.cover<844,'First album cover should still start within initial 844px mobile viewport at '+width+'px: '+offsets.cover);
  const screen=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth}));
  assert.ok(screen.scrollWidth<=screen.clientWidth+2,'Horizontal overflow at '+width+': '+JSON.stringify(screen));
  await page.locator('.ai-test-look-at-tiers a').click();
  assert.equal(new URL(page.url()).hash,'#pricing');
  await page.locator('[data-select-plan="all"]').click();
  assert.equal(await page.locator('#predfinal-checkout-dialog').evaluate(el=>el.open),true,'Test page checkout drawer must open');
  await page.locator('#predfinal-checkout-dialog [data-sheet-close]').click();
  await page.locator('[data-calc-adjust="pack"][data-step="1"]').click();
  assert.equal(await page.locator('#smoking-calc-pack').inputValue(),'210');
  assert.equal(await page.locator('[data-smoking-days]').innerText(),'15');
  assert.ok(errors.length===0,'Browser JavaScript errors at '+width+': '+errors.join('; '));
  console.log('PASS test variant at',width,'px — hero, covers, quiet tariff link, checkout, calculator, no JS error or overflow');
  await page.close();
 }
 console.log('PASS /ai/ original content unchanged; variant scripts parsed; bank return points to backend-allowlisted /ai/');
}finally{
 await browser?.close();
 server.kill();
}
