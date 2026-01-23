// Registrazione Service Worker per PWA
if ('serviceWorker' in navigator) {
    // Rimuovi eventuali Service Worker precedenti per forzare l'aggiornamento
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for(let registration of registrations) {
            registration.unregister();
        }
    });

    // Registra il nuovo
    navigator.serviceWorker.register('./service-worker.js')
        .then(reg => console.log('Service Worker registrato:', reg.scope))
        .catch(err => console.error('Errore Service Worker:', err));
}

// --- INIZIALIZZAZIONE ---
document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    document.getElementById('btn-settings').addEventListener('click', () => renderSettings(false));
    renderHome();
    // Il FAB viene inizializzato da renderHome
});