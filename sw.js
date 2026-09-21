const CACHE_NAME = 'ips-control-v27';
const APP_ASSETS = [
  './',
  './index.html',
  './login.html',
  './calculadora.html',
  './historial.html',
  './supervivencia.html',
  './graficos.html',
  './manual.html',
  './css/style.css',
  './js/config.js',
  './js/supabase.js',
  './js/auth.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_ASSETS)).catch(err => console.log('Error cacheando:', err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

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
      });
    })
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'MOSTRAR_NOTIFICACION') {
    const { titulo, cuerpo, tag } = event.data;
    self.registration.showNotification(titulo, {
      body: cuerpo,
      icon: 'icon-192.png',
      badge: 'icon-192.png',
      tag: tag || 'ips-control',
      requireInteraction: true,
      vibrate: [200, 100, 200]
    });
  }
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes('supervivencia') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('./supervivencia.html');
      }
    })
  );
});
