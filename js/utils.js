// --- GESTIONE VISTE ---
const Views = {
    home: document.getElementById('view-home'),
    workout: document.getElementById('view-workout'),
    plans: document.getElementById('view-plans'),
    settings: document.getElementById('view-settings'),
    createPlan: document.getElementById('view-create-plan'),
    routines: document.getElementById('view-routines'),
    createRoutine: document.getElementById('view-create-routine'),
    routineEditor: document.getElementById('view-routine-editor'),
    exerciseSelector: document.getElementById('view-exercise-selector'),
    restTimer: document.getElementById('view-rest-timer')
};

function switchView(viewName) {
    // Caso speciale per il timer a schermo intero, che agisce come un overlay.
    // Mostra la vista del timer senza nascondere la vista sottostante (workout).
    if (viewName === 'restTimer') {
        // Non imposta 'data-view' per non alterare lo stato della vista sottostante (es. far riapparire l'header globale).
        const target = Views.restTimer;
        if (target) {
            target.classList.remove('hidden');
            target.classList.add('active');
        }
        AppState.currentView = viewName;
        return; // Esce per non eseguire la logica standard di nascondere le altre viste.
    }

    // Comportamento standard per le viste principali
    document.body.setAttribute('data-view', viewName);

    // Comportamento standard: nasconde tutte le viste...
    Object.values(Views).forEach(el => {
        if(el) el.classList.remove('active');
        if(el) el.classList.add('hidden');
    });
    
    // ...e poi mostra solo quella richiesta.
    const target = Views[viewName];
    if (target) {
        target.classList.remove('hidden');
        target.classList.add('active');
        AppState.currentView = viewName;
    }

    // Gestione bottoni header Import/Export
    const btnImport = document.getElementById('btn-import-plan');
    const btnExport = document.getElementById('btn-export-plan');
    if (btnImport) btnImport.classList.remove('visible');
    if (btnExport) btnExport.classList.remove('visible');

    if (viewName === 'plans' && btnImport) {
        btnImport.classList.add('visible');
    } else if (viewName === 'routines' && btnExport) {
        btnExport.classList.add('visible');
    }
}

// --- GESTIONE TEMA ---
function applyTheme() {
    document.body.setAttribute('data-theme', AppState.theme);
    const btn = document.getElementById('theme-toggle');
    
    // Aggiorna icona bottone in base al PROSSIMO tema
    if (btn) {
        let nextIcon = '';
        if (AppState.theme === 'light') nextIcon = '🌙'; // Prossimo: Dark
        else if (AppState.theme === 'dark') nextIcon = '☁️'; // Prossimo: Gray
        else if (AppState.theme === 'gray') nextIcon = '☀️'; // Prossimo: Light

        if (btn.textContent && btn.textContent !== nextIcon) {
            btn.classList.add('icon-animating');
            setTimeout(() => {
                btn.textContent = nextIcon;
                btn.classList.remove('icon-animating');
            }, 150);
        } else {
            btn.textContent = nextIcon;
        }
    }
    
    // Aggiorna meta tag colore browser
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
        let color = '#ffffff';
        if (AppState.theme === 'dark') color = '#000000';
        if (AppState.theme === 'gray') color = '#1c1c1e';
        meta.setAttribute('content', color);
    }
}

function toggleTheme() {
    // Ciclo: Light -> Dark -> Gray -> Light
    if (AppState.theme === 'light') {
        AppState.theme = 'dark';
    } else if (AppState.theme === 'dark') {
        AppState.theme = 'gray';
    } else {
        AppState.theme = 'light';
    }
    
    saveAppData();
    applyTheme();
}

// --- GESTIONE BACK BUTTON GLOBALE ---
function setBackAction(action) {
    const btn = document.getElementById('global-back-btn');
    if (action) {
        btn.classList.add('visible');
        btn.onclick = action;
    } else {
        btn.classList.remove('visible');
        btn.onclick = null;
    }
}

