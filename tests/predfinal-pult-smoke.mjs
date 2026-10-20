// Visual pult smoke: 5 complete variants with original four content sections.
// Purely local: no payment calls, no external source navigation.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';

const BASE='http://127.0.0.1:18766/predfinal/pult/';
const server=spawn('python3',['-m','http.server','18766','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
try{
 let alive=false;
 for(let n=0;n<45;n++){
  try{const response=await fetch(BASE);if(response.ok){alive=true;break}}catch(_){}
  await pause(120);
 }
 assert.equal(alive,true,'Pult static page not available');
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const cases=[390,1440];
 const expected=[
  'От концентрата опыта —',
  'Концентрат опыта',
  'Многократное возвращение к содержанию',
  'Что происходит физиологически',
  'Нейроны, которые часто работают вместе,',
  'Мозг просто экономит энергию',
  'Почему это работает даже в фоне',
  'Сознание может быть занято другим (работа, телевизор, дорога)',
  'Вам просто больше не хочется.',
  'Именно к такой свободе направлена программа «Аудиоякоря».'
 ];
 for(const width of cases){
  const page=await browser.newPage({viewport:{width,height:900}});
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  assert.equal(await page.locator('.pick').count(),5);
  assert.equal(await page.locator('.segment').count(),4);
  for(const sentence of expected)assert.ok((await page.locator('#story').innerText()).includes(sentence),'Original content missing '+sentence);
  for(let variant=1;variant<=5;variant++){
   await page.locator('[data-variant=v'+variant+']').click();
   assert.equal(await page.locator('#story').getAttribute('class'),'story v'+variant);
   assert.equal(await page.locator('.pick[aria-pressed=true]').count(),1);
   assert.equal(await page.locator('.segment').count(),4);
   const measured=await page.evaluate(()=>{
    const story=document.getElementById('story'),frame=document.getElementById('frame');
    const parts=[...document.querySelectorAll('.segment')];
    return {
     frame:frame.getBoundingClientRect().width,
     body:document.documentElement.scrollWidth,
     viewport:innerWidth,
     sections:parts.map(x=>x.getBoundingClientRect().height),
     opacity:getComputedStyle(story).opacity,
     background:getComputedStyle(story).backgroundColor
    };
   });
   assert.ok(measured.sections.every(h=>h>110),'Variant '+variant+' has a collapsed section');
   assert.ok(measured.body<=measured.viewport+3,'Unexpected horizontal overflow in variant '+variant+' at width '+width+': '+JSON.stringify(measured));
   if(width===1440){
    await page.locator('[data-screen=desktop]').click();
    const big=await page.locator('#frame').evaluate(el=>el.getBoundingClientRect().width);
    assert.ok(big>900,'Wide preview did not expand');
    await page.locator('[data-screen=mobile]').click();
    const small=await page.locator('#frame').evaluate(el=>el.getBoundingClientRect().width);
    assert.ok(small>=375&&small<=395,'Mobile preview width not 390px');
   }
  }
  await page.locator('[data-variant=v4]').click();
  await page.reload({waitUntil:'domcontentloaded'});
  assert.equal(await page.locator('#story').getAttribute('class'),'story v4','Variant should survive reload from ?v=');
  await page.close();
 }
 console.log('PASS: all five compositions, four original-content blocks, mobile 390px and desktop 1440px, switching, responsive widths, no horizontal overflow.');
}catch(e){
 console.error('FAIL:',e.stack||e);
 process.exitCode=1;
}finally{await browser?.close();server.kill('SIGTERM')}
