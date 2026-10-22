(async () => {
  if (sessionStorage.getItem('lw_unlocked') === '1') {
    location.replace('/home/');
    return;
  }

  const HASH = 'f448260594387705a220d8fa9759c0e5a8ba1781f6c55ef7262d30ac400f7487';

  // The site's side chat panel (site-chat.js) picks this conversation up after unlock.
  const LOG_KEY = 'lw_chat';
  const greeting = document.querySelector('#messages .msg.agent .bubble');
  sessionStorage.setItem(LOG_KEY, JSON.stringify(greeting ? [{ role: 'agent', html: greeting.innerHTML }] : []));

  function record(role, content) {
    let log;
    try { log = JSON.parse(sessionStorage.getItem(LOG_KEY)) || []; } catch { log = []; }
    log.push(role === 'agent' ? { role, html: content } : { role, text: content });
    sessionStorage.setItem(LOG_KEY, JSON.stringify(log));
  }

  const closeResponses = [
    "So close, check your spelling.",
    "Almost, try that again.",
    "You're right there, just not quite.",
    "Ooh, so close I could taste it."
  ];

  const wrongResponses = [
    "Not quite, give it another shot.",
    "That's not it, try again.",
    "Close, but no, one more try.",
    "Hmm, not the one, try again."
  ];

  const intentAck = {
    ai:             "AI and ML it is — I'll make sure the most relevant work is front and center.",
    design_systems: "Design systems work, noted — I'll highlight what fits best.",
    analytics:      "Analytics focus, got it — surfacing the most relevant projects for you.",
    enterprise:     "Enterprise product work — I'll lead with what fits.",
    general:        "Good to know. Heading in now.",
    skip:           "No worries at all, come on in :)"
  };

  const suggestions = [
    { label: 'See AI case studies',             intent: 'ai',      to: '/works/',                  ack: "Great — AI work is up first." },
    { label: 'How UX influences model behavior', intent: 'ai',      to: '/works/machine-learning/', ack: "Good pick. Taking you to the Machine Learning case study." },
    { label: 'Learn about Lauren personally',   intent: 'general', to: '/offline/',                ack: "Let me introduce you." },
    { label: 'Browse all work',                 intent: 'skip',    to: '/works/',                  ack: "Come on in :)" }
  ];

  let closeIdx = 0, wrongIdx = 0;
  let state = 'password';

  async function sha256(text) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function isClose(text) {
    const t = text.toLowerCase();
    return t.includes('build') || t.includes('wynne');
  }

  async function checkPassword(input) {
    const tokens = input.trim().split(/\s+/);
    for (const token of tokens) {
      if ((await sha256(token.toLowerCase())) === HASH) return true;
    }
    return false;
  }

  function parseIntent(text) {
    const t = text.toLowerCase();
    if (/\b(ai\b|ml\b|machine.?learn|artificial intel|data.?sci|llm|model|copilot|intelligence)\b/.test(t)) return 'ai';
    if (/\b(design.?system|component|token|design.?ops)\b/.test(t)) return 'design_systems';
    if (/\b(analytic|data|insight|dashboard|bi\b)\b/.test(t)) return 'analytics';
    if (/\b(enterprise|platform|suite|b2b|saas|multi.?product)\b/.test(t)) return 'enterprise';
    if (/\b(just|curious|browsing|look.{0,10}around|no\s+reason|no\s+specific|general|not\s+sure)\b/.test(t)) return 'skip';
    return 'general';
  }

  function addBubble(text, role) {
    const messages = document.getElementById('messages');
    const row = document.createElement('div');
    row.className = 'msg ' + role;
    if (role === 'agent') {
      row.innerHTML = `
        <div class="agent-avatar">
          <img src="/assets/65e88c6319801815fa38ea12_lw_logo.png" alt="LW" width="28"/>
        </div>
        <div class="bubble">${text}</div>`;
    } else {
      row.innerHTML = `<div class="bubble">${escapeHtml(text)}</div>`;
    }
    messages.appendChild(row);
    row.scrollIntoView({ behavior: 'smooth', block: 'end' });
    record(role, text);
    return row;
  }

  function addTypingIndicator() {
    const messages = document.getElementById('messages');
    const row = document.createElement('div');
    row.className = 'msg agent';
    row.innerHTML = `
      <div class="agent-avatar">
        <img src="/assets/65e88c6319801815fa38ea12_lw_logo.png" alt="LW" width="28"/>
      </div>
      <div class="bubble typing"><span></span><span></span><span></span></div>`;
    messages.appendChild(row);
    row.scrollIntoView({ behavior: 'smooth', block: 'end' });
    return row;
  }

  function setInputEnabled(on) {
    document.getElementById('gate-input').disabled = !on;
    document.getElementById('gate-send').disabled = !on;
    if (on) document.getElementById('gate-input').focus();
  }

  async function handleSubmit() {
    const input = document.getElementById('gate-input');
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    setInputEnabled(false);
    addBubble(text, 'user');

    if (state === 'password') {
      const typing = addTypingIndicator();
      await delay(600);
      const correct = await checkPassword(text);
      typing.remove();

      if (correct) {
        addBubble("Yes! Welcome in, glad you're here.", 'agent');
        sessionStorage.setItem('lw_unlocked', '1');
        await delay(700);
        addBubble("Where would you like to start?", 'agent');
        addChips();
        state = 'intent';
        setInputEnabled(true);
        return;
      }

      const response = isClose(text)
        ? closeResponses[closeIdx++ % closeResponses.length]
        : wrongResponses[wrongIdx++ % wrongResponses.length];
      addBubble(response, 'agent');
      setInputEnabled(true);

    } else if (state === 'intent') {
      const intent = parseIntent(text);
      await finish(intent, intentAck[intent] || intentAck.general, '/home/');
    }
  }

  function addChips() {
    const messages = document.getElementById('messages');
    const row = document.createElement('div');
    row.className = 'chips';
    row.id = 'gate-chips';
    for (const s of suggestions) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip';
      chip.textContent = s.label;
      chip.addEventListener('click', () => pickSuggestion(s));
      row.appendChild(chip);
    }
    messages.appendChild(row);
    row.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }

  async function pickSuggestion(s) {
    if (state !== 'intent') return;
    addBubble(s.label, 'user');
    await finish(s.intent, s.ack, s.to);
  }

  async function finish(intent, ack, to) {
    state = 'done';
    setInputEnabled(false);
    document.getElementById('gate-chips')?.remove();
    sessionStorage.setItem('lw_intent', intent);
    sessionStorage.setItem('lw_chat_open', '1');

    const typing = addTypingIndicator();
    await delay(500);
    typing.remove();
    addBubble(ack, 'agent');

    await delay(900);
    document.querySelector('.gate-wrap').classList.add('fade-out');
    await delay(500);
    location.replace(to);
  }

  function escapeHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

  document.getElementById('gate-send').addEventListener('click', handleSubmit);
  document.getElementById('gate-input').addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  });
})();
