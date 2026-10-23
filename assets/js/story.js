// Story mode for case studies: every step is on the page, and the sidebar lists
// them by name. The sidebar links are plain #step-N anchors (they scroll without
// JavaScript); this script highlights the step being read and marks earlier ones.

(function () {
  const layout = document.querySelector('[data-story]');
  if (!layout) return;

  const steps = [...layout.querySelectorAll('.lw-step')];
  const links = [...layout.querySelectorAll('.lw-steps-link')];
  if (!steps.length || steps.length !== links.length) return;

  const smooth = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  let current = -1;

  function mark(i) {
    if (i === current) return;
    current = i;
    links.forEach((a, n) => {
      a.parentElement.classList.toggle('is-current', n === i);
      a.parentElement.classList.toggle('is-done', n < i);
      if (n === i) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current');
    });
    // On phones the step list is a sideways row of chips; keep the current one in view
    const list = links[i].closest('ol');
    if (list.scrollWidth > list.clientWidth) {
      list.scrollTo({ left: links[i].parentElement.offsetLeft - 16, behavior: smooth });
    }
  }

  // Highlight the step whose top has most recently passed the upper third of the screen
  function update() {
    const line = window.innerHeight * 0.33;
    let i = 0;
    steps.forEach((s, n) => { if (s.getBoundingClientRect().top <= line) i = n; });
    mark(i);
  }

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { update(); ticking = false; });
  }, { passive: true });
  window.addEventListener('resize', update);

  links.forEach((a, n) => a.addEventListener('click', e => {
    e.preventDefault();
    steps[n].scrollIntoView({ behavior: smooth, block: 'start' });
    history.replaceState(null, '', `#step-${n + 1}`);
    mark(n);
  }));

  update();
})();
