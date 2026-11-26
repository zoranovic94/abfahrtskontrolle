/* Die Abfahrtskontrolle läuft jetzt über https://milo-reisen.de/abfahrtskontrolle/.
   Dieser Helfer räumt eine früher hier installierte Fassung weg und leitet zur Webseite. */
const ZIEL = 'https://milo-reisen.de/abfahrtskontrolle/';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil((async () => {
  const ks = await caches.keys();
  await Promise.all(ks.filter(k => k.indexOf('mak-gh-') === 0).map(k => caches.delete(k)));
  await self.registration.unregister();
  const fenster = await self.clients.matchAll({ type: 'window' });
  fenster.forEach(f => f.navigate(ZIEL).catch(() => null));
})()));
