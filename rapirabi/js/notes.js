/* Proposal annotations. Remove the single script tag to remove this entire layer. */
(() => {
  'use strict';
  if (new URLSearchParams(location.search).get('notes') === '0' || !document.documentElement.lang.toLowerCase().startsWith('ja')) return;

  const entries = [
    { target: '#booking-anchor', kind: 'Update', text: 'お近くの店舗へすぐ進めるようにするため、最初の画面と画面下に電話・LINEの予約ボタンを配置しました。LINEは店舗選択後、その店舗の予約先へ直接進めます。' },
    { target: '#collection-source', kind: 'Point', text: '仕上がり写真は、提供されたラピラビのヘアカラートレンド掲載写真です。写真には価格を添えていません。' },
    { target: '#price-source', kind: 'Point', text: '料金はメニューページと2025年6月21日の改定告知から掲載。告知の根元1,400฿・全体1,700฿は、メニューのセルフドライ料金と一致します。' },
    { target: '#stores-title', kind: 'Update', text: '店舗ごとの連絡先を見つけやすくするため、10店舗を選択し、住所・電話・営業時間・地図をまとめて見られる構成にしました。' },
    { target: '#store-facebook', kind: 'Point', text: 'プンナウィティ・コンケンの定休日は未記載のため、受付中と断定せず「定休日要確認」と表示しています。' }
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
      for (const box of placed) {
        if (left < box.right + 12 && left + w + 12 > box.left && top < box.bottom + 14 && top + h > box.top - 14) top = box.bottom + 20;
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
