const CACHE = "shell-v3";

function appUrl(path) {
  const base = new URL(self.registration.scope);
  return new URL(path.replace(/^\//, ""), base).href;
}

const SHELL = [
  appUrl(""),
  appUrl("manifest.webmanifest"),
  appUrl("favicon.svg"),
  appUrl("apple-touch-icon.png"),
  appUrl("pwa/icon-192.png"),
  appUrl("pwa/icon-512.png"),
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then(async (cache) => {
        await Promise.all(SHELL.map((url) => cache.add(url).catch(() => undefined)));
        const html = await fetch(appUrl("index.html"))
          .then((response) => (response.ok ? response.text() : ""))
          .catch(() => "");
        const assets = [...html.matchAll(/(?:src|href)=["']([^"']*\/assets\/[^"']+)["']/g)].map((match) =>
          new URL(match[1], self.registration.scope).href,
        );
        await Promise.all(assets.map((url) => cache.add(url).catch(() => undefined)));
      })
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(appUrl(""), response.clone());
    return response;
  } catch {
    return (await cache.match(appUrl(""))) ?? offlineResponse();
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  const fetched = fetch(request)
    .then((response) => {
      if (response.ok && response.type === "basic") void cache.put(request, response.clone());
      return response;
    })
    .catch(() => undefined);

  if (cached) return cached;
  return (await fetched) ?? offlineResponse();
}

function offlineResponse() {
  return new Response("Нет сети", {
    status: 503,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
