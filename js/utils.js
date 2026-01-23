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
        if (AppState.theme === 'light') btn.textContent = '🌙'; // Prossimo: Dark
        else if (AppState.theme === 'dark') btn.textContent = '☁️'; // Prossimo: Gray
        else if (AppState.theme === 'gray') btn.textContent = '☀️'; // Prossimo: Light
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
    const spacer = document.getElementById('header-spacer');
    if (action) {
        btn.style.display = 'block';
        if(spacer) spacer.style.display = 'none';
        btn.onclick = action;
    } else {
        btn.style.display = 'none';
        if(spacer) spacer.style.display = 'block';
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