// No-charge responsive browser verification of the typography v4 rollout.
// Reads local /predfinal/ only, no lead submission or payment requests.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
const BASE='http://127.0.0.1:18767/predfinal/';
const server=spawn('python3',['-m','http.server','18767','--bind','127.0.0.1'],{stdio:'ignore'});
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let browser;
const expected={
 essence:[
 'От концентрата опыта —',
 'Главные выводы многолетней практики — коротко и по существу.',
 'Не лекция, которую нужно заставлять себя слушать, а музыка по душе.',
 'Знакомые куплеты и припевы снова возвращают к важным мыслям.',
 'Чтобы сигарета постепенно теряла прежнюю ценность и переставала казаться необходимой.'
 ],
 brain:[
 'Нейроны, которые часто работают вместе, начинают лучше «проводить» сигнал друг к другу.',
 'Связи между ними укрепляются (это называется синаптическая пластичность).',
 'Мозг просто экономит энергию и «убирает» то, чем редко пользуются.',
 'Почему это работает даже в фоне',
 'Мозг не всегда требует вашего полного внимания.',
 'Сознание может быть занято другим (работа, телевизор, дорога), а подсознание уже прокладывает новую дорогу.'
 ],
 freedom:[
 'Представьте: вы больше не бросаете курить.',
 'Вам просто больше не хочется.',
 'Кофе без перекура. Спокойный вечер без сигареты. Пачка, о которой вы забыли.',
 'Именно к такой свободе направлена программа «Аудиоякоря».'
 ]
};
try{
 let ready=false;for(let n=0;n<45;n++){try{const r=await fetch(BASE);if(r.ok){ready=true;break}}catch(_){}await wait(130)}
 assert.ok(ready,'Static /predfinal/ server unavailable');
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const width of [320,390,768,1440]){
  const page=await browser.newPage({viewport:{width,height:900}});
  await page.route('**/mc.yandex.ru/**',route=>route.abort());
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>document.fonts?.ready);
  const checks=await page.evaluate(()=>{
   const by=id=>document.getElementById(id);
   const style=el=>getComputedStyle(el);
   const color=sel=>style(document.querySelector(sel)).backgroundColor;
   const sections=[by('audio-path'),by('brain'),by('freedom')];
   const anatomy=document.querySelector('.brain-physiology');
   const bg=document.querySelector('.brain-background');
   const panel=document.querySelector('.freedom-vision-panel');
   const cols=document.querySelector('.brain-explainer-body');
   const first=document.querySelector('.audio-loop-step');
   const firstNum=document.querySelector('.audio-loop-index');
   const stepped=document.querySelector('.audio-loop-steps');
   const allText=el=>el.textContent.replace(/\s+/g,' ').trim();
   return {
    width:innerWidth, scrollWidth:document.documentElement.scrollWidth,
    markers:sections.map(el=>el.classList.contains('typographic-chain')),
    text:{
     essence:allText(by('audio-path')),
     brain:allText(by('brain')),
     freedom:allText(by('freedom'))
    },
    firstFont:parseFloat(style(document.querySelector('.audio-loop-heading h2')).fontSize),
    finaleFont:parseFloat(style(document.querySelector('.freedom-vision h2')).fontSize),
    numberFont:parseFloat(style(firstNum).fontSize),
    firstGrid:style(first).display,
    listBorder:style(stepped).borderTopWidth,
    numberRadius:style(firstNum).borderRadius,
    articleBg:style(anatomy).backgroundColor,
    articleBorder:style(anatomy).borderTopWidth,
    layout:style(cols).display,
    physBorder:style(document.querySelector('.brain-physiology-points li')).borderTopWidth,
    markerContent:style(document.querySelector('.brain-physiology-points li'),'::before').content,
    backgroundRule:style(bg).borderLeftWidth,
    contextCount:document.querySelectorAll('.brain-background-contexts span').length,
    finalePanelBg:style(panel).backgroundColor,
    finalePanelBorder:style(panel).borderLeftWidth,
    scenesCount:document.querySelectorAll('.freedom-vision-scenes span').length,
    reviewCount:document.querySelectorAll('.review').length,
    audioCount:document.querySelectorAll('audio').length,
    planCount:document.querySelectorAll('[data-select-plan]').length,
    contactCount:document.querySelectorAll('[data-open-question]').length,
    sceneText:allText(document.querySelector('.freedom-vision-scenes'))
   };
  });
  assert.equal(checks.markers.join(','),'true,true,true');
  for(const [group,phrases] of Object.entries(expected)){
   for(const phrase of phrases){
    const source=group==='freedom'&&phrase.startsWith('Кофе без перекура.')?checks.sceneText:checks.text[group];
    assert.ok(source.includes(phrase),'Missing full original wording '+phrase);
   }
  }
  assert.ok(checks.scrollWidth<=width+2,'Horizontal overflow at '+width+': '+JSON.stringify(checks));
  assert.ok(checks.firstFont>=32,'Hero typography not enlarged at '+width);
  assert.ok(checks.finaleFont>=32,'Outcome typography not enlarged at '+width);
  assert.ok(checks.numberFont>=30,'Steps not oversized indexes at '+width);
  assert.equal(checks.firstGrid,'grid');
  assert.ok(parseFloat(checks.listBorder)>=2,'Open step rail missing at '+width);
  assert.equal(checks.numberRadius,'0px');
  assert.equal(checks.articleBorder,'0px','Physiology must be unboxed');
  assert.equal(checks.layout,'block','Physiology and background should stack, not share columns');
  assert.equal(checks.physBorder,'1px');
  assert.ok(['none','normal'].includes(checks.markerContent),'Physiology should have no dot bullets');
  assert.equal(checks.backgroundRule,'4px');
  assert.equal(checks.contextCount,3);
  assert.equal(checks.finalePanelBorder,'0px');
  assert.equal(checks.scenesCount,3);
  assert.equal(checks.reviewCount,3);
  assert.equal(checks.audioCount,3);
  assert.equal(checks.planCount,3);
  assert.equal(checks.contactCount,3);
  console.log('PASS: Typography variant 4 '+width+'px; copy, line rules, open layout, panels, flow and commerce preserved');
  await page.close();
 }
}catch(err){
 console.error('FAIL:',err.stack||err);
 process.exitCode=1;
}finally{await browser?.close();server.kill('SIGTERM')}
