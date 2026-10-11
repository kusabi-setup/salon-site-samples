(() => {
  'use strict';
  // Count the Thursday's occurrence within its month, using Bangkok civil time.
  function getBangkokStatus(date = new Date()) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Bangkok', weekday: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(date);
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    const occurrence = Math.ceil(Number(values.day) / 7);
    const closed = values.weekday === 'Wed' || (values.weekday === 'Thu' && [2, 4].includes(occurrence));
    const minutes = Number(values.hour) * 60 + Number(values.minute);
    if (closed) return { label: '本日は定休日', open: false };
    if (minutes < 540) return { label: '本日は9:00から受付', open: false };
    if (minutes >= 1080) return { label: '本日の受付は終了', open: false };
    return { label: 'ただいま受付中 · 18:00まで', open: true };
  }
  function updateStatus() {
    const status = getBangkokStatus();
    document.querySelectorAll('[data-status]').forEach(element => {
      element.textContent = status.label;
      element.parentElement.dataset.open = String(status.open);
    });
  }
  updateStatus();
  setInterval(updateStatus, 30000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) updateStatus(); });
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('#mobile-nav');
  function closeNav() { nav.hidden = true; toggle.setAttribute('aria-expanded', 'false'); }
  toggle.addEventListener('click', () => {
    nav.hidden = !nav.hidden;
    toggle.setAttribute('aria-expanded', String(!nav.hidden));
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeNav));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !nav.hidden) { closeNav(); toggle.focus(); }
  });
  document.addEventListener('click', event => {
    if (!nav.hidden && !nav.contains(event.target) && !toggle.contains(event.target)) closeNav();
  });
  window.addEventListener('resize', () => { if (window.innerWidth > 800) closeNav(); });
})();
