import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
const server=spawn('python3',['-m','http.server','18779','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 for(let i=0;i<40;i++){try{if((await fetch('http://127.0.0.1:18779/ai/')).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:390,height:844}});
 await page.route(/https:\/\/(?:mc\.yandex\.ru|eu\.i\.posthog\.com|eu-assets\.i\.posthog\.com|www\.googletagmanager\.com|www\.clarity\.ms)\//,r=>r.fulfill({status:200,body:'/* offline */'}));
 await page.goto('http://127.0.0.1:18779/ai/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>typeof window.aiJourneyTrack==='function',{timeout:10000});
 await page.evaluate(()=>{window.__newGoals=[];window.ym=(c,v,id)=>{if(v==='reachGoal')__newGoals.push(id)}});
 await page.waitForTimeout(1000);
 assert.ok(await page.evaluate(()=>__newGoals.includes('ai_hero_view')));
 await page.locator('.ai-test-look-at-tiers a').click();
 assert.ok(await page.evaluate(()=>__newGoals.includes('ai_hero_tariffs_click')));
 await page.locator('#smoking-calc-cigarettes').fill('12');
 await page.waitForTimeout(550);
 assert.ok(await page.evaluate(()=>__newGoals.includes('ai_calculator_cigarettes_changed')));
 console.log('PASS: ordered journey loader and first-screen and calculator goals');
}finally{await browser?.close();server.kill()}
