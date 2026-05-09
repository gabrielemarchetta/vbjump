const CACHE = 'vbjump-v5';
const CORE = [
  'https://gabrielemarchetta.github.io/vbjump/',
  'https://gabrielemarchetta.github.io/vbjump/index.html',
  'https://gabrielemarchetta.github.io/vbjump/css/style.css',
  'https://gabrielemarchetta.github.io/vbjump/js/db.js',
  'https://gabrielemarchetta.github.io/vbjump/js/ui.js',
  'https://gabrielemarchetta.github.io/vbjump/js/nav.js',
  'https://gabrielemarchetta.github.io/vbjump/js/athletes.js',
  'https://gabrielemarchetta.github.io/vbjump/js/analysis.js',
  'https://gabrielemarchetta.github.io/vbjump/js/compare.js',
  'https://gabrielemarchetta.github.io/vbjump/js/ranking.js',
  'https://gabrielemarchetta.github.io/vbjump/js/training.js',
  'https://gabrielemarchetta.github.io/vbjump/js/pdf.js',
  'https://gabrielemarchetta.github.io/vbjump/js/timer.js',
  'https://gabrielemarchetta.github.io/vbjump/js/settings.js',
  'https://gabrielemarchetta.github.io/vbjump/manifest.json',
  'https://gabrielemarchetta.github.io/vbjump/assets/icon-192.png',
  'https://gabrielemarchetta.github.io/vbjump/assets/icon-512.png',
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
  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request).then(res => {
        if (res && res.status === 200) {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        }
        return res;
      }).catch(() => cached);
      return e.request.url.includes('.html') || e.request.url.endsWith('/')
        ? network : cached || network;
    })
  );
});
