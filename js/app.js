// Registrazione Service Worker per PWA
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js')
        .then(reg => {
            console.log('Service Worker registrato:', reg.scope);

            // Funzione per chiedere all'utente di aggiornare
            const askToUpdate = (worker) => {
                showConfirmationModal(
                    "Aggiornamento Disponibile",
                    "Una nuova versione dell'app è pronta. Vuoi aggiornare ora?",
                    () => {
                        // Invia il messaggio al SW in attesa per attivarlo
                        worker.postMessage({ type: 'SKIP_WAITING' });
                    },
                    "Aggiorna"
                );
            };

            // Controlla se c'è già un SW in attesa all'avvio
            if (reg.waiting) {
                askToUpdate(reg.waiting);
            }

            // Ascolta per nuovi SW che entrano nello stato 'installed'
            reg.addEventListener('updatefound', () => {
                const newWorker = reg.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        askToUpdate(newWorker);
                    }
                });
            });
        })
        .catch(err => {
            console.error('Errore Service Worker:', err);
            showAlertModal('Errore Critico', 'L\'app potrebbe non funzionare correttamente senza connessione.');
        });

    // Ricarica la pagina quando un nuovo SW prende il controllo per applicare l'aggiornamento
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
    });
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

    // Gestione Redirect da Notifica (Cold Start)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('redirect') === 'workout') {
        const savedSession = localStorage.getItem('active_workout_session');
        if (savedSession) {
            const session = JSON.parse(savedSession);
            if (session.startTime) {
                renderWorkout(session.routineId, session.planId);
                // Pulisci URL
                window.history.replaceState({}, document.title, "./");
            }
        }
    }

    // Richiesta permessi notifiche al primo avvio (su interazione utente per policy browser)
    const notificationsEnabled = localStorage.getItem('notifications_enabled') !== 'false';
    if (notificationsEnabled && 'Notification' in window && Notification.permission === 'default') {
        const attemptRequest = () => {
            if (typeof SystemNotifier !== 'undefined') {
                SystemNotifier.requestPermission();
            }
            document.removeEventListener('click', attemptRequest);
            document.removeEventListener('touchend', attemptRequest);
        };
        document.addEventListener('click', attemptRequest);
        document.addEventListener('touchend', attemptRequest);
    }

    // Tenta di forzare l'orientamento verticale via API (supportato principalmente su Android/Chrome)
    if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('portrait').catch(() => {
            // Il blocco può fallire su alcuni dispositivi o se non in fullscreen, ignoriamo l'errore
        });
    }
});