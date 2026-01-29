// Registrazione Service Worker per PWA
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js')
        .then(reg => {
            // console.log('Service Worker registrato:', reg.scope);

            // Funzione per chiedere all'utente di aggiornare
            const askToUpdate = (worker) => {
                showConfirmationModal(
                    "Aggiornamento Disponibile",
                    "Una nuova versione dell'app è pronta. Vuoi aggiornare ora?",
                    () => {
                        // Reset timer mensile quando si accetta l'aggiornamento
                        localStorage.setItem('last_update_check_timestamp', Date.now().toString());
                        // Invia il messaggio al SW in attesa per attivarlo
                        worker.postMessage({ type: 'SKIP_WAITING' });
                    },
                    "Aggiorna"
                );
            };

            const showUpdatePrompt = (worker) => {
                // Mostra la richiesta di aggiornamento solo nella home o nelle impostazioni
                if (AppState.currentView === 'home' || AppState.currentView === 'settings') {
                    askToUpdate(worker);
                }
            };

            // --- LOGICA AGGIORNAMENTO MENSILE ---
            const lastCheck = localStorage.getItem('last_update_check_timestamp');
            const now = Date.now();
            const oneMonth = 30 * 24 * 60 * 60 * 1000; // 30 giorni in ms

            // Controlliamo gli aggiornamenti SOLO se:
            // 1. Non abbiamo mai controllato
            // 2. È passato più di un mese
            // 3. C'è già un worker in attesa (aggiornamento già scaricato in precedenza)
            const shouldCheck = !lastCheck || (now - parseInt(lastCheck) > oneMonth);

            if (shouldCheck) {
                // Se c'è già un SW in attesa, mostra prompt
                if (reg.waiting) {
                    showUpdatePrompt(reg.waiting);
                }
                // Aggiorniamo il timestamp solo se effettivamente gestiamo un aggiornamento o se forziamo il check
                // Nota: Il browser controlla comunque il file SW periodicamente, ma noi limitiamo l'interazione utente.
            }

            // Ascolta per nuovi SW che entrano nello stato 'installed'
            reg.addEventListener('updatefound', () => {
                const newWorker = reg.installing;
                newWorker.addEventListener('statechange', () => {
                    // Un nuovo SW è stato installato e sta aspettando di attivarsi
                    // Mostriamo il prompt SOLO se rientriamo nella logica mensile (o se forzato manualmente altrove)
                    if (shouldCheck && newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        showUpdatePrompt(newWorker);
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