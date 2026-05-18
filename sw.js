const CACHE = 'rm-explorer-v1';

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll([
        '/rick-and-morty-explorer/',
        '/rick-and-morty-explorer/index.html',
      ])
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Deja pasar las peticiones a la API siempre por red
  if (url.hostname === 'rickandmortyapi.com') return;

  // Para el resto: devuelve caché si existe, si no va a red y guarda la respuesta
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((response) => {
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE).then((cache) => cache.put(e.request, clone));
        return response;
      });
    })
  );
});