// --- GESTIONE FAB ---
function setFabAction(action, iconHtml) {
    const fab = document.getElementById('fab-action');
    if (!action) {
        fab.style.display = 'none';
        fab.onclick = null;
    } else {
        fab.style.display = 'flex';
        // Default icon is +
        fab.innerHTML = iconHtml || '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>';
        fab.onclick = action;
    }
}

// --- GESTIONE MODALI (Animazioni) ---
function openModal(modalId, pushState = true) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    // Push history state per gestire il tasto indietro
    if (pushState) {
        const currentState = window.history.state || {};
        if (currentState.modalOpen !== modalId) {
            const newState = { ...currentState, modalOpen: modalId };
            window.history.pushState(newState, '', window.location.hash);
        }
    }

    modal.classList.remove('hidden');
    
    // Reset scroll position
    const content = modal.querySelector('.modal-content');
    if (content) content.scrollTop = 0;
    const innerScrolls = modal.querySelectorAll('#sd-exercises-list, #exercise-history-content');
    innerScrolls.forEach(el => el.scrollTop = 0);

    // Force reflow per attivare la transizione CSS
    void modal.offsetWidth; 
    modal.classList.add('open');
    document.body.classList.add('no-scroll');

    // Auto-focus e selezione testo su input per aprire la tastiera
    const input = modal.querySelector('input[type="text"], input[type="number"], textarea');
    if (input) {
        modal.classList.add('keyboard-active');
        
        // Gestione dinamica viewport per centrare la modale nello spazio restante (sopra la tastiera)
        if (window.visualViewport) {
            const handleResize = () => {
                if (!modal.classList.contains('open')) return;
                modal.style.height = `${window.visualViewport.height}px`;
                modal.style.top = `${window.visualViewport.offsetTop}px`;
                modal.style.bottom = 'auto'; // Sovrascrive il CSS
            };
            // Salviamo il riferimento per rimuoverlo alla chiusura
            modal._viewportHandler = handleResize;
            window.visualViewport.addEventListener('resize', handleResize);
            window.visualViewport.addEventListener('scroll', handleResize);
            handleResize(); // Applica subito
        }

        setTimeout(() => {
            input.focus();
        }, 100);
    } else {
        modal.classList.remove('keyboard-active');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    // Se la modale è associata allo stato corrente della history, torniamo indietro
    // (Questo accade quando si chiude col tasto "Annulla" o "Salva", non col tasto indietro)
    if (window.history.state && window.history.state.modalOpen === modalId) {
        window.history.back();
        return; // Lascia che sia l'evento popstate a chiudere effettivamente la modale
    }
    
    // Rimuovi listener viewport se presenti
    if (modal._viewportHandler && window.visualViewport) {
        window.visualViewport.removeEventListener('resize', modal._viewportHandler);
        window.visualViewport.removeEventListener('scroll', modal._viewportHandler);
        delete modal._viewportHandler;
    }
    // Resetta stili inline
    modal.style.height = '';
    modal.style.top = '';
    modal.style.bottom = '';

    modal.classList.remove('open');
    setTimeout(() => {
        modal.classList.add('hidden');
        
        // Rimuovi no-scroll solo se non ci sono altre modali aperte E il calendario non è aperto
        const otherModals = document.querySelectorAll('.modal-overlay.open');
        const calendarOpen = document.querySelector('main') && document.querySelector('main').classList.contains('calendar-open');
        // Check extra: se siamo nella vista calendar (history state), non rimuovere no-scroll
        const isCalendarView = window.history.state && window.history.state.view === 'calendar';
        
        if (otherModals.length === 0 && !calendarOpen && !isCalendarView) {
            document.body.classList.remove('no-scroll');
        }
    }, 300); // Deve corrispondere alla durata della transizione CSS
}

// --- HELPERS ---
function formatRestTime(seconds) {
    return `${seconds}s`;
}

