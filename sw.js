const CACHE_NAME = 'kopfrechen-v2';
const TAILWIND_CDN_URL = 'https://cdn.tailwindcss.com';
const ASSETS = [
  './',
  './index.html',
  './ui.js',
  './engine.js',
  './storage.js',
  './manifest.json',
  './icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(ASSETS);
      try {
        const res = await fetch(new Request(TAILWIND_CDN_URL, { mode: 'no-cors' }));
        if (res && (res.ok || res.type === 'opaque')) {
          await cache.put(TAILWIND_CDN_URL, res);
        }
      } catch {
        // Offline-Installation darf wegen externem CDN nicht abbrechen
      }
    })()
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);

  if (requestUrl.origin === TAILWIND_CDN_URL) {
    const responsePromise = caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(event.request);
      const networkUpdate = fetch(event.request)
        .then(async (networkResponse) => {
          if (networkResponse && (networkResponse.ok || networkResponse.type === 'opaque')) {
            await cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(() => undefined);

      if (cachedResponse) {
        return { response: cachedResponse, background: networkUpdate };
      }

      const freshResponse = await networkUpdate;
      return { response: freshResponse || Response.error(), background: Promise.resolve() };
    });

    event.waitUntil(responsePromise.then((result) => result.background).catch(() => {}));
    event.respondWith(responsePromise.then((result) => result.response));
    return;
  }

  if (requestUrl.origin !== self.location.origin) return;

  let cachePutPromise = Promise.resolve();
  const networkPromise = fetch(event.request)
    .then((networkResponse) => {
      if (networkResponse && networkResponse.ok && networkResponse.type === 'basic') {
        const responseClone = networkResponse.clone();
        cachePutPromise = caches.open(CACHE_NAME)
          .then((cache) => cache.put(event.request, responseClone))
          .catch(() => {});
      }
      return networkResponse;
    })
    .catch(() => caches.match(event.request));

  event.respondWith(networkPromise);
  event.waitUntil(networkPromise.then(() => cachePutPromise).catch(() => {}));
});
