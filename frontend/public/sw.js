const CACHE_NAME = "tichlabs-tracker-v2";
const OFFLINE_QUEUE_KEY = "tichlabs_offline_queue";

const urlsToCache = [
  "/",
  "/incidents/safety",
  "/incidents/new",
  "/incidents/success",
  "/referral",
  "/icon/icon-192.png",
  "/icon/icon-512.png",
  "/site.webmanifest"
];

// Install — cache core shell assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activate — clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) return caches.delete(name);
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch — network-first with offline fallback
self.addEventListener("fetch", (event) => {
  // Only handle GET requests
  if (event.request.method !== "GET") return;

  // Skip Convex WebSocket and API requests — let Convex handle those
  const url = new URL(event.request.url);
  if (
    url.hostname.includes("convex.cloud") ||
    url.hostname.includes("convex.site") ||
    url.protocol === "ws:" ||
    url.protocol === "wss:"
  ) {
    return;
  }

  // Navigation requests — serve app shell, fall back to cached "/"
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match("/"))
    );
    return;
  }

  // Network-first for everything else
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (!response.ok) return response;
        // Skip caching for unsupported schemes (chrome-extension://, etc.)
        const url = new URL(event.request.url);
        if (url.protocol === 'chrome-extension:' || url.protocol === 'extension:') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// Push notifications
self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      const isAppInFocus = clientList.some((c) => c.focused);
      if (!isAppInFocus) {
        return self.registration.showNotification(data.title ?? "Tich Labs Tracker", {
          body: data.body ?? "You have a new notification.",
          icon: "/icon/icon-192.png",
          badge: "/icon/icon-192.png",
          ...data.options,
        });
      }
    })
  );
});

// Notification click — focus or open app
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow("/");
    })
  );
});
