const CACHE_VERSION = 'v60';
const STATIC_CACHE = `partyjniak-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `partyjniak-runtime-${CACHE_VERSION}`;

const LOCAL_ASSETS = [
  './','./index.html','./manifest.webmanifest',
  './views/impostor-setup.html','./views/impostor-round.html','./views/ticking-bomb.html','./views/ticking-bomb-modals.html','./views/naokolo.html','./views/naokolo-modals.html','./views/co-mam-na-mysli.html','./views/co-mam-na-mysli-modals.html','./views/trzy-w-piec.html','./views/trzy-w-piec-modals.html','./views/synchronizacja.html','./views/synchronizacja-modals.html','./views/trzy-rundy.html','./views/trzy-rundy-modals.html','./views/modals.html',
  './content/ticking-bomb.pl.json','./content/naokolo.pl.json','./content/co-mam-na-mysli.pl.json','./content/trzy-w-piec.pl.json','./content/synchronizacja.pl.json','./content/trzy-rundy.pl.json',
  './assets/css/styles.css','./assets/css/impostor.css','./assets/css/impostor-reveal.css','./assets/css/impostor-role.css','./assets/css/impostor-reveal-layout.css','./assets/css/ticking-bomb.css','./assets/css/ticking-bomb-mobile.css','./assets/css/ticking-bomb-visual.css?v=3','./assets/css/naokolo.css','./assets/css/co-mam-na-mysli.css','./assets/css/trzy-w-piec.css','./assets/css/trzy-w-piec-layout.css?v=4','./assets/css/synchronizacja.css','./assets/css/trzy-rundy.css','./assets/css/game-color-system.css','./assets/css/player-setup.css','./assets/css/settings.css','./assets/css/partyjniak.css','./assets/css/navigation.css','./assets/css/navigation-android.css','./assets/css/brand-theme.css','./assets/css/screen-layout-system.css?v=1',
  './assets/icons/icon.svg','./assets/icons/icon-32.png','./assets/icons/icon-192.png','./assets/icons/icon-512.png','./assets/icons/icon-maskable-512.png','./assets/brand/swawole-studio.svg',
  './assets/audio/crewmates-win.mp3.b64','./assets/audio/impostor-win.0.b64','./assets/audio/impostor-win.1.b64','./assets/audio/impostor-win.2.b64','./assets/audio/impostor-win.3.b64','./assets/audio/impostor-win.4.b64','./assets/audio/bomb-tick.b64','./assets/audio/bomb-explosion.b64',
  './assets/js/shared/view-loader.js','./assets/js/shared/app-settings.js','./assets/js/shared/audio.js','./assets/js/shared/player-setup.js','./assets/js/shared/outcome-audio.js?v=6','./assets/js/shared/background.js','./assets/js/shared/platform.js','./assets/js/shared/content-repository.js','./assets/js/shared/game-registry.js?v=2','./assets/js/shared/ui.js','./assets/js/shared/hub.js','./assets/js/shared/navigation-behavior.js','./assets/js/shared/game-themes.js','./assets/js/shared/native-android.js',
  './assets/js/games/index.js?v=6',
  './assets/js/games/impostor/data.js','./assets/js/games/impostor/content-provider.js','./assets/js/games/impostor/rules.js','./assets/js/games/impostor/state.js','./assets/js/games/impostor/setup.js','./assets/js/games/impostor/game.js','./assets/js/games/impostor/presentation.js','./assets/js/games/impostor/reveal-fit.js','./assets/js/games/impostor/scoreboard.js','./assets/js/games/impostor/integration.js?v=2',
  './assets/js/games/ticking-bomb/content-provider.js','./assets/js/games/ticking-bomb/rules.js','./assets/js/games/ticking-bomb/state.js','./assets/js/games/ticking-bomb/audio.js','./assets/js/games/ticking-bomb/setup.js','./assets/js/games/ticking-bomb/game.js','./assets/js/games/ticking-bomb/scoreboard.js','./assets/js/games/ticking-bomb/integration.js?v=2',
  './assets/js/games/naokolo/content-provider.js','./assets/js/games/naokolo/rules.js','./assets/js/games/naokolo/state.js','./assets/js/games/naokolo/setup.js','./assets/js/games/naokolo/game.js','./assets/js/games/naokolo/scoreboard.js','./assets/js/games/naokolo/integration.js?v=1',
  './assets/js/games/co-mam-na-mysli/content-provider.js','./assets/js/games/co-mam-na-mysli/rules.js','./assets/js/games/co-mam-na-mysli/motion.js','./assets/js/games/co-mam-na-mysli/state.js','./assets/js/games/co-mam-na-mysli/setup.js','./assets/js/games/co-mam-na-mysli/game.js','./assets/js/games/co-mam-na-mysli/scoreboard.js','./assets/js/games/co-mam-na-mysli/integration.js?v=1',
  './assets/js/games/trzy-w-piec/content-provider.js','./assets/js/games/trzy-w-piec/rules.js','./assets/js/games/trzy-w-piec/state.js','./assets/js/games/trzy-w-piec/setup.js','./assets/js/games/trzy-w-piec/game.js','./assets/js/games/trzy-w-piec/scoreboard.js','./assets/js/games/trzy-w-piec/integration.js?v=1',
  './assets/js/games/synchronizacja/content-provider.js','./assets/js/games/synchronizacja/rules.js','./assets/js/games/synchronizacja/state.js','./assets/js/games/synchronizacja/setup.js','./assets/js/games/synchronizacja/game.js','./assets/js/games/synchronizacja/scoreboard.js','./assets/js/games/synchronizacja/integration.js?v=1',
  './assets/js/games/trzy-rundy/content-provider.js','./assets/js/games/trzy-rundy/rules.js','./assets/js/games/trzy-rundy/state.js','./assets/js/games/trzy-rundy/setup.js','./assets/js/games/trzy-rundy/game.js','./assets/js/games/trzy-rundy/scoreboard.js','./assets/js/games/trzy-rundy/integration.js?v=1',
  './assets/js/games/prototypes/integration.js?v=5','./assets/js/app.js?v=8'
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
      if (response?.ok) { const copy = response.clone(); event.waitUntil(caches.open(STATIC_CACHE).then(cache => cache.put('./index.html', copy))); }
      return response;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  if (requestUrl.origin === self.location.origin) {
    event.respondWith((async () => {
      const cached = await caches.match(event.request);
      const networkPromise = fetch(event.request).then(response => {
        if (response?.ok) { const copy = response.clone(); event.waitUntil(caches.open(STATIC_CACHE).then(cache => cache.put(event.request, copy))); }
        return response;
      }).catch(() => cached);
      return cached || networkPromise;
    })());
    return;
  }
  if (['script','style','font'].includes(event.request.destination)) {
    event.respondWith((async () => {
      const cached = await caches.match(event.request);
      const networkPromise = fetch(event.request).then(response => {
        if (response && (response.ok || response.type === 'opaque')) { const copy = response.clone(); event.waitUntil(caches.open(RUNTIME_CACHE).then(cache => cache.put(event.request, copy))); }
        return response;
      }).catch(() => cached);
      return cached || networkPromise;
    })());
  }
});
