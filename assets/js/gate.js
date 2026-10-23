(async () => {
  if (sessionStorage.getItem('lw_unlocked') === '1') {
    location.replace('/home/');
    return;
  }

  const HASH = 'f448260594387705a220d8fa9759c0e5a8ba1781f6c55ef7262d30ac400f7487';

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

  let closeIdx = 0, wrongIdx = 0;
  let done = false;

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

  // The field itself stays enabled while the agent "thinks": disabling it
  // would drop a phone's keyboard and pop it back up after every message.
  let busy = false;
  const touch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  function setInputEnabled(on) {
    busy = !on;
    document.getElementById('gate-send').disabled = !on;
    if (on && !touch) document.getElementById('gate-input').focus();
  }

  async function handleSubmit() {
    const input = document.getElementById('gate-input');
    const text = input.value.trim();
    if (!text || busy || done) return;

    input.value = '';
    setInputEnabled(false);
    addBubble(text, 'user');

    const typing = addTypingIndicator();
    await delay(600);
    const correct = await checkPassword(text);
    typing.remove();

    if (correct) {
      sessionStorage.setItem('lw_unlocked', '1');
      await finish();
      return;
    }

    const response = isClose(text)
      ? closeResponses[closeIdx++ % closeResponses.length]
      : wrongResponses[wrongIdx++ % wrongResponses.length];
    addBubble(response, 'agent');
    setInputEnabled(true);
  }

  // Every visitor lands on the homepage, where a note from Lauren is waiting
  // on the Notes tab.
  async function finish() {
    done = true;
    setInputEnabled(false);
    sessionStorage.setItem('lw_chat_open', '0');
    addBubble('Yes! Welcome to my site.', 'agent');
    await delay(900);
    document.querySelector('.gate-wrap').classList.add('fade-out');
    await delay(500);
    location.replace('/home/');
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