// --- MODALE DI CONFERMA GLOBALE ---
function showConfirmationModal(title, message, onConfirm, confirmText = "Elimina") {
    const modal = document.getElementById('confirm-modal');
    if (!modal) return;

    modal.querySelector('#confirm-modal-title').textContent = title;
    modal.querySelector('#confirm-modal-text').textContent = message;

    const confirmBtn = modal.querySelector('#confirm-modal-confirm');
    const cancelBtn = modal.querySelector('#confirm-modal-cancel');

    // Reset stato pulsanti (in caso sia stato usato showAlertModal)
    cancelBtn.classList.remove('hidden');
    confirmBtn.textContent = confirmText;
    if (confirmText === "Elimina") {
        confirmBtn.classList.add('danger-btn');
    } else {
        confirmBtn.classList.remove('danger-btn');
    }

    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    newConfirmBtn.addEventListener('click', () => {
        onConfirm();
        closeModal('confirm-modal');
    });

    const newCancelBtn = cancelBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
    newCancelBtn.addEventListener('click', () => { closeModal('confirm-modal'); });
    
    openModal('confirm-modal');
}

// --- IMPORT/EXPORT PIANI ---
function exportCurrentPlan() {
    // Recupera l'ID del piano corrente dallo stato della history
    const state = history.state;
    if (!state || !state.planId) {
        showAlertModal("Errore", "Impossibile identificare il piano da esportare.");
        return;
    }

    const plan = AppState.plans.find(p => p.id === state.planId);
    if (!plan) {
        showAlertModal("Errore", "Piano non trovato.");
        return;
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(plan, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${plan.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function importPlanFromFile(file) {
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedPlan = JSON.parse(e.target.result);
            
            if (!importedPlan.name || !Array.isArray(importedPlan.routines)) {
                throw new Error("Formato file non valido.");
            }

            showConfirmationModal(
                "Importa Piano",
                `Vuoi importare il piano "${importedPlan.name}"?`,
                () => {
                    try {
                        importedPlan.id = Date.now();

                        importedPlan.routines.forEach(routine => {
                            if (routine.exercises) {
                                routine.exercises.forEach(ex => {
                                    const exists = AppState.exercises.some(existing => existing.name.toLowerCase() === ex.name.toLowerCase());
                                    if (!exists) {
                                        AppState.exercises.push({
                                            id: Date.now() + Math.random(),
                                            name: ex.name,
                                            muscleGroup: ex.muscleGroup || 'Altro'
                                        });
                                    }
                                });
                            }
                        });

                        AppState.plans.push(importedPlan);
                        saveAppData();
                        
                        if (AppState.currentView === 'plans') {
                            if (typeof renderPlans === 'function') {
                                renderPlans(true);
                            } else {
                                window.location.reload();
                            }
                        }
                        
                        showAlertModal("Successo", `Piano "${importedPlan.name}" importato.`);
                    } catch (err) {
                        console.error(err);
                        showAlertModal("Errore", "Errore durante il salvataggio del piano.");
                    }
                },
                "Importa"
            );

        } catch (err) {
            console.error(err);
            showAlertModal("Errore", "File non valido.");
        }
    };
    reader.readAsText(file);
}

// --- MODALE AVVISO GLOBALE ---
function showAlertModal(title, message) {
    const modal = document.getElementById('confirm-modal');
    if (!modal) return;

    modal.querySelector('#confirm-modal-title').textContent = title;
    modal.querySelector('#confirm-modal-text').textContent = message;

    const confirmBtn = modal.querySelector('#confirm-modal-confirm');
    const cancelBtn = modal.querySelector('#confirm-modal-cancel');

    // Configurazione per avviso (solo OK)
    cancelBtn.classList.add('hidden');
    
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    
    newConfirmBtn.textContent = "OK";
    newConfirmBtn.classList.remove('danger-btn');
    newConfirmBtn.addEventListener('click', () => { closeModal('confirm-modal'); });
    
    openModal('confirm-modal');
}