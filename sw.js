const CACHE="iptv-ui-v1";
const ASSETS=[
  "/",
  "/index.html",
  "/assets/css/style.css",
  "/assets/js/player.js",
  "/data/channels.json"
];

self.addEventListener("install",e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
});

self.addEventListener("fetch",e=>{
  if(e.request.url.includes(".m3u8")) return;
  e.respondWith(
    caches.match(e.request).then(r=>r||fetch(e.request))
  );
});
