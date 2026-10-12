/* Local-only color finder. No requests, storage, uploads, or account needed. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const questions = [
    { title: '今の髪の明るさは？', hint: '今の状態に、いちばん近いものを。', choices: [['dark', '黒髪・暗め', '地毛に近い、落ち着いた明るさ'], ['brown', 'ブラウン', '自然な茶色〜明るめの茶色'], ['light', '明るめ・ブリーチ毛', 'ベージュや金髪などの明るい髪']] },
    { title: 'なりたい雰囲気は？', hint: '次の自分に、足したい気分を。', choices: [['soft', 'やわらかく、ナチュラルに', '軽やかで、親しみやすい印象'], ['cool', '落ち着いて、クールに', '甘さを抑えた、すっきりした印象'], ['rich', '華やかに、自分らしく', '深みのある色で、さりげない存在感']] },
    { title: 'ブリーチについて教えて。', hint: '経験と、今回の希望に近いものを。', choices: [['avoid', '今回はブリーチを避けたい', '経験の有無にかかわらず、控えたい'], ['first', '未経験だけど、相談したい', '髪への負担や仕上がりを聞きたい'], ['yes', '経験あり。今回も検討したい', '明るさや透明感のある色も気になる']] },
    { title: 'お手入れは、どちら派？', hint: 'いつもの暮らしに合う方を。', choices: [['easy', 'できるだけ、手軽に', '落ち着いた色を楽しみたい'], ['salon', '色のためなら、ケアも楽しむ', '色を保つお手入れや、定期的な来店も']] }
  ];
  const colors = {
    khaki: { name: 'Khaki brown', ja: 'カーキブラウン', image: 'khaki', description: '赤みを抑えた、落ち着きのあるブラウン。さりげなくクールな雰囲気を楽しみたい方に。', menu: '全体染め', swatch: '#756a50' },
    milk: { name: 'Milk tea brown', ja: 'ミルクティーブラウン', image: 'milk', description: 'ベージュを感じる、やわらかなブラウン。自然な明るさと軽やかな印象を楽しみたい方に。', menu: '全体染め', swatch: '#b9977b' },
    burgundy: { name: 'Burgundy red', ja: 'バーガンディレッド', image: 'burgundy', description: '赤みと深みが溶け合う、華やかなカラー。落ち着きを残しながら、印象を変えたい方に。', menu: '全体染め', swatch: '#783b3c' },
    ash: { name: 'Ash beige', ja: 'アッシュベージュ', image: 'ash', description: 'くすみを帯びた、軽やかなベージュ。明るさとクールな雰囲気を楽しみたい方に。', menu: 'ブリーチ1回＋ヘアカラー', swatch: '#9c958e' }
  };
  let step = 0;
  let answers = [];
  let chosen = null;
  function recommend(a) {
    const score = { khaki: 0, milk: 0, burgundy: 0, ash: 0 };
    const add = values => Object.entries(values).forEach(([key, value]) => { score[key] += value; });
    add(a[0] === 'dark' ? { khaki: 3, burgundy: 2 } : a[0] === 'brown' ? { milk: 3, khaki: 1 } : { ash: 3, milk: 2 });
    add(a[1] === 'soft' ? { milk: 7, khaki: 2 } : a[1] === 'cool' ? { khaki: 7, ash: 5 } : { burgundy: 9, milk: 1 });
    add(a[2] === 'avoid' ? { khaki: 2, burgundy: 2 } : { ash: 2, milk: 1 });
    add(a[3] === 'easy' ? { khaki: 3, burgundy: 1 } : { ash: 3, milk: 1 });
    // Do not recommend a light, bleach-led color when the guest avoids bleach or wants easy care.
    return Object.keys(colors).filter(key => key !== 'ash' || (a[2] !== 'avoid' && a[3] === 'salon'))
      .sort((a, b) => score[b] - score[a]).slice(0, 2);
  }
  function focusAndShow(element) {
    element.focus({ preventScroll: true });
    element.scrollIntoView({ block: 'center' });
  }
  function renderQuestion(focus = false) {
    const q = questions[step];
    $('quiz-count').textContent = `${String(step + 1).padStart(2, '0')} / 04`;
    $('quiz-progress-fill').style.transform = `scaleX(${(step + 1) / 4})`;
    document.querySelector('.quiz-progress').setAttribute('aria-valuenow', String(step + 1));
    $('quiz-question').textContent = q.title;
    $('quiz-hint').textContent = q.hint;
    $('quiz-options').replaceChildren();
    q.choices.forEach(([value, title, description], i) => {
      const label = document.createElement('label'); label.className = 'quiz-option';
      const input = document.createElement('input'); input.type = 'radio'; input.name = 'answer'; input.value = value; input.checked = answers[step] === value; input.required = true;
      const number = document.createElement('span'); number.className = 'option-number'; number.textContent = String(i + 1).padStart(2, '0');
      const text = document.createElement('span'); const strong = document.createElement('strong'); strong.textContent = title;
      const small = document.createElement('small'); small.textContent = description; text.append(strong, small);
      input.addEventListener('change', () => { answers[step] = value; $('quiz-next').disabled = false; });
      label.append(input, number, text); $('quiz-options').append(label);
    });
    $('quiz-back').disabled = step === 0;
    $('quiz-next').disabled = !answers[step];
    $('quiz-next').textContent = step === 3 ? 'おすすめの色を見る ↗' : '次の質問へ →';
    if (focus) focusAndShow($('quiz-question'));
  }
  function showResults() {
    $('quiz-panel').hidden = true; $('quiz-results').hidden = false;
    $('result-cards').replaceChildren();
    recommend(answers).forEach((key, i) => {
      const color = colors[key];
      const card = document.createElement('article'); card.className = 'result-card';
      card.innerHTML = `<img src="img/diagnosis-${color.image}.webp" width="640" height="640" alt="${color.ja}の髪色イメージ"><div class="result-card-copy"><p class="result-rank">${i === 0 ? '01 / YOUR MATCH' : '02 / ANOTHER MOOD'}</p><h4><span style="background:${color.swatch}" class="swatch"></span>${color.name}</h4><p class="color-ja">${color.ja}</p><p>${color.description}</p><p class="result-menu">相談メニューの目安<br><strong>${color.menu}</strong></p><button type="button" class="button dark">この色で相談する ↗</button></div>`;
      const button = card.querySelector('button'); button.setAttribute('aria-label', `${color.name}、この色で相談する`);
      button.addEventListener('click', () => {
        chosen = color;
        document.querySelectorAll('.result-card').forEach(c => c.classList.toggle('is-chosen', c === card));
        $('color-consult').hidden = false;
        $('consult-title').textContent = `${color.name} で相談。`;
        updateConsult(); focusAndShow($('consult-title'));
        document.dispatchEvent(new Event('diagnosischange'));
      });
      $('result-cards').append(card);
    });
    focusAndShow($('result-title')); document.dispatchEvent(new Event('diagnosischange'));
  }
  $('color-quiz').addEventListener('submit', event => {
    event.preventDefault(); if (!answers[step]) return;
    if (step < 3) { step++; renderQuestion(true); } else showResults();
  });
  $('quiz-back').addEventListener('click', () => { if (step > 0) { step--; renderQuestion(true); } });
  $('quiz-restart').addEventListener('click', () => {
    step = 0; answers = []; chosen = null;
    $('quiz-results').hidden = true; $('color-consult').hidden = true; $('quiz-panel').hidden = false;
    $('consult-store').value = ''; $('consult-message').value = ''; $('copy-status').textContent = '';
    $('consult-line').removeAttribute('href'); $('consult-line').setAttribute('aria-disabled', 'true'); $('consult-line').tabIndex = -1;
    renderQuestion(true); document.dispatchEvent(new Event('diagnosischange'));
  });
  window.RAPI_STORES.forEach(store => { const option = document.createElement('option'); option.value = store.id; option.textContent = `${store.ja} / ${store.en} (${store.region})`; $('consult-store').append(option); });
  function updateConsult() {
    if (!chosen) return;
    const store = window.RAPI_STORES.find(s => s.id === $('consult-store').value);
    $('consult-message').value = `${store ? `Rapi-rabi ${store.en}店へ。` : ''}似合う髪色診断で ${chosen.name} になりました。この色について相談したいです。髪の状態に合う施術も教えてください。`;
    $('copy-status').textContent = '';
    const line = $('consult-line');
    if (store) { line.href = store.line; line.removeAttribute('aria-disabled'); line.tabIndex = 0; line.textContent = `${store.ja}店のLINEへ ↗`; }
    else { line.removeAttribute('href'); line.setAttribute('aria-disabled', 'true'); line.tabIndex = -1; line.textContent = '店舗を選ぶとLINEへ進めます ↗'; }
  }
  $('consult-store').addEventListener('change', () => {
    updateConsult(); const id = $('consult-store').value;
    if (id) window.RapiStores.select(id);
  });
  document.addEventListener('storechange', event => {
    if (chosen && event.detail) { $('consult-store').value = event.detail.id; updateConsult(); }
  });
  $('copy-message').addEventListener('click', async () => {
    const field = $('consult-message'); const message = field.value;
    let copied = false;
    try { if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(message); copied = true; } } catch (_) { /* Local file or browser permission fallback below. */ }
    if (!copied) {
      field.focus(); field.select(); field.setSelectionRange(0, message.length);
      try { copied = document.execCommand('copy'); } catch (_) { copied = false; }
    }
    $('copy-status').textContent = copied ? 'コピーしました。LINEに貼り付けて送信できます。' : 'コピーできませんでした。文面を選択しているので、長押し、または Ctrl / ⌘ + C でコピーしてください。';
    if (copied) $('copy-message').focus({ preventScroll: true });
  });
  renderQuestion();
})();
