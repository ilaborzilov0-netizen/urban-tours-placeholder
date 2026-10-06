(() => {
  'use strict';

  const TARIFFS = [
    { id: 1, price: 14000 },
    { id: 2, price: 14000 },
    { id: 3, price: 14000 }
  ];

  const state = {
    mode: ['money','personal'].includes(localStorage.getItem('bzFullSubModeV3')) ? localStorage.getItem('bzFullSubModeV3') : 'money',
    tobaccoType: ['combustible','electronic'].includes(localStorage.getItem('bzFullSubTobaccoType')) ? localStorage.getItem('bzFullSubTobaccoType') : 'combustible',
    daily: clamp(localStorage.getItem('bzFullSubDaily') || 20, 1, 120),
    pack: clamp(localStorage.getItem('bzFullSubPack') || 200, 50, 2000),
    weekly: clamp(localStorage.getItem('bzFullSubWeekly') || 1500, 100, 50000)
  };

  let root = null;
  let bound = false;

  function clamp(value, min, max) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : min;
  }

  function qs(selector, scope = document) { return scope.querySelector(selector); }
  function qsa(selector, scope = document) { return Array.from(scope.querySelectorAll(selector)); }

  function formatMoney(value) {
    return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Math.round(value)) + ' ₽';
  }

  function plural(value, one, few, many) {
    const number = Math.abs(Math.round(value)) % 100;
    const last = number % 10;
    if (number > 10 && number < 20) return many;
    if (last === 1) return one;
    if (last > 1 && last < 5) return few;
    return many;
  }

  function dailySpend() {
    if (state.tobaccoType === 'electronic') return state.weekly / 7;
    return (state.daily / 20) * state.pack;
  }

  function personalPrice(price) {
    const days = price / Math.max(1, dailySpend());
    if (days >= 45) {
      const months = days / 30.4;
      const displayed = months >= 10 ? Math.round(months) : Math.round(months * 10) / 10;
      return String(displayed).replace('.', ',') + ' МЕС.';
    }
    const rounded = Math.max(1, Math.round(days));
    return rounded + ' ' + plural(rounded, 'ДЕНЬ', 'ДНЯ', 'ДНЕЙ');
  }

  function save() {
    localStorage.setItem('bzFullSubModeV3', state.mode);
    localStorage.setItem('bzFullSubTobaccoType', state.tobaccoType);
    localStorage.setItem('bzFullSubDaily', String(state.daily));
    localStorage.setItem('bzFullSubPack', String(state.pack));
    localStorage.setItem('bzFullSubWeekly', String(state.weekly));
  }

  function ensureRoot() {
    root = document.querySelector('[data-bz-tariff-choice]');
    return root;
  }

  function ensureControls() {
    let controls = qs('.bz-full-substitution', root);
    if (controls) return controls;
    controls = document.createElement('section');
    controls.className = 'bz-full-substitution';
    controls.setAttribute('aria-label', 'Переключение цены тарифов в личные цифры');
    const stage = qs('.bz-tariff-choice__stage', root);
    stage.insertAdjacentElement('afterend', controls);
    return controls;
  }

  function combustibleFields() {
    return '<div class="bz-full-inline-fields bz-full-inline-fields--combustible">'
      + '<div class="bz-full-inline-field" aria-label="Сигарет или стиков в день">'
      + '<button type="button" class="bz-full-step" aria-label="Уменьшить количество в день" data-bz-full-action="step" data-field="daily" data-delta="-1">−</button>'
      + '<input aria-label="Штук в день" type="number" min="1" max="120" inputmode="numeric" data-bz-full-input="daily" value="' + state.daily + '">'
      + '<button type="button" class="bz-full-step" aria-label="Увеличить количество в день" data-bz-full-action="step" data-field="daily" data-delta="1">+</button>'
      + '<small>Штук в день</small>'
      + '</div>'
      + '<div class="bz-full-inline-field" aria-label="Цена пачки">'
      + '<button type="button" class="bz-full-step" aria-label="Уменьшить цену пачки" data-bz-full-action="step" data-field="pack" data-delta="-10">−</button>'
      + '<input aria-label="Цена пачки" type="number" min="50" max="2000" step="10" inputmode="numeric" data-bz-full-input="pack" value="' + state.pack + '">'
      + '<button type="button" class="bz-full-step" aria-label="Увеличить цену пачки" data-bz-full-action="step" data-field="pack" data-delta="10">+</button>'
      + '<small>Цена пачки</small>'
      + '</div>'
      + '</div>';
  }

  function electronicField() {
    return '<div class="bz-full-inline-fields bz-full-inline-fields--electronic">'
      + '<div class="bz-full-inline-field bz-full-inline-field--wide" aria-label="Примерные траты на электронки в неделю">'
      + '<button type="button" class="bz-full-step" aria-label="Уменьшить траты в неделю" data-bz-full-action="step" data-field="weekly" data-delta="-100">−</button>'
      + '<input aria-label="Примерные траты в неделю" type="number" min="100" max="50000" step="100" inputmode="numeric" data-bz-full-input="weekly" value="' + state.weekly + '">'
      + '<button type="button" class="bz-full-step" aria-label="Увеличить траты в неделю" data-bz-full-action="step" data-field="weekly" data-delta="100">+</button>'
      + '<small>Примерные траты в неделю</small>'
      + '</div>'
      + '</div>';
  }

  function ensureInstallmentLines() {
    qsa('[data-tariff-card]', root).forEach((card) => {
      const installment = qs('.bz-tariff-choice__installment', card);
      const tariffIndex = Number(card.getAttribute('data-tariff-index'));

      if (tariffIndex === 3) {
        if (installment) installment.remove();
        return;
      }

      if (installment) return;
      const line = document.createElement('span');
      line.className = 'bz-tariff-choice__installment';
      line.textContent = 'Рассрочка доступна';
      line.setAttribute('aria-label', 'Рассрочка доступна');
      card.appendChild(line);
    });
  }

  function renderControls() {
    const controls = ensureControls();
    const selected = state.mode === 'personal';

    const personalPanel = selected
      ? '<div class="bz-full-personal-panel">'
        + '<div class="bz-full-type-tabs" role="tablist" aria-label="Тип курения">'
        + '<button type="button" role="tab" aria-selected="' + (state.tobaccoType === 'combustible') + '" class="bz-full-type-tab' + (state.tobaccoType === 'combustible' ? ' is-active' : '') + '" data-bz-full-action="set-tobacco" data-tobacco="combustible">Сигареты / стики</button>'
        + '<button type="button" role="tab" aria-selected="' + (state.tobaccoType === 'electronic') + '" class="bz-full-type-tab' + (state.tobaccoType === 'electronic' ? ' is-active' : '') + '" data-bz-full-action="set-tobacco" data-tobacco="electronic">Электронки</button>'
        + '</div>'
        + (state.tobaccoType === 'electronic' ? electronicField() : combustibleFields())
        + '</div>'
      : '';

    controls.innerHTML = '<div class="bz-full-one-row is-' + state.mode + ' is-' + state.tobaccoType + '">'
      + '<div class="bz-full-switch" role="group" aria-label="Режим отображения цены">'
      + '<button type="button" class="bz-full-switch__track" aria-label="' + (state.mode === 'money' ? 'Показать в днях курения' : 'Показать в рублях') + '" data-bz-full-action="cycle-mode"><i></i></button>'
      + '</div>'
      + personalPanel
      + '</div>'
      + '<p class="bz-full-price-policy" aria-label="Политика цены"><span><b>Со следующего потока</b> цена будет выше.</span></p>';
  }

  function renderCards() {
    root.dataset.bzFullSubMode = state.mode;
    qsa('.bz-tariff-choice__price-context', root).forEach((node) => node.remove());
    qsa('[data-tariff-card]', root).forEach((card) => {
      const id = Number(card.getAttribute('data-tariff-index'));
      const tariff = TARIFFS.find((item) => item.id === id) || TARIFFS[0];
      const priceNode = qs('em', card);
      if (!priceNode) return;
      if (!card.dataset.bzFullOriginalPrice) card.dataset.bzFullOriginalPrice = priceNode.textContent.trim() || formatMoney(tariff.price);
      priceNode.textContent = state.mode === 'personal' ? personalPrice(tariff.price) : card.dataset.bzFullOriginalPrice;
      priceNode.classList.toggle('bz-full-price-personal', state.mode === 'personal');
    });
  }

  function render() {
    if (!ensureRoot()) return;
    ensureInstallmentLines();
    renderControls();
    renderCards();
    root.setAttribute('data-bz-calc-ready', 'true');
    save();
  }

  function setInput(name, value) {
    if (name === 'daily') state.daily = clamp(value, 1, 120);
    if (name === 'pack') state.pack = clamp(value, 50, 2000);
    if (name === 'weekly') state.weekly = clamp(value, 100, 50000);
    render();
  }

  function bind() {
    if (bound) return;
    bound = true;
    document.addEventListener('click', (event) => {
      const action = event.target.closest('[data-bz-full-action]');
      if (!action) return;
      event.preventDefault();
      const type = action.getAttribute('data-bz-full-action');
      if (type === 'step') {
        const field = action.getAttribute('data-field');
        const delta = Number(action.getAttribute('data-delta') || 0);
        if (field === 'daily') state.daily = clamp(state.daily + delta, 1, 120);
        if (field === 'pack') state.pack = clamp(state.pack + delta, 50, 2000);
        if (field === 'weekly') state.weekly = clamp(state.weekly + delta, 100, 50000);
        render();
        return;
      }
      if (type === 'set-mode') {
        state.mode = action.getAttribute('data-mode') === 'personal' ? 'personal' : 'money';
        render();
        return;
      }
      if (type === 'cycle-mode') {
        state.mode = state.mode === 'personal' ? 'money' : 'personal';
        render();
        return;
      }
      if (type === 'set-tobacco') {
        state.tobaccoType = action.getAttribute('data-tobacco') === 'electronic' ? 'electronic' : 'combustible';
        render();
      }
    });
    document.addEventListener('input', (event) => {
      const input = event.target.closest('[data-bz-full-input]');
      if (!input) return;
      setInput(input.getAttribute('data-bz-full-input'), input.value);
    });
    document.addEventListener('change', (event) => {
      const input = event.target.closest('[data-bz-full-input]');
      if (!input) return;
      setInput(input.getAttribute('data-bz-full-input'), input.value);
    });
  }

  function init() {
    if (!ensureRoot()) return;
    document.querySelectorAll('.bz-v1-pult,.bz-v1-controls').forEach((node) => node.remove());
    bind();
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
  window.addEventListener('bz:priority-island-ready', render);
})();
