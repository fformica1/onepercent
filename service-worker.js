const CACHE_NAME = 'one-percent-v80';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './css/base.css',
    './css/components.css',
    './css/view-common.css',
    './css/view-home.css',
    './css/view-plans.css',
    './css/view-routines.css',
    './css/view-routine-editor.css',
    './css/view-workout.css',
    './css/view-exercises.css',
    './css/view-calendar.css',
    './css/view-rest-timer.css',
    './js/app.js',
    './js/state.js',
    './js/utils.js',
    './js/view-home.js',
    './js/view-plans.js',
    './js/view-routines.js',
    './js/view-settings.js',
    './js/view-routine-editor.js',
    './js/view-exercise-selector.js',
    './js/view-calendar.js',
    './js/view-workout.js',
    './js/notifications.js',
    './js/view-rest-timer.js',
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
    // Non forziamo più l'attivazione immediata. Il nuovo SW attenderà il comando dal client.
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS_TO_CACHE))
    );
});

// Attivazione: prende il controllo immediato della pagina
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName); // Rimuove le vecchie cache
                    }
                })
            );
        }).then(() => clients.claim()) // Prende il controllo dopo la pulizia
    );
});

// Fetch: Strategia Cache-First robusta con Timeout e Fallback
self.addEventListener('fetch', (event) => {
    // Funzione per il timeout della rete (evita che l'app si blocchi su connessioni "zombie")
    const timeoutPromise = (ms) => {
        return new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Network timeout')), ms);
        });
    };

    // STRATEGIA APP SHELL (Navigazione):
    // Se è una richiesta di navigazione (es. reload pagina), restituisci SUBITO index.html.
    // Non tentare la rete, evitando il blocco di 3s su connessioni Lie-fi.
    if (event.request.mode === 'navigate') {
        event.respondWith(
            caches.match('./index.html').then((response) => response || fetch(event.request))
        );
        return;
    }

    event.respondWith(
        caches.match(event.request, {ignoreSearch: true})
            .then((response) => {
                // 1. Se è in cache, restituisci SUBITO (nessun accesso a internet)
                if (response) {
                    return response;
                }

                // 2. Se non è in cache, prova la rete ma con un timeout breve (3 secondi)
                // Questo previene il blocco infinito
                return Promise.race([
                    fetch(event.request),
                    timeoutPromise(3000)
                ]).catch((err) => {
                    // Altrimenti lancia errore (o potremmo restituire un placeholder)
                    throw err;
                });
            })
    );
});

// Gestione Messaggi dal Client
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
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