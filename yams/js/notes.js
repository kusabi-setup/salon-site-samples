(() => {
  'use strict';
  if (!document.documentElement.lang.toLowerCase().startsWith('ja') || new URLSearchParams(location.search).get('notes') === '0') return;
  const entries = [
    { target: '.hero-small', kind: 'Update', text: '予約先をすぐに見つけられるようにするため、最初の画面と画面下から電話・LINEで予約できる構成にしました。' },
    { target: '#styles-title', kind: 'Point', text: '仕上がり写真は、提供されたYAMSのInstagram掲載画像です。スタイル名は見た目に基づく分類で、施術メニューや料金を示すものではありません。' },
    { target: '#kids-title', kind: 'Update', text: 'お子様連れでの来店をイメージしやすくするため、専用のお部屋・見守り・赤ちゃん向け設備を写真と一緒に紹介する構成にしました。' },
    { target: '#sweets-title', kind: 'Point', text: '「今月のスイーツ」は、提供素材にある2026年9月の紹介です。現在の提供内容を示すものではありません。' },
    { target: '#menu-title', kind: 'Update', text: '来店前の情報をまとめて見られるようにするため、料金・キッズエリア・スタッフ・アクセスを1ページで確認できる構成にしました。' },
    { target: '.staff-section h2', kind: 'Point', text: 'スタッフの名前とイラスト、掲載料金は、提供されたYAMS公式サイトの素材を使用しています。' },
    { target: '#access-title', kind: 'Point', text: '受付表示はタイ時間の9:00〜18:00と、水曜日・第2・第4木曜日の定休日から自動計算しています。臨時休業は反映していません。' }
  ];
  const sheet = document.createElement('style');
  sheet.textContent = `
    body{position:relative}
    .yams-notes-layer{position:absolute;top:0;left:0;width:100%;height:100%;overflow:clip;z-index:20;pointer-events:none;font-family:Arial,"Hiragino Kaku Gothic ProN",Meiryo,sans-serif}
    .yams-note{position:absolute;width:300px;max-width:calc(100vw - 40px);padding:12px 15px;border:2px solid #111;border-radius:0;box-shadow:4px 4px 0 #111;background:#1D4ED8;color:#fff;text-align:left;white-space:normal;pointer-events:auto;font:700 12px/1.7 Arial,"Hiragino Kaku Gothic ProN",Meiryo,sans-serif;cursor:pointer;animation:yams-note-float 3.4s ease-in-out infinite;transform:rotate(var(--tilt));transform-origin:center;overflow-wrap:anywhere}
    .yams-note.point{background:#FFE14D;color:#111}
    .yams-note:before{content:"";position:absolute;top:-8px;left:22px;width:12px;height:12px;background:inherit;border-top:2px solid #111;border-left:2px solid #111;transform:rotate(45deg)}
    .yams-note-label{display:block;font-size:12px;line-height:1.3;letter-spacing:.02em;margin-bottom:6px;padding-right:20px}
    .yams-note-close{position:absolute;right:10px;top:7px;font-size:16px;font-weight:400}
    .yams-note-copy{display:block}
    .yams-notes-toggle{position:fixed;right:16px;bottom:calc(90px + env(safe-area-inset-bottom));z-index:35;max-width:calc(100% - 32px);border:2px solid #111;background:#FFE14D;color:#111;box-shadow:4px 4px 0 #111;padding:10px 13px;font:700 11px/1.5 Arial,"Hiragino Kaku Gothic ProN",Meiryo,sans-serif;cursor:pointer}
    .yams-note:focus-visible,.yams-notes-toggle:focus-visible{outline:3px solid #1D4ED8;outline-offset:6px}
    @keyframes yams-note-float{0%,100%{transform:translateY(0) rotate(var(--tilt))}50%{transform:translateY(-4px) rotate(var(--tilt))}}
    @media(max-width:600px){.yams-note{font-size:11px;padding:11px 13px}.yams-notes-toggle{right:12px;bottom:calc(80px + env(safe-area-inset-bottom));padding:9px 10px;font-size:10px}}
    @media(prefers-reduced-motion:reduce){.yams-note{animation:none}}
    @media print{.yams-notes-layer,.yams-notes-toggle{display:none!important}}
  `;
  document.head.append(sheet);
  const layer = document.createElement('aside');
  layer.className = 'yams-notes-layer';
  layer.id = 'proposal-notes';
  layer.setAttribute('aria-label', '提案用の説明（現行のYAMS公式サイト https://yamshair.com/ との比較）');
  document.body.append(layer);
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'yams-notes-toggle';
  toggle.textContent = '説明をすべて隠す';
  toggle.setAttribute('aria-controls', 'proposal-notes');
  toggle.setAttribute('aria-expanded', 'true');
  document.body.append(toggle);
  let hidden = false;
  const notes = entries.map((entry, index) => {
    const target = document.querySelector(entry.target);
    if (!target) return null;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `yams-note ${entry.kind.toLowerCase()}`;
    button.style.setProperty('--tilt', index % 2 ? '1deg' : '-1deg');
    button.setAttribute('aria-label', `${entry.kind}: ${entry.text}（クリックでこの説明を閉じる）`);
    const label = document.createElement('span');
    label.className = 'yams-note-label';
    label.textContent = `${entry.kind === 'Update' ? '✓' : 'i'} ${entry.kind}`;
    const close = document.createElement('span');
    close.className = 'yams-note-close';
    close.setAttribute('aria-hidden', 'true');
    close.textContent = '×';
    const copy = document.createElement('span');
    copy.className = 'yams-note-copy';
    copy.textContent = entry.text;
    button.append(label, close, copy);
    layer.append(button);
    const note = { target, button, dismissed: false };
    button.addEventListener('click', () => {
      note.dismissed = true;
      arrange();
      toggle.focus({ preventScroll: true });
      if (notes.every(item => item.dismissed)) setHidden(true);
    });
    return note;
  }).filter(Boolean);
  function inkBounds(element) {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const rects = [];
    while (walker.nextNode()) {
      if (!walker.currentNode.textContent.trim()) continue;
      const range = document.createRange();
      range.selectNode(walker.currentNode);
      rects.push(...Array.from(range.getClientRects()).filter(rect => rect.width && rect.height));
    }
    if (!rects.length) return element.getBoundingClientRect();
    return { left: Math.min(...rects.map(r => r.left)), bottom: Math.max(...rects.map(r => r.bottom)) };
  }
  function arrange() {
    const width = document.documentElement.clientWidth;
    const bodyTop = document.body.getBoundingClientRect().top + window.scrollY;
    const placed = [];
    for (const note of notes) note.button.hidden = hidden || note.dismissed;
    for (const note of notes) {
      if (note.button.hidden) continue;
      const ink = inkBounds(note.target);
      const w = note.button.offsetWidth;
      const h = note.button.offsetHeight;
      const left = Math.max(20, Math.min(ink.left, width - w - 20));
      let top = ink.bottom + window.scrollY - bodyTop + 18;
      // Includes generous clearance for the ±1° rotation, shadow and floating motion.
      for (const box of placed) {
        if (left < box.right + 18 && left + w + 18 > box.left && top < box.bottom + 22 && top + h + 22 > box.top) top = box.bottom + 28;
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
  document.querySelectorAll('details').forEach(el => el.addEventListener('toggle', queueLayout));
  document.querySelector('.nav-toggle')?.addEventListener('click', queueLayout);
  if (document.fonts) document.fonts.ready.then(queueLayout);
  if ('ResizeObserver' in window) new ResizeObserver(queueLayout).observe(document.querySelector('main'));
  arrange();
})();
