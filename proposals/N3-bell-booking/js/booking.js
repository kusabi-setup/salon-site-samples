/* Local-only reservation composer. Menu prices and staff images come from the page. */
(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const dialog = $('#booking-dialog');
  const selected = new Set();
  const preferences = [{date: '', time: ''}, {date: '', time: ''}, {date: '', time: ''}];
  let step = 1, activePreference = 0, review = false, opener;
  const bangkok = new Intl.DateTimeFormat('en-CA', {timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit'});
  const dateLabel = new Intl.DateTimeFormat('ja-JP', {timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric', weekday: 'short'});
  const key = date => date.toISOString().slice(0, 10);
  const asDate = value => new Date(`${value}T00:00:00Z`);
  function today() {
    const parts = Object.fromEntries(bangkok.formatToParts(new Date()).map(p => [p.type, p.value]));
    return `${parts.year}-${parts.month}-${parts.day}`;
  }
  function lastDate() { const date = asDate(today()); date.setUTCDate(date.getUTCDate() + 90); return key(date); }
  let month = asDate(today()); month.setUTCDate(1);
  function closed(value) {
    const date = asDate(value), day = date.getUTCDay(), week = Math.ceil(date.getUTCDate() / 7);
    return day === 3 || (day === 4 && [2, 4].includes(week));
  }
  function times(value, now = Date.now()) {
    if (!value || value < today() || value > lastDate() || closed(value)) return [];
    const cutoff = asDate(value).getUTCDay() === 2 ? 840 : 1110;
    const result = [];
    for (let minute = 540; minute <= cutoff; minute += 30) {
      const time = `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
      if (Date.parse(`${value}T${time}:00+07:00`) > now) result.push(time);
    }
    return result;
  }
  window.BellBookingCalendar = Object.freeze({closed, times});
  const menus = [];
  document.querySelectorAll('#hair-menu .menu-group, #menu .eyelash').forEach((group, groupIndex) => {
    const fieldset = document.createElement('fieldset');
    const legend = document.createElement('legend');
    legend.textContent = group.querySelector('h3').textContent;
    fieldset.append(legend);
    group.querySelectorAll('dl > div').forEach(row => {
      const name = row.querySelector('dt').childNodes[0].textContent.trim();
      const price = row.querySelector('dd').textContent;
      const id = `menu-${menus.length}`;
      const numbers = price.replaceAll(',', '').match(/\d+/g).map(Number);
      menus.push({id, name, price, low: numbers[0], high: numbers[1] || numbers[0]});
      const label = document.createElement('label');
      label.className = 'menu-choice';
      const input = document.createElement('input');
      input.type = 'checkbox'; input.value = id;
      const title = document.createElement('span'); title.textContent = name;
      const cost = document.createElement('strong'); cost.textContent = price;
      label.append(input, title, cost); fieldset.append(label);
      input.addEventListener('change', () => {input.checked ? selected.add(id) : selected.delete(id); updateSummary();});
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'menu-book'; button.textContent = '選ぶ ＋';
      button.setAttribute('aria-label', `${name}を選んで予約リクエスト`);
      button.addEventListener('click', () => {selected.add(id); input.checked = true; open(button);});
      row.querySelector('dd').append(button);
    });
    if (groupIndex === 4) legend.textContent = 'Eyelash & Eyebrow';
    $('#menu-choices').append(fieldset);
  });
  document.querySelectorAll('.staff-grid article').forEach(article => {
    const name = article.querySelector('h3').textContent;
    const label = document.createElement('label'); label.className = 'staff-choice';
    const input = document.createElement('input'); input.type = 'radio'; input.name = 'stylist'; input.value = name;
    const img = article.querySelector('img').cloneNode(); img.loading = 'eager'; img.alt = '';
    const text = document.createElement('span'); text.textContent = name;
    const check = document.createElement('span'); check.className = 'choice-check'; check.textContent = '✓'; check.setAttribute('aria-hidden', 'true');
    label.append(input, img, text, check); $('#staff-choices').append(label);
  });
  const stylist = () => document.querySelector('[name="stylist"]:checked').value;
  document.querySelectorAll('[name="stylist"]').forEach(input => input.addEventListener('change', updateSummary));
  function totalPrice() {
    const choices = menus.filter(menu => selected.has(menu.id));
    const low = choices.reduce((n, m) => n + m.low, 0), high = choices.reduce((n, m) => n + m.high, 0);
    return low === high ? `${low.toLocaleString()}B` : `${low.toLocaleString()}–${high.toLocaleString()}B`;
  }
  function updateSummary() {
    const choices = menus.filter(menu => selected.has(menu.id));
    $('#summary-menu').textContent = choices.map(menu => menu.name).join(' / ') || 'メニューを選んでください';
    $('#summary-staff').textContent = `担当：${stylist()}`;
    $('#summary-price').textContent = selected.size ? totalPrice() : '—';
    $('#selection-count').textContent = selected.size ? `${selected.size}メニュー · 目安 ${totalPrice()}` : 'メニュー未選択';
    $('#booking-next').disabled = step === 1 && !selected.size;
  }
  function open(button) {
    opener = button; review = false; step = 1;
    updateSummary(); renderStep();
    dialog.showModal(); document.body.classList.add('booking-open');
    $('#booking-title').focus();
  }
  document.querySelectorAll('[data-book]').forEach(button => button.addEventListener('click', () => open(button)));
  $('#booking-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {document.body.classList.remove('booking-open'); opener?.focus({preventScroll: true});});
  function renderStep() {
    $('#booking-error').textContent = '';
    document.querySelectorAll('.booking-step').forEach(el => el.hidden = Number(el.dataset.step) !== step);
    document.querySelectorAll('.booking-progress li').forEach((el, i) => {
      if (i + 1 === step) el.setAttribute('aria-current', 'step'); else el.removeAttribute('aria-current');
      el.classList.toggle('completed', i + 1 < step);
    });
    $('#step-label').textContent = `STEP 0${step} / 03${review ? ' · CHECK & COPY' : ''}`;
    $('#booking-title').textContent = review ? 'あとは、LINEで。' : ['メニューを選ぶ。', '担当を選ぶ。', '希望日時を選ぶ。'][step - 1];
    $('#booking-back').hidden = step === 1;
    $('#booking-back').textContent = review ? '← 日時を編集' : '← 戻る';
    $('#booking-next').hidden = review;
    $('#booking-next').textContent = ['担当を選ぶ →', '希望日時を選ぶ →', '予約内容を確認 →'][step - 1];
    $('#date-editor').hidden = review;
    $('#request-review').hidden = !review;
    updateSummary();
    if (step === 3 && !review) renderCalendar();
    $('.booking-content').scrollTop = 0;
    $('#booking-title').focus({preventScroll: true});
  }
  function validate() {
    if (!selected.size) return 'メニューを1つ以上選んでください。';
    if (!preferences[0].date || !preferences[0].time) return '第1希望の日付と時間を選んでください。';
    const seen = new Set();
    for (const [index, preference] of preferences.entries()) {
      if (!preference.date && !preference.time) continue;
      if (!preference.time || !times(preference.date).includes(preference.time)) return `第${index + 1}希望の日時を選び直してください。受付時間外、または過去の日時です。`;
      const signature = preference.date + preference.time;
      if (seen.has(signature)) return '希望日時が重複しています。別の日時を選んでください。';
      seen.add(signature);
    }
    return '';
  }
  $('#booking-next').addEventListener('click', () => {
    if (step === 1 && !selected.size) return;
    if (step < 3) step++;
    else {
      const error = validate();
      if (error) {$('#booking-error').textContent = error; $('#booking-error').scrollIntoView({block: 'nearest'}); return;}
      review = true; $('#request-message').value = message(); $('#copy-status').textContent = '';
    }
    renderStep();
  });
  $('#booking-back').addEventListener('click', () => {if (review) review = false; else step--; renderStep();});
  function renderPreferences() {
    $('#preference-tabs').replaceChildren();
    preferences.forEach((preference, index) => {
      const button = document.createElement('button'); button.type = 'button';
      button.dataset.preference = String(index);
      button.setAttribute('aria-pressed', String(activePreference === index));
      const name = document.createElement('strong'); name.textContent = `第${index + 1}希望 ${index ? '任意' : '必須'}`;
      const value = document.createElement('span'); value.textContent = preference.date ? `${Number(preference.date.slice(5, 7))}/${Number(preference.date.slice(8))} ${preference.time || '時間を選択'}` : '日時を選択';
      button.append(name, value);
      button.addEventListener('click', () => {
        activePreference = index;
        if (preference.date) {month = asDate(preference.date); month.setUTCDate(1);}
        $('#booking-error').textContent = ''; renderCalendar();
        document.querySelector(`[data-preference="${index}"]`).focus({preventScroll: true});
      });
      $('#preference-tabs').append(button);
    });
  }
  function renderCalendar() {
    renderPreferences();
    const first = new Date(month), end = new Date(month); end.setUTCMonth(end.getUTCMonth() + 1); end.setUTCDate(0);
    $('#calendar-month').textContent = `${month.getUTCFullYear()}年 ${month.getUTCMonth() + 1}月`;
    $('#month-prev').disabled = key(month).slice(0, 7) <= today().slice(0, 7);
    $('#month-next').disabled = key(month).slice(0, 7) >= lastDate().slice(0, 7);
    const days = $('#calendar-days'); days.replaceChildren();
    for (let i = 0; i < first.getUTCDay(); i++) days.append(document.createElement('span'));
    for (let day = 1; day <= end.getUTCDate(); day++) {
      const date = new Date(month); date.setUTCDate(day); const value = key(date);
      const button = document.createElement('button'); button.type = 'button'; button.textContent = day;
      button.dataset.date = value;
      const isClosed = closed(value);
      button.disabled = !times(value).length;
      button.classList.toggle('closed', isClosed);
      button.setAttribute('aria-label', `${dateLabel.format(date)}${isClosed ? ' 定休日' : button.disabled ? ' 受付対象外' : ''}`);
      button.setAttribute('aria-pressed', String(preferences[activePreference].date === value));
      button.addEventListener('click', () => {
        preferences[activePreference] = {date: value, time: ''};
        $('#booking-error').textContent = ''; renderCalendar();
        document.querySelector(`[data-date="${value}"]`).focus({preventScroll: true});
      });
      days.append(button);
    }
    renderTimes();
  }
  function renderTimes() {
    const preference = preferences[activePreference];
    $('#time-heading').textContent = preference.date ? `${dateLabel.format(asDate(preference.date))} の希望時間` : '日付を選ぶと、受付時間が表示されます。';
    $('#time-slots').replaceChildren();
    times(preference.date).forEach(time => {
      const button = document.createElement('button'); button.type = 'button'; button.textContent = time;
      button.dataset.time = time;
      button.setAttribute('aria-pressed', String(preference.time === time));
      button.disabled = preferences.some((p, i) => i !== activePreference && p.date === preference.date && p.time === time);
      if (button.disabled) button.title = 'ほかの希望日時で選択済み';
      button.addEventListener('click', () => {preference.time = time; $('#booking-error').textContent = ''; renderPreferences(); renderTimes(); document.querySelector(`[data-time="${time}"]`).focus({preventScroll: true});});
      $('#time-slots').append(button);
    });
    $('#clear-preference').hidden = !preference.date;
  }
  $('#month-prev').addEventListener('click', () => {month.setUTCMonth(month.getUTCMonth() - 1); renderCalendar();});
  $('#month-next').addEventListener('click', () => {month.setUTCMonth(month.getUTCMonth() + 1); renderCalendar();});
  $('#clear-preference').addEventListener('click', () => {preferences[activePreference] = {date: '', time: ''}; renderCalendar(); document.querySelector(`[data-preference="${activePreference}"]`).focus({preventScroll: true});});
  function message() {
    return ['BELL ご担当者様', '予約を希望します。空き状況をお知らせください。', '', '【メニュー】', ...menus.filter(m => selected.has(m.id)).map(m => `・${m.name}（${m.price}）`), `料金の目安：${totalPrice()}（追加料金別）`, '', `【担当】${stylist()}`, '', '【希望日時・タイ時間】', ...preferences.map((p, i) => p.date && p.time ? `第${i + 1}希望：${dateLabel.format(asDate(p.date))} ${p.time}` : null).filter(Boolean), '', 'お名前：（LINEでご記入ください）', 'ご相談・追加オプション：（あればご記入ください）', '', 'お店からの返信をもって予約確定となることを承知しています。'].join('\n');
  }
  function ensureCurrent() {
    const error = validate();
    if (error) {review = false; renderStep(); $('#booking-error').textContent = error; return false;}
    return true;
  }
  $('#copy-message').addEventListener('click', async () => {
    if (!ensureCurrent()) return;
    const textarea = $('#request-message');
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(textarea.value);
      else {textarea.focus(); textarea.select(); if (!document.execCommand('copy')) throw new Error('Clipboard unavailable');}
      $('#copy-status').textContent = 'コピーしました。LINEを開き、トークに貼り付けて送信してください。';
    } catch (_) {
      textarea.focus(); textarea.select();
      $('#copy-status').textContent = '自動コピーが使えません。選択された文面を長押し、または Ctrl+C / ⌘C でコピーしてください。';
    }
  });
  $('#open-line').addEventListener('click', event => {if (!ensureCurrent()) event.preventDefault();});
  document.addEventListener('visibilitychange', () => {if (!document.hidden && dialog.open && step === 3 && !review) renderCalendar();});
})();
