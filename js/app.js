// Registrazione Service Worker per PWA
if ('serviceWorker' in navigator) {
    // Registra il Service Worker (Gestisce cache e offline)
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