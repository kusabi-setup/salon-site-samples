(() => {
  'use strict';
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const hero = document.querySelector('.hero-rabbit');
  const tracker = document.querySelector('.journey-tracker');
  const guide = document.querySelector('.guide-rabbit');
  const label = document.querySelector('.guide-label');
  guide.append(hero.querySelector('svg').cloneNode(true));
  const names = { top: 'ようこそ', styles: 'キレイに', concept: 'YAMSの想い', kids: 'こんにちは！', cafe: 'ひと息どうぞ', menu: 'メニュー', staff: 'スタッフ', access: 'また会おうね' };
  const sections = [...document.querySelectorAll('main > section[id]')];
  let lastHop = 0;
  function hop(button) {
    if (motion.matches || button.classList.contains('is-hopping')) return;
    button.classList.add('is-hopping');
  }
  [hero, guide].forEach(button => {
    button.addEventListener('click', () => hop(button));
    button.addEventListener('animationend', event => {
      if (event.animationName === 'rabbit-hop') button.classList.remove('is-hopping');
    });
  });
  const revealElements = [...document.querySelectorAll('.style-gallery figure,.concept-photo,.concept-copy,.kids-grid article,.cafe-copy,.sweets-photo,.staff-grid figure')];
  let revealObserver;
  function configureReveal() {
    revealObserver?.disconnect();
    revealElements.forEach(el => el.classList.remove('reveal-pending'));
    if (motion.matches || !('IntersectionObserver' in window)) return;
    revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.remove('reveal-pending');
        entry.target.classList.add('reveal-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: .08 });
    revealElements.filter(el => !el.classList.contains('reveal-visible')).forEach(el => {
      el.classList.add('reveal-pending');
      revealObserver.observe(el);
    });
  }
  configureReveal();
  const kidsImages = [...document.querySelectorAll('.kids-grid img')];
  kidsImages.forEach(img => img.classList.add('kids-parallax'));
  let sectionPositions = [];
  let total = 1;
  let frame = 0;
  let active = '';
  function measure() {
    sectionPositions = sections.map(section => ({ id: section.id, y: section.getBoundingClientRect().top + scrollY }));
    total = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    queue();
  }
  function render() {
    frame = 0;
    const progress = Math.min(1, Math.max(0, scrollY / total));
    tracker.hidden = scrollY < 150;
    tracker.style.setProperty('--progress', progress);
    // One event-driven frame; no perpetual JavaScript animation loop.
    tracker.style.setProperty('--guide-x', `${12 + progress * Math.max(0, document.documentElement.clientWidth - 92)}px`);
    const current = [...sectionPositions].reverse().find(section => section.y <= scrollY + innerHeight * .38)?.id || 'top';
    if (current !== active) {
      active = current;
      guide.dataset.scene = current;
      guide.setAttribute('aria-label', `${names[current]}。YAMSのウサギを跳ねさせる`);
      label.textContent = names[current];
      hop(guide);
    }
    if (Math.abs(scrollY - lastHop) > 170) { hop(guide); lastHop = scrollY; }
    if (!motion.matches) {
      kidsImages.forEach((img, index) => {
        const rect = img.parentElement.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > innerHeight) return;
        const shift = Math.max(-9, Math.min(9, (innerHeight * .5 - rect.top) * (.013 + index * .005)));
        img.style.setProperty('--parallax', `${shift.toFixed(2)}px`);
      });
    }
  }
  function queue() { if (!frame) frame = requestAnimationFrame(render); }
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', measure);
  addEventListener('load', measure);
  document.querySelectorAll('details').forEach(el => el.addEventListener('toggle', measure));
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(document.querySelector('main'));
  motion.addEventListener('change', () => {
    [hero, guide].forEach(button => button.classList.remove('is-hopping'));
    configureReveal();
    queue();
  });
  measure();
})();
