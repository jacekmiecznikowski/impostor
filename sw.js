const CACHE_VERSION = 'v21';
const STATIC_CACHE = `partyjniak-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `partyjniak-runtime-${CACHE_VERSION}`;

const LOCAL_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './views/impostor-setup.html',
  './views/impostor-round.html',
  './views/modals.html',
  './assets/css/styles.css',
  './assets/css/impostor.css',
  './assets/css/impostor-reveal.css',
  './assets/css/impostor-role.css',
  './assets/css/impostor-reveal-layout.css',
  './assets/css/partyjniak.css',
  './assets/css/navigation.css',
  './assets/css/navigation-android.css',
  './assets/css/brand-theme.css',
  './assets/icons/icon.svg',
  './assets/icons/icon-32.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-maskable-512.png',
  './assets/js/shared/view-loader.js',
  './assets/js/shared/audio.js',
  './assets/js/shared/outcome-audio-user.js?v=1',
  './assets/js/shared/outcome-audio.js?v=4',
  './assets/js/shared/background.js',
  './assets/js/shared/platform.js',
  './assets/js/shared/content-repository.js',
  './assets/js/shared/ui.js',
  './assets/js/shared/hub.js',
  './assets/js/shared/navigation-behavior.js',
  './assets/js/shared/game-themes.js',
  './assets/js/shared/native-android.js',
  './assets/js/games/impostor/data.js',
  './assets/js/games/impostor/content-provider.js',
  './assets/js/games/impostor/rules.js',
  './assets/js/games/impostor/state.js',
  './assets/js/games/impostor/setup.js',
  './assets/js/games/impostor/game.js',
  './assets/js/games/impostor/presentation.js',
  './assets/js/games/impostor/reveal-fit.js',
  './assets/js/games/impostor/scoreboard.js',
  './assets/js/app.js'
];

const EXTERNAL_ASSETS = [
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/phaser/3.60.0/phaser.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap'
];

async function warmExternalCache() {
  const cache = await caches.open(RUNTIME_CACHE);
  await Promise.allSettled(EXTERNAL_ASSETS.map(async url => {
    const response = await fetch(url, { mode: 'no-cors' });
    await cache.put(url, response);
  }));
}

self.addEventListener('install', event => {
  event.waitUntil(caches.open(STATIC_CACHE).then(cache => cache.addAll(LOCAL_ASSETS)).then(warmExternalCache));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => ![STATIC_CACHE, RUNTIME_CACHE].includes(key)).map(key => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const requestUrl = new URL(event.request.url);

  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then(response => {
      if (response?.ok) {
        const copy = response.clone();
        event.waitUntil(caches.open(STATIC_CACHE).then(cache => cache.put('./index.html', copy)));
      }
      return response;
    }).catch(() => caches.match('./index.html')));
    return;
  }

  if (requestUrl.origin === self.location.origin) {
    event.respondWith((async () => {
      const cached = await caches.match(event.request);
      const networkPromise = fetch(event.request).then(response => {
        if (response?.ok) {
          const copy = response.clone();
          event.waitUntil(caches.open(STATIC_CACHE).then(cache => cache.put(event.request, copy)));
        }
        return response;
      }).catch(() => cached);
      return cached || networkPromise;
    })());
    return;
  }

  if (['script', 'style', 'font'].includes(event.request.destination)) {
    event.respondWith((async () => {
      const cached = await caches.match(event.request);
      const networkPromise = fetch(event.request).then(response => {
        if (response && (response.ok || response.type === 'opaque')) {
          const copy = response.clone();
          event.waitUntil(caches.open(RUNTIME_CACHE).then(cache => cache.put(event.request, copy)));
        }
        return response;
      }).catch(() => cached);
      return cached || networkPromise;
    })());
  }
});
