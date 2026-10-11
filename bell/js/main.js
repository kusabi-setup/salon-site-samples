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
