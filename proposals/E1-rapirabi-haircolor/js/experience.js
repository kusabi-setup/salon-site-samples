(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const colors = [
    ['burgundy', 'Burgundy Red', '#783b40', '深みのある赤で、印象的に。'],
    ['milktea', 'Milk tea brown', '#937858', 'やわらかなブラウンを、軽やかに。'],
    ['khaki', 'Khaki brown', '#67694c', '自然体に似合う、落ち着いたニュアンス。'],
    ['ash', 'Ash', '#6f7277', '透明感をまとって、クールに。'],
    ['blue', 'Blue', '#415f81', 'いつものわたしに、新しい表情を。'],
    ['pink', 'Pink', '#a35b76', 'やさしいピンクで、気分まで華やかに。']
  ];
  const buttons = [...document.querySelectorAll('[data-color]')];
  const canvas = $('color-canvas');
  const ctx = canvas.getContext('2d');
  const brush = document.createElement('canvas');
  const bctx = brush.getContext('2d');
  const images = colors.map(c => { const img = new Image(); img.src = `img/haircolor/${c[0]}.webp`; return img; });
  let current = 0, displayed = 0, paused = false, visible = true, timer = 0, animation = 0, generation = 0, consulting = false;
  const ready = img => img.decode().catch(() => null);
  function sizeCanvas() {
    // Bound the drawing surface even on high-density mobile screens.
    const rect = canvas.parentElement.getBoundingClientRect();
    const scale = Math.min(devicePixelRatio || 1, 1.25, 900 / Math.max(rect.width, rect.height));
    canvas.width = brush.width = Math.round(rect.width * scale);
    canvas.height = brush.height = Math.round(rect.height * scale);
  }
  function drawCover(context, img) {
    const w = canvas.width, h = canvas.height;
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    context.drawImage(img, (w - img.naturalWidth * scale) / 2, (h - img.naturalHeight * scale) / 2, img.naturalWidth * scale, img.naturalHeight * scale);
  }
  function paint(index) {
    if (!ctx || !images[index].naturalWidth) return;
    drawCover(ctx, images[index]);
    canvas.hidden = false;
    $('color-fallback').setAttribute('aria-hidden', 'true');
  }
  function updateCopy() {
    $('consult-color').textContent = colors[current][1];
    $('consult-message').value = `Rapi-rabi ${$('store-name').textContent}店へ。${colors[current][1]}の髪色イメージについて相談したいです。髪の状態に合うメニューと予約可能な日時を教えてください。`;
    $('copy-status').textContent = '';
  }
  function labels(index) {
    const color = colors[index];
    document.documentElement.style.setProperty('--accent', color[2]);
    $('current-color').textContent = color[1];
    $('color-mood').textContent = color[3];
    $('color-number').textContent = String(index + 1).padStart(2, '0');
    document.querySelector('.portrait-index').textContent = `${String(index + 1).padStart(2, '0')} / 06`;
    canvas.setAttribute('aria-label', `${color[1]} の髪色イメージ`);
    $('color-fallback').src = images[index].src;
    $('color-fallback').alt = `${color[1]} の髪色イメージ`;
    buttons.forEach((b, i) => b.setAttribute('aria-pressed', String(i === index)));
    if (consulting) updateCopy();
  }
  function schedule() {
    clearTimeout(timer);
    if (!paused && !motion.matches && visible && !document.hidden) timer = setTimeout(() => select((current + 1) % colors.length), 4200);
  }
  async function select(index, manual = false) {
    if (manual) { paused = true; updatePlay(); }
    clearTimeout(timer);
    const token = ++generation;
    cancelAnimationFrame(animation);
    await ready(images[index]);
    if (token !== generation) return;
    if (!images[index].naturalWidth) { schedule(); return; }
    const from = displayed;
    current = index;
    labels(index);
    if (!ctx || !bctx || motion.matches || index === from || !images[from].naturalWidth) {
      paint(index); displayed = index; schedule(); return;
    }
    const start = performance.now();
    function frame(now) {
      const t = Math.min((now - start) / 1150, 1);
      const progress = t * t * (3 - 2 * t);
      const w = canvas.width, h = canvas.height;
      drawCover(ctx, images[from]);
      bctx.clearRect(0, 0, w, h);
      bctx.globalCompositeOperation = 'source-over';
      drawCover(bctx, images[index]);
      // A feathered diagonal brush edge travels across the portrait, revealing color.
      bctx.globalCompositeOperation = 'destination-in';
      const edge = progress * (w + h * .4 + w * .44) - h * .4 - w * .22;
      const gradient = bctx.createLinearGradient(edge, 0, edge + w * .22, h * .55);
      gradient.addColorStop(0, '#000'); gradient.addColorStop(1, '#0000');
      bctx.fillStyle = gradient; bctx.fillRect(0, 0, w, h);
      bctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(brush, 0, 0);
      if (t < 1) animation = requestAnimationFrame(frame);
      else { paint(index); displayed = index; schedule(); }
    }
    animation = requestAnimationFrame(frame);
  }
  function updatePlay() {
    $('color-play').textContent = motion.matches ? '動きを減らす設定・手動切替' : paused ? '▶ 自動切替を再生' : 'Ⅱ 自動切替を停止';
    $('color-play').setAttribute('aria-pressed', String(paused || motion.matches));
    $('color-play').disabled = motion.matches;
  }
  buttons.forEach((button, index) => {
    button.addEventListener('click', () => select(index, true));
    button.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') select(index, true); });
    button.addEventListener('keydown', e => {
      let next;
      if (e.key === 'ArrowRight') next = (index + 1) % colors.length;
      if (e.key === 'ArrowLeft') next = (index + colors.length - 1) % colors.length;
      if (e.key === 'Home') next = 0;
      if (e.key === 'End') next = colors.length - 1;
      if (next !== undefined) { e.preventDefault(); buttons[next].focus(); select(next, true); }
    });
  });
  $('color-play').addEventListener('click', () => { paused = !paused; updatePlay(); schedule(); });
  motion.addEventListener('change', () => { ++generation; cancelAnimationFrame(animation); paint(current); displayed = current; updatePlay(); schedule(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { ++generation; cancelAnimationFrame(animation); paint(current); displayed = current; } schedule(); });
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; schedule(); }, { threshold: .1 }).observe($('color-visual'));
  new ResizeObserver(() => { ++generation; cancelAnimationFrame(animation); sizeCanvas(); paint(current); displayed = current; schedule(); }).observe(canvas.parentElement);
  sizeCanvas(); ready(images[0]).then(() => { paint(0); schedule(); }); updatePlay();
  $('color-consult').addEventListener('click', () => {
    paused = true; consulting = true; updatePlay(); clearTimeout(timer);
    $('consult-summary').hidden = false; updateCopy();
    $('stores-title').focus({ preventScroll: true });
    document.dispatchEvent(new Event('storechange'));
  });
  document.addEventListener('storechange', () => { if (consulting) updateCopy(); });
  $('copy-color').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText($('consult-message').value);
      $('copy-status').textContent = 'コピーしました。選択した店舗のLINEで貼り付けて送信できます。';
    } catch {
      $('consult-message').hidden = false; $('consult-message').focus(); $('consult-message').select();
      $('copy-status').textContent = '相談メモを選択しました。コピーしてLINEでお送りください。';
    }
  });
  const collection = document.querySelector('.color-grid');
  document.querySelectorAll('[data-slide]').forEach(b => b.addEventListener('click', () => collection.scrollBy({ left: Number(b.dataset.slide) * collection.clientWidth * .8, behavior: motion.matches ? 'instant' : 'smooth' })));
  const reveal = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('is-visible'); reveal.unobserve(entry.target); }
  }), { threshold: .08 });
  document.querySelectorAll('.section-heading,.about-visual,.about-copy,.menu-row,.colorists>div,.trend,.international').forEach(el => { el.classList.add('reveal-ready'); reveal.observe(el); });
  const counters = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    counters.unobserve(entry.target);
    if (motion.matches) return;
    const el = entry.target, target = Number(el.dataset.count), start = performance.now();
    el.setAttribute('aria-label', String(target));
    function count(now) { const t = Math.min((now - start) / 1200, 1); el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3))); if (t < 1 && !motion.matches) requestAnimationFrame(count); else el.textContent = target; }
    requestAnimationFrame(count);
  }), { threshold: .8 });
  document.querySelectorAll('[data-count]').forEach(el => counters.observe(el));
})();
