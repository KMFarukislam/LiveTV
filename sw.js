const STATIC_CACHE = "iptv-static-v1";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/assets/css/style.css",
  "/assets/js/player.js",
  "/data/channels.json"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener("fetch", e => {
  const url = e.request.url;

  // Don't cache live streams
  if (url.includes(".m3u8") || url.includes(".ts")) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then(res => {
      return (
        res ||
        fetch(e.request).then(netRes => {
          return caches.open(STATIC_CACHE).then(cache => {
            cache.put(e.request, netRes.clone());
            return netRes;
          });
        })
      );
    })
  );
});
