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

    show(0);
    kudos.classList.add('is-ready');
  }
})();
