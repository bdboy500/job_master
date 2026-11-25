// Job Master Performance-First & Offline-Resilient PWA Service Worker
const SHELL_CACHE = 'jobmaster-shell-v13';
const STATIC_CACHE = 'jobmaster-static-v13';
const DATA_CACHE = 'jobmaster-data-v13';
const VALID_CACHES = [SHELL_CACHE, STATIC_CACHE, DATA_CACHE];
const IS_DEV_PREVIEW_HOST =
  self.location.hostname.includes('ais-dev') ||
  self.location.hostname === 'localhost' ||
  self.location.hostname === '127.0.0.1';

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
  '/api/job-circulars',
  '/api/exam-papers',
];

// Install: Pre-cache core icons/manifest (never trap stale HTML) and activate immediately
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
    }).then(() => self.clients.claim())
  );
});

// Allow client recovery handlers to wipe all SW caches cleanly
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_ALL_CACHES') {
    event.waitUntil(
      caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key)))).catch(() => {})
    );
  } else if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Helper: Fetch with timeout so slow networks seamlessly fall back to cached shell
function fetchWithTimeout(request, timeoutMs, initOverrides) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('SW_TIMEOUT')), timeoutMs);
    fetch(request, initOverrides)
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

  const url = new URL(event.request.url);

  // Bypass non-HTTP, auth callbacks, admin, smart open redirect, assetlinks, dev preview bundles, and third-party services
  if (
    !url.protocol.startsWith('http') ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/auth/') ||
    url.pathname.startsWith('/admin') ||
    url.pathname.startsWith('/open') ||
    url.pathname.startsWith('/.well-known/') ||
    url.pathname.includes('_next/webpack-hmr') ||
    (IS_DEV_PREVIEW_HOST && url.pathname.startsWith('/_next/'))
  ) {
    return;
  }

  // Always bypass SW cache when client explicitly requests no-store
  if (event.request.cache === 'no-store') {
    return;
  }

  // 1. Public Read-Only Metadata APIs: Network-First (never serve/store 'default' fallback in DATA_CACHE)
  if (PUBLIC_DATA_ROUTES.some((route) => url.pathname === route)) {
    const ref = event.request.referrer || '';
    if (ref.includes('/admin')) return;

    event.respondWith(
      caches.open(DATA_CACHE).then(async (cache) => {
        try {
          const networkResponse = await fetchWithTimeout(event.request, 6000, { cache: 'no-store' });
          if (networkResponse && networkResponse.status === 200) {
            const cloneForInspect = networkResponse.clone();
            const cloneForCache = networkResponse.clone();
            cloneForInspect
              .json()
              .then((payload) => {
                if (payload && payload.source !== 'default' && payload.source !== 'empty') {
                  cache.put(event.request, cloneForCache).catch(() => {});
                }
              })
              .catch(() => {});
          }
          return networkResponse;
        } catch {
          const cachedResponse = await cache.match(event.request);
          if (cachedResponse) return cachedResponse;
          return new Response(JSON.stringify({ error: 'network_unavailable' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      })
    );
    return;
  }

  // Bypass all other /api/ endpoints (user auth, live quiz, leaderboard, etc.)
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // 2. HTML Navigations: Network-First (4.5s timeout for slow Android WebView mobile networks) -> Cached Shell fallback
  //    Wait 4.5s instead of 1.5s so slow 2G/3G doesn't prematurely receive old pre-deploy HTML that mismatches JS chunks.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.open(SHELL_CACHE).then(async (cache) => {
        const networkPromise = fetch(event.request, { cache: 'no-cache' })
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
              cache.put(event.request, networkResponse.clone()).catch(() => {});
              cache.put('/', networkResponse.clone()).catch(() => {});
            }
            return networkResponse;
          });

        try {
          const fresh = await fetchWithTimeout(event.request, 4500, { cache: 'no-cache' });
          if (fresh && fresh.status === 200 && fresh.type === 'basic') {
            cache.put(event.request, fresh.clone()).catch(() => {});
            cache.put('/', fresh.clone()).catch(() => {});
          }
          return fresh;
        } catch {
          // Keep background update alive in case it completes right after timeout
          networkPromise.catch(() => {});
          const cached = (await cache.match(event.request)) || (await cache.match('/'));
          if (cached) return cached;
          try {
            return await networkPromise;
          } catch {
            return new Response('Offline - অনুগ্রহ করে ইন্টারনেট সংযোগ পরীক্ষা করুন', {
              status: 503,
              headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            });
          }
        }
      })
    );
    return;
  }

  // 3. Next.js Static Bundles, Fonts, CSS, JS, and Images
  const isNextStatic = url.pathname.startsWith('/_next/static/');
  const isStaticAsset = /\.(js|css|woff2|woff|ttf|png|jpg|jpeg|webp|svg|ico|json)$/i.test(url.pathname);
  const shouldBgRevalidate = url.pathname.endsWith('.css') || url.pathname.endsWith('.json') || url.pathname.includes('root-of-the-server');

  if (isNextStatic || isStaticAsset) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            if (shouldBgRevalidate) {
              fetch(event.request, { cache: 'reload' })
                .then((res) => {
                  if (res && res.status === 200) {
                    cache.put(event.request, res.clone()).catch(() => {});
                  }
                })
                .catch(() => {});
            }
            return cachedResponse;
          }

          return fetch(event.request, shouldBgRevalidate ? { cache: 'reload' } : undefined).then((networkResponse) => {
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
