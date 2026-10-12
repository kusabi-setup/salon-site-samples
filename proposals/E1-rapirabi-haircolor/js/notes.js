/* Proposal annotations. Remove the single script tag to remove this entire layer. */
(() => {
  'use strict';
  if (new URLSearchParams(location.search).get('notes') === '0' || !document.documentElement.lang.toLowerCase().startsWith('ja')) return;

  const entries = [
    { target: '.color-visual figcaption', kind: 'Update', text: 'Rapi-rabiの豊富な色を体験していただくため、同じ写真の髪色がブラシでなぞるように変わり、6色を選べるトップにしました。' },
    { target: '#color-consult', kind: 'Point', text: '髪色の変化は、同じ写真をもとに色を変えたイメージです。実際の仕上がりは髪の状態や施術によって異なります。' },
    { target: '#collection-source', kind: 'Update', text: 'Rapi-rabiの色選びを楽しんでいただくため、仕上がり写真を横にめくれるコレクションにしました。' },
    { target: '#price-source', kind: 'Point', text: '料金は提供されたメニューページと2025年6月21日の改定告知から掲載。根元1,400฿・全体1,700฿はセルフドライ料金です。' },
    { target: '#stores-title', kind: 'Update', text: 'Rapi-rabiへの相談につなげるため、選んだ色の相談メモをコピーし、10店舗から選んだ店舗のLINEへ進める構成にしました。' },
    { target: '#store-facebook', kind: 'Point', text: '写真・連絡先は提供された公式サイトの素材を使用しています。プンナウィティ・コンケンの定休日は素材に記載がないため「定休日要確認」としています。' }
  ];

  const sheet = document.createElement('style');
  sheet.textContent = `
    .rapi-notes-layer{position:absolute;inset:0 0 auto;height:0;z-index:20;pointer-events:none;font-family:Arial,"Hiragino Kaku Gothic ProN",Meiryo,sans-serif}
    .rapi-note{position:absolute;width:300px;max-width:calc(100vw - 32px);padding:12px 15px;text-align:left;white-space:normal;border:2px solid #111;border-radius:0;box-shadow:4px 4px 0 #111;color:#fff;background:#1D4ED8;pointer-events:auto;font-family:inherit;font-size:12px;line-height:1.7;font-weight:700;cursor:pointer;animation:rapi-note-float 3.4s ease-in-out infinite;transform:rotate(var(--tilt));transform-origin:center;overflow-wrap:anywhere}
    .rapi-note.point{background:#FFE14D;color:#111}
    .rapi-note::before{content:"";position:absolute;top:-8px;left:22px;width:12px;height:12px;background:inherit;border-top:2px solid #111;border-left:2px solid #111;transform:rotate(45deg)}
    .rapi-note-label{display:block;font-size:12px;line-height:1.3;letter-spacing:.02em;margin-bottom:6px}
    .rapi-note-close{position:absolute;right:10px;top:7px;font-size:16px;font-weight:400}
    .rapi-note-copy{display:block;padding-right:2px}
    .rapi-notes-toggle{position:fixed;right:16px;bottom:calc(76px + env(safe-area-inset-bottom));z-index:35;border:2px solid #111;background:#FFE14D;color:#111;box-shadow:4px 4px 0 #111;padding:10px 13px;font:700 11px/1.5 Arial,"Hiragino Kaku Gothic ProN",Meiryo,sans-serif;cursor:pointer}
    .rapi-note:focus-visible,.rapi-notes-toggle:focus-visible{outline:3px solid #1D4ED8;outline-offset:6px}
    @keyframes rapi-note-float{0%,100%{transform:translateY(0) rotate(var(--tilt))}50%{transform:translateY(-4px) rotate(var(--tilt))}}
    @media(max-width:600px){.rapi-note{width:300px;font-size:11px;padding:11px 13px}.rapi-notes-toggle{right:12px;padding:8px 10px;font-size:10px}}
    @media(prefers-reduced-motion:reduce){.rapi-note{animation:none}}
    @media print{.rapi-notes-layer,.rapi-notes-toggle{display:none!important}}
  `;
  document.head.append(sheet);
  const layer = document.createElement('aside');
  layer.className = 'rapi-notes-layer';
  layer.setAttribute('aria-label', '提案用の説明（https://rapirabicolor.com/ja/ との比較）');
  document.body.append(layer);
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'rapi-notes-toggle';
  toggle.textContent = '説明をすべて隠す';
  toggle.setAttribute('aria-expanded', 'true');
  document.body.append(toggle);

  let hidden = false;
  const notes = entries.map((entry, index) => {
    const target = document.querySelector(entry.target);
    if (!target) return null;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `rapi-note ${entry.kind.toLowerCase()}`;
    button.style.setProperty('--tilt', index % 2 ? '1deg' : '-1deg');
    button.setAttribute('aria-label', `${entry.kind}: ${entry.text}（クリックでこの説明を閉じる）`);
    const label = document.createElement('span');
    label.className = 'rapi-note-label';
    label.textContent = `${entry.kind === 'Update' ? '✓' : 'i'} ${entry.kind}`;
    const close = document.createElement('span');
    close.className = 'rapi-note-close';
    close.setAttribute('aria-hidden', 'true');
    close.textContent = '×';
    const copy = document.createElement('span');
    copy.className = 'rapi-note-copy';
    copy.textContent = entry.text;
    button.append(label, close, copy);
    layer.append(button);
    const note = { target, button, dismissed: false };
    button.addEventListener('click', () => {
      note.dismissed = true;
      arrange();
      toggle.focus({ preventScroll: true });
      if (notes.every(n => n.dismissed)) setHidden(true);
    });
    return note;
  }).filter(Boolean);

  // Measure the rendered text, not its full-width parent box.
  function inkBounds(element) {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const rects = [];
    let node;
    while ((node = walker.nextNode())) {
      if (!node.textContent.trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      rects.push(...Array.from(range.getClientRects()).filter(rect => rect.width && rect.height));
    }
    if (!rects.length) return element.getBoundingClientRect();
    return { left: Math.min(...rects.map(r => r.left)), right: Math.max(...rects.map(r => r.right)), bottom: Math.max(...rects.map(r => r.bottom)) };
  }

  // 吹き出しはページの上に重ねるだけ。ページ側の余白は変えない（消しても本文は動かない）。
  function arrange() {
    const width = document.documentElement.clientWidth;
    for (const note of notes) note.button.hidden = hidden || note.dismissed;
    const placed = [];
    for (const note of notes) {
      if (note.button.hidden) continue;
      const ink = inkBounds(note.target);
      const w = note.button.offsetWidth;
      const h = note.button.offsetHeight;
      const left = Math.max(20, Math.min(ink.left, width - w - 20));
      let top = ink.bottom + window.scrollY + 24;
      const protectedBoxes = [...document.querySelectorAll('.hero-booking, .palette, #color-consult, #color-play')].map(el => { const r = el.getBoundingClientRect(); return { left:r.left, right:r.right, top:r.top + scrollY, bottom:r.bottom + scrollY }; });
      // Re-check after every shift: moving past one note can meet another control.
      const obstacles = [...protectedBoxes, ...placed].sort((a, b) => a.top - b.top);
      for (const box of obstacles) {
        if (left < box.right + 14 && left + w + 14 > box.left && top < box.bottom + 16 && top + h > box.top - 16) top = box.bottom + 24;
      }
      note.button.style.left = `${left}px`;
      note.button.style.top = `${top}px`;
      placed.push({ left, right: left + w, top, bottom: top + h });
    }
  }

  function setHidden(value) {
    hidden = value;
    if (!hidden) notes.forEach(note => { note.dismissed = false; });
    toggle.textContent = hidden ? '説明をもう一度表示' : '説明をすべて隠す';
    toggle.setAttribute('aria-expanded', String(!hidden));
    arrange();
  }
  toggle.addEventListener('click', () => setHidden(!hidden));
  let pending = false;
  function queueLayout() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => { pending = false; arrange(); });
  }
  window.addEventListener('resize', queueLayout);
  window.addEventListener('load', queueLayout);
  document.querySelectorAll('img').forEach(img => img.addEventListener('load', queueLayout));
  document.addEventListener('storechange', queueLayout);
  document.querySelectorAll('details').forEach(el => el.addEventListener('toggle', queueLayout));
  if (document.fonts) document.fonts.ready.then(queueLayout);
  new ResizeObserver(queueLayout).observe(document.querySelector('main'));
  arrange();
})();
