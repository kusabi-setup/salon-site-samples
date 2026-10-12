/* 受付状況の表示（タイ時間）。 */
(() => {
  'use strict';
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit',
    weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  });

  function receptionAt(date) {
    const parts = Object.fromEntries(formatter.formatToParts(date).map(p => [p.type, p.value]));
    const week = Math.ceil(Number(parts.day) / 7);
    const closed = parts.weekday === 'Wed' || (parts.weekday === 'Thu' && (week === 2 || week === 4));
    const minutes = Number(parts.hour) * 60 + Number(parts.minute);
    const cutoff = parts.weekday === 'Tue' ? 14 * 60 : 18 * 60 + 30;
    const label = closed ? '定休日' : minutes < 540 ? '受付開始前 · 9:00から' : minutes <= cutoff ? '受付中' : '本日の受付は終了';
    return { label, time: `${parts.hour}:${parts.minute}`, closed, cutoff };
  }

  // Exposed as a pure function so the calendar boundaries can be checked offline.
  window.BellReception = Object.freeze({ at: receptionAt });
  function updateReception() {
    const current = receptionAt(new Date());
    document.querySelectorAll('[data-status]').forEach(el => { el.textContent = current.label; });
    document.querySelectorAll('[data-thai-time]').forEach(el => { el.textContent = `タイ時間 ${current.time}`; });
  }
  updateReception();
  setInterval(updateReception, 30000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) updateReception(); });

})();

/* Local-only interactions: no libraries, requests or audio. */
(() => {
  'use strict';
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const demos = new Set();
  const bell = document.querySelector('.bell-button');
  function ring() {
    if (motion.matches || bell.classList.contains('is-ringing')) return;
    bell.classList.add('is-ringing');
  }
  bell.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') ring(); });
  bell.addEventListener('click', ring);
  bell.addEventListener('animationend', e => { if (e.animationName === 'bell-swing') bell.classList.remove('is-ringing'); });
  ring();

  document.querySelectorAll('[data-comparison]').forEach(frame => {
    const range = frame.querySelector('input');
    let raf = 0, interacting = false, pointer = null;
    const set = value => {
      value = Math.round(Math.max(0, Math.min(100, value)));
      frame.style.setProperty('--position', `${value}%`);
      range.value = value;
      range.setAttribute('aria-valuetext', `施術前 ${value}%、施術後 ${100-value}%`);
    };
    const cancel = () => { interacting = true; cancelAnimationFrame(raf); demos.delete(cancel); };
    const move = e => {
      const rect = frame.getBoundingClientRect();
      set((e.clientX - rect.left) / rect.width * 100);
    };
    range.addEventListener('input', () => { cancel(); set(Number(range.value)); });
    range.addEventListener('keydown', cancel);
    range.addEventListener('focus', cancel);
    range.addEventListener('pointerdown', e => {
      if (!e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return;
      cancel(); pointer = e.pointerId;
      range.setPointerCapture(pointer); move(e); e.preventDefault();
      range.focus({ preventScroll: true });
    });
    range.addEventListener('pointermove', e => { if (e.pointerId === pointer) move(e); });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => range.addEventListener(type, () => { pointer = null; }));
    if (!('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(e => e.isIntersecting)) return;
      observer.disconnect();
      if (motion.matches || interacting) return;
      demos.add(cancel);
      let start;
      function demo(time) {
        if (interacting || motion.matches) return;
        start ??= time;
        const progress = Math.min((time - start) / 1900, 1);
        // One deliberate left-right demonstration, ending at the middle.
        set(50 + 23 * Math.sin(progress * 2 * Math.PI) * Math.sin(progress * Math.PI));
        if (progress < 1) raf = requestAnimationFrame(demo);
        else { set(50); demos.delete(cancel); }
      }
      raf = requestAnimationFrame(demo);
    }, { threshold: .35 });
    observer.observe(frame);
  });

  // Keep headings readable when JavaScript or observer support is unavailable.
  const headings = document.querySelectorAll('h1,h2');
  const revealObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-revealed'); revealObserver.unobserve(entry.target); }
    });
  }, { threshold: .15 }) : null;
  headings.forEach(heading => {
    const lines = heading.innerHTML.split(/<br\s*\/?\s*>/i);
    heading.innerHTML = lines.map((line, i) => `<span class="heading-line"><span style="--line-delay:${i * 130}ms">${line}</span></span>`).join('');
    if (revealObserver && !motion.matches) { heading.classList.add('reveal-ready'); revealObserver.observe(heading); }
  });
  const photos = [...document.querySelectorAll('[data-parallax]')];
  let pending = false;
  function parallax() {
    pending = false;
    if (motion.matches) return;
    photos.forEach(photo => {
      const r = photo.getBoundingClientRect();
      if (r.bottom < -40 || r.top > innerHeight + 40) return;
      const offset = Math.max(-12, Math.min(12, (innerHeight/2 - (r.top + r.height/2)) * .025));
      photo.style.setProperty('--parallax-y', `${offset.toFixed(2)}px`);
    });
  }
  function schedule() { if (!pending && !motion.matches) { pending = true; requestAnimationFrame(parallax); } }
  addEventListener('scroll', schedule, { passive:true });
  addEventListener('resize', schedule, { passive:true });
  motion.addEventListener('change', () => {
    if (motion.matches) {
      demos.forEach(cancel => cancel());
      bell.classList.remove('is-ringing');
      headings.forEach(h => h.classList.add('is-revealed'));
      photos.forEach(p => p.style.removeProperty('--parallax-y'));
    } else schedule();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) demos.forEach(cancel => cancel());
  });
  schedule();
})();
