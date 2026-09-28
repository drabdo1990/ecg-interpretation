const CACHE_NAME = "ecg-consultant-v3";
const ASSETS = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;

  const putInCache = (res) => {
    if (res.ok) {
      const resClone = res.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
    }
    return res;
  };

  // Pages: network first so updates reach users; fall back to cache offline.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).then(putInCache).catch(() =>
        caches.match(req).then((cached) => cached || caches.match("./index.html"))
      )
    );
    return;
  }

  // Static assets: cache first.
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then(putInCache))
  );
});
