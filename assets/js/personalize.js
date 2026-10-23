// Runs on /works — reads intent from sessionStorage, scores + reorders tiles, shows context bubble.
(function () {
  const intent = sessionStorage.getItem('lw_intent');
  if (!intent || intent === 'general' || intent === 'skip') return;

  // Keyword sets that earn score points per project
  const SCORES = {
    ai: {
      composer:           4,
      'marketing-agent':  4,
      'machine-learning': 3,
      aidincopilot:       3
    },
    design_systems: {
      composer:               2,
      aidincopilot:           1,
      'marketing-agent':      1,
      'machine-learning':     0
    },
    analytics: {
      'machine-learning': 3,
      aidincopilot:       2,
      composer:           1,
      'marketing-agent':  1
    },
    enterprise: {
      composer:               2,
      'marketing-agent':      1,
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

  // Tell the visitor why the order changed, in the side chat rather than on the page.
  // site-chat.js (loaded after this script) renders it and opens the chat. Said once per visit.
  const intentLabels = {
    ai:             'AI and ML work',
    design_systems: 'design systems work',
    analytics:      'analytics work',
    enterprise:     'enterprise product work'
  };
  const label = intentLabels[intent] || 'your interests';

  if (sessionStorage.getItem('lw_sort_told') !== intent) {
    let log;
    try { log = JSON.parse(sessionStorage.getItem('lw_chat')) || []; } catch { log = []; }
    log.push({
      role: 'agent',
      html: `I've sorted these by relevance to <strong>${label}</strong>. The order is mine, not Lauren's — tap any project to dig in.`
    });
    sessionStorage.setItem('lw_chat', JSON.stringify(log));
    sessionStorage.setItem('lw_chat_open', '1');
    sessionStorage.setItem('lw_sort_told', intent);
  }
})();
