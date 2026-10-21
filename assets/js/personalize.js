// Runs on /works — reads intent from sessionStorage, scores + reorders tiles, shows context bubble.
(function () {
  const intent = sessionStorage.getItem('lw_intent');
  if (!intent || intent === 'general' || intent === 'skip') return;

  // Keyword sets that earn score points per project
  const SCORES = {
    ai: {
      'machine-learning': 3,
      aidincopilot:       2,
      appbuilder:         1,
      multiproductexperience: 0
    },
    design_systems: {
      multiproductexperience: 3,
      aidincopilot:           1,
      appbuilder:             1,
      'machine-learning':     0
    },
    analytics: {
      'machine-learning': 3,
      aidincopilot:       2,
      appbuilder:         2,
      multiproductexperience: 0
    },
    enterprise: {
      multiproductexperience: 3,
      appbuilder:             2,
      'machine-learning':     1,
      aidincopilot:           1
    }
  };

  const scores = SCORES[intent];
  if (!scores) return;

  const list = document.querySelector('.work-list');
  if (!list) return;

  const items = Array.from(list.querySelectorAll('.work-item'));
  items.sort((a, b) => {
    const slug_a = (a.querySelector('a[href]') || {}).href?.split('/').pop() || '';
    const slug_b = (b.querySelector('a[href]') || {}).href?.split('/').pop() || '';
    return (scores[slug_b] || 0) - (scores[slug_a] || 0);
  });

  // Mark top tile
  items.forEach((item, i) => {
    item.setAttribute('data-rank', i);
    if (i === 0) item.classList.add('lw-top-pick');
  });

  // Re-append in new order
  items.forEach(item => list.appendChild(item));

  // Transparent chat-style context note
  const intentLabels = {
    ai:             'AI and ML work',
    design_systems: 'design systems work',
    analytics:      'analytics work',
    enterprise:     'enterprise product work'
  };
  const label = intentLabels[intent] || 'your interests';

  const note = document.createElement('div');
  note.className = 'lw-reorder-note';
  note.innerHTML = `
    <div class="lw-reorder-bubble">
      <div class="agent-avatar">
        <img src="/assets/65e88c6319801815fa38ea12_lw_logo.png" alt="LW" width="16"/>
      </div>
      <span>I've sorted these by relevance to <strong>${label}</strong>. The order is mine, not Lauren's — tap any project to dig in.</span>
    </div>`;
  list.parentElement.insertBefore(note, list);
})();
