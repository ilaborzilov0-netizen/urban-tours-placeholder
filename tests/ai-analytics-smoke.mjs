// /ai/ analytics smoke test; external collectors mocked so no fake production visits.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
const pageHtml=await fs.readFile('ai/index.html','utf8');
const install=await fs.readFile('ai/posthog-init.js','utf8');
const clarity=await fs.readFile('analytics.js','utf8');
const offer=await fs.readFile('predfinal/offer.js','utf8');
const checkout=await fs.readFile('predfinal/checkout.js','utf8');
assert.match(pageHtml,/src="\/ai\/posthog-init\.js\?v=20261020-prod1"/);
assert.match(pageHtml,/https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=G-J076WS14NV/);
assert.match(pageHtml,/gtag\('config','G-J076WS14NV'/);
assert.equal((pageHtml.match(/googletagmanager\.com\/gtag\/js/g)||[]).length,1);
assert.match(offer,/window\.gtag\?\.\('event',name,safe\)/);
assert.match(checkout,/window\.gtag\?\.\('event','predfinal_'\+name,safe\)/);
assert.match(pageHtml,/src="\/analytics\.js\?v=20261020-clarity-ai1"/);
assert.equal((pageHtml.match(/\/ai\/posthog-init.js\?/g)||[]).length,1);
assert.equal((pageHtml.match(/\/analytics.js\?v=20261020-clarity-ai1/g)||[]).length,1);
assert.match(clarity,/clarity\.ms\/tag/);
assert.match(clarity,/xpsxeyxojq/);
assert.match(install,/https:\/\/eu\.i\.posthog\.com/);
assert.match(install,/disable_session_recording:true/);
assert.match(install,/autocapture:false/);
assert.match(install,/person_profiles:"identified_only"/);
assert.match(install,/phc_[A-Za-z0-9_]{20,}/);
assert.ok(!/G-XXXXXXXX|INSERT_KEY|TEST_TOKEN|YOUR_CLARITY_ID/i.test(pageHtml+install));
assert.match(offer,/posthog\?\.capture\?\./);
assert.match(checkout,/posthog\?\.capture\?\./);
assert.match(pageHtml,/110906734/);
for(const source of [install,offer,checkout])new Function(source);
const server=spawn('python3',['-m','http.server','18769','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 let ready=false;
 for(let n=0;n<50;n++){
  try{if((await fetch('http://127.0.0.1:18769/ai/')).ok){ready=true;break}}catch(_){}
  await new Promise(resolve=>setTimeout(resolve,110));
 }
 assert.ok(ready);
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:390,height:844}});
 const requests=[];
 await page.route(/https:\/\/(eu-assets\.i\.posthog\.com|www\.clarity\.ms|mc\.yandex\.ru|www\.googletagmanager\.com)\//,async route=>{
  requests.push(route.request().url());
  await route.fulfill({status:200,contentType:'application/javascript',body:'/* analytics script intercepted by safe smoke test */'});
 });
 await page.goto('http://127.0.0.1:18769/ai/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>Array.isArray(window.posthog?._i) && window.posthog._i.length>0);
 await page.locator('[data-select-plan="all"]').first().click();
 const result=await page.evaluate(()=>{
  const collected=Array.from(window.posthog||[]).filter(e=>Array.isArray(e)&&e[0]==='capture').map(e=>e[1]);
  const initialized=window.posthog._i?.length>0;
  const ga4Events=(window.dataLayer||[]).filter(args=>args?.[0]==='event').map(args=>args[1]);
  const ga4Initialized=(window.dataLayer||[]).some(args=>args?.[0]==='config'&&args?.[1]==='G-J076WS14NV');
  return {initialized,collected,clarity:typeof window.clarity==='function',checkout:document.querySelector('#predfinal-checkout-dialog')?.open,ga4Events,ga4Initialized};
 });
 assert.equal(result.initialized,true);
 assert.equal(result.clarity,true);
 assert.equal(result.ga4Initialized,true,'GA4 stream not initialized');
 assert.ok(result.ga4Events.includes('predfinal_plan_select'),'GA4 did not receive selected-plan event');
 assert.ok(result.collected.includes('predfinal_plan_select'),JSON.stringify(result));
 assert.equal(result.checkout,true);
 await page.waitForTimeout(250);
 assert.ok(requests.some(u=>u.startsWith('https://eu-assets.i.posthog.com/')),'PostHog loader not requested');
 assert.ok(requests.some(u=>u.startsWith('https://www.clarity.ms/tag/xpsxeyxojq')),'Existing Clarity project loader not requested');
 assert.ok(requests.some(u=>u.startsWith('https://www.googletagmanager.com/gtag/js?id=G-J076WS14NV')),'GA4 script not requested');
 await page.close();
 const unchanged=await browser.newPage();
 await unchanged.goto('http://127.0.0.1:18769/predfinal/',{waitUntil:'domcontentloaded'});
 assert.equal(await unchanged.evaluate(()=>typeof window.posthog),'undefined','PostHog should only load for /ai/');
 assert.equal(await unchanged.evaluate(()=>typeof window.gtag),'undefined','GA4 should only load for /ai/');
 await unchanged.close();
 console.log('PASS: /ai/ initializes EU PostHog, existing Clarity, Google Analytics 4 and Yandex goals. No production events sent.');
}catch(e){console.error('FAIL:',e.stack||e);process.exitCode=1}
finally{await browser?.close();server.kill('SIGTERM')}
