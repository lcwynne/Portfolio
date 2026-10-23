// Notes panel on every page after the gate. Pages leave notes from Lauren;
// the panel keeps every note the visitor has received this session
// (sessionStorage 'lw_chat') and remembers whether it's open ('lw_chat_open')
// as they move between pages. It's read-only: there's no typing box until the
// AI is connected.

(function () {
  const LOG_KEY   = 'lw_chat';
  const OPEN_KEY  = 'lw_chat_open';
  const NOTES_KEY = 'lw_notes_seen';
  const PORTRAIT  = '/assets/65e88a8532893e5bd3597de6_laurenwynne-p-500.png';
  const NOTE_ICON = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M4 2.5h7.5L14.5 5.5V15a.5.5 0 0 1-.5.5H4a.5.5 0 0 1-.5-.5V3a.5.5 0 0 1 .5-.5z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M11 2.5V6h3.5M6 9h6M6 12h4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  // Only notes are kept; anything else from older versions of the chat is dropped
  const store = {
    get() { try { return (JSON.parse(sessionStorage.getItem(LOG_KEY)) || []).filter(e => e.note); } catch { return []; } },
    push(entry) { const log = store.get(); log.push(entry); sessionStorage.setItem(LOG_KEY, JSON.stringify(log)); }
  };

  // ── DOM ──────────────────────────────────────────────────────────────────
  const root = document.documentElement;

  // A page can leave a note: <template id="lw-chat-note" data-id="...">…</template>.
  // Until it's read, the tab shows Lauren's photo with an unread dot.
  const noteTpl = document.getElementById('lw-chat-note');
  const seenNotes = () => { try { return JSON.parse(sessionStorage.getItem(NOTES_KEY)) || []; } catch { return []; } };
  let pendingNote = noteTpl && !seenNotes().includes(noteTpl.dataset.id) ? noteTpl : null;

  const tab = document.createElement('button');
  tab.type = 'button';
  tab.className = 'lwc-tab';
  function renderTab() {
    tab.classList.toggle('has-note', !!pendingNote);
    if (pendingNote) {
      tab.setAttribute('aria-label', 'Open notes: you have a new note from Lauren');
      tab.innerHTML = `<span class="lwc-tab-avatar"><img src="${PORTRAIT}" alt=""/><i class="lwc-dot"></i></span><span>A note from Lauren</span>`;
    } else {
      tab.setAttribute('aria-label', 'Open notes from Lauren');
      tab.innerHTML = `${NOTE_ICON}<span>Notes</span>`;
    }
  }
  renderTab();

  const panel = document.createElement('aside');
  panel.className = 'lwc-panel';
  panel.setAttribute('aria-label', 'Notes from Lauren');
  panel.innerHTML = `
    <div class="lwc-header">
      <div class="lwc-avatar"><img src="${PORTRAIT}" alt=""/></div>
      <div class="lwc-title"><strong>Notes from Lauren</strong><span>laurenwynne.com</span></div>
      <button type="button" class="lwc-close" aria-label="Close notes">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      </button>
    </div>
    <div class="lwc-messages" role="log" aria-live="polite"></div>`;

  document.body.append(tab, panel);

  const messages = panel.querySelector('.lwc-messages');

  function renderEntry(e) {
    const row = document.createElement('div');
    row.className = 'lwc-msg agent lwc-note';
    row.innerHTML = `<div class="lwc-avatar"><img src="${PORTRAIT}" alt=""/></div><div class="lwc-bubble"><div class="lwc-note-label">A note from Lauren</div>${e.html}</div>`;
    messages.appendChild(row);
  }

  function scrollToEnd() { messages.scrollTop = messages.scrollHeight; }

  // ── Open / close ─────────────────────────────────────────────────────────
  // A page's note arrives the first time the panel is open on that page.
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
      if (focus) panel.querySelector('.lwc-close').focus({ preventScroll: true });
    } else if (focus) {
      tab.focus({ preventScroll: true });
    }
  }

  // ── Wiring ───────────────────────────────────────────────────────────────
  tab.addEventListener('click', () => setOpen(true, true));
  panel.querySelector('.lwc-close').addEventListener('click', () => setOpen(false, true));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && root.classList.contains('lwc-open') && panel.contains(document.activeElement)) setOpen(false, true);
  });

  // Match the panel header to the nav bar's height so their bottom lines are one continuous line.
  const nav = document.querySelector('.navbar');
  function matchNavHeight() {
    if (nav) root.style.setProperty('--lwc-header-h', nav.getBoundingClientRect().height + 'px');
  }
  matchNavHeight();
  window.addEventListener('resize', matchNavHeight);

  // ── First paint ──────────────────────────────────────────────────────────
  store.get().forEach(renderEntry);

  // Closed unless the visitor left it open on the last page
  setOpen(sessionStorage.getItem(OPEN_KEY) === '1', false);
  // Enable slide animations only after the initial state is painted, so pages don't animate on load.
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('lwc-ready')));
})();
