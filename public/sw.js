// Job Master Minimal PWA Service Worker
// Ultra-lightweight for Browser Install Prompt & Fresh Performance
const CACHE_NAME = 'jobmaster-pwa-v6';

const ESSENTIAL_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.ico'
];

// Install: Cache only essentials and skip waiting immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ESSENTIAL_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

// Activate: Immediately claim clients and purge old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Lightweight Network-First strategy
// Guarantees Kotlin WebView always gets direct live server responses
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Bypass non-HTTP/HTTPS, external analytics, ads, API and Supabase endpoints
  if (
    !url.protocol.startsWith('http') ||
    url.pathname.startsWith('/api/') ||
    url.pathname.includes('_next/webpack-hmr') ||
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('googletagmanager.com') ||
    url.hostname.includes('google-analytics.com') ||
    url.hostname.includes('pagead2.googlesyndication.com')
  ) {
    return;
  }

  // Network-first for HTML navigations (fallback to cached root only when offline)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        const root = await caches.match('/');
        if (root) return root;
        return new Response('Offline', { status: 503, statusText: 'Offline' });
      })
    );
    return;
  }

  // Static assets (images, icons, manifest): Fast cache lookup with background refresh
  if (url.pathname.match(/\.(png|jpg|jpeg|webp|svg|ico|json)$/i)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => {});
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
  }
});
