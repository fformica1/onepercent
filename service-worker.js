const CACHE_NAME = 'one-percent-v61';
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
    './js/view-workout.js',
    './js/notifications.js',
    './w-notification-icon.png',
    './notification-icon.png',
    './manifest.json',
    './favicon.png',
    './app-icon.png',
    './fonts/Poppins-Light.woff2',
    './fonts/Poppins-Regular.woff2',
    './fonts/Poppins-Medium.woff2',
    './fonts/Poppins-SemiBold.woff2',
    './fonts/Poppins-Bold.woff2'
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
        caches.match(event.request, {ignoreSearch: true})
            .then((response) => response || fetch(event.request))
    );
});

// Gestione Click Notifica
self.addEventListener('notificationclick', (event) => {
    const isPersistent = event.notification.tag === 'onepercent-workout-status';
    
    // Chiudi la notifica solo se non è quella persistente dell'allenamento
    if (!isPersistent) {
        event.notification.close();
    }

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if ('focus' in client) {
                    return client.focus().then(() => {
                        client.postMessage({ type: 'NAVIGATE_TO_ACTIVE_EXERCISE' });
                    });
                }
            }
            if (clients.openWindow) {
                return clients.openWindow('./?redirect=workout');
            }
        })
    );
});