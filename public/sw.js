const CACHE_NAME = 'xyrobrowse-v1';
const STATIC_CACHE = 'xyrobrowse-static-v1';
const DYNAMIC_CACHE = 'xyrobrowse-dynamic-v1';
const OFFLINE_URL = '/offline.html';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.ico',
];

const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only',
};

const ROUTE_STRATEGIES = new Map([
  [/^\/api\/proxy\//, CACHE_STRATEGIES.NETWORK_FIRST],
  [/^\/api\/search/, CACHE_STRATEGIES.NETWORK_FIRST],
  [/^\/api\/reader/, CACHE_STRATEGIES.NETWORK_FIRST],
  [/^\/api\/download/, CACHE_STRATEGIES.NETWORK_ONLY],
  [/\.(js|css|woff2?|png|jpg|jpeg|gif|svg|ico)$/, CACHE_STRATEGIES.CACHE_FIRST],
  [/^\/$/, CACHE_STRATEGIES.STALE_WHILE_REVALIDATE],
  [/^\/index\.html$/, CACHE_STRATEGIES.STALE_WHILE_REVALIDATE],
]);

async function installServiceWorker() {
  const cache = await caches.open(STATIC_CACHE);
  await cache.addAll(STATIC_ASSETS);
  console.log('[SW] Static assets cached');
}

async function activateServiceWorker() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames
      .filter(name => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
      .map(name => caches.delete(name))
  );
  console.log('[SW] Old caches cleaned up');
  await clients.claim();
}

async function fetchWithStrategy(request, strategy) {
  const cache = await caches.open(DYNAMIC_CACHE);
  
  switch (strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST: {
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) cache.put(request, response.clone());
      return response;
    }
    
    case CACHE_STRATEGIES.NETWORK_FIRST: {
      try {
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      } catch {
        const cached = await cache.match(request);
        if (cached) return cached;
        return new Response('Offline', { status: 503 });
      }
    }
    
    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE: {
      const cached = await cache.match(request);
      const fetchPromise = fetch(request).then(response => {
        if (response.ok) cache.put(request, response.clone());
        return response;
      }).catch(() => cached);
      return cached || fetchPromise;
    }
    
    case CACHE_STRATEGIES.NETWORK_ONLY: {
      return fetch(request);
    }
    
    case CACHE_STRATEGIES.CACHE_ONLY: {
      const cached = await cache.match(request);
      return cached || new Response('Not cached', { status: 503 });
    }
  }
}

function getStrategyForRequest(request) {
  const url = new URL(request.url);
  for (const [pattern, strategy] of ROUTE_STRATEGIES) {
    if (pattern.test(url.pathname)) {
      return strategy;
    }
  }
  return CACHE_STRATEGIES.NETWORK_FIRST;
}

self.addEventListener('install', (event) => {
  event.waitUntil(installServiceWorker());
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(activateServiceWorker());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  if (request.method !== 'GET') return;
  
  const url = new URL(request.url);
  if (url.origin !== location.origin) return;
  
  const strategy = getStrategyForRequest(request);
  event.respondWith(fetchWithStrategy(request, strategy));
});

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
  if (event.data === 'clearCache') {
    caches.keys().then(names => {
      names.forEach(name => caches.delete(name));
    });
  }
});

self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    vibrate: [100, 50, 100],
    data: data.data,
    actions: data.actions || [],
    requireInteraction: true,
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action) {
    console.log('[SW] Notification action:', event.action);
    return;
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow('/');
    })
  );
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-bookmarks') {
    event.waitUntil(syncBookmarks());
  }
  if (event.tag === 'sync-history') {
    event.waitUntil(syncHistory());
  }
  if (event.tag === 'sync-passwords') {
    event.waitUntil(syncPasswords());
  }
});

async function syncBookmarks() {
  console.log('[SW] Syncing bookmarks...');
}

async function syncHistory() {
  console.log('[SW] Syncing history...');
}

async function syncPasswords() {
  console.log('[SW] Syncing passwords...');
}

console.log('[SW] Service Worker loaded');