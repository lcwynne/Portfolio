// Story mode for case studies. The sidebar lists every step by name (plain #step
// links, so the page works without JavaScript). With JavaScript, one step shows at
// a time with Previous/Next, and "Show all steps" switches to one long scroll
// where the sidebar follows the step being read.

(function () {
  const layout = document.querySelector('[data-story]');
  if (!layout) return;

  const story  = layout.querySelector('.lw-story');
  const steps  = [...story.querySelectorAll('.lw-step')];
  const links  = [...layout.querySelectorAll('.lw-steps-link')];
  const toggle = layout.querySelector('.lw-story-toggle');
  if (!steps.length || steps.length !== links.length) return;

  const MODE_KEY = 'lw_story_mode';
  const smooth = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  let index = 0;
  let expanded = false;
  try { expanded = localStorage.getItem(MODE_KEY) === 'expanded'; } catch { /* storage blocked */ }

  // Previous / Next under each step
  steps.forEach((step, i) => {
    const nav = document.createElement('div');
    nav.className = 'lw-step-nav';
    const title = n => steps[n].dataset.title;
    nav.innerHTML =
      (i > 0 ? `<button type="button" class="lw-step-btn" data-go="${i - 1}"><span aria-hidden="true">←</span> ${title(i - 1)}</button>` : '<span></span>') +
      (i < steps.length - 1
        ? `<button type="button" class="lw-step-btn is-next" data-go="${i + 1}">Next: ${title(i + 1)} <span aria-hidden="true">→</span></button>`
        : `<button type="button" class="lw-step-btn is-next" data-go="0">Back to the start <span aria-hidden="true">↺</span></button>`);
    step.append(nav);
  });

  function markCurrent(i) {
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

  function bringStoryIntoView() {
    const top = layout.getBoundingClientRect().top + window.scrollY - 24;
    if (window.scrollY > top) window.scrollTo({ top, behavior: smooth });
  }

  function go(i, fromUser) {
    index = Math.max(0, Math.min(steps.length - 1, i));
    if (expanded) {
      steps[index].scrollIntoView({ behavior: smooth, block: 'start' });
    } else {
      steps.forEach((s, n) => {
        s.hidden = n !== index;
        s.classList.toggle('is-entering', n === index && fromUser);
      });
      if (fromUser) bringStoryIntoView();
    }
    markCurrent(index);
    history.replaceState(null, '', `#step-${index + 1}`);
  }

  function setExpanded(on) {
    expanded = on;
    layout.classList.toggle('is-expanded', on);
    toggle.textContent = on ? 'Show one step at a time' : 'Show all steps';
    toggle.setAttribute('aria-pressed', String(on));
    steps.forEach((s, n) => { s.hidden = !on && n !== index; });
    try { localStorage.setItem(MODE_KEY, on ? 'expanded' : 'collapsed'); } catch { /* storage blocked */ }
  }

  // While scrolling through every step, the sidebar follows the one being read
  const watcher = new IntersectionObserver(entries => {
    if (!expanded) return;
    const seen = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
    if (seen.length) { index = steps.indexOf(seen[0].target); markCurrent(index); }
  }, { rootMargin: '-30% 0px -60% 0px' });
  steps.forEach(s => watcher.observe(s));

  layout.addEventListener('click', e => {
    const link = e.target.closest('.lw-steps-link');
    if (link) { e.preventDefault(); go(Number(link.dataset.i), true); return; }
    const btn = e.target.closest('.lw-step-btn');
    if (btn) go(Number(btn.dataset.go), true);
  });

  toggle.addEventListener('click', () => {
    setExpanded(!expanded);
    go(index, true);
  });

  // Start: honour a #step-N link, otherwise begin at step 1
  const m = location.hash.match(/^#step-(\d+)$/);
  if (m) index = Math.min(steps.length, Math.max(1, Number(m[1]))) - 1;
  toggle.hidden = false;
  layout.classList.add('is-ready');
  setExpanded(expanded);
  markCurrent(index);
  if (m) go(index, true);
})();
