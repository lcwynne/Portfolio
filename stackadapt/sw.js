// Keeps the StackAdapt deck working with no connection: everything it needs is
// cached on first load, and served cache-first afterwards. Bump VERSION when
// any of these files change.
const VERSION = 'stackadapt-v39';
const FILES = [
  '/stackadapt/',
  '/assets/css/deck.css?v=32',
  '/assets/js/deck.js?v=15',
  '/assets/659566c3e235c696a2875be2_GeneralSans-Regular.otf',
  '/assets/659566c3e235c696a2875be0_GeneralSans-Medium.otf',
  '/assets/659566c3e235c696a2875be3_GeneralSans-Semibold.otf',
  '/assets/65e89fa0190699d5ae4884bf_lw_logo_1.png',
  '/assets/lauren-family.jpg',
  '/assets/composer-klaviyo-brain.png',
  '/assets/composer-chat-panel.png',
  '/assets/composer-versioning.png',
  '/assets/composer-scheduled-task.png',
  '/assets/composer-sms.png',
  '/assets/composer-changelog.mp4',
  '/assets/composer-changelog-poster.jpg'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('stackadapt-') && k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// The page itself goes to the network first so edits show up; everything else
// comes from the cache. Either way, the cache is the fallback when offline.
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  const isPage = e.request.mode === 'navigate';
  e.respondWith(isPage
    ? fetch(e.request).then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put('/stackadapt/', copy)); return r; })
        .catch(() => caches.match('/stackadapt/'))
    : caches.match(e.request).then(hit => hit || fetch(e.request)));
});
