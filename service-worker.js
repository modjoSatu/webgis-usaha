const CACHE_NAME = 'webgis-v1';
const RUNTIME_CACHE = 'webgis-runtime';
const STATIC_ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/utils.js',
  './js/layers.js',
  './js/main.js',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://unpkg.com/papaparse@5.4.1/papaparse.min.js'
];


self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html').then(resp => resp || fetch(event.request))
    );
    return;
  }
  if (url.search.includes('drive.bps.go.id') || url.pathname.endsWith('.geojson') || url.pathname.endsWith('.csv')) {
    event.respondWith(
      fetch(event.request).then(r => {
        const copy = r.clone();
        caches.open(RUNTIME_CACHE).then(cache => cache.put(event.request, copy));
        return r;
      }).catch(() => caches.match(event.request))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then(resp => resp || fetch(event.request))
  );
});
