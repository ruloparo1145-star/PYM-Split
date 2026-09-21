// sw.js - PYM Split
const CACHE_NAME = 'pym-split-v1';
const APP_ASSETS = [
  './',
  './index.html',
  './app.html', // Lo dejamos preparado para el siguiente paso
  './css/style.css',
  './js/config.js',
  './js/supabase.js',
  './js/auth.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// InstalaciÃ³n
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_ASSETS))
      .catch(err => console.log('Error cacheando:', err))
  );
  self.skipWaiting();
});

// ActivaciÃ³n
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

// Fetch
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        if (response.ok && new URL(event.request.url).origin === self.location.origin) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      }).catch(() => {
        return caches.match('./index.html');
      });
    })
  );
});
