// ── Tippy Tap Service Worker ──────────────────────────────────
// Caches the app on first load so it works fully offline after that.

const CACHE = ‘tippy-tap-v1’;

// On install: cache the app shell
self.addEventListener(‘install’, event => {
event.waitUntil(
caches.open(CACHE).then(cache => {
// Cache the root and index.html (covers both URL forms)
return cache.addAll([
self.registration.scope,
self.registration.scope + ‘index.html’,
]).catch(() => {
// Fallback: at minimum cache the scope root
return cache.add(self.registration.scope);
});
})
);
// Activate immediately without waiting for old tabs to close
self.skipWaiting();
});

// On activate: delete old caches
self.addEventListener(‘activate’, event => {
event.waitUntil(
caches.keys().then(keys =>
Promise.all(
keys.filter(k => k !== CACHE).map(k => caches.delete(k))
)
)
);
// Take control of all open pages immediately
self.clients.claim();
});

// On fetch: cache-first strategy
// Serve from cache if available; otherwise fetch from network and cache the response
self.addEventListener(‘fetch’, event => {
// Only handle GET requests
if (event.request.method !== ‘GET’) return;

event.respondWith(
caches.match(event.request).then(cached => {
if (cached) return cached;

```
  return fetch(event.request)
    .then(response => {
      // Don't cache non-successful or opaque responses from other origins
      if (!response || response.status !== 200 || response.type === 'opaque') {
        return response;
      }
      // Cache a clone so we can both return and store it
      const toCache = response.clone();
      caches.open(CACHE).then(cache => cache.put(event.request, toCache));
      return response;
    })
    .catch(() => {
      // Offline fallback: return the cached app root
      return caches.match(self.registration.scope);
    });
})
```

);
});
