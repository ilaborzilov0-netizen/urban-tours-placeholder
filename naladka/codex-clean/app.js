'use strict';
(() => {
  const API = 'https://ilaborzilov0-netizen-metod-payment-test-0305.twc1.net';
  const $ = (selector, root = document) => root.querySelector(selector);
  const menuButton = $('.menu-toggle');
  const navigation = $('#navigation');
  const closeMenu = () => { navigation.hidden = true; menuButton.setAttribute('aria-expanded', 'false'); menuButton.setAttribute('aria-label', 'Открыть меню'); };
  menuButton.addEventListener('click', () => { const open = navigation.hidden; navigation.hidden = !open; menuButton.setAttribute('aria-expanded', String(open)); menuButton.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню'); });
  navigation.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
  document.addEventListener('click', event => { if (!event.target.closest('.header')) closeMenu(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });

  const dialog = $('#contact-dialog');
  const modalForm = $('.modal-form');
  let previousFocus;
  document.querySelectorAll('[data-dialog]').forEach(button => button.addEventListener('click', () => {
    previousFocus = button;
    const question = button.dataset.dialog === 'question';
    modalForm.reset();
    modalForm.dataset.formType = question ? 'question' : 'join';
    $('.form-status', modalForm).textContent = '';
    $('#dialog-title').textContent = question ? 'Задать вопрос' : 'Хочу участвовать';
    $('#dialog-kicker').textContent = question ? 'МЕТОД · ВАША СИТУАЦИЯ' : 'ОНЛАЙН-ГРУППА';
    $('#dialog-description').textContent = question ? 'Напишите, что вас волнует. Оставьте телефон для ответа.' : 'Оставьте контакт. Уточним ближайшую дату и условия участия.';
    $('#question-field').hidden = !question;
    $('#modal-message').required = question;
    $('.solid-cta', modalForm).innerHTML = (question ? 'Отправить вопрос' : 'Отправить заявку') + ' <span>→</span>';
    document.body.classList.add('modal-open');
    dialog.showModal();
  }));
  $('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
  dialog.addEventListener('close', () => { document.body.classList.remove('modal-open'); previousFocus?.focus(); });

  document.querySelectorAll('[data-channel]').forEach(button => button.addEventListener('click', () => {
    const form = button.closest('form');
    $('[name=channel]', form).value = button.dataset.channel;
    form.querySelectorAll('[data-channel]').forEach(option => option.setAttribute('aria-pressed', String(option === button)));
    const input = $('[name=contact]', form);
    input.value = '';
    input.type = button.dataset.channel === 'telegram' ? 'text' : 'tel';
    input.autocomplete = button.dataset.channel === 'telegram' ? 'off' : 'tel';
    input.placeholder = { max: 'Номер для связи в MAX', telegram: '@username или ссылка на Telegram', phone: '+7 999 123-45-67' }[button.dataset.channel];
    input.focus();
  }));
  document.querySelectorAll('.lead-form').forEach(form => form.addEventListener('submit', async event => {
    event.preventDefault();
    if (form.dataset.submitting === 'true' || !form.reportValidity()) return;
    const contact = $('[name=contact]', form).value.trim();
    const channel = $('[name=channel]', form).value;
    const question = form.dataset.formType === 'question';
    const message = $('[name=message]', form)?.value.trim() || '';
    const status = $('.form-status', form);
    const setStatus = (text, error = false) => { status.textContent = text; status.dataset.error = String(error); };
    if (channel !== 'telegram' && !/^\+?[\d\s()\-]{10,24}$/.test(contact)) { setStatus('Укажите телефон с кодом страны, например +7 999 123-45-67.', true); return; }
    if (channel === 'telegram' && !/^(?:@[a-zA-Z0-9_]{5,32}|https:\/\/t\.me\/[a-zA-Z0-9_]{5,32})$/.test(contact)) { setStatus('Укажите @username или ссылку https://t.me/username.', true); return; }
    if (question && !message) { setStatus('Напишите ваш вопрос.', true); return; }
    const submit = $('[type=submit]', form);
    const label = submit.innerHTML;
    form.dataset.submitting = 'true'; submit.disabled = true; submit.textContent = 'Отправляем…'; setStatus('');
    const abort = new AbortController();
    const timeout = setTimeout(() => abort.abort(), 15000);
    try {
      const params = new URLSearchParams(location.search);
      const response = await fetch(API + '/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, signal: abort.signal,
        body: JSON.stringify({ formType: question ? 'mobile_question' : 'commercial_application', contactType: channel === 'telegram' ? 'telegram' : 'phone', contact,
          message: question ? message : 'Заявка на практикум «Бросить за выходные». Просьба уточнить ближайшую дату и актуальные условия. Предпочтительный канал связи: ' + channel + '.',
          plan: 'basic', price: '9900', source: 'marafon_naladka_codex_clean_' + (question ? 'question' : 'join'), sourceUrl: location.origin + location.pathname,
          utm: { source: params.get('utm_source') || '', medium: params.get('utm_medium') || '', campaign: params.get('utm_campaign') || '' } }) });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result || result.success === false || result.ok === false) throw new Error('request_failed');
      form.reset(); setStatus(question ? 'Вопрос отправлен. Ответим по указанному контакту.' : 'Заявка отправлена. Свяжемся с вами и уточним ближайшую дату.');
      if ($('[data-channel]', form)) { $('[name=channel]', form).value = 'max'; form.querySelectorAll('[data-channel]').forEach(option => option.setAttribute('aria-pressed', String(option.dataset.channel === 'max'))); const input = $('[name=contact]', form); input.type = 'tel'; input.autocomplete = 'tel'; input.placeholder = 'Номер для связи в MAX'; }
    } catch (error) { setStatus('Не удалось отправить. Попробуйте ещё раз или напишите на ilaborzilov0@gmail.com.', true); }
    finally { clearTimeout(timeout); delete form.dataset.submitting; submit.disabled = false; submit.innerHTML = label; }
  }));

  const audio = $('#audio-anchor');
  const play = $('#audio-toggle');
  const resetAudio = () => { play.textContent = '▶'; play.setAttribute('aria-pressed', 'false'); play.setAttribute('aria-label', 'Включить аудиоякорь'); };
  play.addEventListener('click', async () => { if (!audio.paused) { audio.pause(); resetAudio(); return; } try { await audio.play(); play.textContent = 'Ⅱ'; play.setAttribute('aria-pressed', 'true'); play.setAttribute('aria-label', 'Приостановить аудиоякорь'); $('#audio-status').textContent = ''; } catch (error) { resetAudio(); $('#audio-status').textContent = 'Аудио не загрузилось. Попробуйте ещё раз.'; } });
  audio.addEventListener('ended', resetAudio); audio.addEventListener('error', () => { resetAudio(); $('#audio-status').textContent = 'Аудио не загрузилось. Попробуйте ещё раз.'; });

  const weeks = $('#weeks');
  const fragment = document.createDocumentFragment();
  const dots = [];
  for (let i = 0; i < 5200; i++) { const dot = document.createElement('i'); dots.push(dot); fragment.appendChild(dot); }
  weeks.appendChild(fragment);
  const age = $('#age');
  const decade = $('#show-decade');
  const yearsWord = number => { const rest = number % 100; return rest >= 11 && rest <= 14 ? 'лет' : number % 10 === 1 ? 'год' : number % 10 >= 2 && number % 10 <= 4 ? 'года' : 'лет'; };
  const updateWeeks = () => { const years = Math.max(0, Math.min(100, Number(age.value))); const past = years * 52; dots.forEach((dot, index) => { dot.className = index < past ? 'past' : decade.checked && index < Math.min(5200, past + 520) ? 'next' : ''; }); $('#age-value').textContent = years + ' ' + yearsWord(years); $('#weeks-summary').textContent = 'Возраст ' + years + ' ' + yearsWord(years) + '. На сетке ' + past + ' прошедших недель.' + (decade.checked ? ' Выделены следующие ' + Math.min(520, 5200 - past) + ' недель.' : ' Следующие десять лет не выделены.'); };
  age.addEventListener('input', () => { $('#birthdate').value = ''; updateWeeks(); });
  decade.addEventListener('change', updateWeeks);
  const now = new Date();
  $('#birthdate').max = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
  $('#birthdate').addEventListener('change', event => { if (!event.target.value) return; const birth = new Date(event.target.value + 'T12:00:00'); if (Number.isNaN(birth.getTime()) || birth > now) return; let years = now.getFullYear() - birth.getFullYear(); if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) years--; age.value = String(Math.max(0, Math.min(100, years))); updateWeeks(); });
  updateWeeks();
})();
