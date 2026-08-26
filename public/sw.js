const CACHE_NAME = 'vicmic-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.php',
  '/assets/css/storefront.css',
  '/assets/js/api-client.js',
  '/assets/js/router.js',
  '/assets/js/components/header.js',
  '/assets/js/components/product-card.js',
  '/assets/js/components/cart.js',
  '/assets/js/pages/home.js',
  '/assets/js/pages/catalog.js',
  '/assets/js/pages/product-detail.js',
  '/assets/js/pages/checkout.js',
  '/assets/js/pages/order-tracking.js',
  '/assets/js/pages/warranty-check.js',
  '/assets/js/app.js'
];

// Install event
self.addEventListener('install', (evt) => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching assets');
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

// Fetch event (Network first, fallback to cache for API; Cache first for assets)
self.addEventListener('fetch', (evt) => {
  // Ignore API requests for cache-first strategy
  if (evt.request.url.includes('/api/')) {
    evt.respondWith(
      fetch(evt.request).catch(() => {
        return new Response(JSON.stringify({
          success: false, 
          message: 'Anda sedang offline. Tidak dapat memuat data.'
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // Cache first for static assets
  evt.respondWith(
    caches.match(evt.request).then((cacheRes) => {
      return cacheRes || fetch(evt.request).then(fetchRes => {
        return caches.open(CACHE_NAME).then(cache => {
          // Cache only GET requests
          if (evt.request.method === 'GET' && !evt.request.url.includes('browser-sync')) {
             cache.put(evt.request.url, fetchRes.clone());
          }
          return fetchRes;
        });
      });
    }).catch(() => {
      // If HTML page request fails and no cache, fallback to index
      if (evt.request.headers.get('accept').includes('text/html')) {
        return caches.match('/');
      }
    })
  );
});
