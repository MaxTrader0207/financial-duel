// sw.js — generated at build time by tools/pwa-plugin.js; do not edit dist/sw.js by hand.
// Offline play for the installed web app: every file of this build is cached on install (cache-first afterwards);
// a new build has a new VERSION, installs next to the old one and takes over when the player taps 「重新載入」
// (or after all game tabs are closed). Google Fonts (body text) are cached as they load.
const VERSION = '__VERSION__';
const CACHE = 'fd-' + VERSION, FONTS = 'fd-fonts';
const FILES = __FILES__;
const scopeUrl = p => new URL(p, self.registration.scope).href;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(scopeUrl(f), { cache: 'reload' })))));
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) {
      if (k.startsWith('fd-') && k !== CACHE && k !== FONTS) await caches.delete(k);
      if (k.startsWith('financial-duel-')) await caches.delete(k);        // the first single-file release's cache
    }
    await self.clients.claim();
  })());
});
self.addEventListener('message', e => { if (e.data === 'skipWaiting') self.skipWaiting(); });

self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    if (req.mode === 'navigate') {                       // any page of the app → the cached index.html
      e.respondWith(caches.open(CACHE).then(c => c.match(scopeUrl('index.html'))).then(r => r || fetch(req)));
      return;
    }
    e.respondWith(caches.open(CACHE).then(async c => {
      const hit = await c.match(req, { ignoreSearch: true }); if (hit) return hit;
      const res = await fetch(req); if (res.ok && url.href.startsWith(self.registration.scope)) c.put(req, res.clone()); return res;
    }));
    return;
  }
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {   // stale-while-revalidate
    e.respondWith(caches.open(FONTS).then(async c => {
      const hit = await c.match(req);
      const net = fetch(req).then(res => { if (res.ok || res.type === 'opaque') c.put(req, res.clone()); return res; }).catch(() => hit);
      return hit || net;
    }));
  }
});
