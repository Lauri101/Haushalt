const CACHE = "haushalt-v4";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png", "three.min.js"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {})); self.skipWaiting(); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
// network first (always the newest version from GitHub), cache as offline fallback.
// Range requests (audio streaming) go straight to the network.
// Task Scheduling: the app opens ./plan.ics?d=<calendar text>; answered here as a real calendar file,
// so iPhone shows its "Add All" sheet (a home screen app may not open data: links)
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (u.origin === location.origin && u.pathname.endsWith("/plan.ics")) {
    const body = u.searchParams.get("d") || "";
    e.respondWith(new Response(body, { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": "inline; filename=haushalt-plan.ics", "Cache-Control": "no-store" } }));
  }
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (new URL(req.url).pathname.endsWith("/plan.ics")) return;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin || req.headers.get("range")) return;
  e.respondWith(
    fetch(req.url, { cache: "no-cache" })
      .then(res => { if (res.ok && res.status === 200) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; })
      .catch(() => caches.match(req).then(r => r || caches.match("index.html")))
  );
});
