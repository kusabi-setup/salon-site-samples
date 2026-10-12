(() => {
  'use strict';
  const cards = [...document.querySelectorAll('.story-card')];
  const progress = [...document.querySelectorAll('.progress button')];
  const stage = document.querySelector('.story-stage');
  const dialog = document.querySelector('#contents-dialog');
  const playback = document.querySelector('#playback');
  const previous = document.querySelector('#previous');
  const next = document.querySelector('#next');
  const announcement = document.querySelector('#story-announcement');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const duration = 9000;
  let current = 0;
  let elapsed = 0;
  let frame = 0;
  let lastTime = 0;
  let paused = motion.matches;
  let finished = false;
  document.querySelector('.dialog-chapters').innerHTML = document.querySelector('.chapter-list').innerHTML;
  const selectors = [...document.querySelectorAll('[data-go]')];
  function running() { return !paused && !motion.matches && !document.hidden && !dialog.open && !finished; }
  function paint() {
    progress.forEach((button, index) => {
      button.firstElementChild.style.transform = `scaleX(${index < current ? 1 : index === current ? elapsed / duration : 0})`;
    });
  }
  function tick(time) {
    if (!running()) { frame = 0; return; }
    if (lastTime) elapsed += time - lastTime;
    lastTime = time;
    if (elapsed >= duration) {
      if (current < cards.length - 1) { show(current + 1, false); return; }
      elapsed = duration;
      finished = true;
      paint();
      syncPlayback();
      return;
    }
    paint();
    frame = requestAnimationFrame(tick);
  }
  function syncPlayback() {
    cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
    const active = running();
    playback.innerHTML = active ? 'Ⅱ <span>一時停止</span>' : '▷ <span>自動再生</span>';
    playback.setAttribute('aria-label', active ? '自動再生を一時停止' : '自動再生を開始');
    playback.disabled = motion.matches;
    if (motion.matches) {
      playback.innerHTML = '− <span>手動で読む</span>';
      playback.setAttribute('aria-label', '動きを減らす設定のため自動再生は停止しています');
    }
    announcement.setAttribute('aria-live', active ? 'off' : 'polite');
    if (active) frame = requestAnimationFrame(tick);
  }
  function show(index, manual = true) {
    if (index < 0 || index >= cards.length) return;
    const focusedInCard = cards[current].contains(document.activeElement);
    current = index;
    elapsed = 0;
    finished = false;
    if (manual) paused = true;
    cards.forEach((card, i) => {
      card.hidden = i !== current;
      card.classList.toggle('is-active', i === current);
      if (i === current) card.scrollTop = 0;
    });
    selectors.forEach(button => {
      if (Number(button.dataset.go) === current) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    });
    previous.disabled = current === 0;
    next.disabled = current === cards.length - 1;
    document.querySelector('#story-count').textContent = String(current + 1).padStart(2, '0');
    document.querySelector('#gesture-hint').textContent = current === cards.length - 1 ? '最後のお話 / 全情報もどうぞ' : '左右にタップ / スワイプ';
    // replaceState avoids filling the Back history for automatically advancing slides.
    try { history.replaceState(null, '', `${location.pathname}${location.search}#${cards[current].id}`); } catch (_) { /* local-file browsers can restrict history */ }
    paint();
    syncPlayback();
    announcement.textContent = `${current + 1} / ${cards.length} ${cards[current].dataset.title}`;
    if (focusedInCard) document.querySelector('#story').focus({preventScroll:true});
    document.dispatchEvent(new CustomEvent('yams:storychange', {detail:{index:current}}));
  }
  function closeContents() { dialog.close(); }
  selectors.forEach(button => button.addEventListener('click', event => {
    event.preventDefault();
    if (dialog.open) closeContents();
    show(Number(button.dataset.go));
  }));
  previous.addEventListener('click', () => show(current - 1));
  next.addEventListener('click', () => show(current + 1));
  playback.addEventListener('click', () => {
    if (finished) { current = 0; show(0); }
    paused = !paused;
    syncPlayback();
  });
  document.querySelector('#contents-open').addEventListener('click', () => { dialog.showModal(); syncPlayback(); });
  document.querySelector('#contents-close').addEventListener('click', closeContents);
  dialog.addEventListener('close', syncPlayback);
  dialog.addEventListener('click', event => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) closeContents();
  });
  let pointer = null;
  stage.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0 || event.target.closest('a, button')) return;
    pointer = {x:event.clientX,y:event.clientY,time:performance.now()};
  });
  stage.addEventListener('pointercancel', () => { pointer = null; });
  stage.addEventListener('pointerup', event => {
    if (!pointer || event.target.closest('a, button')) { pointer = null; return; }
    const dx = event.clientX - pointer.x;
    const dy = event.clientY - pointer.y;
    const time = performance.now() - pointer.time;
    pointer = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) show(current + (dx < 0 ? 1 : -1));
    else if (Math.abs(dx) < 12 && Math.abs(dy) < 12 && time < 500 && !window.getSelection().toString()) {
      const rect = stage.getBoundingClientRect();
      show(current + (event.clientX < rect.left + rect.width / 2 ? -1 : 1));
    }
  });
  document.addEventListener('keydown', event => {
    if (dialog.open || event.altKey || event.ctrlKey || event.metaKey || event.target.closest('input,textarea,select')) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); show(current + 1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); show(current - 1); }
    if (event.key === ' ' && !event.target.closest('a,button,summary')) { event.preventDefault(); playback.click(); }
  });
  // Keyboard readers must never lose the content or link they are focusing on.
  document.addEventListener('focusin', event => {
    if (event.target.closest('.story-card, .chapter-list, .progress')) { paused = true; syncPlayback(); }
  });
  document.addEventListener('visibilitychange', syncPlayback);
  motion.addEventListener('change', () => { paused = true; syncPlayback(); });
  window.addEventListener('hashchange', () => {
    const index = cards.findIndex(card => `#${card.id}` === location.hash);
    if (index >= 0) show(index);
  });
  // Keep the clean-preview setting when opening the full-information page.
  if (new URLSearchParams(location.search).get('notes') === '0') {
    document.querySelectorAll('a[href^="full.html"]').forEach(link => {
      link.setAttribute('href', link.getAttribute('href').replace('full.html', 'full.html?notes=0'));
    });
  }
  const initial = cards.findIndex(card => `#${card.id}` === location.hash);
  show(initial < 0 ? 0 : initial, initial > 0);
})();
