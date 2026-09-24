// sw.js - PYM Split
const CACHE_NAME = 'pym-split-v24';
const APP_ASSETS = [
  './',
  './index.html',
  './app.html',
  './manifest.json',
  './css/style.css',
  './icon-192.png',
  './icon-512.png',
  './js/config.js',
  './js/supabase.js',
  './js/auth.js',
  './js/ui.js',
  './js/groups.js',
  './js/expenses.js',
  './js/debtSolver.js',
  './js/friends.js',
  './js/members.js',
  './js/history.js',
  './js/charts.js',
  './js/dashboard.js',
  './js/profile.js',
  './js/currency.js'
];

// Instalacion
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_ASSETS))
      .catch(err => console.log('Error cacheando:', err))
  );
  self.skipWaiting();
});

// Activacion
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

  // No cachear peticiones a Supabase ni a Frankfurter
  if (event.request.url.includes('supabase.co')) return;
  if (event.request.url.includes('frankfurter.app')) return;

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
