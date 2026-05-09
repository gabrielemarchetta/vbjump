const CACHE = 'vbjump-v4';
const CORE = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/db.js',
  '/js/ui.js',
  '/js/nav.js',
  '/js/athletes.js',
  '/js/analysis.js',
  '/js/compare.js',
  '/js/ranking.js',
  '/js/training.js',
  '/js/pdf.js',
  '/manifest.json',
  '/assets/icon-192.png',
  '/assets/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(CORE)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request).then(res => {
        if (res && res.status === 200) {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        }
        return res;
      }).catch(() => cached);
      return e.request.url.includes('.html') || url.pathname === '/'
        ? network : cached || network;
    })
  );
});
