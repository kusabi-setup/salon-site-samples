(() => {
  'use strict';
  if (!document.documentElement.lang.startsWith('ja') || new URLSearchParams(location.search).get('notes') === '0') return;
  const isStory = document.body.classList.contains('story-page');
  const entries = isStory ? [
    {target:'#welcome .card-photo',kind:'Update',text:'親子で通うYAMSの魅力を気軽に読めるようにするため、タップ・スワイプで巡る8枚のストーリーにしました。'},
    {target:'#kids .card-photo',kind:'Update',text:'YAMSで親子が過ごす時間をイメージできるようにするため、キッズスペースを1枚のお話にしました。'},
    {target:'#baby .card-photo',kind:'Point',text:'キッズルームの写真とベビーシッター・設備の紹介は、提供されたYAMSの素材に基づいています。'},
    {target:'#style .card-photo',kind:'Point',text:'仕上がり写真は、提供されたYAMSのInstagram掲載画像です。施術料金は写真に重ねていません。'},
    {target:'#sweets .card-photo',kind:'Point',text:'「今月のスイーツ」は2026年9月の掲載素材です。現在の提供内容を示すものではありません。'},
    {target:'#menu .card-photo',kind:'Update',text:'YAMSのメニューを自分のペースで比較できるようにするため、全料金を読める縦長ページも用意しました。'},
    {target:'#team .card-photo',kind:'Point',text:'スタッフのお名前と紹介イラストは、提供されたYAMS公式サイトの素材を使用しています。'},
    {target:'#visit .card-photo',kind:'Update',text:'YAMSへ予約したいときに迷わないようにするため、電話・LINEをどのお話でも押せる配置にしました。'}
  ] : [
    {target:'.hero-visual',kind:'Update',text:'YAMSの情報をまとめて読みたい方のため、ストーリーから全情報を読めるページへ行き来できる構成にしました。'},
    {target:'.sweets-photo',kind:'Point',text:'「今月のスイーツ」は提供素材にある2026年9月の紹介です。現在の提供内容を示すものではありません。'},
    {target:'.concept-photo',kind:'Point',text:'写真・紹介文・料金・連絡先は、提供されたYAMS公式サイトの素材に基づいています。'}
  ];
  const style = document.createElement('style');
  style.textContent = `
    .yams-notes-layer{position:fixed;inset:0;z-index:25;pointer-events:none;overflow:clip}
    .yams-note{position:absolute;width:285px;max-width:calc(100vw - 40px);padding:11px 14px;border:2px solid #111;box-shadow:4px 4px 0 #111;background:#1D4ED8;color:white;pointer-events:auto;text-align:left;font:700 11px/1.7 Arial,"Hiragino Kaku Gothic ProN",Meiryo,sans-serif;cursor:pointer;transform:rotate(-1deg);animation:yams-note-float 3.4s ease-in-out infinite}
    .yams-note.point{background:#FFE14D;color:#111;transform:rotate(1deg)}
    .yams-note:before{content:"";position:absolute;top:-8px;left:22px;width:12px;height:12px;transform:rotate(45deg);background:inherit;border-top:2px solid #111;border-left:2px solid #111}
    .yams-note-label{display:block;margin-bottom:4px;font-size:12px}.yams-note-close{position:absolute;right:9px;top:5px;font-size:18px;font-weight:400}
    .yams-notes-toggle{position:fixed;right:16px;bottom:18px;z-index:26;padding:8px 10px;border:2px solid #111;box-shadow:3px 3px 0 #111;background:#FFE14D;color:#111;font:700 10px/1.5 Arial,"Hiragino Kaku Gothic ProN",Meiryo,sans-serif;cursor:pointer}
    .full-page .yams-notes-toggle{bottom:calc(92px + env(safe-area-inset-bottom))}
    .yams-note:focus-visible,.yams-notes-toggle:focus-visible{outline:3px solid #1D4ED8;outline-offset:5px}
    @keyframes yams-note-float{0%,100%{translate:0 0}50%{translate:0 -4px}}
    @media(max-width:600px){.yams-note{width:260px;font-size:10px;padding:10px 12px}.story-page .yams-notes-toggle{bottom:calc(121px + env(safe-area-inset-bottom));right:12px;font-size:9px;padding:6px 8px}}
    @media(prefers-reduced-motion:reduce){.yams-note{animation:none}}
    @media print{.yams-notes-layer,.yams-notes-toggle{display:none!important}}
  `;
  document.head.append(style);
  const layer = document.createElement('aside');
  layer.id = 'proposal-notes';
  layer.className = 'yams-notes-layer';
  layer.setAttribute('aria-label','提案用の説明（提供されたYAMS公式サイトの素材に基づく）');
  document.body.append(layer);
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'yams-notes-toggle';
  toggle.setAttribute('aria-controls',layer.id);
  document.body.append(toggle);
  let hidden = false;
  const notes = entries.map(entry => {
    const target = document.querySelector(entry.target);
    if (!target) return null;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `yams-note ${entry.kind.toLowerCase()}`;
    button.setAttribute('aria-label',`${entry.kind}: ${entry.text}（この説明を閉じる）`);
    const label = document.createElement('span');
    label.className = 'yams-note-label';
    label.textContent = `${entry.kind === 'Update' ? '✓' : 'i'} ${entry.kind}`;
    const cross = document.createElement('span');
    cross.className = 'yams-note-close';
    cross.textContent = '×';
    cross.setAttribute('aria-hidden','true');
    button.append(label,cross,document.createTextNode(entry.text));
    layer.append(button);
    const note = {target,button,dismissed:false};
    button.addEventListener('click', () => { note.dismissed = true; arrange(); toggle.focus({preventScroll:true}); });
    return note;
  }).filter(Boolean);
  function overlaps(a,b,gap=10) { return a.left < b.right+gap && a.right+gap > b.left && a.top < b.bottom+gap && a.bottom+gap > b.top; }
  function arrange() {
    const placed = [];
    const vw = document.documentElement.clientWidth;
    const vh = innerHeight;
    const controls = [...document.querySelectorAll('.booking,.story-top,.story-navigation,.card-link,.fixed-booking,.nav-toggle,.header-social')].filter(el => el.getClientRects().length).map(el => el.getBoundingClientRect());
    toggle.textContent = hidden ? '説明をもう一度表示' : '説明をすべて隠す';
    toggle.setAttribute('aria-expanded',String(!hidden));
    // Move the toggle upward only if it would cover a story link.
    toggle.style.transform = '';
    if (isStory && vw <= 600) {
      const box = toggle.getBoundingClientRect();
      const collisions = controls.filter(rect => overlaps(box,rect,4));
      if (collisions.length) toggle.style.transform = `translateY(-${Math.max(...collisions.map(rect => box.bottom-rect.top))+10}px)`;
    }
    controls.push(toggle.getBoundingClientRect());
    for (const note of notes) {
      note.button.hidden = hidden || note.dismissed || !note.target.getClientRects().length;
      if (note.button.hidden) continue;
      const anchor = note.target.getBoundingClientRect();
      if (anchor.bottom < 60 || anchor.top > vh-100) { note.button.hidden = true; continue; }
      const width = note.button.offsetWidth;
      const height = note.button.offsetHeight;
      // Anchor to the actual visible photo, not the surrounding grid column.
      const left = Math.max(20,Math.min(anchor.left+(anchor.width-width)/2,vw-width-20));
      let top = Math.max(55,Math.min(anchor.bottom-height-20,vh-height-100));
      let box = {left,right:left+width,top,bottom:top+height};
      for (const other of placed) {
        if (overlaps(box,other,20)) { top=other.bottom+28; box={left,right:left+width,top,bottom:top+height}; }
      }
      // On unusually short screens, retain the controls and omit the floating note.
      if (top < anchor.top+18 || box.bottom > vh-20 || controls.some(rect => overlaps(box,rect,10))) { note.button.hidden=true; continue; }
      note.button.style.left = `${left}px`;
      note.button.style.top = `${top}px`;
      placed.push(box);
    }
  }
  toggle.addEventListener('click', () => { hidden=!hidden; if (!hidden) notes.forEach(note=>{note.dismissed=false;}); arrange(); });
  let queued=false;
  function queueLayout() { if(queued)return; queued=true; requestAnimationFrame(()=>{queued=false;arrange();}); }
  window.addEventListener('resize',queueLayout);
  window.addEventListener('scroll',queueLayout,{passive:true});
  window.addEventListener('load',queueLayout);
  document.addEventListener('yams:storychange',queueLayout);
  document.querySelectorAll('img').forEach(img=>img.addEventListener('load',queueLayout));
  document.querySelectorAll('details').forEach(item=>item.addEventListener('toggle',queueLayout));
  if ('ResizeObserver' in window) new ResizeObserver(queueLayout).observe(document.querySelector('main'));
  arrange();
})();
