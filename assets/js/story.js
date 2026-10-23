// Story mode for case studies: a small stepper through the steps Lauren took.
// Collapsed (default) shows one step at a time with Previous/Next; Expanded shows
// every step for scrolling, and the stepper then tracks the step in view.
// Without JavaScript every step simply shows, in order.

(function () {
  const story = document.querySelector('[data-story]');
  if (!story) return;

  const steps = [...story.querySelectorAll('.lw-step')];
  if (!steps.length) return;

  const MODE_KEY = 'lw_story_mode';
  let index = 0;
  let expanded = false;
  try { expanded = localStorage.getItem(MODE_KEY) === 'expanded'; } catch { /* storage blocked */ }

  // ── Stepper: a small centered control pinned above the story ─────────────
  const esc = t => String(t).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const chev = d => `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="${d}" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const bar = document.createElement('div');
  bar.className = 'lw-stepper-wrap';
  bar.innerHTML = `
    <nav class="lw-stepper" aria-label="Case study steps">
      <button type="button" class="lw-stepper-arrow" data-dir="-1" aria-label="Previous step">${chev('M8.5 3 4.5 7l4 4')}</button>
      <ol class="lw-stepper-dots">${steps.map((s, i) => `<li><button type="button" class="lw-stepper-dot" data-i="${i}" aria-label="Step ${i + 1}: ${esc(s.dataset.title)}" title="${esc(s.dataset.title)}"></button></li>`).join('')}</ol>
      <span class="lw-stepper-label" aria-live="polite"></span>
      <button type="button" class="lw-stepper-arrow" data-dir="1" aria-label="Next step">${chev('M5.5 3l4 4-4 4')}</button>
      <span class="lw-stepper-sep" aria-hidden="true"></span>
      <button type="button" class="lw-story-toggle" aria-pressed="false"></button>
    </nav>`;
  story.prepend(bar);

  const buttons = [...bar.querySelectorAll('.lw-stepper-dot')];
  const toggle  = bar.querySelector('.lw-story-toggle');
  const label   = bar.querySelector('.lw-stepper-label');
  const [prevArrow, nextArrow] = bar.querySelectorAll('.lw-stepper-arrow');

  // ── Previous / Next under each step ──────────────────────────────────────
  steps.forEach((step, i) => {
    const nav = document.createElement('div');
    nav.className = 'lw-step-nav';
    const prev = i > 0 ? `<button type="button" class="lw-step-btn" data-go="${i - 1}"><span aria-hidden="true">←</span> ${steps[i - 1].dataset.title}</button>` : '<span></span>';
    const next = i < steps.length - 1
      ? `<button type="button" class="lw-step-btn is-next" data-go="${i + 1}">Next: ${steps[i + 1].dataset.title} <span aria-hidden="true">→</span></button>`
      : `<button type="button" class="lw-step-btn is-next" data-go="0">Back to the start <span aria-hidden="true">↺</span></button>`;
    nav.innerHTML = prev + next;
    step.append(nav);
  });

  function scrollToStory() {
    const top = bar.getBoundingClientRect().top + window.scrollY - 16;
    if (window.scrollY > top) window.scrollTo({ top, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  function markCurrent(i) {
    buttons.forEach((b, n) => {
      b.classList.toggle('is-current', n === i);
      b.classList.toggle('is-done', n < i);
      if (n === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    });
    label.innerHTML = `<span class="lw-stepper-count">${i + 1}/${steps.length}</span> ${esc(steps[i].dataset.title)}`;
    prevArrow.disabled = i === 0;
    nextArrow.disabled = i === steps.length - 1;
  }

  function go(i, fromUser) {
    index = Math.max(0, Math.min(steps.length - 1, i));
    if (expanded) {
      const top = steps[index].getBoundingClientRect().top + window.scrollY - bar.offsetHeight - 24;
      window.scrollTo({ top, behavior: 'smooth' });
    } else {
      steps.forEach((s, n) => { s.hidden = n !== index; s.classList.toggle('is-entering', n === index && fromUser); });
      if (fromUser) scrollToStory();
    }
    markCurrent(index);
    history.replaceState(null, '', `#step-${index + 1}`);
  }

  function setExpanded(on) {
    expanded = on;
    story.classList.toggle('is-expanded', on);
    story.classList.toggle('is-collapsed', !on);
    toggle.setAttribute('aria-pressed', String(on));
    toggle.textContent = on ? 'One at a time' : 'Show all';
    steps.forEach((s, n) => { s.hidden = !on && n !== index; });
    try { localStorage.setItem(MODE_KEY, on ? 'expanded' : 'collapsed'); } catch { /* storage blocked */ }
  }

  // In expanded mode the timeline follows whichever step is being read.
  const watcher = new IntersectionObserver(entries => {
    if (!expanded) return;
    const visible = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
    if (visible.length) { index = steps.indexOf(visible[0].target); markCurrent(index); }
  }, { rootMargin: '-35% 0px -55% 0px' });
  steps.forEach(s => watcher.observe(s));

  // ── Wiring ───────────────────────────────────────────────────────────────
  bar.addEventListener('click', e => {
    const dot = e.target.closest('.lw-stepper-dot');
    if (dot) return go(Number(dot.dataset.i), true);
    const arrow = e.target.closest('.lw-stepper-arrow');
    if (arrow) go(index + Number(arrow.dataset.dir), true);
  });
  story.addEventListener('click', e => {
    const b = e.target.closest('.lw-step-btn');
    if (b) go(Number(b.dataset.go), true);
  });
  toggle.addEventListener('click', () => {
    setExpanded(!expanded);
    go(index, true);
  });
  // Left/right arrow keys move between steps while focus is on a dot
  bar.addEventListener('keydown', e => {
    if (!e.target.closest('.lw-stepper-dot')) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      go(index + (e.key === 'ArrowRight' ? 1 : -1), true);
      buttons[index].focus();
    }
  });

  // ── Start ────────────────────────────────────────────────────────────────
  const m = location.hash.match(/^#step-(\d+)$/);
  if (m) index = Math.min(steps.length, Number(m[1])) - 1;
  story.classList.add('is-ready');
  setExpanded(expanded);
  markCurrent(index);
  if (m) go(index, true);
})();
