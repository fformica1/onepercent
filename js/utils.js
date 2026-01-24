// --- GESTIONE VISTE ---
const Views = {
    home: document.getElementById('view-home'),
    workout: document.getElementById('view-workout'),
    plans: document.getElementById('view-plans'),
    settings: document.getElementById('view-settings'),
    createPlan: document.getElementById('view-create-plan'),
    planDetail: document.getElementById('view-plan-detail'),
    createRoutine: document.getElementById('view-create-routine'),
    routineEditor: document.getElementById('view-routine-editor'),
    exerciseSelector: document.getElementById('view-exercise-selector')
};

function switchView(viewName) {
    // Imposta l'attributo sul body per gestire lo stile globale via CSS
    document.body.setAttribute('data-view', viewName);

    // Nascondi tutte
    Object.values(Views).forEach(el => {
        if(el) el.classList.remove('active');
        if(el) el.classList.add('hidden');
    });
    
    // Mostra richiesta
    const target = Views[viewName];
    if (target) {
        target.classList.remove('hidden');
        target.classList.add('active');
        AppState.currentView = viewName;
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
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.remove('hidden');
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
        document.body.classList.remove('no-scroll');
    }, 300); // Deve corrispondere alla durata della transizione CSS
}