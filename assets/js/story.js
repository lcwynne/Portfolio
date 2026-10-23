// Story mode for case studies: a clickable timeline of the steps Lauren took.
// Collapsed (default) shows one step at a time with Previous/Next; Expanded shows
// every step for scrolling, and the timeline then tracks the step in view.
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

  // ── Timeline ─────────────────────────────────────────────────────────────
  const bar = document.createElement('nav');
  bar.className = 'lw-timeline-bar';
  bar.setAttribute('aria-label', 'Case study steps');
  bar.innerHTML = `
    <ol class="lw-timeline">${steps.map((s, i) => `
      <li><button type="button" class="lw-timeline-step" data-i="${i}">
        <span class="lw-timeline-dot" aria-hidden="true">${i + 1}</span>
        <span class="lw-timeline-label">${s.dataset.title}</span>
      </button></li>`).join('')}
    </ol>
    <button type="button" class="lw-story-toggle" aria-pressed="false"></button>`;
  story.prepend(bar);

  const buttons = [...bar.querySelectorAll('.lw-timeline-step')];
  const toggle  = bar.querySelector('.lw-story-toggle');

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
    const cur = buttons[i];
    // keep the current step visible in the (scrollable, on phones) timeline
    cur.parentElement.parentElement.scrollTo({ left: cur.parentElement.offsetLeft - 16, behavior: 'smooth' });
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
    toggle.innerHTML = on
      ? '<span class="lw-long">Show one step at a time</span><span class="lw-short">Collapse</span>'
      : '<span class="lw-long">Expand all steps</span><span class="lw-short">Expand</span>';
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
    const b = e.target.closest('.lw-timeline-step');
    if (b) go(Number(b.dataset.i), true);
  });
  story.addEventListener('click', e => {
    const b = e.target.closest('.lw-step-btn');
    if (b) go(Number(b.dataset.go), true);
  });
  toggle.addEventListener('click', () => {
    setExpanded(!expanded);
    go(index, true);
  });
  // Left/right arrows move between steps while focus is in the timeline
  bar.addEventListener('keydown', e => {
    if (!e.target.closest('.lw-timeline-step')) return;
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
