const CACHE_VERSION = 'v1';
const CACHE_NAMES = {
  STATIC: `static-${CACHE_VERSION}`,
  DYNAMIC: `dynamic-${CACHE_VERSION}`,
  API: `api-${CACHE_VERSION}`,
};

// Critical assets to cache on install
const CRITICAL_ASSETS = [
  '/',
  '/index.html',
  '/assets/index-BTx9JiF2.css',
  '/assets/vendor-react-DY9BSjkW.js',
  '/assets/vendor-ui-zG24g-yP.js',
  '/assets/index.es-DG-MDbwk.js',
];

// Install event - cache critical assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAMES.STATIC).then((cache) => {
      console.log('[ServiceWorker] Caching critical assets');
      return cache.addAll(CRITICAL_ASSETS).catch((err) => {
        console.warn('[ServiceWorker] Failed to cache some assets:', err);
        // Continue even if some assets fail to cache
      });
    })
  );
  
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!Object.values(CACHE_NAMES).includes(cacheName)) {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  self.clients.claim();
});

// Fetch event - implement caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome extensions and external requests
  if (url.protocol === 'chrome-extension:' || url.origin !== self.location.origin) {
    return;
  }

  // API requests - network first, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            // Cache successful API responses
            const cache = caches.open(CACHE_NAMES.API);
            cache.then((c) => c.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => {
          // Return cached API response if network fails
          return caches.match(request).then((cached) => {
            if (cached) {
              console.log('[ServiceWorker] Serving cached API response:', url.pathname);
              return cached;
            }
            // Return offline error response
            return new Response(
              JSON.stringify({ error: 'Offline - cached data unavailable' }),
              { status: 503, headers: { 'Content-Type': 'application/json' } }
            );
          });
        })
    );
    return;
  }

  // Static assets - cache first, fallback to network
  if (url.pathname.match(/\.(js|css|woff2|png|jpg|svg)$/)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          return cached;
        }
        return fetch(request)
          .then((response) => {
            if (response.ok) {
              // Cache successful responses
              const cache = caches.open(CACHE_NAMES.DYNAMIC);
              cache.then((c) => c.put(request, response.clone()));
            }
            return response;
          })
          .catch(() => {
            // Return offline placeholder for images
            if (url.pathname.match(/\.(png|jpg|svg)$/)) {
              return new Response(
                '<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect fill="#f0f0f0" width="100" height="100"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="#999" font-size="12">Offline</text></svg>',
                { headers: { 'Content-Type': 'image/svg+xml' } }
              );
            }
            return new Response('Offline', { status: 503 });
          });
      })
    );
    return;
  }

  // HTML pages - network first, fallback to cache
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            // Cache successful HTML responses
            const cache = caches.open(CACHE_NAMES.DYNAMIC);
            cache.then((c) => c.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => {
          // Return cached HTML or offline page
          return caches.match(request).then((cached) => {
            if (cached) {
              console.log('[ServiceWorker] Serving cached HTML:', url.pathname);
              return cached;
            }
            // Return offline page
            return caches.match('/').then((home) => {
              return home || new Response('Offline', { status: 503 });
            });
          });
        })
    );
    return;
  }

  // Default - network first
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const cache = caches.open(CACHE_NAMES.DYNAMIC);
          cache.then((c) => c.put(request, response.clone()));
        }
        return response;
      })
      .catch(() => {
        return caches.match(request).then((cached) => {
          return cached || new Response('Offline', { status: 503 });
        });
      })
  );
});

// Message event - handle cache clearing from client
self.addEventListener('message', (event) => {
  if (event.data.type === 'CLEAR_CACHE') {
    console.log('[ServiceWorker] Clearing all caches');
    caches.keys().then((cacheNames) => {
      Promise.all(cacheNames.map((name) => caches.delete(name)));
    });
  }
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-watchlist') {
    event.waitUntil(
      // Attempt to sync watchlist changes
      fetch('/api/trpc/watchlist.sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }).catch((err) => {
        console.log('[ServiceWorker] Background sync failed:', err);
        // Will retry automatically
      })
    );
  }
});

// Periodic background sync for data updates
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-prices') {
    event.waitUntil(
      fetch('/api/trpc/market.trend').catch((err) => {
        console.log('[ServiceWorker] Periodic sync failed:', err);
      })
    );
  }
});

console.log('[ServiceWorker] Enhanced Service Worker loaded');
