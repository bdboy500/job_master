const CACHE_NAME = 'job-master-pwa-v5';
const DYNAMIC_API_CACHE = 'job-master-api-v5';
const PAGE_CACHE = 'job-master-pages-v5';
const AVATAR_IMAGE_CACHE = 'jobmaster-avatars-v4';

const STATIC_ASSETS = [
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon.svg'
];

// Install Event: Immediate activation via skipWaiting
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

// Activate Event: Clean up legacy caches & claim control immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (
            cache !== CACHE_NAME &&
            cache !== DYNAMIC_API_CACHE &&
            cache !== PAGE_CACHE &&
            cache !== AVATAR_IMAGE_CACHE
          ) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  // 1. Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // 2. Ignore non-http/https (e.g., chrome-extension://, ws://, wss://)
  if (!url.protocol.startsWith('http')) return;

  // 3. Bypass Next.js internal dev routes & HMR
  if (url.pathname.includes('_next/webpack-hmr') || url.pathname.includes('_next/image')) return;

  // 4. Avatar & Profile Images Caching
  const isImageRequest =
    event.request.destination === 'image' ||
    url.pathname.match(/\.(png|jpg|jpeg|webp|svg|gif|ico)$/i) ||
    (url.hostname.includes('supabase.co') && url.pathname.includes('/storage/v1/object/public/'));

  if (isImageRequest) {
    event.respondWith(
      caches.open(AVATAR_IMAGE_CACHE).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
          fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                cache.put(event.request, networkResponse.clone()).catch(() => {});
              }
            })
            .catch(() => {});
          return cachedResponse;
        }

        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone()).catch(() => {});
          }
          return networkResponse;
        } catch (err) {
          return new Response('', { status: 404 });
        }
      })
    );
    return;
  }

  // 5. HTML Page Navigations: Network-First Strategy
  if (
    event.request.mode === 'navigate' ||
    (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html'))
  ) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(PAGE_CACHE).then((cache) => {
              cache.put(event.request, responseClone).catch(() => {});
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) return cachedResponse;
          const rootCached = await caches.match('/');
          if (rootCached) return rootCached;
          return Response.error();
        })
    );
    return;
  }

  // 6. Dynamic API & Supabase REST Endpoint Requests: Network-First Strategy
  if (url.pathname.startsWith('/api/') || (url.hostname.includes('supabase.co') && url.pathname.startsWith('/rest/'))) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(DYNAMIC_API_CACHE).then((cache) => {
              cache.put(event.request, responseClone).catch(() => {});
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) return cachedResponse;
          return new Response(JSON.stringify({ error: "Offline mode", offline: true }), {
            status: 503,
            headers: { "Content-Type": "application/json" }
          });
        })
    );
    return;
  }

  // 7. For Next.js chunks, static JS/CSS, let standard network handle it, with fallback
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cachedResponse = await caches.match(event.request);
        return cachedResponse || Response.error();
      })
    );
    return;
  }
});
