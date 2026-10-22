// Case studies page: the expanding project panels and the one-at-a-time kudos card.

(function () {
  // ── Project panels ───────────────────────────────────────────────────────
  // One panel is open at a time. Hover or keyboard focus opens a panel; on a
  // touch screen the first tap on a closed panel opens it instead of navigating.
  const list = document.querySelector('.lw-strips');
  if (list) {
    const items = () => [...list.querySelectorAll('.work-item')];
    const open = el => items().forEach(i => i.classList.toggle('is-active', i === el));

    open(items()[0]); // personalize.js has already moved the most relevant project first

    items().forEach(item => {
      item.addEventListener('mouseenter', () => open(item));
      item.addEventListener('focusin', () => open(item));
      item.querySelector('.work-link').addEventListener('click', e => {
        if (!item.classList.contains('is-active')) { e.preventDefault(); open(item); }
      });
    });
    list.classList.add('is-ready');
  }

  // ── Awards, honors, and kudos ────────────────────────────────────────────
  const kudos = document.querySelector('.lw-kudos');
  if (kudos) {
    const slides = [...kudos.querySelectorAll('.lw-kudo')];
    const count  = kudos.querySelector('.lw-kudos-count');
    let index = 0;

    function show(i) {
      index = (i + slides.length) % slides.length;
      slides.forEach((s, n) => {
        const on = n === index;
        s.classList.toggle('is-active', on);
        s.hidden = !on;
        s.setAttribute('aria-label', `${n + 1} of ${slides.length}`);
      });
      count.textContent = `${index + 1} / ${slides.length}`;
    }

    kudos.querySelectorAll('.lw-kudos-btn').forEach(btn => {
      btn.addEventListener('click', () => show(index + Number(btn.dataset.dir)));
    });
    kudos.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') show(index + 1);
      if (e.key === 'ArrowLeft')  show(index - 1);
    });

    // Swipe left or right on a phone; mostly-vertical drags are left to page scrolling
    let startX = null, startY = null;
    const list = kudos.querySelector('.lw-kudos-list');
    list.addEventListener('touchstart', e => { startX = e.touches[0].clientX; startY = e.touches[0].clientY; }, { passive: true });
    list.addEventListener('touchend', e => {
      if (startX === null) return;
      const dx = e.changedTouches[0].clientX - startX, dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) show(index + (dx < 0 ? 1 : -1));
      startX = null;
    }, { passive: true });

    show(0);
    kudos.classList.add('is-ready');
  }
})();
