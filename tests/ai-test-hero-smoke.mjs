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
 for(const width of [320,360,390,1366]){
  const page=await browser.newPage({viewport:{width,height:844}});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route(/https:\/\/(?:eu-assets\.i\.posthog\.com|eu\.i\.posthog\.com|www\.clarity\.ms|mc\.yandex\.ru|www\.googletagmanager\.com|d2ol7oe51mr4n9\.cloudfront\.net)\//,route=>route.fulfill({status:200,contentType:'application/javascript',body:'/* stub */'}));
  await page.goto(root+'/ai/test/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.aiGoals));
  assert.equal(await page.locator('.ai-test-hero h1').count(),1);
  assert.equal((await page.locator('.ai-test-hero h1').innerText()).replace(/\s+/g,' ').trim(),'Бросьте курить, просто слушая аудио.');
  assert.match(await page.locator('.ai-test-hero .hero-priority').innerText(),/40 лет и больше/);
  assert.equal(await page.locator('.ai-test-audience').innerText(),'Для тех, кто курит много лет');
  assert.equal(await page.locator('.ai-test-simple').innerText(),'Без таблеток, пластырей и силы воли.');
  assert.equal(await page.locator('.ai-test-contents').innerText(),'Два альбома · 20 коротких аудиозаписей');
  assert.equal(await page.locator('.ai-test-price-from').innerText(),'от');
  assert.equal(await page.locator('.ai-test-price strong').innerText(),'1 990 ₽');
  assert.equal(await page.locator('.ai-test-price-context').count(),0);
  assert.match((await page.locator('.ai-test-access').innerText()).replace(/\s+/g,' ').trim(),/^✓ Доступ сразу после оплаты$/);
  assert.equal(await page.locator('.ai-test-access .ai-test-emphasis').innerText(),'сразу');
  assert.equal(await page.locator('.ai-test-guarantee .ai-test-emphasis').innerText(),'30\u00a0дней');
  assert.match((await page.locator('.ai-test-guarantee').innerText()).replace(/\u00a0/g,' '),/30 дней/);
  const refundLayout=await page.locator('.ai-test-guarantee').evaluate(p=>{
   const mark=p.querySelector('.ai-test-emphasis');
   return {parentDisplay:getComputedStyle(p).display,markDisplay:getComputedStyle(mark).display,markWhiteSpace:getComputedStyle(mark).whiteSpace,refundWidth:p.getBoundingClientRect().width};
  });
  assert.equal(refundLayout.parentDisplay,'block','Refund must be a normal flowing paragraph, not flex');
  assert.equal(refundLayout.markDisplay,'inline','Highlighted phrase must stay inside its text flow');
  assert.equal(refundLayout.markWhiteSpace,'nowrap','30 days must remain together');
  const fontInfo=await page.evaluate(()=>{
   const size=selector=>parseFloat(getComputedStyle(document.querySelector(selector)).fontSize);
   return {mechanism:size('.album-display--one>.ai-test-mechanism'),access:size('.ai-test-access'),guarantee:size('.ai-test-guarantee'),tariffLink:size('.ai-test-look-at-tiers a')};
  });
  if(width<=390)assert.ok(Object.values(fontInfo).every(v=>v>=17), 'All mobile trust copy and tariff link must be readable: '+JSON.stringify(fontInfo));
  const title=await page.locator('.ai-test-hero h1').evaluate(e=>{
   const first=e.querySelector('.ai-test-title-main'),second=e.querySelector('.ai-test-title-rest');
   const measure=x=>{const box=x.getBoundingClientRect(),style=getComputedStyle(x);const probe=document.createRange();probe.selectNodeContents(x);const textBox=probe.getBoundingClientRect();return {font:parseFloat(style.fontSize),top:box.top,height:box.height,clientWidth:box.width,inkWidth:textBox.width,inkHeight:textBox.height,whiteSpace:style.whiteSpace,lines:Math.round(box.height/parseFloat(style.lineHeight))}};
   return {top:e.getBoundingClientRect().top,first:measure(first),second:measure(second),fullWidth:e.getBoundingClientRect().width};
  });
  console.log('Headline hierarchy',width,JSON.stringify(title));
  assert.ok(title.top>=90,'Header needs a top pause: '+JSON.stringify(title));
  assert.ok(title.first.font>title.second.font*1.45,'The first phrase must dominate the subtitle: '+JSON.stringify(title));
  if(width===360)assert.ok(title.first.font>=46,'360px main headline must be enlarged: '+title.first.font);
  if(width===390)assert.ok(title.first.font>=49,'390px main headline must be enlarged: '+title.first.font);
  if(width===1366)assert.ok(title.first.font>=98,'Desktop main headline must be enlarged: '+title.first.font);
  assert.equal(title.first.whiteSpace,'nowrap');
  assert.equal(title.second.whiteSpace,'nowrap');
  assert.equal(title.first.lines,1,'First phrase must occupy one line, not wrap: '+JSON.stringify(title));
  assert.equal(title.second.lines,1,'Second phrase must occupy one line, not wrap: '+JSON.stringify(title));
  assert.ok(title.first.inkWidth<=title.fullWidth+1&&title.second.inkWidth<=title.fullWidth+1,'Both headings must fit viewport, without clipping: '+JSON.stringify(title));
  assert.equal(await page.locator('.ai-test-group').count(),3);
  assert.equal(await page.locator('.ai-test-hero .ai-test-mechanism').count(),0,'No dense mechanism paragraph before first cover');
  assert.equal(await page.locator('.album-display--one > .ai-test-mechanism').count(),1,'Explanation belongs directly below first album cover');
  assert.match(await page.locator('.album-display--one > .ai-test-mechanism').innerText(),/курить больше не хочется/);
  const breaks=await page.evaluate(()=>{
   const rect=s=>document.querySelector(s).getBoundingClientRect();
   const gap=(a,b)=>rect(b).top-rect(a).bottom;
   return {
    first:gap('.ai-test-group--heading','.ai-test-group--offer'),
    second:gap('.ai-test-group--offer','.ai-test-group--trust'),
    inside:gap('.ai-test-simple','.ai-test-purchase-reassurance'),
    checkGap:gap('.ai-test-access','.ai-test-guarantee')
   };
  });
  assert.ok(breaks.first>=20&&breaks.second>=22,'Three groups need visible pauses: '+JSON.stringify(breaks));
  assert.ok(breaks.first>breaks.inside*1.5 && breaks.second>breaks.checkGap*1.5,'Groups must be spaced more than related statements: '+JSON.stringify(breaks));
  assert.equal(await page.locator('.album-cover img').count(),2,'Keep album covers');
  assert.equal(await page.locator('[data-price-card]').count(),3,'Keep all tariffs');
  assert.equal(await page.locator('[data-annual-savings]').count(),1,'Keep yearly savings panel');
  assert.equal(await page.locator('.ai-test-look-at-tiers').count(),1,'No duplicate quiet links');
  assert.equal(await page.locator('.ai-test-hero .ai-test-look-at-tiers a').innerText(),'Смотреть тарифы →');
  assert.equal(await page.locator('.ai-test-look-at-tiers a').evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(0, 0, 0, 0)','The first-screen journey link must have no colored CTA background');
  const offsets=await page.evaluate(()=>{
   const top=x=>document.querySelector(x).getBoundingClientRect().top+scrollY;
   return {
    trust:top('.ai-test-group--trust'),
    link:top('.ai-test-look-at-tiers'),
    cover:top('.album-display--one .album-cover'),
    mechanism:top('.album-display--one>.ai-test-mechanism'),
    coverBottom:document.querySelector('.album-display--one .album-cover').getBoundingClientRect().bottom+scrollY
   };
  });
  console.log('Hero layout',width,JSON.stringify(offsets));
  assert.ok(offsets.trust<offsets.link && offsets.link<offsets.cover && offsets.coverBottom<=offsets.mechanism,'Link precedes cover; description follows cover');
  if(width===320||width===360||width===390){
   const visible=844-offsets.cover;
   assert.ok(visible>=55&&visible<=115,'Cover should peek 60–100px, not compete with headline at '+width+'px: '+visible);
  }
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
