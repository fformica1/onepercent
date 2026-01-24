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
    
    // Gestione visibilità FAB con tastiera (nascondi su focus input)
    const fab = document.getElementById('fab-action');
    if (fab) {
        const isKeyboardInput = (el) => {
            if (!el) return false;
            const tagName = el.tagName;
            if (tagName === 'TEXTAREA' || tagName === 'SELECT') return true;
            if (tagName === 'INPUT') {
                const type = el.type.toLowerCase();
                return !['checkbox', 'radio', 'button', 'submit', 'reset', 'range', 'color', 'file', 'hidden'].includes(type);
            }
            return false;
        };

        document.addEventListener('focusin', (e) => {
            if (isKeyboardInput(e.target)) fab.classList.add('keyboard-hidden');
        });

        document.addEventListener('focusout', () => {
            setTimeout(() => {
                if (!isKeyboardInput(document.activeElement)) fab.classList.remove('keyboard-hidden');
            }, 100);
        });
    }

    renderHome();
    // Il FAB viene inizializzato da renderHome
});