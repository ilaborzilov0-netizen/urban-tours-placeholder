'use strict';
(function () {
  const COUNTER = 110906734;
  const API = 'https://api.marafon-metod.ru/api/leads';
  function goal(name, params) {
    try { if (typeof window.ym === 'function') window.ym(COUNTER, 'reachGoal', name, params || {}); } catch (_) {}
  }

  document.querySelectorAll('.stage').forEach((stage, index) => stage.addEventListener('toggle', () => {
    if (stage.open) goal('potencia_stage_open', {stage: index + 1});
  }));
  document.querySelectorAll('[data-direct]').forEach(link => link.addEventListener('click', () => goal('potencia_direct_contact', {channel: link.dataset.direct})));


  const situationTabs = Array.from(document.querySelectorAll('[data-situation]'));
  function selectSituation(button, moveFocus) {
    const id = button.getAttribute('aria-controls');
    situationTabs.forEach(tab => {
      const active = tab === button;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      document.getElementById(tab.getAttribute('aria-controls')).hidden = !active;
    });
    if (moveFocus) button.focus();
    goal('potencia_situation_view', {situation: Number(button.dataset.situation)});
  }
  situationTabs.forEach((button, index) => {
    button.addEventListener('click', () => selectSituation(button, false));
    button.addEventListener('keydown', event => {
      let next = index;
      if (event.key === 'ArrowRight') next = (index + 1) % situationTabs.length;
      else if (event.key === 'ArrowLeft') next = (index - 1 + situationTabs.length) % situationTabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = situationTabs.length - 1;
      else return;
      event.preventDefault();
      selectSituation(situationTabs[next], true);
    });
  });

  const dialog = document.getElementById('booking-dialog');
  const form = document.getElementById('consultation-form');
  if (!dialog || !form) return;
  const nameInput = document.getElementById('consultation-name');
  const contactInput = document.getElementById('consultation-contact');
  const contactLabel = document.getElementById('consultation-contact-label');
  const channelHelp = document.getElementById('consultation-channel-help');
  const submit = document.getElementById('consultation-submit');
  const status = document.getElementById('consultation-status');
  const entry = document.getElementById('booking-entry');
  const success = document.getElementById('booking-success');
  const successDescription = document.getElementById('booking-success-description');
  const invitation = document.getElementById('booking-success-invitation');
  const directContact = document.getElementById('booking-success-contact');
  const controls = Array.from(form.querySelectorAll('input'));
  const links = {max: 'https://max.ru/id312334031550_biz', telegram: 'https://t.me/+79102247621'};
  const channelLabels = {max: 'MAX', telegram: 'Telegram', phone: 'звонок'};
  const savedContacts = {};
  let previousChannel = '', openedAt = 0, sending = false, succeeded = false, lastTrigger = null, placement = '';
  function selectedChannel() { return form.querySelector('input[name="contactType"]:checked')?.value || ''; }
  function updateChannel() {
    const channel = selectedChannel();
    if (channel !== previousChannel) {
      if (previousChannel) {
        savedContacts[previousChannel] = contactInput.value;
        if (previousChannel === 'max' || previousChannel === 'phone') savedContacts.max = savedContacts.phone = contactInput.value;
      }
      contactInput.value = savedContacts[channel] || '';
      previousChannel = channel;
    }
    const telegram = channel === 'telegram';
    contactLabel.textContent = telegram ? 'Ваш Telegram' : channel === 'max' ? 'Ваш телефон для связи в MAX' : 'Ваш телефон';
    contactInput.type = telegram ? 'text' : 'tel';
    contactInput.inputMode = telegram ? 'text' : 'tel';
    contactInput.autocomplete = telegram ? 'off' : 'tel';
    contactInput.maxLength = telegram ? 40 : 30;
    contactInput.placeholder = telegram ? '@username или телефон' : '+7 999 123-45-67';
    contactInput.setAttribute('autocapitalize', 'none');
    contactInput.spellcheck = false;
    channelHelp.textContent = telegram ? 'Достаточно @username или номера телефона.' : channel === 'max' ? 'Укажите номер, к которому привязан MAX.' : 'Укажите номер, на который можно позвонить.';
  }
  function showError(message) { status.textContent = message; status.hidden = false; }
  function close() { dialog.close(); }
  function open(event) {
    if (typeof dialog.showModal !== 'function') { location.href = links.max; return; }
    lastTrigger = event.currentTarget;
    placement = lastTrigger.dataset.placement || '';
    if (!openedAt) openedAt = Date.now();
    dialog.setAttribute('aria-labelledby', succeeded ? 'booking-success-title' : 'booking-title');
    dialog.setAttribute('aria-describedby', succeeded ? 'booking-success-description' : 'booking-description');
    dialog.showModal();
    document.body.classList.add('modal-open');
    (succeeded ? document.getElementById('booking-success-title') : nameInput).focus();
    goal('potencia_form_open', {placement, price: 50000});
  }
  document.querySelectorAll('[data-booking]').forEach(button => button.addEventListener('click', open));
  dialog.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', close));
  dialog.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    if (lastTrigger) lastTrigger.focus();
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) close();
  });
  form.querySelectorAll('input[name="contactType"]').forEach(input => input.addEventListener('change', () => { updateChannel(); status.hidden = true; }));
  form.addEventListener('input', () => { status.hidden = true; });
  directContact.addEventListener('click', () => goal('potencia_direct_contact', {channel: selectedChannel(), afterLead: true}));
  updateChannel();
  function normalizePhone(value) {
    if (!/^[+\d\s().-]+$/.test(String(value).trim())) return '';
    let digits = String(value).replace(/\D/g, '');
    if (digits.length === 10) digits = '7' + digits;
    if (digits.length === 11 && digits[0] === '8') digits = '7' + digits.slice(1);
    return digits.length >= 10 && digits.length <= 15 ? '+' + digits : '';
  }
  function attribution() {
    const query = new URLSearchParams(location.search), utm = {};
    for (const key of ['source', 'medium', 'campaign', 'content', 'term']) {
      const value = query.get('utm_' + key);
      if (value) utm[key] = value.slice(0, 180);
    }
    return utm;
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending || succeeded) return;
    status.hidden = true;
    const name = nameInput.value.trim(), channel = selectedChannel();
    if (name.length < 2) { showError('Укажите ваше имя.'); nameInput.focus(); return; }
    if (!channelLabels[channel]) { showError('Выберите удобный способ связи.'); return; }
    const rawContact = contactInput.value.trim();
    let contact = normalizePhone(rawContact), username = '';
    if (channel === 'telegram' && !contact) {
      username = rawContact.replace(/^@/, '');
      if (!/^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(username)) { showError('Укажите @username в Telegram или телефон с кодом страны.'); contactInput.focus(); return; }
      contact = '@' + username;
    }
    if (!contact) { showError('Укажите телефон с кодом страны.'); contactInput.focus(); return; }
    if (form.elements.website.value) { showError('Не удалось отправить заявку.'); return; }
    sending = true;
    submit.disabled = true;
    controls.forEach(input => { input.disabled = true; });
    submit.textContent = 'Сохраняем заявку…';
    goal('potencia_form_submit', {placement, channel, price: 50000});
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 25000);
    try {
      const params = new URLSearchParams(location.search);
      const payload = {
        formType: 'personal_contact', name, contactType: channel, contact,
        phone: username ? '' : contact,
        plan: 'Ради мужского здоровья · отказ от курения · 4 сессии и месяц сопровождения',
        price: '50 000 ₽', source: 'marafon_potencia_personal_50000',
        sourceUrl: location.origin + location.pathname, referrer: document.referrer.slice(0, 500),
        utm: attribution(), yclid: (params.get('yclid') || '').slice(0, 180), openedAt, website: '',
        message: 'Заявка на личное сопровождение: Ради мужского здоровья за 50 000 ₽ со страницы /potencia/. Контакт: ' + contact + '. Удобный способ связи: ' + channelLabels[channel] + '. 4 индивидуальные онлайн-сессии по 50 минут и 4 недели сопровождения в MAX или Telegram с первой платной сессии. Один личный ответ в рабочий день, понедельник — пятница. Первый разбор курения — 20 минут бесплатно. Согласовать время через выбранный канал. Заявка не является оплатой. Согласие на обработку контакта подтверждено нажатием кнопки; условия /potencia/privacy/.'
      };
      const response = await fetch(API, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload), signal: controller.signal});
      const result = await response.json().catch(() => null);
      if (!response.ok || !result || result.ok !== true || result.received !== true) throw new Error('Не удалось подтвердить сохранение заявки. Попробуйте ещё раз или напишите мне напрямую ниже.');
      successDescription.textContent = channel === 'phone' ? 'Я позвоню вам, чтобы согласовать время первого бесплатного разбора.' : 'Я напишу вам в ' + channelLabels[channel] + ', чтобы согласовать время первого бесплатного разбора.';
      invitation.hidden = channel === 'phone';
      if (links[channel]) { directContact.href = links[channel]; directContact.textContent = 'Написать Илье в ' + channelLabels[channel] + ' ↗'; }
      succeeded = true;
      entry.hidden = true;
      success.hidden = false;
      dialog.scrollTop = 0;
      dialog.setAttribute('aria-labelledby', 'booking-success-title');
      dialog.setAttribute('aria-describedby', 'booking-success-description');
      document.getElementById('booking-success-title').focus();
      goal('potencia_lead_success', {price: 50000});
      goal('lead_success', {form: 'potencia_personal_50000', price: 50000});
    } catch (error) {
      showError(error.name === 'AbortError' ? 'Ответ занял больше времени. Ваши данные остались в форме. Можно повторить отправку или написать мне напрямую ниже.' : 'Не удалось отправить заявку. Ваши данные остались в форме. Попробуйте ещё раз или напишите мне напрямую ниже.');
      goal('potencia_lead_error');
    } finally {
      clearTimeout(timer);
      sending = false;
      submit.disabled = false;
      controls.forEach(input => { input.disabled = false; });
      updateChannel();
      submit.innerHTML = 'Записаться на бесплатный разбор <span aria-hidden="true">↗</span>';
    }
  });
})();
