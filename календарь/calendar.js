'use strict';
(() => {
  const API='https://api.marafon-metod.ru';
  const DIRECT_MAX='https://max.ru/u/f9LHodD0cOLpevOEzdPM7DBn_9wNoZiKdBMryxkSM2b4SpNmf4xagvVkl8g';
  const box=document.getElementById('calendar');
  const datesEl=document.getElementById('calendar-dates');
  const timesEl=document.getElementById('calendar-times');
  const timesStage=document.getElementById('calendar-time-stage');
  const timeNote=document.getElementById('calendar-time-note');
  const form=document.getElementById('calendar-form');
  const selectedText=document.getElementById('calendar-selected');
  const errorEl=document.getElementById('calendar-error');
  const infoEl=document.getElementById('calendar-info');
  const successEl=document.getElementById('calendar-success');
  const submit=document.getElementById('calendar-submit');
  const fallbackHint=document.getElementById('calendar-fallback-hint');
  const contact=document.getElementById('calendar-contact');
  const contactLabel=document.getElementById('calendar-contact-label');
  const days=[
    {date:'2026-11-05',label:'Четверг',day:'5 ноября'},
    {date:'2026-11-06',label:'Пятница',day:'6 ноября'}
  ];
  let slots=[],selectedDay='',selectedSlot='',busy=false,isFallback=true;
  const FALLBACK_TIMES=['11:00','16:30','19:30'];
  function fallbackSlots(){
    const now=Date.now();
    return days.flatMap(d=>FALLBACK_TIMES.map(time=>{
      const id=d.date+'T'+time+':00+03:00';
      return {id,date:d.date,time,available:Date.parse(id)>now+60*60_000};
    }));
  }
  slots=fallbackSlots();
  const channelLabel={max:'MAX',telegram:'Telegram',phone:'телефон'};
  const friendly=(slot)=>{const day=days.find(d=>d.date===slot.date);return (day?day.label+', '+day.day:slot.date)+' · '+slot.time+' МСК';};
  const clear=(el)=>{while(el.firstChild)el.removeChild(el.firstChild)};
  const showError=(message)=>{errorEl.textContent=message;errorEl.hidden=!message};
  const setInfo=(message)=>{infoEl.textContent=message;infoEl.hidden=!message};
  const make=(tag,css,text)=>{const el=document.createElement(tag);if(css)el.className=css;if(text!==undefined)el.textContent=text;return el};
  const link=document.getElementById('calendar-help-max');
  link.href=DIRECT_MAX;
  // The copied landing's call-to-action buttons take visitors to the inline calendar.
  document.querySelectorAll('[data-booking]').forEach((button)=>button.addEventListener('click',(event)=>{
    event.preventDefault(); box.scrollIntoView({behavior:'smooth',block:'start'});
    history.replaceState(null,'',location.pathname+location.search+'#calendar');
  }));
  const radios=Array.from(form.querySelectorAll('input[name=channel]'));
  const channel=()=>form.querySelector('input[name=channel]:checked').value;
  function updateContact(){
    const value=channel();
    contactLabel.textContent=value==='telegram'?'Ваш Telegram (@username или номер)':
      value==='max'?'Номер телефона в MAX':'Номер телефона';
    contact.placeholder=value==='telegram'?'@username или +7 999 123-45-67':'+7 999 123-45-67';
    contact.autocomplete=value==='telegram'?'off':'tel';
    contact.inputMode=value==='telegram'?'text':'tel';
  }
  radios.forEach(r=>r.addEventListener('change',updateContact));
  updateContact();
  function renderDates(){
    clear(datesEl);
    for(const d of days){
      const todaySlots=slots.filter(s=>s.date===d.date&&s.available);
      const btn=make('button','cal-date'+(d.date===selectedDay?' is-active':''),'');
      btn.type='button';btn.disabled=todaySlots.length===0;
      btn.setAttribute('aria-pressed',String(d.date===selectedDay));
      btn.append(make('span','cal-day-name',d.label),make('strong','cal-date-label',d.day),
        make('small','cal-date-count',todaySlots.length?(isFallback?'Время подтвердим лично':todaySlots.length+' '+(todaySlots.length===1?'свободное окно':todaySlots.length<5?'свободных окна':'свободных окон')):'Нет доступного времени'));
      if(d.date===selectedDay){const check=make('span','cal-date-check','✓');check.setAttribute('aria-hidden','true');btn.append(check);}
      btn.addEventListener('click',()=>{
        if(selectedDay!==d.date){selectedDay=d.date;selectedSlot='';form.hidden=true;showError('');}
        renderDates();renderTimes(true);
      });
      datesEl.append(btn);
    }
  }
  function renderTimes(animate=false){
    clear(timesEl);
    if(!selectedDay){timesStage.hidden=true;return;}
    timesStage.hidden=false;
    if(animate){timesStage.classList.remove('is-revealed');void timesStage.offsetWidth;timesStage.classList.add('is-revealed');}
    timeNote.textContent=isFallback?'Время предварительное — я подтвержу его лично перед созвоном.':'Доступность окончательно проверяется при записи.';
    const available=slots.filter(s=>s.date===selectedDay);
    if(!available.length){
      timesEl.append(make('p','cal-note','На эту дату пока нет доступных окон.'));
      return;
    }
    for(const slot of available){
      const btn=make('button','cal-time'+(slot.id===selectedSlot?' is-selected':''),slot.time);
      btn.type='button';btn.disabled=!slot.available;btn.setAttribute('aria-pressed',String(slot.id===selectedSlot));
      btn.title=slot.available?'Выбрать '+slot.time:'Это время занято или уже прошло';
      btn.addEventListener('click',()=>{
        selectedSlot=slot.id;form.hidden=false;selectedText.textContent=friendly(slot);
        showError('');renderTimes();
        form.scrollIntoView({behavior:'smooth',block:'nearest'});
      });
      timesEl.append(btn);
    }
  }
  async function refresh(preserveSelection=false){
    // Keep date cards visible while availability loads or fails.
    setInfo('');
    try{
      const response=await fetch(API+'/api/consultation/slots',{cache:'no-store',headers:{Accept:'application/json'},signal:AbortSignal.timeout(12000)});
      const json=await response.json();
      if(!response.ok||json?.ok!==true||!Array.isArray(json.slots))throw Error('Не удалось проверить расписание');
      isFallback=false;
      slots=json.slots.filter(x=>x&&typeof x.id==='string'&&typeof x.date==='string'&&typeof x.time==='string');
      if(selectedDay&&!slots.some(x=>x.date===selectedDay&&x.available)){
        selectedDay='';selectedSlot='';form.hidden=true;
      }
      if(!slots.some(x=>x.id===selectedSlot&&x.available)){selectedSlot='';form.hidden=true;}
      setInfo('');fallbackHint.hidden=true;submit.textContent='Занять это время бесплатно';
      renderDates();renderTimes();
      if(!slots.some(x=>x.available))setInfo('Все опубликованные окна заняты или прошли. Напишите мне в MAX — подберём другое время.');
    }catch(e){
      isFallback=true; selectedSlot='';form.hidden=true;
      // Fallback uses the existing lead API. It MUST NOT claim a hard reservation.
      // Only future owner-approved windows are offered; final availability is confirmed personally.
      slots=fallbackSlots();
      if(selectedDay&&!slots.some(x=>x.date===selectedDay&&x.available)){
        selectedDay='';selectedSlot='';form.hidden=true;
      }
      renderDates();renderTimes();fallbackHint.hidden=false;submit.textContent='Отправить запрос на это время';
      setInfo('Выберите день и время. Я лично подтвержу запись перед созвоном.');
    }
  }
  const normalizePhone=(value)=>{
    let v=String(value||'').trim().replace(/[^\d+]/g,'');
    if(/^8\d{10}$/.test(v))v='+7'+v.slice(1);
    else if(/^7\d{10}$/.test(v))v='+'+v;
    else if(!v.startsWith('+'))v='+'+v;
    return /^\+\d{10,15}$/.test(v)?v:'';
  };
  function attribution(){
    const p=new URLSearchParams(location.search),u={};
    for(const k of ['source','medium','campaign']){
      const v=p.get('utm_'+k);
      if(v)u[k]=v.slice(0,150);
    }
    return u;
  }
  form.addEventListener('submit',async(event)=>{
    event.preventDefault();
    if(busy||!selectedSlot)return;
    showError('');
    const name=form.elements.name.value.trim(),chosen=channel();
    const raw=contact.value.trim();
    const contactValue=chosen==='telegram'&&/^@[A-Za-z][A-Za-z0-9_]{4,31}$/.test(raw)?raw:normalizePhone(raw);
    if(name.length<2){showError('Укажите ваше имя.');form.elements.name.focus();return;}
    if(!contactValue){showError('Проверьте номер телефона или Telegram @username.');contact.focus();return;}
    if(!form.elements.consent.checked){showError('Подтвердите согласие на обработку контакта.');return;}
    const slot=slots.find(x=>x.id===selectedSlot);
    if(!slot||!slot.available){showError('Это время уже недоступно. Выберите другое.');await refresh();return;}
    busy=true;submit.disabled=true;submit.textContent=isFallback?'Отправляем запрос…':'Закрепляем время…';
    try{
      const payload=isFallback?{
        formType:'personal_contact',name,contactType:chosen,contact:contactValue,
        startDate:slot.date,preferredTime:slot.time+' МСК',
        plan:'Бесплатный индивидуальный разбор · 20 минут',
        price:'Бесплатно; продолжение: 4 × 50 минут — 19 900 ₽',
        source:'marafon_calendar_time_request',sourceUrl:location.origin+location.pathname,
        message:'Запрос времени '+friendly(slot)+'. Внимание: автоматическая бронь не подтверждена! Согласовать с клиентом и вручную проверить доступность.',
        referrer:document.referrer,utm:attribution(),website:form.elements.website.value
      }:{name,contact:contactValue,channel:chosen,slot:selectedSlot,consent:true,
        referrer:document.referrer,utm:attribution(),website:form.elements.website.value};
      const response=await fetch(API+(isFallback?'/api/leads':'/api/consultation/book'),{method:'POST',cache:'no-store',
        headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(18000)});
      const result=await response.json().catch(()=>({}));
      if(response.status===409){await refresh();throw Error('Это время только что заняли. Выберите другое из свободных.');}
      if(!response.ok||result.ok!==true||(isFallback?result.received!==true:(result.booked!==true||result.slot!==selectedSlot)))
        throw Error(result.error||'Не удалось закрепить время. Попробуйте ещё раз.');
      document.getElementById('calendar-success-time').textContent=friendly(slot);
      document.getElementById('calendar-success-title').textContent=isFallback?'Запрос времени отправлен.':'Время закреплено за вами.';
      const c=isFallback?('Я свяжусь с вами через '+channelLabel[chosen]+', чтобы подтвердить, свободно ли выбранное время, и согласовать созвон.'):
        (chosen==='phone'?'Я свяжусь с вами перед встречей, чтобы подтвердить время и договориться о звонке.':
        'Я напишу вам в '+channelLabel[chosen]+' до встречи, чтобы подтвердить время и согласовать формат созвона.');
      document.getElementById('calendar-success-message').textContent=c;
      document.getElementById('calendar-success-max').href=DIRECT_MAX;
      form.hidden=true;datesEl.hidden=true;timesStage.hidden=true;
      document.getElementById('calendar-date-stage').hidden=true;
      document.getElementById('calendar-bottom').hidden=true;
      document.getElementById('calendar-lead').hidden=true;
      document.getElementById('calendar-title').textContent='Заявка на бесплатный разбор';
      successEl.hidden=false;setInfo('');showError('');
      successEl.scrollIntoView({behavior:'smooth',block:'center'});
    }catch(e){showError(e.name==='TimeoutError'?'Сервер долго отвечает. Не отправляйте повторную заявку вслепую: проверьте позже или напишите мне в MAX.':e.message);}
    finally{busy=false;submit.disabled=false;submit.textContent=isFallback?'Отправить запрос на это время':'Занять это время бесплатно';}
  });
  // Render usable days immediately, regardless of network status.
  renderDates();
  renderTimes();
  fallbackHint.hidden=false;
  refresh();
})();