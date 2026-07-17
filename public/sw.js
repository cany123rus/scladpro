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
const CACHE = 'scladpro-shell-v215';
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

  // Navigations -> network-first, и обновляем кэш свежим index.html (для оффлайн-фолбэка,
  // чтобы он не указывал на удалённые после деплоя JS-чанки -> белый экран).
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put('/index.html', copy)).catch(() => undefined);
          }
          return res;
        })
        .catch(() => caches.match('/index.html').then((r) => r || caches.match('/')))
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

// ===== Web Push =====
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { body: event.data && event.data.text ? event.data.text() : '' }; }
  const title = data.title || 'СкладПро';
  const options = {
    body: data.body || '',
    icon: data.icon || '/site-icon.jpg',
    badge: '/site-icon.jpg',
    tag: data.tag || undefined,
    data: { url: data.url || '/' },
    requireInteraction: !!data.requireInteraction,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) {
          client.navigate(url).catch(() => undefined);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
