// Service worker for Stevie's Task Tracker PWA.
// Caches the app shell on install so the tracker opens instantly and works
// offline. Network-first for the HTML so updates ship immediately, cache
// fallback for offline/poor-connection use.

const CACHE_NAME = "stevies-tracker-v1";
const APP_SHELL = ["./", "./index.html", "./app-icon.png"];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const req = event.request;
  // Only handle same-origin GETs. Don't intercept GitHub API calls or anything else.
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  event.respondWith(
    fetch(req)
      .then(resp => {
        // Cache successful responses for offline use
        if (resp && resp.ok) {
          const respClone = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, respClone));
        }
        return resp;
      })
      .catch(() => caches.match(req).then(hit => hit || caches.match("./index.html")))
  );
});
