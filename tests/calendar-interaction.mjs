import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { JSDOM, VirtualConsole } from 'jsdom';

const html=await fs.readFile('календарь/index.html','utf8');
const script=await fs.readFile('календарь/calendar.js','utf8');
const flush=()=>new Promise(resolve=>setTimeout(resolve,35));

async function runScenario(apiAvailable){
  const errors=[], calls=[], virtualConsole=new VirtualConsole();
  virtualConsole.on('jsdomError',error=>errors.push(error.message));
  const dom=new JSDOM(html,{url:'https://marafon-metod.ru/календарь/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole});
  const w=dom.window,d=w.document;
  w.HTMLElement.prototype.scrollIntoView=function(){};
  const OriginalDate=w.Date;
  w.Date=class extends OriginalDate{static now(){return OriginalDate.parse('2026-11-02T12:00:00+03:00');}};
  if(!w.AbortSignal.timeout)w.AbortSignal.timeout=()=>new w.AbortController().signal;
  const slots=['2026-11-05','2026-11-06'].flatMap(date=>['11:00','16:30','19:30'].map(time=>({
    date,time,id:date+'T'+time+':00+03:00',available:true
  })));
  w.fetch=async (url,opts={})=>{
    calls.push({url,method:opts.method||'GET'});
    if(url.endsWith('/api/consultation/slots')){
      if(!apiAvailable)return {ok:false,status:404,json:async()=>({})};
      return {ok:true,status:200,json:async()=>({ok:true,timezone:'Europe/Moscow',slots})};
    }
    if(url.endsWith('/api/leads'))return {ok:true,status:200,json:async()=>({ok:true,received:true,leadId:'test-only-not-sent'})};
    if(url.endsWith('/api/consultation/book')){
      const body=JSON.parse(opts.body);
      return {ok:true,status:200,json:async()=>({ok:true,booked:true,slot:body.slot,leadId:'test-only-not-sent'})};
    }
    throw Error('Unexpected request '+url);
  };
  w.eval(script);
  await flush();
  assert.deepEqual(errors,[],'No browser exceptions after script initialisation');
  const days=[...d.querySelectorAll('#calendar-dates button')];
  assert.equal(days.length,2,'Both dates must be visible before choosing a day');
  assert.equal(days.every(x=>!x.disabled),true,'Two future date cards must remain clickable');
  assert.equal(d.querySelector('#calendar-time-stage').hidden,true,'Time stage initially hidden');
  assert.equal(d.querySelector('#calendar-form').hidden,true,'Contact stage initially hidden');
  days[0].click();
  assert.deepEqual(errors,[],'Choosing a date must not crash the script');
  assert.equal(d.querySelector('#calendar-time-stage').hidden,false,'Times appear after choosing date');
  assert.equal(d.querySelectorAll('#calendar-times button').length,3,'Three slots appear for selected day');
  assert.ok(d.querySelector('#calendar-dates button.is-active .cal-date-check'),'Selected day has a checkmark');
  const secondDay=d.querySelectorAll('#calendar-dates button')[1];
  secondDay.click();
  assert.ok(d.querySelector('#calendar-dates button:nth-child(2).is-active'),'Second date can be selected');
  assert.equal(d.querySelector('#calendar-form').hidden,true,'Form stays hidden until a time is chosen');
  d.querySelector('#calendar-times button').click();
  assert.equal(d.querySelector('#calendar-form').hidden,false,'Contact form shown after choosing time');
  assert.match(d.querySelector('#calendar-selected').textContent,/пятница.*11:00/i);
  assert.equal(d.querySelector('#calendar-fallback-hint').hidden,apiAvailable);
  assert.match(d.querySelector('#calendar-submit').textContent,apiAvailable?/Занять это время/:/Отправить запрос/);
  const form=d.querySelector('#calendar-form');
  form.elements.name.value='Тестовый клиент';
  form.elements.contact.value='+79998887766';
  form.elements.consent.checked=true;
  form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
  await flush();
  assert.deepEqual(errors,[],'Submission must not crash');
  assert.equal(d.querySelector('#calendar-success').hidden,false,'Success screen visible only after API acknowledgement');
  assert.match(d.querySelector('#calendar-success-title').textContent,apiAvailable?/Время закреплено/:/Запрос времени отправлен/);
  assert.equal(calls.filter(x=>x.method==='POST').length,1,'Exactly one submission');
  assert.match(calls.find(x=>x.method==='POST').url,apiAvailable?/\/api\/consultation\/book$/:/\/api\/leads$/);
  dom.window.close();
  console.log('PASS calendar UI: ',apiAvailable?'live booking backend':'fallback leads backend',
              '— day cards, slot reveal, contact reveal, submission, success state.');
}
await runScenario(false);
await runScenario(true);
