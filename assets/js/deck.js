// StackAdapt interview deck. Scales the 1920x1080 stage to fit the window and
// steps through the slides.
//   Arrows, space, Page Up/Down, Home/End: move     F: full screen
//   O or G: overview of every slide, grouped by section
//   A number, then Enter: jump to that slide
//   T: presenter timer (elapsed against the 45-minute plan)    R: restart the timer
//   N: speaker notes        Z: zoom the slide's diagram to fill the window
//   Esc: close the zoom or overview, leave full screen, or leave the deck
// Moving the mouse shows a nav bar with Previous/Next and a chip per section.
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

  // Every slide gets its number in the footer
  slides.forEach((s, n) => {
    const num = s.querySelector('.s-num');
    if (num) num.textContent = `${n + 1} / ${slides.length}`;
  });

  // Sections (beats) and a short title per slide, read from the slides themselves
  const beatOf = s => (s.querySelector('.s-mark')?.textContent || '').trim();
  const titleOf = s => {
    const h = s.querySelector('h1, h2');
    const t = (h || s.querySelector('.s-eyebrow'))?.textContent.trim() || '';
    return t.length > 90 ? t.slice(0, 88).trimEnd() + '…' : t;
  };
  const beats = [];
  slides.forEach((s, n) => {
    const name = beatOf(s);
    if (!beats.length || beats[beats.length - 1].name !== name) beats.push({ name, first: n, slides: [] });
    beats[beats.length - 1].slides.push(n);
  });
  const esc = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  // Shorter section names for the nav bar chips; the overview uses the full ones
  const SHORT = {
    'Introduction': 'Intro',
    'The vision and the restraint': 'Vision',
    'The Klaviyo brain': 'Brain',
    'Scaling myself': 'Scaling',
    "What didn't work": "Didn't work",
    "What I'd do differently": 'Differently',
    'How AI shows up in my process': 'AI process',
    'The problem': 'Problem',
    'Building the chat': 'Chat UI'
  };

  // ── Nav bar: shows while the mouse moves ──
  const nav = document.createElement('nav');
  nav.className = 'deck-nav';
  nav.setAttribute('aria-label', 'Slides');
  nav.innerHTML =
    `<button type="button" class="deck-nav-btn" data-go="prev" aria-label="Previous slide">‹</button>` +
    `<div class="deck-nav-beats">${beats.map((b, i) => `<button type="button" class="deck-nav-beat" data-beat="${i}" title="${esc(b.name)}">${esc(SHORT[b.name] || b.name)}</button>`).join('')}</div>` +
    `<button type="button" class="deck-nav-btn" data-go="next" aria-label="Next slide">›</button>` +
    `<button type="button" class="deck-nav-all" data-go="overview">All slides <kbd>O</kbd></button>`;
  document.body.append(nav);

  let navTimer = 0;
  function wake() {
    nav.classList.add('is-awake');
    clearTimeout(navTimer);
    navTimer = setTimeout(() => { if (!nav.matches(':hover')) nav.classList.remove('is-awake'); }, 2500);
  }
  document.addEventListener('mousemove', wake);
  nav.addEventListener('mouseleave', wake);
  nav.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.go === 'prev') show(index - 1);
    else if (b.dataset.go === 'next') show(index + 1);
    else if (b.dataset.go === 'overview') openOverview();
    else if (b.dataset.beat) show(beats[Number(b.dataset.beat)].first);
  });

  // ── Overview (O or G): every slide, grouped by section, click to jump ──
  const overview = document.createElement('div');
  overview.className = 'deck-overview';
  overview.hidden = true;
  overview.setAttribute('role', 'dialog');
  overview.setAttribute('aria-label', 'All slides');
  overview.innerHTML =
    `<div class="deck-overview-head"><strong>All slides</strong><span>Click a slide, or type its number and press Enter · Esc to close</span></div>` +
    `<div class="deck-overview-grid">${beats.map(b =>
      `<section><h3>${esc(b.name)}</h3><ol>${b.slides.map(n =>
        `<li><button type="button" data-slide="${n}"><span>${n + 1}</span>${esc(titleOf(slides[n]))}</button></li>`).join('')}</ol></section>`).join('')}</div>`;
  document.body.append(overview);
  overview.addEventListener('click', e => {
    const b = e.target.closest('[data-slide]');
    if (b) { show(Number(b.dataset.slide)); closeOverview(); }
    else if (e.target === overview) closeOverview();
  });
  function openOverview() {
    overview.hidden = false;
    overview.querySelector(`[data-slide="${index}"]`)?.focus({ preventScroll: false });
  }
  function closeOverview() { overview.hidden = true; }

  // ── Zoom: a diagram fills the window (click it, or Z on its slide) ──
  const zoom = document.createElement('div');
  zoom.className = 'deck-zoom';
  zoom.hidden = true;
  zoom.setAttribute('role', 'dialog');
  zoom.setAttribute('aria-label', 'Zoomed image');
  document.body.append(zoom);
  function openZoom(img) {
    zoom.innerHTML = `<img src="${img.getAttribute('src')}" alt="${img.getAttribute('alt') || ''}"/>`;
    zoom.hidden = false;
  }
  function closeZoom() { zoom.hidden = true; zoom.innerHTML = ''; }
  zoom.addEventListener('click', closeZoom);
  deck.addEventListener('click', e => { const img = e.target.closest('.s-zoom'); if (img) openZoom(img); });

  // ── Jump: type a slide number, then Enter ──
  const jump = document.createElement('div');
  jump.className = 'tool deck-jump';
  jump.hidden = true;
  document.body.append(jump);
  let digits = '', jumpTimer = 0;
  function typeDigit(d) {
    digits = (digits + d).slice(-2);
    jump.textContent = `Go to slide ${digits} · Enter`;
    jump.hidden = false;
    clearTimeout(jumpTimer);
    jumpTimer = setTimeout(clearJump, 2500);
  }
  function clearJump() { digits = ''; jump.hidden = true; }

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
    // One-time flourishes play the first time their slide shows, then stay put
    slides[i].querySelectorAll('[data-once]:not(.is-played)').forEach(el => el.classList.add('is-played'));
    const beat = beats.findIndex(b => b.slides.includes(i));
    nav.querySelectorAll('.deck-nav-beat').forEach((b, n) => b.classList.toggle('is-current', n === beat));
    nav.querySelector('[data-go="prev"]').disabled = i === 0;
    nav.querySelector('[data-go="next"]').disabled = i === slides.length - 1;
    overview.querySelectorAll('[data-slide]').forEach(b => b.classList.toggle('is-current', Number(b.dataset.slide) === i));
    renderNotes();
    tick();
  }

  // ── Speaker notes (N) ──
  function renderNotes() {
    const src = slides[index].querySelector('.notes');
    notesPanel.innerHTML = `<div class="notes-head">Notes · slide ${index + 1}</div>` + (src ? src.innerHTML : '<p>No notes for this slide.</p>');
    if (!notesPanel.hidden) fit();
  }

  // ── Timer (T): starts the moment the deck opens. A refresh keeps the clock
  // running; R restarts it, and going back through the gate starts it fresh.
  const START_KEY = 'lw_deck_started';
  let startedAt = Number(sessionStorage.getItem(START_KEY)) || Date.now();
  sessionStorage.setItem(START_KEY, String(startedAt));
  function restartTimer() {
    startedAt = Date.now();
    sessionStorage.setItem(START_KEY, String(startedAt));
    tick();
  }
  const mmss = ms => {
    const s = Math.max(0, Math.round(ms / 1000));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };
  function tick() {
    if (timer.hidden) return;
    const elapsed = Date.now() - startedAt;
    const target = Number(slides[index].dataset.at || 0) * 60000;
    const diff = elapsed - target;
    const pace = Math.abs(diff) < 30000 ? 'On pace'
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
    if (!zoom.hidden) {
      if (k === 'Escape' || k === 'z' || k === 'Z') { e.preventDefault(); closeZoom(); }
      return;
    }
    if (k === 'z' || k === 'Z') { const img = slides[index].querySelector('.s-zoom'); if (img) openZoom(img); return; }
    if (/^[0-9]$/.test(k)) { typeDigit(k); return; }
    if (k === 'Enter' && digits) { e.preventDefault(); show(Number(digits) - 1); clearJump(); closeOverview(); return; }
    if (k === 'o' || k === 'O' || k === 'g' || k === 'G') { overview.hidden ? openOverview() : closeOverview(); return; }
    if (!overview.hidden) {
      if (k === 'Escape') { e.preventDefault(); closeOverview(); }
      return; // arrows and Tab move through the overview's own buttons
    }
    if (k === 'ArrowRight' || k === 'ArrowDown' || k === 'PageDown' || (k === ' ' && !e.shiftKey)) { e.preventDefault(); show(index + 1); }
    else if (k === 'ArrowLeft' || k === 'ArrowUp' || k === 'PageUp' || (k === ' ' && e.shiftKey)) { e.preventDefault(); show(index - 1); }
    else if (k === 'Home') { e.preventDefault(); show(0); }
    else if (k === 'End') { e.preventDefault(); show(slides.length - 1); }
    else if (k === 't' || k === 'T') toggle(timer);
    else if (k === 'r' || k === 'R') restartTimer();
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
