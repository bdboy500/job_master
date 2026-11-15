// Job Master Performance-First & Offline-Resilient PWA Service Worker
const SHELL_CACHE = 'jobmaster-shell-v8';
const STATIC_CACHE = 'jobmaster-static-v8';
const DATA_CACHE = 'jobmaster-data-v8';
const VALID_CACHES = [SHELL_CACHE, STATIC_CACHE, DATA_CACHE];

const ESSENTIAL_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.ico',
];

const PUBLIC_DATA_ROUTES = [
  '/api/courses',
  '/api/prep-subjects',
  '/api/pro-section',
  '/api/app-settings',
];

// Install: Pre-cache core app shell & icons and activate immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(ESSENTIAL_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

// Activate: Clean up old cache versions and take control immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (!VALID_CACHES.includes(key)) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Helper: Fetch with timeout so slow networks seamlessly fall back to cached shell
function fetchWithTimeout(request, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('SW_TIMEOUT')), timeoutMs);
    fetch(request)
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// Fetch strategy
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.cache === 'no-store') return;

  const url = new URL(event.request.url);

  // Bypass non-HTTP, auth callbacks, admin, user-private APIs, and third-party services
  if (
    !url.protocol.startsWith('http') ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/auth/') ||
    url.pathname.startsWith('/admin') ||
    url.pathname.includes('_next/webpack-hmr')
  ) {
    return;
  }

  // 1. Public Read-Only Metadata APIs: Stale-While-Revalidate (skip if initiated from /admin)
  if (PUBLIC_DATA_ROUTES.some((route) => url.pathname === route)) {
    const ref = event.request.referrer || '';
    if (ref.includes('/admin')) return;

    event.respondWith(
      caches.open(DATA_CACHE).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const networkPromise = fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                cache.put(event.request, networkResponse.clone()).catch(() => {});
              }
              return networkResponse;
            })
            .catch(() => cachedResponse);

          return cachedResponse || networkPromise;
        });
      })
    );
    return;
  }

  // Bypass all other /api/ endpoints (user auth, live quiz, leaderboard, etc.)
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // 2. HTML Navigations: Fast 1500ms Network Race -> Instant Cached Shell Fallback + Background Refresh
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.open(SHELL_CACHE).then(async (cache) => {
        const networkPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
              cache.put(event.request, networkResponse.clone()).catch(() => {});
            }
            return networkResponse;
          });

        try {
          // Wait at most 1.5s for network; on slow 2G/3G, serve cached HTML immediately while network updates cache in background
          const cached = (await cache.match(event.request)) || (await cache.match('/'));
          if (cached) {
            return await fetchWithTimeout(event.request, 1500)
              .then((fresh) => {
                if (fresh && fresh.status === 200 && fresh.type === 'basic') {
                  cache.put(event.request, fresh.clone()).catch(() => {});
                }
                return fresh;
              })
              .catch(() => {
                // Keep background update alive even after serving cached shell
                networkPromise.catch(() => {});
                return cached;
              });
          }

          return await networkPromise;
        } catch {
          const fallback = (await cache.match(event.request)) || (await cache.match('/'));
          if (fallback) return fallback;
          return new Response('Offline - অনুগ্রহ করে ইন্টারনেট সংযোগ পরীক্ষা করুন', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          });
        }
      })
    );
    return;
  }

  // 3. Immutable Next.js Static Bundles, Fonts, CSS, JS, and Images: Cache-First (0ms on repeat loads)
  const isNextStatic = url.pathname.startsWith('/_next/static/');
  const isStaticAsset = /\.(js|css|woff2|woff|ttf|png|jpg|jpeg|webp|svg|ico|json)$/i.test(url.pathname);

  if (isNextStatic || isStaticAsset) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            // Revalidate non-hashed static assets (like manifest.json) quietly in background
            if (!isNextStatic && url.pathname.endsWith('.json')) {
              fetch(event.request)
                .then((res) => {
                  if (res && res.status === 200) {
                    cache.put(event.request, res.clone()).catch(() => {});
                  }
                })
                .catch(() => {});
            }
            return cachedResponse;
          }

          return fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone()).catch(() => {});
            }
            return networkResponse;
          });
        });
      })
    );
  }
});
