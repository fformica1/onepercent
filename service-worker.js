const CACHE_NAME = 'one-percent-v54';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './css/base.css',
    './css/components.css',
    './css/view-common.css',
    './css/view-home.css',
    './css/view-plans.css',
    './css/view-routines.css',
    './css/view-workout.css',
    './css/view-exercises.css',
    './css/view-calendar.css',
    './js/app.js',
    './js/state.js',
    './js/utils.js',
    './js/view-home.js',
    './js/view-plans.js',
    './js/view-settings.js',
    './js/view-routines.js',
    './js/view-workout.js'
];

// Installazione: cache delle risorse statiche
self.addEventListener('install', (event) => {
    self.skipWaiting(); // Forza l'attivazione immediata del nuovo SW
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS_TO_CACHE))
    );
});

// Attivazione: prende il controllo immediato della pagina
self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

// Fetch: serve i file dalla cache se offline
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => response || fetch(event.request))
    );
});