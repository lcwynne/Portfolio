// Interview presentation: one slide at a time. Arrow keys, space, Page Up/Down,
// Home/End, the buttons, or a swipe move between slides; the URL hash (#slide-N)
// keeps your place on refresh.

(function () {
  const slides = [...document.querySelectorAll('.slide')];
  const controls = document.querySelector('.deck-controls');
  if (!slides.length || !controls) return;

  document.documentElement.classList.add('is-deck');
  // A single slide needs no controls or progress bar
  const multi = slides.length > 1;
  controls.hidden = !multi;
  document.documentElement.classList.toggle('is-single', !multi);

  const prev = controls.querySelector('[data-dir="-1"]');
  const next = controls.querySelector('[data-dir="1"]');
  const count = controls.querySelector('.deck-count');
  const bar = document.querySelector('.deck-progress span');
  let index = -1;

  function show(i) {
    i = Math.max(0, Math.min(slides.length - 1, i));
    if (i === index) return;
    index = i;
    slides.forEach((s, n) => {
      s.classList.toggle('is-active', n === i);
      s.inert = n !== i;
    });
    slides[i].scrollTop = 0;
    count.textContent = `${i + 1} / ${slides.length}`;
    prev.disabled = i === 0;
    next.disabled = i === slides.length - 1;
    if (bar) bar.style.width = `${((i + 1) / slides.length) * 100}%`;
    history.replaceState(null, '', `#slide-${i + 1}`);
  }

  prev.addEventListener('click', () => show(index - 1));
  next.addEventListener('click', () => show(index + 1));

  document.addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    if (k === 'ArrowRight' || k === 'ArrowDown' || k === 'PageDown' || (k === ' ' && !e.shiftKey)) { e.preventDefault(); show(index + 1); }
    else if (k === 'ArrowLeft' || k === 'ArrowUp' || k === 'PageUp' || (k === ' ' && e.shiftKey)) { e.preventDefault(); show(index - 1); }
    else if (k === 'Home') { e.preventDefault(); show(0); }
    else if (k === 'End') { e.preventDefault(); show(slides.length - 1); }
  });

  // Horizontal swipes change slides; vertical ones still scroll a long slide
  let x0 = null, y0 = null;
  document.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  document.addEventListener('touchend', e => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) show(index + (dx < 0 ? 1 : -1));
    x0 = y0 = null;
  }, { passive: true });

  const m = location.hash.match(/^#slide-(\d+)$/);
  show(m ? Number(m[1]) - 1 : 0);
})();
