/* 0149 · owner:bz-life-calendar · dark-integrated calendar + 5-palette lab */
(function () {
      var root = document.getElementById('bz-life-calendar-intro');
      if (!root) return;
      if (root.dataset.bzlcReady === '1') return;
      root.dataset.bzlcReady = '1';

      var queryParams;
      try { queryParams = new URLSearchParams(window.location.search || ''); }
      catch (e) { queryParams = { get: function () { return null; } }; }

      var requestedPalette = queryParams.get('lifePalette') || '5';
      var lifePalette = /^[1-5]$/.test(String(requestedPalette)) ? String(requestedPalette) : '5';
      var paletteButtons = [];
      var paletteReset = null;
      var themePalette = null;

      function cssToken(name, fallback) {
        if (!window.getComputedStyle) return fallback;
        var value = window.getComputedStyle(root).getPropertyValue(name);
        return String(value || '').trim() || fallback;
      }

      function refreshThemePalette() {
        themePalette = {
          past: cssToken('--life-past', 'rgba(255,253,248,0.64)'),
          future: cssToken('--life-future', 'rgba(185,79,53,0.22)'),
          current: cssToken('--life-current', 'rgba(185,79,53,0.96)'),
          currentStroke: cssToken('--life-current-stroke', 'rgba(255,253,248,0.94)')
        };
        return themePalette;
      }

      function syncPaletteButtons() {
        Array.prototype.forEach.call(paletteButtons, function (button) {
          var active = button.getAttribute('data-bzlc-palette-button') === lifePalette;
          button.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
      }

      function setLifePalette(palette, updateUrl) {
        lifePalette = /^[1-5]$/.test(String(palette)) ? String(palette) : '5';
        root.setAttribute('data-life-palette', lifePalette);
        refreshThemePalette();
        syncPaletteButtons();
        try { if (window.localStorage) window.localStorage.setItem('bzLifePalette', lifePalette); } catch (e) {}
        if (updateUrl && window.history && window.history.replaceState) {
          try {
            var url = new URL(window.location.href);
            url.searchParams.set('lifePalette', lifePalette);
            window.history.replaceState(window.history.state, '', url.toString());
          } catch (e) {}
        }
        if (gridCanvas) scheduleGridResize();
      }

      root.setAttribute('data-life-theme', 'dark');
      root.setAttribute('data-life-palette', lifePalette);
      syncPaletteButtons();

      var totalYears = 80;
      var cutYears = 65;
      var weeksPerYear = 52;
      var totalWeeks = totalYears * weeksPerYear;
      var dayMs = 24 * 60 * 60 * 1000;
      var weekMs = 7 * dayMs;
      var preciseMode = false;
      var preciseBirthDate = null;

      var ageRange = root.querySelector('#bzlc-age-intro');
      var ageNumber = root.querySelector('#bzlc-age-num-intro');
      var birthPanel = root.querySelector('#bzlc-birth-panel-intro');
      var birthInput = root.querySelector('#bzlc-birthdate-intro');
      var birthReset = root.querySelector('#bzlc-birth-reset');
      var modePill = root.querySelector('#bzlc-mode-pill');
      var cutToggle = root.querySelector('#bzlc-cut-toggle-intro');
      var cutCopy = root.querySelector('.bzlc-cut-copy');
      var cutPill = root.querySelector('.bzlc-cut-pill');
      var riskCutActive = true;
      var realAge = 36;
      var cutWeeks = 15 * weeksPerYear;
      var grid = root.querySelector('#bzlc-grid-intro');
      var gridWrap = root.querySelector('.bzlc-grid-wrap');
      var smoke = root.querySelector('#bzlc-smoke-intro');
      var scaleMark = root.querySelector('#bzlc-scale-mark-intro');
      var previousLivedWeeks = null;
      var previousCurrentIndex = null;
      var previousRiskCutActive = null;
      var updateRaf = null;
      var resizeRaf = null;
      var gridCanvas = null;
      var gridContext = null;
      var gridCellSize = 0;
      var gridCellHeight = 0;
      var gridGap = 1;
      var gridPixelWidth = 0;
      var gridPixelHeight = 0;
      var renderedCurrentIndex = 0;

      function clamp(value, min, max) {
        var number = Number(value);
        if (!Number.isFinite(number)) number = min;
        return Math.max(min, Math.min(max, number));
      }
      function getActiveYears() { return riskCutActive ? cutYears : totalYears; }
      function getActiveTotalWeeks() { return getActiveYears() * weeksPerYear; }
      function getEffectiveAge(value) {
        var maxAge = getActiveYears();
        return clamp(riskCutActive ? Math.min(value, cutYears) : value, 1, maxAge);
      }
      function syncAgeInputLimits(displayAge) {
        var maxAge = getActiveYears();
        if (ageRange) {
          ageRange.max = String(maxAge);
          ageRange.step = preciseMode ? 'any' : '1';
          ageRange.value = String(displayAge);
        }
        if (ageNumber) {
          ageNumber.max = String(maxAge);
          ageNumber.step = preciseMode ? 'any' : '1';
          ageNumber.value = formatAge(displayAge).replace(',', '.');
        }
      }
      function wholeYearAge(value) {
        return Math.round(clamp(value, 1, getActiveYears()));
      }
      function syncRangeFill(displayAge) {
        if (!ageRange) return;
        var minAge = Number(ageRange.min || 1);
        var maxAge = Number(ageRange.max || getActiveYears());
        var safeAge = Number(displayAge);
        if (!Number.isFinite(safeAge)) safeAge = minAge;
        var progress = ((safeAge - minAge) / Math.max(1, maxAge - minAge)) * 100;
        var clamped = Math.max(0, Math.min(100, progress));
        ageRange.style.setProperty('--bzlc-fill', clamped.toFixed(2) + '%');
      }
      function readDisplayedAge() { return clamp(ageNumber && ageNumber.value, 1, getActiveYears()); }
      function formatAge(value) {
        var rounded = Math.round(value * 10) / 10;
        if (Math.abs(rounded - Math.round(rounded)) < 0.05) return String(Math.round(rounded));
        return String(rounded).replace('.', ',');
      }
      function parseLocalDate(value) {
        if (!value) return null;
        var raw = String(value).trim();
        var match = raw.match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{2}|\d{4})$/);
        if (!match) return null;
        var day = Number(match[1]);
        var month = Number(match[2]);
        var year = Number(match[3]);
        var nowYear = new Date().getFullYear();
        var currentCentury = Math.floor(nowYear / 100) * 100;
        if (year < 100) {
          var candidate = currentCentury + year;
          year = candidate > nowYear ? candidate - 100 : candidate;
        }
        var date = new Date(year, month - 1, day);
        if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
        return date;
      }
      function maskBirthDateInput(value) {
        var digits = String(value || '').replace(/\D/g, '').slice(0, 8);
        if (digits.length <= 2) return digits;
        if (digits.length <= 4) return digits.slice(0, 2) + '.' + digits.slice(2);
        return digits.slice(0, 2) + '.' + digits.slice(2, 4) + '.' + digits.slice(4);
      }
      function getCurrentMondayDate() {
        var now = new Date();
        var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        var daysSinceMonday = (today.getDay() + 6) % 7;
        return new Date(today.getFullYear(), today.getMonth(), today.getDate() - daysSinceMonday);
      }
      function getCurrentMondayWeekIndex() {
        var currentMonday = getCurrentMondayDate();
        var janFirst = new Date(currentMonday.getFullYear(), 0, 1);
        var daysFromNewYear = Math.max(0, Math.floor((currentMonday - janFirst) / dayMs));
        return clamp(Math.floor(daysFromNewYear / 7), 0, weeksPerYear - 1);
      }
      function buildGrid() {
        if (!grid) return;
        grid.textContent = '';
        gridCanvas = document.createElement('canvas');
        gridCanvas.className = 'bzlc-grid-canvas';
        gridCanvas.setAttribute('aria-hidden', 'true');
        gridCanvas.style.display = 'block';
        gridCanvas.style.width = '100%';
        gridCanvas.style.height = '100%';
        gridCanvas.style.pointerEvents = 'none';
        grid.appendChild(gridCanvas);
        gridContext = gridCanvas.getContext('2d', { alpha: true });
      }
      function roundedCell(context, x, y, width, height, radius) {
        if (!context) return;
        var r = Math.max(0, Math.min(radius, Math.min(width, height) / 2));
        context.beginPath();
        context.moveTo(x + r, y);
        context.arcTo(x + width, y, x + width, y + height, r);
        context.arcTo(x + width, y + height, x, y + height, r);
        context.arcTo(x, y + height, x, y, r);
        context.arcTo(x, y, x + width, y, r);
        context.closePath();
      }
      function resizeGridCanvas() {
        if (!grid || !gridCanvas || !gridContext) return;
        var width = Math.max(1, grid.clientWidth || (gridWrap && gridWrap.clientWidth) || 1);
        var mobile = window.matchMedia && window.matchMedia('(max-width: 640px)').matches;
        var gap = mobile ? 1 : 1.15;
        var cell = Math.max(0.75, (width - gap * (totalYears - 1)) / totalYears);
        var height = width * 0.65 + (mobile ? -0.025 : 0.322);
        var cellHeight = Math.max(0.75, (height - gap * (weeksPerYear - 1)) / weeksPerYear);
        var dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
        grid.style.setProperty('height', height.toFixed(3) + 'px', 'important');
        gridCanvas.style.width = width.toFixed(3) + 'px';
        gridCanvas.style.height = height.toFixed(3) + 'px';
        gridCanvas.width = Math.max(1, Math.round(width * dpr));
        gridCanvas.height = Math.max(1, Math.round(height * dpr));
        gridContext.setTransform(dpr, 0, 0, dpr, 0, 0);
        gridCellSize = cell; gridCellHeight = cellHeight; gridGap = gap; gridPixelWidth = width; gridPixelHeight = height;
      }
      function drawGrid(currentCellIndex) {
        if (!gridContext || !gridCanvas) return;
        if (!gridCellSize || !gridPixelWidth || !gridPixelHeight) resizeGridCanvas();
        if (!gridCellSize) return;
        var context = gridContext;
        var size = gridCellSize;
        var cellHeight = gridCellHeight || size;
        var stepX = size + gridGap;
        var stepY = cellHeight + gridGap;
        var mobile = window.innerWidth <= 640;
        var radius = mobile ? 1 : 1.1;
        var palette = themePalette || refreshThemePalette();
        var futureColor = palette.future;
        var livedColor = palette.past;
        var currentColor = palette.current;
        context.clearRect(0, 0, gridPixelWidth, gridPixelHeight);
        var visibleYears = getActiveYears();
        for (var row = 0; row < weeksPerYear; row++) {
          for (var col = 0; col < visibleYears; col++) {
            var logicalIndex = col * weeksPerYear + row;
            var x = col * stepX;
            var y = row * stepY;
            context.fillStyle = logicalIndex < currentCellIndex ? livedColor : futureColor;
            roundedCell(context, x, y, size, cellHeight, radius);
            context.fill();
          }
        }
        var currentCol = Math.floor(currentCellIndex / weeksPerYear);
        var currentRow = currentCellIndex % weeksPerYear;
        var currentX = currentCol * stepX;
        var currentY = currentRow * stepY;
        var scaleGrow = mobile ? 0.05 : 0.07;
        var growX = size * scaleGrow;
        var growY = cellHeight * scaleGrow;
        context.save();
        context.fillStyle = currentColor;
        context.strokeStyle = palette.currentStroke;
        context.lineWidth = 1;
        roundedCell(context, currentX - growX, currentY - growY, size + growX * 2, cellHeight + growY * 2, radius);
        context.fill();
        context.stroke();
        context.restore();
      }
      function setGridSize() {
        if (!gridWrap) return;
        var padding = window.getComputedStyle ? window.getComputedStyle(gridWrap).paddingTop : '';
        if (padding) gridWrap.style.setProperty('--bzlc-grid-pad', padding);
        resizeGridCanvas(); drawGrid(renderedCurrentIndex); positionScaleMark();
      }
      function positionScaleMark() {
        if (!scaleMark || !grid || !gridWrap) return;
        if (!riskCutActive) {
          scaleMark.style.display = 'none';
          return;
        }
        scaleMark.style.display = 'block';
        var yearsMark = totalYears - 15;
        scaleMark.textContent = yearsMark + ' лет';
        scaleMark.classList.add('bzlc-scale-mark--cut');
        var wrapRect = gridWrap.getBoundingClientRect();
        var gridRect = grid.getBoundingClientRect();
        if (!wrapRect.width || !gridRect.width) return;
        var ratio = Math.max(0, Math.min(1, yearsMark / totalYears));
        var x = (gridRect.left - wrapRect.left) + (gridRect.width * ratio);
        var safeX = Math.max(22, Math.min(wrapRect.width - 22, x));
        scaleMark.style.left = safeX + 'px';
      }
      function scheduleGridResize() {
        if (resizeRaf) window.cancelAnimationFrame(resizeRaf);
        resizeRaf = window.requestAnimationFrame(function () { resizeRaf = null; setGridSize(); });
      }
      function scheduleUpdate() {
        if (updateRaf) window.cancelAnimationFrame(updateRaf);
        updateRaf = window.requestAnimationFrame(function () { updateRaf = null; update(); });
      }
      function setBirthPanelOpen() { if (!birthPanel) return; birthPanel.classList.add('bzlc-open'); birthPanel.setAttribute('aria-hidden', 'false'); }
      function syncBirthFieldState() {
        var birthField = root.querySelector('.bzlc-birth-field');
        if (!birthField || !birthInput) return;
        birthField.classList.toggle('bzlc-has-value', !!String(birthInput.value || '').trim());
      }
      function syncModePills() { if (modePill) modePill.classList.toggle('bzlc-active', !preciseMode); }
      function setFastModeFromAge(options) {
        options = options || {};
        preciseMode = false; preciseBirthDate = null;
        if (options.ageValue !== undefined) realAge = clamp(options.ageValue, 1, getActiveYears());
        else if (!options.preserveRealAge) realAge = readDisplayedAge();
        if (options.clearBirth && birthInput) { birthInput.value = ''; syncBirthFieldState(); }
        syncModePills();
        if (options.defer) scheduleUpdate(); else update();
      }
      function applyBirthDate() {
        var date = parseLocalDate(birthInput && birthInput.value);
        var monday = getCurrentMondayDate();
        if (!date || date > monday) { preciseMode = false; preciseBirthDate = null; syncModePills(); update(); return; }
        var livedWeeks = clamp(Math.floor((monday - date) / weekMs), 0, totalWeeks - 1);
        var exactAge = clamp(livedWeeks / weeksPerYear, 1, totalYears);
        preciseMode = true; preciseBirthDate = date; realAge = exactAge;
        syncAgeInputLimits(getEffectiveAge(exactAge)); setBirthPanelOpen(true); syncModePills(); update();
      }
      function update() {
        var activeTotalWeeks = getActiveTotalWeeks();
        var currentCellIndex; var displayAge;
        if (preciseMode && preciseBirthDate) {
          var monday = getCurrentMondayDate();
          var realCurrentIndex = clamp(Math.floor((monday - preciseBirthDate) / weekMs), 0, totalWeeks - 1);
          realAge = clamp(realCurrentIndex / weeksPerYear, 1, totalYears);
          displayAge = getEffectiveAge(realAge);
          currentCellIndex = riskCutActive ? Math.min(realCurrentIndex, activeTotalWeeks - 1) : realCurrentIndex;
        } else {
          realAge = clamp(realAge, 1, totalYears);
          displayAge = getEffectiveAge(realAge);
          currentCellIndex = Math.min(activeTotalWeeks - 1, Math.floor(displayAge * weeksPerYear) + getCurrentMondayWeekIndex());
        }
        syncAgeInputLimits(displayAge);
        syncRangeFill(displayAge);
        renderedCurrentIndex = currentCellIndex;
        drawGrid(currentCellIndex);
        previousLivedWeeks = currentCellIndex; previousCurrentIndex = currentCellIndex; previousRiskCutActive = riskCutActive;
        if (cutToggle) {
          cutToggle.removeAttribute('aria-pressed');
          cutToggle.setAttribute('role', 'switch');
          cutToggle.setAttribute('aria-checked', riskCutActive ? 'true' : 'false');
          cutToggle.setAttribute('aria-label', riskCutActive ? 'Сценарий включён: 65 лет, если не бросить' : 'Показать сценарий 65 лет, если не бросить');
        }
        if (cutCopy) cutCopy.textContent = 'Если не бросить';
        if (cutPill) cutPill.textContent = riskCutActive ? '65 лет' : '80 лет';
        root.classList.toggle('bzlc-cut-mode', !!riskCutActive);
        positionScaleMark(); syncModePills();
      }

      buildGrid(); setGridSize(); setBirthPanelOpen(true); syncBirthFieldState(); setLifePalette(lifePalette, false); update();

      function primeWholeYearSlider() {
        if (!ageRange) return;
        ageRange.step = '1';
      }
      ageRange.addEventListener('pointerdown', primeWholeYearSlider, { passive: true });
      ageRange.addEventListener('keydown', primeWholeYearSlider);
      ageRange.addEventListener('input', function () {
        realAge = wholeYearAge(ageRange.value);
        ageRange.step = '1';
        ageRange.value = String(realAge);
        ageNumber.value = String(realAge);
        setFastModeFromAge({ clearBirth: true, defer: true, ageValue: realAge });
      });
      ageNumber.addEventListener('input', function () {
        if (ageNumber.value === '') return;
        realAge = wholeYearAge(ageNumber.value);
        ageNumber.step = '1';
        ageNumber.value = String(realAge);
        setFastModeFromAge({ clearBirth: true, defer: true, ageValue: realAge });
      });
      ageNumber.addEventListener('blur', function () {
        realAge = wholeYearAge(ageNumber.value);
        ageNumber.step = '1';
        ageNumber.value = String(realAge);
        setFastModeFromAge({ clearBirth: true, ageValue: realAge });
      });
      if (birthInput) {
        birthInput.addEventListener('input', function () {
          birthInput.value = maskBirthDateInput(birthInput.value); syncBirthFieldState();
          try { birthInput.setSelectionRange(birthInput.value.length, birthInput.value.length); } catch(e) {}
          applyBirthDate();
        });
        birthInput.addEventListener('change', function () { syncBirthFieldState(); applyBirthDate(); });
        birthInput.addEventListener('blur', function () { syncBirthFieldState(); applyBirthDate(); });
      }
      if (birthReset) birthReset.addEventListener('click', function () { setFastModeFromAge({ clearBirth: true }); });
      window.addEventListener('resize', scheduleGridResize, { passive: true });
      if (cutToggle) {
        cutToggle.addEventListener('click', function () {
          riskCutActive = !riskCutActive;
          root.classList.remove('bzlc-cut-evaporated');
          update();
        });
      }
    })();
