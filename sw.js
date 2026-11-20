/* 主網域已不放任何系統：清掉熊熊綜合系統舊版留下的快取後自行解除，不再攔截其他系統 */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('shell-bearbear-')).map(k => caches.delete(k))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.matchAll())
      .then(list => list.forEach(c => c.navigate(c.url)))
  );
});
