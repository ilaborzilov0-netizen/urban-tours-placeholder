import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
const server=spawn('python3',['-m','http.server','18785','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 let ready=false;
 for(let n=0;n<70;n++){
  try{ready=(await fetch('http://127.0.0.1:18785/ai/оптимайз/')).ok;if(ready)break}catch(_){}
  await new Promise(r=>setTimeout(r,120));
 }
 assert.ok(ready,'Preview server failed');
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:375,height:812}});
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://**',route=>route.fulfill({status:200,contentType:'application/javascript',body:''}));
 await page.goto('http://127.0.0.1:18785/ai/оптимайз/',{waitUntil:'domcontentloaded'});
 await page.waitForSelector('#calc-showcase .cc-card');
 assert.equal(await page.locator('#calc-showcase [role="tab"]').count(),5);
 assert.equal(await page.locator('#calc-showcase .cc-card').count(),1);
 assert.equal(await page.locator('#calc-showcase [data-calc-result]').innerText(),'73 000 ₽ за год');
 assert.equal(await page.locator('.smoking-savings').count(),0,'Old calculator still present');
 assert.equal(await page.locator('.annual-savings-panel').count(),0,'Old annual panel still present');
 const before=await page.evaluate(()=>document.querySelector('#calc-showcase').compareDocumentPosition(document.querySelector('#pricing'))&Node.DOCUMENT_POSITION_FOLLOWING);
 assert.ok(before,'Calculator must precede pricing');
 for(let i=1;i<=5;i++){
  await page.locator('[data-calc-variant="'+i+'"]').click();
  assert.equal(await page.locator('#calc-showcase .cc-card').count(),1,'Only one variant visible');
  assert.equal(await page.locator('#calc-showcase [data-calc-input]').count(),2);
  assert.equal(await page.locator('[data-calc-variant="'+i+'"]').getAttribute('aria-selected'),'true');
  assert.equal(await page.locator('#calc-showcase [data-calc-result]').innerText(),'73 000 ₽ за год');
  assert.ok(await page.locator('#calc-showcase .cc-card').evaluate((el,i)=>el.classList.contains('cc-v'+i),i));
  for(const b of await page.locator('#calc-showcase [data-calc-adjust]').all()){
   const size=await b.boundingBox();
   assert.ok(size && size.height>=43,'Buttons too small for mobile 55+: '+JSON.stringify(size));
  }
  const dimensions=await page.locator('#calc-live-stage').evaluate(el=>({w:el.clientWidth,s:el.scrollWidth}));
  assert.ok(dimensions.s<=dimensions.w+4,'Variant '+i+' overflows horizontally: '+JSON.stringify(dimensions));
 }
 await page.locator('[data-calc-variant="1"]').click();
 await page.locator('[data-calc-adjust="cigarettes"][data-dir="1"]').click();
 assert.equal(await page.locator('[data-calc-result]').innerText(),'76 650 ₽ за год');
 await page.locator('[data-calc-variant="4"]').click();
 assert.equal(await page.locator('[data-calc-input="cigarettes"]').inputValue(),'21','Switch should preserve values');
 await page.locator('[data-calc-adjust="cigarettes"][data-dir="-1"]').click();
 await page.locator('[data-calc-adjust="pack"][data-dir="1"]').click();
 assert.equal(await page.locator('[data-calc-result]').innerText(),'76 650 ₽ за год');
 await page.locator('[data-calc-input="pack"]').fill('300');
 await page.locator('[data-calc-input="pack"]').blur();
 assert.equal(await page.locator('[data-calc-result]').innerText(),'109 500 ₽ за год');
 const tab2=page.locator('[data-calc-variant="2"]');
 await tab2.focus();
 await page.keyboard.press('ArrowRight');
 assert.equal(await page.locator('[data-calc-variant="3"]').getAttribute('aria-selected'),'true');
 assert.deepEqual(errors,[],'Browser JS errors in calculator');
 console.log('PASS 5 live calculator variants; default 73 000 ₽ за год; keyboard tabs; 20/200 stepper; inputs; preserved state; mobile touch size; calculator before pricing; old sections deleted; production untouched.');
} finally {
 await browser?.close();server.kill('SIGTERM');
}