/**
 * ============================================================================
 * TapsCalculator - Aplikasi Perhitungan Ilmiah & Konversi Satuan
 * JavaScript ES6+ Engine
 * Modul:
 *  1. Navigasi Antarmuka (Kalkulator Ilmiah & Konversi Satuan)
 *  2. Kalkulator Ilmiah Presisi Tinggi (DEG/RAD, Invers, Pangkat, Konstanta, Memori, Riwayat)
 *  3. Konversi Satuan Ilmiah Lengkap (Panjang, Energi, Tekanan, Suhu, Massa, Kecepatan)
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  NavigationModule.init();
  ScientificCalcModule.init();
  UnitConverterModule.init();
});

/* ============================================================================
   NAVIGASI TAB MODUL
   ============================================================================ */
const NavigationModule = (() => {
  function init() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const panels = document.querySelectorAll('.tab-panel');

    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-tab');

        navButtons.forEach(b => b.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const targetPanel = document.getElementById(targetId);
        if (targetPanel) {
          targetPanel.classList.add('active');
        }
      });
    });
  }

  return { init };
})();

/* ============================================================================
   1. MODUL KALKULATOR ILMIAH
   ============================================================================ */
const ScientificCalcModule = (() => {
  let isDegreeMode = true;
  let isInvMode = false;
  let memoryVal = 0;
  let lastAns = 0;
  let calcHistory = [];

  let inputEl;
  let previewEl;
  let historyPrevEl;
  let angleBadgeEl;
  let invBadgeEl;
  let memBadgeEl;
  let historyListEl;

  function init() {
    inputEl = document.getElementById('calcInput');
    previewEl = document.getElementById('calcPreviewResult');
    historyPrevEl = document.getElementById('calcHistoryPreview');
    angleBadgeEl = document.getElementById('angleModeBadge');
    invBadgeEl = document.getElementById('invModeBadge');
    memBadgeEl = document.getElementById('memBadge');
    historyListEl = document.getElementById('calcHistoryList');

    loadHistoryFromStorage();
    bindEvents();
  }

  function bindEvents() {
    inputEl?.addEventListener('input', () => {
      updateLivePreview();
    });

    document.querySelectorAll('.calc-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        handleButtonClick(btn);
      });
    });

    document.querySelectorAll('.const-item').forEach(item => {
      item.addEventListener('click', () => {
        const val = item.getAttribute('data-insert');
        insertAtCursor(val);
        updateLivePreview();
      });
    });

    const clearHistBtn = document.getElementById('btnClearHistory');
    if (clearHistBtn) {
      clearHistBtn.addEventListener('click', () => {
        calcHistory = [];
        saveHistoryToStorage();
        renderHistoryList();
      });
    }

    window.addEventListener('keydown', handleKeyboard);
  }

  function handleButtonClick(btn) {
    const val = isInvMode && btn.dataset.inv ? btn.dataset.inv : btn.dataset.val;
    const action = btn.dataset.action;
    const id = btn.id;

    if (id === 'btnToggleAngle') {
      isDegreeMode = !isDegreeMode;
      btn.textContent = isDegreeMode ? 'DEG' : 'RAD';
      angleBadgeEl.textContent = isDegreeMode ? 'DEG' : 'RAD';
      angleBadgeEl.classList.toggle('active', isDegreeMode);
      updateLivePreview();
      return;
    }

    if (id === 'btnToggleInv') {
      isInvMode = !isInvMode;
      btn.classList.toggle('active', isInvMode);
      invBadgeEl.textContent = isInvMode ? '2nd ON' : '2nd OFF';
      invBadgeEl.classList.toggle('active', isInvMode);
      updateButtonLabelsForInverse();
      return;
    }

    if (id === 'btnClear') {
      inputEl.value = '';
      previewEl.textContent = '= 0';
      document.getElementById('calcStatus').textContent = 'Siap menghitung';
      inputEl.focus();
      return;
    }

    if (id === 'btnBackspace') {
      backspace();
      return;
    }

    if (id === 'btnEquals') {
      executeCalculation();
      return;
    }

    if (action === 'mem-clear') {
      memoryVal = 0;
      updateMemBadge();
      return;
    }
    if (action === 'mem-recall') {
      insertAtCursor(memoryVal.toString());
      updateLivePreview();
      return;
    }
    if (action === 'mem-add') {
      const current = evaluateExpression(inputEl.value);
      if (current !== null && !isNaN(current)) {
        memoryVal += current;
        updateMemBadge();
      }
      return;
    }
    if (action === 'mem-sub') {
      const current = evaluateExpression(inputEl.value);
      if (current !== null && !isNaN(current)) {
        memoryVal -= current;
        updateMemBadge();
      }
      return;
    }

    if (action === 'negate') {
      toggleNegate();
      return;
    }

    if (val) {
      if (val === 'Ans') {
        insertAtCursor(lastAns.toString());
      } else {
        insertAtCursor(val);
      }
      updateLivePreview();
    }
  }

  function updateButtonLabelsForInverse() {
    document.querySelectorAll('[data-inv]').forEach(btn => {
      const normal = btn.dataset.val.replace('(', '');
      const inv = btn.dataset.inv.replace('(', '');
      btn.textContent = isInvMode ? inv : normal;
    });
  }

  function updateMemBadge() {
    memBadgeEl.textContent = `M: ${Math.round(memoryVal * 1000) / 1000}`;
    memBadgeEl.classList.toggle('active', memoryVal !== 0);
  }

  function insertAtCursor(text) {
    const start = inputEl.selectionStart || inputEl.value.length;
    const end = inputEl.selectionEnd || inputEl.value.length;
    const before = inputEl.value.substring(0, start);
    const after = inputEl.value.substring(end);

    inputEl.value = before + text + after;
    inputEl.selectionStart = inputEl.selectionEnd = start + text.length;
    inputEl.focus();
  }

  function backspace() {
    const start = inputEl.selectionStart;
    const end = inputEl.selectionEnd;
    if (start === end && start > 0) {
      inputEl.value = inputEl.value.substring(0, start - 1) + inputEl.value.substring(start);
      inputEl.selectionStart = inputEl.selectionEnd = start - 1;
    } else if (start !== end) {
      inputEl.value = inputEl.value.substring(0, start) + inputEl.value.substring(end);
      inputEl.selectionStart = inputEl.selectionEnd = start;
    }
    updateLivePreview();
    inputEl.focus();
  }

  function toggleNegate() {
    let str = inputEl.value.trim();
    if (!str) {
      inputEl.value = '-';
      return;
    }
    if (str.startsWith('-(') && str.endsWith(')')) {
      inputEl.value = str.slice(2, -1);
    } else if (str.startsWith('-')) {
      inputEl.value = str.slice(1);
    } else {
      inputEl.value = `-(${str})`;
    }
    updateLivePreview();
  }

  function updateLivePreview() {
    const expr = inputEl.value.trim();
    if (!expr) {
      previewEl.textContent = '= 0';
      document.getElementById('calcStatus').textContent = 'Siap menghitung';
      return;
    }

    try {
      const res = evaluateExpression(expr);
      if (res !== null && !isNaN(res) && isFinite(res)) {
        previewEl.textContent = `= ${formatScientificNumber(res)}`;
        document.getElementById('calcStatus').textContent = 'Ekspresi Valid';
      } else if (res !== null && !isFinite(res)) {
        previewEl.textContent = '= Tak Hingga (∞)';
        document.getElementById('calcStatus').textContent = 'Batas Tak Terhingga';
      }
    } catch (e) {
      document.getElementById('calcStatus').textContent = 'Mengetik formula...';
    }
  }

  function executeCalculation() {
    const rawExpr = inputEl.value.trim();
    if (!rawExpr) return;

    try {
      const result = evaluateExpression(rawExpr);
      if (result === null || isNaN(result)) {
        throw new Error('Ekspresi Tidak Valid');
      }

      lastAns = result;
      const formatted = formatScientificNumber(result);

      historyPrevEl.textContent = `${rawExpr} =`;
      addToHistory(rawExpr, formatted);

      inputEl.value = formatted;
      previewEl.textContent = `= ${formatted}`;
      document.getElementById('calcStatus').textContent = 'Selesai';
    } catch (err) {
      document.getElementById('calcStatus').textContent = 'Error: ' + err.message;
      previewEl.textContent = '= Error Sintaks';
    }
  }

  function handleKeyboard(e) {
    const activeElement = document.activeElement;
    if (activeElement && (activeElement.id === 'convertFromValue' || activeElement.tagName === 'TEXTAREA' || (activeElement.tagName === 'INPUT' && activeElement.id !== 'calcInput'))) {
      return;
    }

    if (e.key >= '0' && e.key <= '9') {
      insertAtCursor(e.key);
      updateLivePreview();
      e.preventDefault();
    } else if (['+', '-', '*', '/', '.', '(', ')', '^', '%', '!'].includes(e.key)) {
      insertAtCursor(e.key);
      updateLivePreview();
      e.preventDefault();
    } else if (e.key === 'Enter' || e.key === '=') {
      executeCalculation();
      e.preventDefault();
    } else if (e.key === 'Backspace') {
      backspace();
      e.preventDefault();
    } else if (e.key === 'Escape' || e.key.toLowerCase() === 'c') {
      inputEl.value = '';
      previewEl.textContent = '= 0';
      e.preventDefault();
    }
  }

  function evaluateExpression(exprStr) {
    if (!exprStr || typeof exprStr !== 'string') return null;
    let s = exprStr.trim();

    s = s.replace(/\bpi\b/gi, Math.PI.toString());
    s = s.replace(/π/g, Math.PI.toString());
    s = s.replace(/\be\b/g, Math.E.toString());

    s = s.replace(/(\d+(?:\.\d+)?)\s*nPr\s*(\d+(?:\.\d+)?)/gi, (_, n, r) => {
      return `__calcPermutation(${n},${r})`;
    });
    s = s.replace(/(\d+(?:\.\d+)?)\s*nCr\s*(\d+(?:\.\d+)?)/gi, (_, n, r) => {
      return `__calcCombination(${n},${r})`;
    });

    s = s.replace(/(\d+(?:\.\d+)?|\([^()]+\))!/g, (_, val) => {
      return `__calcFact(${val})`;
    });

    s = parsePowers(s);

    if (isDegreeMode) {
      s = s.replace(/\basin\(/g, `(180/Math.PI)*Math.asin(`);
      s = s.replace(/\bacos\(/g, `(180/Math.PI)*Math.acos(`);
      s = s.replace(/\batan\(/g, `(180/Math.PI)*Math.atan(`);

      s = s.replace(/\bsin\(/g, `Math.sin((Math.PI/180)*`);
      s = s.replace(/\bcos\(/g, `Math.cos((Math.PI/180)*`);
      s = s.replace(/\btan\(/g, `Math.tan((Math.PI/180)*`);
    } else {
      s = s.replace(/\basin\(/g, `Math.asin(`);
      s = s.replace(/\bacos\(/g, `Math.acos(`);
      s = s.replace(/\batan\(/g, `Math.atan(`);

      s = s.replace(/\bsin\(/g, `Math.sin(`);
      s = s.replace(/\bcos\(/g, `Math.cos(`);
      s = s.replace(/\btan\(/g, `Math.tan(`);
    }

    s = s.replace(/\blog10\(/g, `Math.log10(`);
    s = s.replace(/\bln\(/g, `Math.log(`);
    s = s.replace(/\bsqrt\(/g, `Math.sqrt(`);
    s = s.replace(/√\(/g, `Math.sqrt(`);
    s = s.replace(/√(\d+(?:\.\d+)?)/g, `Math.sqrt($1)`);
    s = s.replace(/\bcbrt\(/g, `Math.cbrt(`);
    s = s.replace(/\babs\(/g, `Math.abs(`);

    s = s.replace(/(\d)(\()/g, '$1*$2');
    s = s.replace(/(\))(\d)/g, '$1*$2');
    s = s.replace(/(\))(\()/g, '$1*$2');

    let openParens = (s.match(/\(/g) || []).length;
    let closeParens = (s.match(/\)/g) || []).length;
    while (openParens > closeParens) {
      s += ')';
      closeParens++;
    }

    const fn = new Function(
      '__calcFact',
      '__calcPermutation',
      '__calcCombination',
      `"use strict"; return (${s});`
    );

    return fn(factorial, permutation, combination);
  }

  function parsePowers(str) {
    while (str.includes('^')) {
      const match = str.match(/([a-zA-Z0-9_.]+|\([^()]+\))\^([a-zA-Z0-9_.]+|\([^()]+\))/);
      if (!match) break;
      str = str.replace(match[0], `Math.pow(${match[1]}, ${match[2]})`);
    }
    return str;
  }

  function factorial(n) {
    n = Math.floor(n);
    if (n < 0) return NaN;
    if (n === 0 || n === 1) return 1;
    let res = 1;
    for (let i = 2; i <= n; i++) {
      res *= i;
      if (!isFinite(res)) return Infinity;
    }
    return res;
  }

  function permutation(n, r) {
    if (r < 0 || r > n) return 0;
    return factorial(n) / factorial(n - r);
  }

  function combination(n, r) {
    if (r < 0 || r > n) return 0;
    return factorial(n) / (factorial(r) * factorial(n - r));
  }

  function formatScientificNumber(num) {
    if (num === null || isNaN(num)) return 'NaN';
    if (!isFinite(num)) return num > 0 ? 'Infinity' : '-Infinity';

    const rounded = Number(Math.round(Number(num + 'e12')) + 'e-12');
    if (Math.abs(rounded) > 1e12 || (Math.abs(rounded) < 1e-6 && rounded !== 0)) {
      return rounded.toExponential(6).replace('e+', ' × 10^').replace('e-', ' × 10^-');
    }
    return rounded.toString();
  }

  function addToHistory(expr, result) {
    calcHistory.unshift({ expr, result, time: new Date().toLocaleTimeString('id-ID') });
    if (calcHistory.length > 25) calcHistory.pop();
    saveHistoryToStorage();
    renderHistoryList();
  }

  function saveHistoryToStorage() {
    try {
      localStorage.setItem('taps_calc_history', JSON.stringify(calcHistory));
    } catch (e) {}
  }

  function loadHistoryFromStorage() {
    try {
      const saved = localStorage.getItem('taps_calc_history') || localStorage.getItem('quantum_calc_history');
      if (saved) {
        calcHistory = JSON.parse(saved);
        renderHistoryList();
      }
    } catch (e) {}
  }

  function renderHistoryList() {
    if (!historyListEl) return;
    if (calcHistory.length === 0) {
      historyListEl.innerHTML = '<div class="empty-state">Belum ada riwayat kalkulasi.</div>';
      return;
    }

    historyListEl.innerHTML = calcHistory.map((item, idx) => `
      <div class="history-item" data-idx="${idx}" title="Klik untuk memuat kembali">
        <div class="hist-exp">${escapeHtml(item.expr)}</div>
        <div class="hist-res">= ${escapeHtml(item.result)}</div>
      </div>
    `).join('');

    historyListEl.querySelectorAll('.history-item').forEach(el => {
      el.addEventListener('click', () => {
        const idx = el.getAttribute('data-idx');
        const item = calcHistory[idx];
        if (item) {
          inputEl.value = item.result.replace(/ × 10\^/g, 'e');
          updateLivePreview();
        }
      });
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  return {
    init,
    evaluate: evaluateExpression,
    formatNumber: formatScientificNumber
  };
})();

/* ============================================================================
   2. MODUL KONVERSI SATUAN ILMIAH
   ============================================================================ */
const UnitConverterModule = (() => {
  const unitData = {
    length: {
      name: 'Panjang & Jarak',
      base: 'm',
      units: {
        m: { name: 'Meter', factor: 1 },
        km: { name: 'Kilometer', factor: 1000 },
        cm: { name: 'Sentimeter', factor: 0.01 },
        mm: { name: 'Milimeter', factor: 0.001 },
        um: { name: 'Mikrometer (µm)', factor: 1e-6 },
        nm: { name: 'Nanometer', factor: 1e-9 },
        angstrom: { name: 'Angstrom (Å)', factor: 1e-10 },
        in: { name: 'Inci (inch)', factor: 0.0254 },
        ft: { name: 'Kaki (feet)', factor: 0.3048 },
        mi: { name: 'Mil (mile)', factor: 1609.344 },
        au: { name: 'Satuan Astronomi (AU)', factor: 1.495978707e11 },
        ly: { name: 'Tahun Cahaya (Light-Year)', factor: 9.460730472e15 },
        pc: { name: 'Parsec', factor: 3.085677581e16 }
      }
    },
    energy: {
      name: 'Energi & Kalori',
      base: 'j',
      units: {
        j: { name: 'Joule', factor: 1 },
        kj: { name: 'Kilojoule', factor: 1000 },
        cal: { name: 'Kalori (cal)', factor: 4.184 },
        kcal: { name: 'Kilokalori (kcal)', factor: 4184 },
        ev: { name: 'Elektron-Volt (eV)', factor: 1.602176634e-19 },
        kwh: { name: 'Kilowatt-Hour (kWh)', factor: 3.6e6 },
        btu: { name: 'BTU', factor: 1055.06 },
        erg: { name: 'Erg', factor: 1e-7 }
      }
    },
    pressure: {
      name: 'Tekanan',
      base: 'pa',
      units: {
        pa: { name: 'Pascal (N/m²)', factor: 1 },
        kpa: { name: 'Kilopascal', factor: 1000 },
        bar: { name: 'Bar', factor: 1e5 },
        atm: { name: 'Atmosfer Standar (atm)', factor: 101325 },
        torr: { name: 'Torr (mmHg)', factor: 133.322368 },
        psi: { name: 'Pound/sq inch (psi)', factor: 6894.757 }
      }
    },
    temp: {
      name: 'Temperatur',
      base: 'c',
      isCustom: true,
      units: {
        c: { name: 'Celsius (°C)', symbol: '°C' },
        f: { name: 'Fahrenheit (°F)', symbol: '°F' },
        k: { name: 'Kelvin (K)', symbol: 'K' },
        r: { name: 'Rankine (°R)', symbol: '°R' }
      }
    },
    mass: {
      name: 'Massa',
      base: 'kg',
      units: {
        kg: { name: 'Kilogram', factor: 1 },
        g: { name: 'Gram', factor: 0.001 },
        mg: { name: 'Miligram', factor: 1e-6 },
        ug: { name: 'Mikrogram (µg)', factor: 1e-9 },
        ton: { name: 'Ton Metrik', factor: 1000 },
        lb: { name: 'Pound (lbs)', factor: 0.45359237 },
        oz: { name: 'Ons (ounce)', factor: 0.0283495231 },
        u: { name: 'Satuan Massa Atom (u)', factor: 1.6605390666e-27 }
      }
    },
    speed: {
      name: 'Kecepatan',
      base: 'mps',
      units: {
        mps: { name: 'Meter/sekon (m/s)', factor: 1 },
        kph: { name: 'Kilometer/jam (km/h)', factor: 1 / 3.6 },
        mph: { name: 'Mil/jam (mph)', factor: 0.44704 },
        knot: { name: 'Knot (nautical mile/h)', factor: 0.514444 },
        c_speed: { name: 'Kecepatan Cahaya (c)', factor: 299792458 },
        mach: { name: 'Mach (pada STP)', factor: 340.29 }
      }
    }
  };

  let activeCat = 'length';
  let fromValInput, toValInput, fromSelect, toSelect;

  function init() {
    fromValInput = document.getElementById('convertFromValue');
    toValInput = document.getElementById('convertToValue');
    fromSelect = document.getElementById('convertFromSelect');
    toSelect = document.getElementById('convertToSelect');

    const catButtons = document.querySelectorAll('.cat-btn');
    catButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        catButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeCat = btn.getAttribute('data-cat');
        populateSelectOptions();
        recalculate();
      });
    });

    fromValInput?.addEventListener('input', recalculate);
    fromSelect?.addEventListener('change', recalculate);
    toSelect?.addEventListener('change', recalculate);

    document.getElementById('btnSwapUnits')?.addEventListener('click', () => {
      const temp = fromSelect.value;
      fromSelect.value = toSelect.value;
      toSelect.value = temp;
      recalculate();
    });

    populateSelectOptions();
    recalculate();
  }

  function populateSelectOptions() {
    const cat = unitData[activeCat];
    if (!cat) return;

    const keys = Object.keys(cat.units);
    const optionsHtml = keys
      .map(k => `<option value="${k}">${cat.units[k].name}</option>`)
      .join('');

    fromSelect.innerHTML = optionsHtml;
    toSelect.innerHTML = optionsHtml;

    fromSelect.value = keys[0];
    toSelect.value = keys[1] || keys[0];
  }

  function recalculate() {
    const cat = unitData[activeCat];
    const val = parseFloat(fromValInput.value) || 0;
    const uFrom = fromSelect.value;
    const uTo = toSelect.value;

    let res = 0;

    if (cat.isCustom && activeCat === 'temp') {
      res = convertTemperature(val, uFrom, uTo);
    } else {
      const fromFactor = cat.units[uFrom].factor;
      const toFactor = cat.units[uTo].factor;
      const inBase = val * fromFactor;
      res = inBase / toFactor;
    }

    toValInput.value = formatConvertedVal(res);
    populateComparisonTable(val, uFrom);
  }

  function convertTemperature(val, from, to) {
    let kelvin = 0;
    if (from === 'c') kelvin = val + 273.15;
    else if (from === 'f') kelvin = (val - 32) * (5 / 9) + 273.15;
    else if (from === 'k') kelvin = val;
    else if (from === 'r') kelvin = val * (5 / 9);

    if (to === 'c') return kelvin - 273.15;
    if (to === 'f') return (kelvin - 273.15) * (9 / 5) + 32;
    if (to === 'k') return kelvin;
    if (to === 'r') return kelvin * (9 / 5);
    return val;
  }

  function formatConvertedVal(num) {
    if (num === 0) return '0';
    if (Math.abs(num) >= 1e9 || Math.abs(num) < 1e-4) {
      return num.toExponential(6);
    }
    return (Math.round(num * 1e8) / 1e8).toString();
  }

  function populateComparisonTable(val, currentUnitKey) {
    const cat = unitData[activeCat];
    const tbody = document.getElementById('unitComparisonBody');
    if (!tbody || !cat) return;

    let rowsHtml = '';
    const keys = Object.keys(cat.units);

    keys.forEach(key => {
      let converted = 0;
      if (cat.isCustom && activeCat === 'temp') {
        converted = convertTemperature(val, currentUnitKey, key);
      } else {
        const inBase = val * cat.units[currentUnitKey].factor;
        converted = inBase / cat.units[key].factor;
      }

      const formattedVal = Math.abs(converted) >= 100000 || (Math.abs(converted) < 0.001 && converted !== 0)
        ? converted.toPrecision(6)
        : (Math.round(converted * 10000) / 10000).toString();

      const sciVal = converted.toExponential(4).replace('e+', ' × 10^').replace('e-', ' × 10^-');

      rowsHtml += `
        <tr>
          <td><strong>${cat.units[key].name}</strong></td>
          <td><code>${key}</code></td>
          <td>${formattedVal}</td>
          <td>${sciVal}</td>
        </tr>
      `;
    });

    tbody.innerHTML = rowsHtml;
  }

  return { init };
})();
