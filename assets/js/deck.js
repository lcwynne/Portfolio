// StackAdapt interview deck. Scales the 1920x1080 stage to fit the window and
// steps through the slides.
//   Arrows, space, Page Up/Down, Home/End: move     F: full screen
//   T: presenter timer (elapsed against the 45-minute plan)
//   N: speaker notes        Esc: leave full screen, or leave the deck
// The URL hash (#slide-N) keeps your place on refresh.

(function () {
  const deck = document.querySelector('.deck');
  const slides = [...document.querySelectorAll('.slide')];
  if (!deck || !slides.length) return;

  const root = document.documentElement;
  root.classList.add('is-deck');

  const PLAN_MIN = 45;
  const timer = document.querySelector('.timer');
  const notesPanel = document.querySelector('.notes-panel');
  const keys = document.querySelector('.keys');
  let index = -1;

  // Every slide gets its beat name and number in the footer
  slides.forEach((s, n) => {
    const num = s.querySelector('.s-num');
    if (num) num.textContent = `${n + 1} / ${slides.length}`;
  });

  // ── Fit the stage to the window, leaving room for notes when they're open ──
  function fit() {
    const notesH = notesPanel.hidden ? 0 : notesPanel.offsetHeight + 24;
    const w = window.innerWidth, h = window.innerHeight - notesH;
    const scale = Math.min(w / 1920, h / 1080);
    const x = (w - 1920 * scale) / 2, y = Math.max(0, (h - 1080 * scale) / 2);
    deck.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
  }

  // ── Slides ──
  function show(i) {
    i = Math.max(0, Math.min(slides.length - 1, i));
    if (i === index) return;
    index = i;
    slides.forEach((s, n) => {
      s.classList.toggle('is-active', n === i);
      s.inert = n !== i;
    });
    history.replaceState(null, '', `#slide-${i + 1}`);
    renderNotes();
    tick();
    if (i > 0 && !startedAt) startedAt = Date.now();
  }

  // ── Speaker notes (N) ──
  function renderNotes() {
    const src = slides[index].querySelector('.notes');
    notesPanel.innerHTML = `<div class="notes-head">Notes · slide ${index + 1}</div>` + (src ? src.innerHTML : '<p>No notes for this slide.</p>');
    if (!notesPanel.hidden) fit();
  }

  // ── Timer (T): starts when you leave the title slide ──
  let startedAt = 0;
  const mmss = ms => {
    const s = Math.max(0, Math.round(ms / 1000));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };
  function tick() {
    if (timer.hidden) return;
    const elapsed = startedAt ? Date.now() - startedAt : 0;
    const target = Number(slides[index].dataset.at || 0) * 60000;
    const diff = elapsed - target;
    const pace = !startedAt ? 'Starts when you leave the title slide'
      : Math.abs(diff) < 30000 ? 'On pace'
      : diff > 0 ? `<span class="behind">${mmss(diff)} behind</span>` : `<span class="ahead">${mmss(-diff)} ahead</span>`;
    timer.innerHTML = `<strong>${mmss(elapsed)}</strong> / ${PLAN_MIN}:00<br/>Plan for this slide: ${mmss(target)} · ${pace}`;
  }
  setInterval(tick, 1000);

  function toggle(el) {
    el.hidden = !el.hidden;
    if (el === timer) tick();
    fit();
  }

  // ── Keys ──
  document.addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    if (k === 'ArrowRight' || k === 'ArrowDown' || k === 'PageDown' || (k === ' ' && !e.shiftKey)) { e.preventDefault(); show(index + 1); }
    else if (k === 'ArrowLeft' || k === 'ArrowUp' || k === 'PageUp' || (k === ' ' && e.shiftKey)) { e.preventDefault(); show(index - 1); }
    else if (k === 'Home') { e.preventDefault(); show(0); }
    else if (k === 'End') { e.preventDefault(); show(slides.length - 1); }
    else if (k === 't' || k === 'T') toggle(timer);
    else if (k === 'n' || k === 'N') toggle(notesPanel);
    else if (k === 'f' || k === 'F') {
      if (document.fullscreenElement) document.exitFullscreen();
      else root.requestFullscreen?.().catch(() => {});
    }
    // In full screen the browser takes the first Esc; otherwise Esc leaves the deck
    else if (k === 'Escape' && !document.fullscreenElement) location.href = '/home/';
  });

  // Swipes and clicks on the right or left edge also move between slides
  let x0 = null;
  document.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  document.addEventListener('touchend', e => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
    x0 = null;
  }, { passive: true });

  window.addEventListener('resize', fit);
  document.addEventListener('fullscreenchange', fit);

  // The key hint fades after a few seconds
  if (keys) setTimeout(() => { keys.hidden = true; }, 6000);

  const m = location.hash.match(/^#slide-(\d+)$/);
  show(m ? Number(m[1]) - 1 : 0);
  fit();

  // Cache the deck so it still loads with no connection
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/stackadapt/sw.js').catch(() => {});
})();
