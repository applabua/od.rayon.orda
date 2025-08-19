// Сервис-воркер для GitHub Pages (офлайн ядро + runtime cache)
const CACHE = 'eko-odrra-v5'; // обновили версию кэша
const CORE = ['./','./index.html','./manifest.webmanifest'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k!==CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  // Network-first для HTML
  if (req.destination === 'document' || req.headers.get('accept')?.includes('text/html')) {
    e.respondWith(
      fetch(req).then(res => { caches.open(CACHE).then(c => c.put(req, res.clone())); return res; })
      .catch(() => caches.match(req).then(r => r || caches.match('./')))
    );
    return;
  }
  // Cache-first для статики (вкл. CDN)
  e.respondWith(
    caches.match(req).then(r => r || fetch(req).then(res => { caches.open(CACHE).then(c => c.put(req, res.clone())); return res; }).catch(() => r))
  );
});
