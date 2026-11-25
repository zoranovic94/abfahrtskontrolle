/* Milo Abfahrtskontrolle – Service Worker der App bei GitHub.
   Er hält nur die Programmdateien vor (Start ohne Netz). Kontrollen, Fotos und Zugänge gehen nie in diesen Zwischenspeicher. */
const CACHE = "mak-gh-1.5.0-ea065f40e4", DATEIEN = ["app.css?v=167cf8699c", "app.js?v=679df21dc1", "js/qrcode.js?v=79ec86f828", "manifest.webmanifest", "fonts/barlow-latin-400-normal.woff2", "fonts/barlow-latin-500-normal.woff2", "fonts/barlow-latin-600-normal.woff2", "fonts/barlow-latin-700-normal.woff2", "fonts/barlow-latin-ext-400-normal.woff2", "fonts/barlow-latin-ext-500-normal.woff2", "fonts/barlow-latin-ext-600-normal.woff2", "fonts/barlow-latin-ext-700-normal.woff2", "fonts/barlow-semi-condensed-latin-600-normal.woff2", "fonts/barlow-semi-condensed-latin-700-normal.woff2", "fonts/barlow-semi-condensed-latin-ext-600-normal.woff2", "fonts/barlow-semi-condensed-latin-ext-700-normal.woff2", "fonts/doto-latin-800-normal.woff2", "fonts/doto-latin-ext-800-normal.woff2", "logo/emblem-256.png", "logo/emblem-512.png", "logo/schriftzug-hell.png", "logo/schriftzug.png", "icons/apple-touch-icon.png", "icons/favicon-32.png", "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-192.png", "icons/maskable-512.png"];
const BASIS = self.registration.scope, ICON = BASIS + 'icons/icon-192.png';
const START = new URL(BASIS).pathname;

const vorrat = c => Promise.all([BASIS].concat(DATEIEN).map(u => c.add(new Request(u, { cache: 'reload' })).catch(() => null)));
/* Fehlt etwas (z. B. weil eine andere App derselben Adresse den Speicher geleert hat), wird es still nachgeholt */
const auffuellen = () => caches.open(CACHE).then(c => c.match(DATEIEN[0]).then(hit => (hit ? null : vorrat(c)))).catch(() => null);

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(vorrat).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.indexOf('mak-gh-') === 0 && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== self.location.origin || u.href.indexOf(BASIS) !== 0) return;   /* nur die eigene App */
  if (/\/version\.json$/.test(u.pathname)) return;                                 /* immer frisch aus dem Netz */
  if (r.mode === 'navigate') {
    if (u.pathname !== START && u.pathname !== START + 'index.html') return;
    /* Start der App: die neueste Fassung aus dem Netz. Dauert das zu lange oder fehlt das Netz, die zuletzt gespeicherte. */
    const netz = fetch(BASIS, { cache: 'no-cache' }).then(res => {
      if (!res.ok) throw new Error('Start ' + res.status);
      const kopie = res.clone();
      return caches.open(CACHE).then(c => c.put(BASIS, kopie)).then(auffuellen).then(() => res, () => res);
    });
    const gespeichert = () => caches.match(BASIS);
    e.respondWith(new Promise(fertig => {
      let da = false;
      const gib = x => { if (!da && x) { da = true; fertig(x); } };
      const uhr = setTimeout(() => gespeichert().then(gib), 3500);
      netz.then(res => { clearTimeout(uhr); gib(res); })
        .catch(() => { clearTimeout(uhr); gespeichert().then(hit => gib(hit || Response.error())); });
    }));
    e.waitUntil(netz.catch(() => null));
    return;
  }
  e.respondWith(caches.match(r).then(hit => hit || fetch(r).then(res => {
    if (res.ok) { const kopie = res.clone(); caches.open(CACHE).then(c => c.put(r, kopie)); }
    return res;
  })));
});
/* Erinnerung an die monatliche Führerscheinkontrolle */
self.addEventListener('push', e => {
  e.waitUntil(self.registration.showNotification('Führerscheinkontrolle', {
    body: 'Bitte fotografiere in der App die Vorder- und Rückseite deines Führerscheins.',
    icon: ICON, badge: ICON, tag: 'mak-fs', renotify: true, data: { url: BASIS + '#fuehrerschein' }
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || BASIS;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    const c = list.find(x => x.url.indexOf(BASIS) === 0);
    if (c) return c.focus().then(w => (w && w.navigate ? w.navigate(url).catch(() => w) : w));
    return self.clients.openWindow(url);
  }));
});
