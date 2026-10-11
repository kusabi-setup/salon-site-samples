(() => {
  'use strict';
  const stores = window.RAPI_STORES;
  const $ = id => document.getElementById(id);
  let selected = stores[0];
  const formatter = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  function bangkokParts(date = new Date()) {
    const p = Object.fromEntries(formatter.formatToParts(date).map(p => [p.type, p.value]));
    return { day: Number(p.day), weekday: new Date(Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day))).getUTCDay(), minutes: Number(p.hour) * 60 + Number(p.minute), clock: `${p.hour}:${p.minute}` };
  }
  function statusFor(store, date = new Date()) {
    const t = bangkokParts(date);
    const nth = Math.ceil(t.day / 7);
    if (store.closed && (t.weekday === 3 || (t.weekday === 4 && (nth === 2 || nth === 4)))) return { text: '定休日', open: false };
    const minutes = s => Number(s.split(':')[0]) * 60 + Number(s.split(':')[1]);
    // A missing closure schedule must not be presented as confirmed availability.
    if (!store.closed) return { text: '定休日要確認', open: false };
    if (t.minutes < minutes(store.open)) return { text: '本日の受付前', open: false };
    if (t.minutes >= minutes(store.close)) return { text: '本日の受付は終了', open: false };
    return { text: '受付中', open: true };
  }
  window.RapiHours = { bangkokParts, statusFor };
  const buttons = stores.map((s, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'store-choice'; b.dataset.store = s.id;
    b.setAttribute('aria-pressed', String(i === 0)); b.setAttribute('aria-controls', 'store-detail');
    const num = document.createElement('span'); num.textContent = String(i + 1).padStart(2, '0');
    const name = document.createElement('span'); name.className = 'choice-name'; name.textContent = s.ja;
    const en = document.createElement('small'); en.textContent = s.en; name.append(en);
    const dot = document.createElement('span'); dot.className = 'choice-dot'; dot.setAttribute('aria-hidden', 'true');
    b.append(num, name, dot); b.addEventListener('click', () => selectStore(s, i));
    $('store-buttons').append(b); return b;
  });
  function updateStatus() {
    $('thai-clock').textContent = `タイ時間 ${bangkokParts().clock} / UTC+7`;
    stores.forEach((s, i) => { const status = statusFor(s); buttons[i].querySelector('.choice-dot').classList.toggle('is-open', status.open); buttons[i].setAttribute('aria-label', `${s.ja}、${status.text}`); });
    const status = statusFor(selected); $('store-status').textContent = status.text; $('store-status').classList.toggle('is-open', status.open);
  }
  function selectStore(s, i) {
    selected = s;
    buttons.forEach((b, n) => b.setAttribute('aria-pressed', String(n === i)));
    $('store-en').textContent = `Rapi-rabi ${s.en}`; $('store-name').textContent = s.ja;
    $('store-number').textContent = `${String(i + 1).padStart(2, '0')} / 10`;
    $('store-image').src = `img/store-${s.id}.webp`; $('store-image').alt = `${s.ja}店の店舗写真`;
    // Ari / Silom source photos are only 630 px wide; never enlarge them.
    $('store-image').style.maxWidth = ['ari', 'silom'].includes(s.id) ? '630px' : '100%';
    $('store-hours').textContent = `${s.open}–${s.close}（タイ時間）`;
    $('store-closed').textContent = s.closed ? '水曜日、第2・第4木曜日' : '素材に記載なし・店舗にお問い合わせください';
    $('store-address').textContent = s.address; $('store-phone').textContent = s.phone;
    ['store-phone','store-call'].forEach(id => $(id).href = `tel:${s.tel}`);
    $('store-call').setAttribute('aria-label', `${s.ja}店に電話で予約 ${s.phone}`);
    $('store-line').href = s.line;
    $('store-line').setAttribute('aria-label', `${s.ja}店のLINEで予約`);
    document.querySelectorAll('[data-booking="line"]').forEach(a => {
      a.href = s.line;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.setAttribute('aria-label', `${s.ja}店のLINEで予約`);
    });
    $('store-facebook').href = s.facebook;
    const query = `${s.latitude},${s.longitude}`;
    $('store-map').src = `https://www.google.com/maps?q=${query}&z=17&output=embed`;
    $('store-map').title = `Rapi-rabi ${s.en} の Google マップ`;
    $('map-link').href = `https://www.google.com/maps?q=${query}`;
    $('map-caption').textContent = `ACCESS / Rapi-rabi ${s.en}`;
    updateStatus();
    document.dispatchEvent(new Event('storechange'));
  }
  document.querySelectorAll('[data-booking]').forEach(a => a.addEventListener('click', () => {
    if (a.getAttribute('href') === '#stores') $('stores-title').focus({ preventScroll: true });
  }));
  updateStatus(); setInterval(updateStatus, 30000);
})();
