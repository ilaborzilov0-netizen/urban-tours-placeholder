'use strict';
(() => {
  const views = ['instrument', 'album', 'author'];
  const titles = { instrument: 'Аудиоякоря · Другой ответ на привычный перекур', album: 'Без торга · Музыкальный альбом аудиоякорей', author: 'Илья Борзилов · Авторские аудиоякоря' };
  const tabs = Array.from(document.querySelectorAll('[role="tab"][data-view]'));
  const panels = Array.from(document.querySelectorAll('[role="tabpanel"]'));
  const initial = new URL(location.href);
  let current = views.includes(initial.searchParams.get('v')) ? initial.searchParams.get('v') : 'instrument';
  const state = {
    get current() { return current; },
    get returnUrl() {
      const url = new URL(location.pathname, location.origin);
      url.searchParams.set('v', current);
      if (new URL(location.href).searchParams.get('pult') === 'off') url.searchParams.set('pult', 'off');
      return url.href;
    }
  };
  window.audioConcept = state;
  const goal = (name, extra = {}) => { try { window.ym?.(110906734, 'reachGoal', 'audio_concept_' + name, { variant: current, experiment: 'audioyakorya_work_3', ...extra }); } catch (_) {} };
  const cleanLink = document.getElementById('clean-link');
  const status = document.getElementById('control-status');
  const controls = document.getElementById('concept-control');
  const showControl = document.getElementById('show-control');
  function setLinks() {
    const clean = new URL(location.href);
    clean.searchParams.set('v', current);
    clean.searchParams.set('pult', 'off');
    clean.searchParams.delete('payment_result');
    clean.searchParams.delete('orderId');
    clean.hash = '';
    cleanLink.href = clean.href;
  }
  function selectView(view, { updateUrl = true, scroll = true, track = true } = {}) {
    if (!views.includes(view)) return;
    current = view;
    panels.forEach(panel => { panel.hidden = panel.id !== 'panel-' + view; });
    tabs.forEach(tab => {
      const selected = tab.dataset.view === view;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    document.body.dataset.view = view;
    document.title = titles[view] + ' · 990 ₽';
    const theme = document.querySelector('meta[name="theme-color"]');
    theme.content = { instrument: '#f7faf8', album: '#121410', author: '#f6f1e8' }[view];
    if (updateUrl) {
      const url = new URL(location.href);
      url.searchParams.set('v', view);
      url.hash = '';
      history.replaceState({}, '', url.pathname + url.search);
    }
    setLinks();
    if (scroll) window.scrollTo({ top: 0, behavior: 'instant' });
    if (track) goal('switch');
  }
  tabs.forEach(tab => {
    tab.addEventListener('click', () => selectView(tab.dataset.view));
    tab.addEventListener('keydown', event => {
      const index = tabs.indexOf(tab);
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next == null) return;
      event.preventDefault();
      selectView(tabs[next].dataset.view);
      tabs[next].focus();
    });
  });
  function setControlVisible(visible, updateUrl = true) {
    controls.hidden = !visible;
    showControl.hidden = visible;
    document.body.classList.toggle('pult-hidden', !visible);
    if (updateUrl) {
      const url = new URL(location.href);
      if (visible) url.searchParams.delete('pult'); else url.searchParams.set('pult', 'off');
      history.replaceState({}, '', url.pathname + url.search + url.hash);
      setLinks();
    }
  }
  document.getElementById('hide-control').addEventListener('click', () => {
    setControlVisible(false); showControl.focus();
  });
  showControl.addEventListener('click', () => {
    setControlVisible(true); tabs.find(tab => tab.dataset.view === current).focus();
  });
  document.getElementById('copy-link').addEventListener('click', async () => {
    const url = new URL(location.href);
    url.searchParams.set('v', current);
    url.searchParams.delete('payment_result');
    url.searchParams.delete('orderId');
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(url.href);
      status.textContent = 'Ссылка на выбранную версию скопирована.';
      const button = document.getElementById('copy-link');
      button.classList.add('copied');
      button.setAttribute('aria-label', 'Ссылка скопирована');
      button.querySelector('span').textContent = 'Готово';
      setTimeout(() => { button.classList.remove('copied'); button.setAttribute('aria-label', 'Скопировать ссылку на выбранную версию'); button.querySelector('span').textContent = 'Ссылка'; }, 2200);
    } catch (_) { status.textContent = 'Скопируйте ссылку из адресной строки — выбранная версия уже сохранена в ней.'; }
  });
  window.addEventListener('popstate', () => {
    const url = new URL(location.href);
    selectView(url.searchParams.get('v') || 'instrument', { updateUrl: false, scroll: false });
    setControlVisible(url.searchParams.get('pult') !== 'off', false);
  });
  const situations = {
    coffee: { old: '«Без сигареты кофе уже не тот».', answer: '«Кофе остаётся. Пауза — моя».', foot: 'Вкус, отдых и время для себя можно исследовать отдельно от перекура.', title: 'ПАУЗА\nОСТАЁТСЯ.', index: '01 / ВАШ КОФЕ' },
    stress: { old: '«Мне тяжело. Надо покурить».', answer: '«Мне нужна пауза. Сигарета — не вся пауза».', foot: 'Потребность отдохнуть реальна. Можно заметить её отдельно от привычного перекура.', title: 'ВРЕМЯ\nДЛЯ СЕБЯ.', index: '02 / ПОСЛЕ СТРЕССА' },
    one: { old: '«Всего одну. Она не считается».', answer: '«Желание — не приказ».', foot: 'Знакомая мысль не обязана становиться действием. У вас остаётся пространство для выбора.', title: 'ВЫБОР\nОСТАЁТСЯ.', index: '03 / МОМЕНТ ТОРГА' }
  };
  document.querySelectorAll('[data-scene-widget]').forEach(widget => {
    widget.querySelectorAll('[data-scene]').forEach(button => button.addEventListener('click', () => {
      const scene = button.dataset.scene;
      const item = situations[scene];
      if (!item) return;
      widget.querySelectorAll('[data-scene]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
      widget.querySelector('[data-old]').textContent = item.old;
      widget.querySelector('[data-new]').textContent = item.answer;
      widget.querySelector('[data-scene-foot]').textContent = item.foot;
      widget.querySelector('[data-scene-visual]').dataset.sceneVisual = scene;
      widget.querySelector('.coffee-type').textContent = item.title;
      widget.querySelector('.scene-index').textContent = item.index;
      goal('situation', { situation: scene });
    }));
  });
  const motionButtons = document.querySelectorAll('[data-motion]');
  let motionPaused = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
  function setMotion(paused) {
    motionPaused = paused;
    document.body.classList.toggle('motion-paused', paused);
    motionButtons.forEach(button => {
      button.setAttribute('aria-pressed', String(paused));
      button.setAttribute('aria-label', paused ? 'Включить анимацию обложки' : 'Остановить анимацию обложки');
      button.textContent = paused ? '▶' : 'Ⅱ';
    });
  }
  motionButtons.forEach(button => button.addEventListener('click', () => setMotion(!motionPaused)));
  document.querySelectorAll('.faq-list, .conversation-list').forEach(list => {
    list.querySelectorAll('details').forEach(detail => detail.addEventListener('toggle', () => {
      if (detail.open) list.querySelectorAll('details').forEach(other => { if (other !== detail) other.open = false; });
    }));
  });
  selectView(current, { updateUrl: false, scroll: false, track: false });
  setControlVisible(initial.searchParams.get('pult') !== 'off', false);
  setMotion(motionPaused);
  goal('view');
})();
