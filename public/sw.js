/* СкладПро service worker — app-shell offline cache.
 * Strategy:
 *  - Only same-origin GET requests are handled. Cross-origin (Supabase proxy,
 *    Cloud Run, Telegram, etc.) and non-GET always go straight to the network.
 *  - Navigations: network-first, fall back to cached index.html when offline,
 *    so the app shell loads without internet after the first visit.
 *  - Static assets (hashed JS/CSS/fonts/images): cache-first, then network,
 *    caching successful responses for next time.
 *  - API calls (/api/...) are never cached.
 */
const CACHE = 'scladpro-shell-v5';
const APP_SHELL = ['/', '/index.html', '/manifest.webmanifest', '/site-icon.jpg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL).catch(() => undefined)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch { return; }
  if (url.origin !== self.location.origin) return;        // cross-origin: passthrough
  if (url.pathname.startsWith('/api/')) return;            // never cache API

  // Navigations -> network-first with index.html fallback.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('/index.html').then((r) => r || caches.match('/')))
    );
    return;
  }

  // Static assets -> cache-first, then network (and cache the result).
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res && res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => undefined);
        }
        return res;
      });
    })
  );
});
