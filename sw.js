/* =====================================================================
   熊熊綜合系統 App - service worker
   ・index.html：先連網取得最新版，沒網路時才用上次的版本 → 改 GitHub 上的 index.html，App 下次開啟就是新版
   ・試算表資料：先連網，沒網路時顯示上次讀到的資料
   ・外部程式庫（地圖、圖表）：存一份在手機，加快開啟速度
   只有更換圖示或 manifest.json 時，才需要把下面的 VERSION 改一個新名稱
   ===================================================================== */
const VERSION = 'bearbear-2026-10-09-v0';
const SHELL_CACHE = `shell-${VERSION}`;
const DATA_CACHE = 'sheet-data';
const LIB_CACHE = 'libs';
const SHELL = ['./', './index.html', './manifest.json', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png'];
const LIB_HOSTS = ['unpkg.com', 'cdn.jsdelivr.net', 'cdnjs.cloudflare.com'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(SHELL_CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('shell-') && k !== SHELL_CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* 試算表網址帶有防快取參數（_=、t=），存檔時去掉，離線時才找得到上次的資料 */
function dataKey(url) {
  const u = new URL(url);
  u.searchParams.delete('_');
  u.searchParams.delete('t');
  return u.toString();
}

async function networkFirst(request, cacheName, key) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(key || request, response.clone());
    return response;
  } catch (err) {
    const cached = await cache.match(key || request, { ignoreSearch: false });
    if (cached) return cached;
    throw err;
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && (response.ok || response.type === 'opaque')) cache.put(request, response.clone());
  return response;
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  /* 本站檔案 */
  if (url.origin === self.location.origin) {
    if (request.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('.html')) {
      event.respondWith(networkFirst(request, SHELL_CACHE, './index.html'));
    } else {
      event.respondWith(networkFirst(request, SHELL_CACHE));
    }
    return;
  }

  /* 熊熊綜合系統試算表的 CSV（地圖、月曆、活動、分海、潮汐） */
  if (url.hostname === 'docs.google.com' && url.pathname.includes('/spreadsheets/') && /format=csv|out%3Acsv|out:csv/.test(url.search)) {
    event.respondWith(networkFirst(request, DATA_CACHE, dataKey(request.url)));
    return;
  }

  /* 外部程式庫（網址含版本號，內容不會變） */
  if (LIB_HOSTS.includes(url.hostname)) {
    event.respondWith(cacheFirst(request, LIB_CACHE));
  }
  /* 其他（地圖圖磚、航班即時資料、圖片…）照常連網 */
});
