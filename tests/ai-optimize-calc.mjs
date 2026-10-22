import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
const server=spawn('python3',['-m','http.server','18785','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try {
 let ready=false;
 for(let n=0;n<70;n++){
  try{ready=(await fetch('http://127.0.0.1:18785/ai/оптимайз/')).ok;if(ready)break}catch(_){}
  await new Promise(r=>setTimeout(r,120));
 }
 assert.ok(ready,'Preview server failed');
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const width of [375,390,320]){
  const page=await browser.newPage({viewport:{width,height:812}});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**',route=>route.fulfill({status:200,contentType:'application/javascript',body:''}));
  await page.goto('http://127.0.0.1:18785/ai/оптимайз/',{waitUntil:'domcontentloaded'});
  await page.waitForSelector('#calc-showcase .cc-v4');
  assert.equal(await page.locator('#calc-showcase .cc-card').count(),1);
  assert.equal(await page.locator('#calc-showcase [data-calc-variant]').count(),0);
  assert.equal(await page.locator('#calc-showcase .calc-tabs').count(),0);
  assert.equal(await page.locator('[data-calc-result]').innerText(),'73 000 ₽ за год');
  const positions=await page.evaluate(()=>{
   const nodes=['.pricing','.copyright-under-pricing','.predfinal-pricing-contact','.ai-refund-guarantee'];
   return nodes.map(s=>document.querySelector(s)?.getBoundingClientRect().top+window.scrollY??-1);
  });
  assert.ok(positions.every((x,i)=>x>=0&&(i===0||x>positions[i-1])),'Incorrect section order: '+positions);
  assert.equal(await page.locator('.copyright-under-pricing').count(),1);
  assert.equal(await page.locator('footer:has-text("© Аудиоякоря")').count(),0);
  assert.equal(await page.locator('.predfinal-pricing-contact .ai-question-prompt').innerText(),'Есть вопросы?');
  assert.equal(await page.locator('.predfinal-pricing-contact button').innerText(),'Напишите — разберёмся.');
  assert.equal(await page.locator('#calc-showcase [data-calc-input]').count(),2);
  for(const b of await page.locator('#calc-showcase [data-calc-adjust]').all()){
   const rect=await b.boundingBox();
   assert.ok(rect&&rect.height>=43,'Controls smaller than intended: '+JSON.stringify(rect));
  }
  const sizes=await page.locator('#calc-showcase').evaluate(el=>({client:el.clientWidth,scroll:el.scrollWidth}));
  assert.ok(sizes.scroll<=sizes.client+4,'Horizontal overflow at width '+width+': '+JSON.stringify(sizes));
  await page.locator('[data-calc-adjust="cigarettes"][data-dir="1"]').click();
  assert.equal(await page.locator('[data-calc-result]').innerText(),'76 650 ₽ за год');
  await page.locator('[data-calc-adjust="cigarettes"][data-dir="-1"]').click();
  await page.locator('[data-calc-adjust="pack"][data-dir="1"]').click();
  assert.equal(await page.locator('[data-calc-result]').innerText(),'76 650 ₽ за год');
  await page.locator('[data-calc-input="pack"]').fill('300');
  await page.locator('[data-calc-input="pack"]').blur();
  assert.equal(await page.locator('[data-calc-result]').innerText(),'109 500 ₽ за год');
  const contact=page.locator('.predfinal-pricing-contact [data-open-question]');
  await contact.click();
  await page.waitForTimeout(80);
  assert.equal(await page.locator('#predfinal-question-dialog').evaluate(el=>el.open),true,'Question dialog should open');
  assert.equal(await page.locator('#predfinal-question-heading').innerText(),'Напишите — разберёмся.');
  assert.deepEqual(errors,[],'JavaScript errors: '+errors);
  await page.close();
 }
 console.log('PASS: approved calculator 04 only; working savings, controls, tariff order -> copyright -> questions -> guarantee, contact dialog, mobile 320/375/390, no real payment.');
} finally {
 await browser?.close();
 server.kill('SIGTERM');
}
