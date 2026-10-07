/* global self, caches, clients */
const VERSION = "ba-v1";
const SHELL_CACHE = `${VERSION}-shell`;
const STATIC_CACHE = `${VERSION}-static`;
const SITE_ORIGIN =
  typeof self !== "undefined" && self.location
    ? self.location.origin
    : "https://buscaagora.com.br";
const PRIVATE_PREFIXES = [
  "/checkout",
  "/carrinho",
  "/conta",
  "/admin",
  "/api",
  "/auth",
  "/entrar",
  "/cadastro",
  "/recuperar-senha",
  "/redefinir-senha",
  "/aceite-termos",
  "/pedido",
  "/rastreio",
];

function policyFor(url, method, mode) {
  if (method !== "GET") return "network-only";
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return "network-only";
  }
  if (parsed.origin !== SITE_ORIGIN || parsed.searchParams.has("_rsc"))
    return "network-only";
  if (PRIVATE_PREFIXES.some((prefix) => parsed.pathname.startsWith(prefix)))
    return "network-only";
  if (
    parsed.pathname.startsWith("/_next/static/") ||
    parsed.pathname.startsWith("/brand/") ||
    parsed.pathname.startsWith("/icons/") ||
    parsed.pathname.endsWith(".woff2")
  )
    return "cache-first";
  if (parsed.pathname === "/_next/image") {
    // An optimized URL must not turn a private endpoint into a cacheable asset.
    const source = parsed.searchParams.get("url");
    if (source) {
      try {
        const image = new URL(source, SITE_ORIGIN);
        if (
          image.origin === SITE_ORIGIN &&
          PRIVATE_PREFIXES.some((prefix) => image.pathname.startsWith(prefix))
        )
          return "network-only";
      } catch {
        return "network-only";
      }
    }
    return "stale-while-revalidate";
  }
  return mode === "navigate" ? "network-first-offline" : "network-only";
}

if (typeof self !== "undefined" && self.addEventListener) {
  self.addEventListener("install", (event) => {
    event.waitUntil(
      (async () => {
        const cache = await caches.open(SHELL_CACHE);
        await cache.addAll([
          "/offline",
          "/brand/logo-d-branco.svg",
          "/brand/logo-e-branco.svg",
          "/brand/logo-e-escuro.svg",
          "/manifest.webmanifest",
          "/icons/icon-192.png",
        ]);
        await self.skipWaiting();
      })(),
    );
  });
  self.addEventListener("activate", (event) => {
    event.waitUntil(
      (async () => {
        const names = await caches.keys();
        await Promise.all(
          names
            .filter(
              (name) =>
                name.startsWith("ba-") &&
                name !== SHELL_CACHE &&
                name !== STATIC_CACHE,
            )
            .map((name) => caches.delete(name)),
        );
        await clients.claim();
      })(),
    );
  });

  async function refresh(request) {
    const response = await fetch(request);
    if (
      response.status === 200 &&
      response.type !== "opaque" &&
      !/no-store|private/i.test(response.headers.get("Cache-Control") || "")
    ) {
      try {
        const cache = await caches.open(STATIC_CACHE);
        await cache.put(request, response.clone());
      } catch {
        /* Storage failure must not hide a successful network response. */
      }
    }
    return response;
  }

  self.addEventListener("fetch", (event) => {
    const request = event.request;
    // RSC header checks belong here: the pure policy accepts URL/method/mode.
    if (
      request.headers.has("RSC") ||
      request.headers.has("Next-Router-State-Tree") ||
      request.headers.has("Authorization")
    )
      return;
    const policy = policyFor(request.url, request.method, request.mode);
    if (policy === "network-only") return;
    if (policy === "network-first-offline") {
      event.respondWith(
        fetch(request).catch(async () => {
          const cache = await caches.open(SHELL_CACHE);
          return (await cache.match("/offline")) || Response.error();
        }),
      );
      return;
    }
    if (policy === "cache-first") {
      event.respondWith(
        (async () => {
          let cached;
          try {
            cached = await (await caches.open(STATIC_CACHE)).match(request);
          } catch {
            /* Try the network if storage is unavailable. */
          }
          return cached || refresh(request);
        })(),
      );
      return;
    }
    // Keep the update alive even when a cached response is returned immediately.
    const update = refresh(request);
    event.waitUntil(
      update.then(
        () => undefined,
        () => undefined,
      ),
    );
    event.respondWith(
      (async () => {
        let cached;
        try {
          cached = await (await caches.open(STATIC_CACHE)).match(request);
        } catch {
          /* Use the network. */
        }
        return cached || update;
      })(),
    );
  });
}

if (typeof module !== "undefined") module.exports = { policyFor };
