// Side chat panel on every page after the gate. It continues the gate's
// conversation (sessionStorage 'lw_chat', written by gate.js) and remembers
// whether it's open ('lw_chat_open') as the visitor moves between pages.

(function () {
  const LOG_KEY   = 'lw_chat';
  const OPEN_KEY  = 'lw_chat_open';
  const NOTES_KEY = 'lw_notes_seen';
  const LOGO      = '/assets/65e88c6319801815fa38ea12_lw_logo.png';
  const PORTRAIT  = '/assets/65e88a8532893e5bd3597de6_laurenwynne-p-500.png';

  // Cloudflare Worker proxy for Claude. Empty means the AI isn't connected,
  // so typed questions get a pointer to the right page instead.
  const WORKER_URL = '';

  const NEW_CHAT = /\b(new|fresh|another|separate|second)\s+(chat|conversation|thread|session)\b|\bstart\s+(over|again|fresh)\b|\b(restart|reset|clear)\b.*\b(chat|conversation)\b|\b(clear|reset)\s+(this|the|it)\b/i;
  const NEW_CHAT_REPLY = "Starting a new chat is out of scope for right now, but look for it in future improvements.";

  const store = {
    get() { try { return JSON.parse(sessionStorage.getItem(LOG_KEY)) || []; } catch { return []; } },
    push(entry) { const log = store.get(); log.push(entry); sessionStorage.setItem(LOG_KEY, JSON.stringify(log)); }
  };

  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  // Project the visitor is asking about: set by a tile's chat icon, or read from a case-study URL.
  let project = null;
  const m = location.pathname.match(/^\/works\/([^/]+)\/?$/);
  if (m) {
    const h1 = document.querySelector('h1');
    project = { slug: m[1], title: h1 ? h1.textContent.trim() : m[1] };
  }

  // ── DOM ──────────────────────────────────────────────────────────────────
  const root = document.documentElement;
  const touch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  // A page can leave Lauren a note for the chat: <template id="lw-chat-note" data-id="...">…</template>.
  // Until it's read, the tab shows her photo with an unread dot.
  const noteTpl = document.getElementById('lw-chat-note');
  const seenNotes = () => { try { return JSON.parse(sessionStorage.getItem(NOTES_KEY)) || []; } catch { return []; } };
  let pendingNote = noteTpl && !seenNotes().includes(noteTpl.dataset.id) ? noteTpl : null;

  const tab = document.createElement('button');
  tab.type = 'button';
  tab.className = 'lwc-tab';
  function renderTab() {
    tab.classList.toggle('has-note', !!pendingNote);
    if (pendingNote) {
      tab.setAttribute('aria-label', 'Open chat: you have a note from Lauren');
      tab.innerHTML = `<span class="lwc-tab-avatar"><img src="${PORTRAIT}" alt=""/><i class="lwc-dot"></i></span><span>A note from Lauren</span>`;
    } else {
      tab.setAttribute('aria-label', 'Open chat with Lauren\'s portfolio agent');
      tab.innerHTML = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M9 1.5C4.86 1.5 1.5 4.43 1.5 8.03c0 1.95.95 3.7 2.45 4.9L3 16.5l3.8-1.9C7.5 14.87 8.24 15 9 15c4.14 0 7.5-2.93 7.5-6.53S13.14 1.5 9 1.5z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg><span>Chat</span>`;
    }
  }
  renderTab();

  const panel = document.createElement('aside');
  panel.className = 'lwc-panel';
  panel.setAttribute('aria-label', 'Chat with Lauren\'s portfolio agent');
  panel.innerHTML = `
    <div class="lwc-header">
      <div class="lwc-avatar"><img src="${LOGO}" alt=""/></div>
      <div class="lwc-title"><strong>Portfolio Agent</strong><span>laurenwynne.com</span></div>
      <button type="button" class="lwc-close" aria-label="Close chat">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      </button>
    </div>
    <div class="lwc-messages" role="log" aria-live="polite"></div>
    <form class="lwc-form" autocomplete="off">
      <input class="lwc-input" type="text" placeholder="Message..." aria-label="Message" autocorrect="off" spellcheck="false"/>
      <button type="submit" class="lwc-send" aria-label="Send">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 13V3M8 3L4 7M8 3L12 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    </form>`;

  document.body.append(tab, panel);

  const messages = panel.querySelector('.lwc-messages');
  const form     = panel.querySelector('.lwc-form');
  const input    = panel.querySelector('.lwc-input');
  const sendBtn  = panel.querySelector('.lwc-send');

  function renderEntry(e) {
    const row = document.createElement('div');
    if (e.note) {
      row.className = 'lwc-msg agent lwc-note';
      row.innerHTML = `<div class="lwc-avatar"><img src="${PORTRAIT}" alt=""/></div><div class="lwc-bubble"><div class="lwc-note-label">A note from Lauren</div>${e.html}</div>`;
    } else if (e.role === 'agent') {
      row.className = 'lwc-msg agent';
      row.innerHTML = `<div class="lwc-avatar"><img src="${LOGO}" alt=""/></div><div class="lwc-bubble">${e.html}</div>`;
    } else {
      row.className = 'lwc-msg user';
      row.innerHTML = `<div class="lwc-bubble">${esc(e.text)}</div>`;
    }
    messages.appendChild(row);
    return row;
  }

  function scrollToEnd() { messages.scrollTop = messages.scrollHeight; }

  function say(role, content) {
    const entry = role === 'agent' ? { role, html: content } : { role, text: content };
    store.push(entry);
    renderEntry(entry);
    scrollToEnd();
  }

  // ── Open / close ─────────────────────────────────────────────────────────
  // Lauren's note arrives in the conversation the first time the chat is open on that page.
  function deliverNote() {
    if (!pendingNote) return;
    const entry = { role: 'agent', note: true, html: pendingNote.innerHTML.trim() };
    store.push(entry);
    renderEntry(entry);
    sessionStorage.setItem(NOTES_KEY, JSON.stringify([...seenNotes(), pendingNote.dataset.id]));
    pendingNote = null;
    renderTab();
  }

  function setOpen(open, focus) {
    root.classList.toggle('lwc-open', open);
    sessionStorage.setItem(OPEN_KEY, open ? '1' : '0');
    if (open) {
      deliverNote();
      scrollToEnd();
      // On touch screens, focusing would throw the keyboard up over the conversation
      if (focus && !touch) input.focus({ preventScroll: true });
    } else if (focus) {
      tab.focus({ preventScroll: true });
    }
  }

  // Opened from a tile's chat icon: same conversation, now about that project.
  function openFor(slug, title) {
    const changed = !project || project.slug !== slug;
    project = { slug, title };
    setOpen(true, true);
    if (changed) say('agent', `You're looking at <strong>${esc(title)}</strong>. What would you like to know?`);
  }

  // ── Replies ──────────────────────────────────────────────────────────────
  function fallback() {
    if (project) {
      return `I can't answer questions in my own words yet, so the <a href="/works/${esc(project.slug)}/">${esc(project.title)} case study</a> is the best place to look.`;
    }
    return `I can't answer questions in my own words yet. The <a href="/works">case studies</a> and the <a href="/offline">Offline</a> page are the best places to look.`;
  }

  async function askWorker(question) {
    if (!WORKER_URL || !project) return null;
    try {
      const data = await fetch(`/assets/data/${project.slug}.json`).then(r => (r.ok ? r.json() : null));
      if (!data) return null;
      const history = store.get()
        .filter(e => e.role === 'user' || e.role === 'agent')
        .slice(-10)
        .map(e => ({ role: e.role === 'user' ? 'user' : 'assistant', content: e.text || e.html.replace(/<[^>]+>/g, '') }));
      const res = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: `Answer questions about the "${project.title}" case study using only this text. Never invent facts. If the answer isn't in the text, say so. Keep answers to 2-4 sentences.\n\n---\n${data.text}\n---`,
          messages: [...history.slice(0, -1), { role: 'user', content: question }]
        })
      });
      if (!res.ok) return null;
      const out = await res.json();
      return out.content?.[0]?.text || null;
    } catch {
      return null;
    }
  }

  let busy = false;

  async function handleSubmit(e) {
    e.preventDefault();
    const text = input.value.trim();
    if (!text || busy) return;
    // The field stays enabled so a phone keyboard doesn't drop and pop back up
    busy = true;
    sendBtn.disabled = true;
    input.value = '';
    say('user', text);

    const typing = document.createElement('div');
    typing.className = 'lwc-msg agent';
    typing.innerHTML = `<div class="lwc-avatar"><img src="${LOGO}" alt=""/></div><div class="lwc-bubble lwc-typing"><span></span><span></span><span></span></div>`;
    messages.appendChild(typing);
    scrollToEnd();

    let reply;
    if (NEW_CHAT.test(text)) {
      await new Promise(r => setTimeout(r, 500));
      reply = NEW_CHAT_REPLY;
    } else {
      const [answer] = await Promise.all([askWorker(text), new Promise(r => setTimeout(r, 500))]);
      reply = answer ? esc(answer) : fallback();
    }

    typing.remove();
    say('agent', reply);
    busy = false;
    sendBtn.disabled = false;
    if (!touch) input.focus({ preventScroll: true });
  }

  // ── Wiring ───────────────────────────────────────────────────────────────
  form.addEventListener('submit', handleSubmit);
  tab.addEventListener('click', () => setOpen(true, true));
  panel.querySelector('.lwc-close').addEventListener('click', () => setOpen(false, true));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && root.classList.contains('lwc-open') && panel.contains(document.activeElement)) setOpen(false, true);
  });

  document.querySelectorAll('.lw-ask-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      openFor(btn.dataset.slug, btn.dataset.title);
    });
  });

  // Match the chat header to the nav bar's height so their bottom lines are one continuous line.
  const nav = document.querySelector('.navbar');
  function matchNavHeight() {
    if (nav) root.style.setProperty('--lwc-header-h', nav.getBoundingClientRect().height + 'px');
  }
  matchNavHeight();
  window.addEventListener('resize', matchNavHeight);

  // ── First paint ──────────────────────────────────────────────────────────
  let log = store.get();
  if (!log.length) {
    store.push({ role: 'agent', html: "Hi, I'm Lauren's portfolio agent. I'm here while you look around." });
    log = store.get();
  }
  log.forEach(renderEntry);

  setOpen(sessionStorage.getItem(OPEN_KEY) !== '0', false);
  // Enable slide animations only after the initial state is painted, so pages don't animate on load.
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('lwc-ready')));
})();
