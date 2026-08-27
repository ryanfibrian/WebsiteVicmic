const CACHE_NAME = 'vicmic-v3';
const ASSETS_TO_CACHE = [
  '/',
  '/index.php',
  '/assets/css/storefront.css',
  '/assets/js/api-client.js',
  '/assets/js/router.js',
  '/assets/js/app.js'
];

// Install event
self.addEventListener('install', (evt) => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching core assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate event (clean old caches)
self.addEventListener('activate', (evt) => {
  evt.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch event (Network first for almost everything to prevent cache issues during dev)
self.addEventListener('fetch', (evt) => {
  // Ignore non-GET requests
  if (evt.request.method !== 'GET') return;

  // Network First strategy
  evt.respondWith(
    fetch(evt.request)
      .then(fetchRes => {
        // Cache the fresh response dynamically (only for non-API and non-admin)
        if (!evt.request.url.includes('/api/') && !evt.request.url.includes('/admin/')) {
            return caches.open(CACHE_NAME).then(cache => {
                cache.put(evt.request.url, fetchRes.clone());
                return fetchRes;
            });
        }
        return fetchRes;
      })
      .catch(() => {
        // Fallback to cache if offline
        return caches.match(evt.request).then(cacheRes => {
          if (cacheRes) return cacheRes;
          
          // API offline fallback
          if (evt.request.url.includes('/api/')) {
            return new Response(JSON.stringify({
              success: false, 
              message: 'Anda sedang offline. Tidak dapat memuat data.'
            }), { headers: { 'Content-Type': 'application/json' } });
          }
          
          // HTML offline fallback
          if (evt.request.headers.get('accept').includes('text/html')) {
            return caches.match('/');
          }
        });
      })
  );
});
