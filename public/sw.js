const CACHE_NAME = 'job-master-pwa-v2';
const STATIC_ASSETS = [
  '/',
  '/icon-192.png',
  '/icon-512.png',
  '/icon.svg',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // 1. Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // 2. Ignore non-http/https (e.g. chrome-extension://, ws://, wss://)
  if (!url.protocol.startsWith('http')) return;

  // 3. Bypass API routes, Supabase API calls, and Next.js hot-reload scripts to prevent network overhead
  if (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('google') ||
    url.pathname.includes('_next/webpack-hmr')
  ) {
    return;
  }

  // 4. Stale-While-Revalidate strategy for static assets
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(event.request);

      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            cache.put(event.request, networkResponse.clone()).catch(() => {});
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
