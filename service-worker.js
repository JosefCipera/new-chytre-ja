const CACHE_NAME = 'my-pwa-cache-v1'; // Název cache pro správu verzí
const urlsToCache = [
  '/', // Kořenová cesta (index.html)
  '/index.html',
  '/styles.css', // Příklad CSS souboru
  '/App.jsx', // Příklad komponenty, pokud je potřeba cachovat
  '/main.jsx', // Příklad hlavního souboru, pokud je potřeba cachovat
  // Přidejte další statické soubory, které vaše aplikace potřebuje k běhu offline
];

self.addEventListener("install", (event) => {
  console.log("Service Worker: Instalace...");
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log("Service Worker: Cachování statických assetů.");
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Okamžitá aktivace Service Workeru
      .catch((error) => {
        console.error("Service Worker: Chyba při cachování:", error);
      })
  );
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker: Aktivace.");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("Service Worker: Odstraňování staré cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Převzetí kontroly nad klienty okamžitě
  );
});

self.addEventListener("fetch", (event) => {
  // console.log("Service Worker: Zachycena žádost:", event.request.url); // Může být příliš mnoho logů
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - vrátíme cached response
        if (response) {
          return response;
        }
        // Cache miss - provedeme síťovou žádost
        return fetch(event.request).then((networkResponse) => {
          // Zkontrolujeme, zda je odezva platná
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }

          // Naklonujeme odezvu, protože stream lze číst pouze jednou
          const responseToCache = networkResponse.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return networkResponse;
        });
      }).catch(() => {
        // Chyba při fetchi nebo offline - můžete zde vrátit fallback stránku
        // return caches.match('/offline.html'); // Příklad pro offline stránku
      })
  );
});