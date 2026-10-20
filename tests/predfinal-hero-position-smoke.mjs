// Geometry regression: keep first album cover at EXACT baseline Y while changing only hero copy.
// Baseline is the site's last commit before the hero reorganization.
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const baselineCommit='5256a7dc2ffa73ed1acec0e486c491decdc71cb8';
const reference='predfinal/hero-position-reference-local.html';
const base='http://127.0.0.1:18768/predfinal/';
const server=spawn('python3',['-m','http.server','18768','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function ready(){
 for(let n=0;n<50;n++){
  try{if((await fetch(base)).ok)return}catch{}
  await sleep(120);
 }
 throw new Error('Static site unavailable');
}
async function positions(page){
 return await page.evaluate(()=>{
  const box=selector=>{const el=document.querySelector(selector);if(!el)throw Error('Missing '+selector);const r=el.getBoundingClientRect();return {top:r.top+scrollY,bottom:r.bottom+scrollY,height:r.height,left:r.left,width:r.width}};
  const heading=box('#top h1'),priority=document.querySelector('.hero-priority')?box('.hero-priority'):null;
  return {heading,priority,lead:box('.hero-lead'),cover:box('.album-display--one .album-cover'),image:box('.album-display--one img'),hero:box('#top'),album:box('#albums'),viewportWidth:innerWidth,scrollWidth:document.documentElement.scrollWidth};
 });
}
try{
 const previous=execFileSync('git',['show',baselineCommit+':predfinal/index.html'],{encoding:'utf8'});
 await fs.writeFile(reference,previous);
 await ready();
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const result=[];
 for(const width of [320,360,375,390,430,768,1024,1440]){
  const ctx=await browser.newContext({viewport:{width,height:1000},deviceScaleFactor:1});
  const previousPage=await ctx.newPage();const currentPage=await ctx.newPage();
  await previousPage.goto(base+'hero-position-reference-local.html',{waitUntil:'domcontentloaded'});
  await currentPage.goto(base,{waitUntil:'domcontentloaded'});
  await Promise.all([previousPage.evaluate(()=>document.fonts?.ready),currentPage.evaluate(()=>document.fonts?.ready)]);
  const old=await positions(previousPage),now=await positions(currentPage);
  const diff=Math.round((now.cover.top-old.cover.top)*10)/10;
  result.push({width,oldY:old.cover.top,newY:now.cover.top,delta:diff,heroOld:old.hero.height,heroNew:now.hero.height,priorityY:now.priority?.top});
  assert.ok(now.priority&&now.priority.top>=now.heading.bottom-1,'Prominent 40+ caption must follow headline at '+width);
  assert.ok(now.priority.bottom<now.lead.top+1,'Secondary message must follow emphasis at '+width);
  assert.ok(now.scrollWidth<=width+2,'No horizontal overflow at '+width);
  assert.ok(Math.abs(diff)<=2,'First album cover MOVED at '+width+'px: '+JSON.stringify(result.at(-1)));
  await ctx.close();
 }
 console.log('PASS: Cover stays at baseline coordinates, headline/40+ priority/secondary text in order, no horizontal overflow.');
 console.log(JSON.stringify(result,null,2));
}catch(error){console.error('FAIL: '+(error.stack||String(error)));process.exitCode=1}
finally{await browser?.close();server.kill('SIGTERM');await fs.rm(reference,{force:true})}
