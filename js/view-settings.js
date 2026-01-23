// --- RENDER IMPOSTAZIONI ---
function renderSettings(fromHistory = false) {
    if (!fromHistory) {
        history.pushState({view: 'settings'}, 'Impostazioni', '#settings');
    }

    document.getElementById('btn-settings').style.display = 'none';
    const container = Views.settings;
    
    const moonIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
    const sunIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
    const cloudIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path></svg>';

    let themeLabel = 'Chiaro';
    let themeIcon = sunIcon;
    if (AppState.theme === 'dark') {
        themeLabel = 'Scuro';
        themeIcon = moonIcon;
    } else if (AppState.theme === 'gray') {
        themeLabel = 'Grigio';
        themeIcon = cloudIcon;
    }
    
    const notifEnabled = localStorage.getItem('notifications_enabled') === 'true';
    const bellIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>';
    const bellOffIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13.73 21a2 2 0 0 1-3.46 0"></path><path d="M18.63 13A17.89 17.89 0 0 1 18 8"></path><path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14"></path><path d="M18 8a6 6 0 0 0-9.33-5"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';

    const weightIncrement = localStorage.getItem('weight_increment') || '2.5';
    const slidersIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>';

    container.innerHTML = `
        <div class="view-header" style="justify-content: center;">
            <h2>Impostazioni</h2>
        </div>
        <div class="card-list">
            <div class="routine-card" id="setting-theme-card">
                <div>
                    <h3>Tema</h3>
                    <small id="theme-status">${themeLabel}</small>
                </div>
                <div style="display:flex; align-items:center;">
                     <button class="action-btn">${themeIcon}</button>
                </div>
            </div>
            <div class="routine-card" id="setting-notif-card">
                <div>
                    <h3>Notifiche</h3>
                    <small id="notif-status">${notifEnabled ? 'Abilitate' : 'Disabilitate'}</small>
                </div>
                <div style="display:flex; align-items:center;">
                     <button class="action-btn">${notifEnabled ? bellIcon : bellOffIcon}</button>
                </div>
            </div>
            <div class="routine-card" id="setting-weight-card">
                <div>
                    <h3>Incremento Peso</h3>
                    <small id="weight-status">${weightIncrement} kg</small>
                </div>
                <div style="display:flex; align-items:center;">
                     <button class="action-btn">${slidersIcon}</button>
                </div>
            </div>
        </div>
        <div style="text-align: center; margin-top: 20px; color: var(--text-muted); font-size: 0.8rem; padding-bottom: 20px;">
            OnePercent v1.0
        </div>
    `;

    document.getElementById('setting-theme-card').addEventListener('click', () => {
        toggleTheme();
        renderSettings(true); // Ricarica senza aggiungere alla history
    });

    document.getElementById('setting-notif-card').addEventListener('click', () => {
        const newState = !notifEnabled;
        localStorage.setItem('notifications_enabled', newState);
        if (newState && 'Notification' in window) {
            Notification.requestPermission();
        }
        renderSettings(true); // Ricarica senza aggiungere alla history
    });

    document.getElementById('setting-weight-card').addEventListener('click', () => {
        const newVal = weightIncrement === '2.5' ? '2' : '2.5';
        localStorage.setItem('weight_increment', newVal);
        renderSettings(true); // Ricarica per aggiornare la UI
    });

    setBackAction(() => history.back());
    setFabAction(null);
    switchView('settings');
}