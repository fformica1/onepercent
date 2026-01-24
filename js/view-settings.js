// --- RENDER IMPOSTAZIONI ---
function renderSettings(fromHistory = false) {
    if (!fromHistory) {
        history.pushState({view: 'settings'}, 'Impostazioni', '#settings');
    }

    document.getElementById('btn-settings').classList.remove('visible');
    const container = Views.settings;
    
    const moonIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
    const sunIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
    const cloudIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path></svg>';

    const downloadIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>';
    const uploadIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>';

    let themeLabel = 'Chiaro';
    let themeIcon = sunIcon;
    if (AppState.theme === 'dark') {
        themeLabel = 'Scuro';
        themeIcon = moonIcon;
    } else if (AppState.theme === 'gray') {
        themeLabel = 'Grigio';
        themeIcon = cloudIcon;
    }
    
    const notifEnabled = localStorage.getItem('notifications_enabled') !== 'false';
    const bellIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        <line x1="3" y1="3" x2="21" y2="21" class="notif-slash ${!notifEnabled ? 'visible' : ''}"></line>
    </svg>`;

    const weightIncrement = localStorage.getItem('weight_increment') || '2.5';
    
    const weightIconHtml = `
        <div id="btn-weight-icon" style="width: 30px; height: 30px; position: relative; cursor: pointer;">
            <div class="weight-disk">${weightIncrement}</div>
        </div>
    `;

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
                     <button id="btn-theme-icon" class="action-btn">${themeIcon}</button>
                </div>
            </div>
            <div class="routine-card" id="setting-notif-card">
                <div>
                    <h3>Notifiche</h3>
                    <small id="notif-status">${notifEnabled ? 'Abilitate' : 'Disabilitate'}</small>
                </div>
                <div style="display:flex; align-items:center;">
                     <button id="btn-notif-icon" class="action-btn">${bellIcon}</button>
                </div>
            </div>
            <div class="routine-card" id="setting-weight-card">
                <div>
                    <h3>Incremento Peso</h3>
                    <small id="weight-status">${weightIncrement} kg</small>
                </div>
                <div style="display:flex; align-items:center;">
                     ${weightIconHtml}
                </div>
            </div>
            <div class="routine-card" style="cursor: default;">
                <div>
                    <h3>Backup</h3>
                    <small>Importa o esporta i dati</small>
                </div>
                <div style="display:flex; align-items:center; gap: 15px;">
                     <button id="btn-backup-import" class="action-btn">${downloadIcon}</button>
                     <button id="btn-backup-export" class="action-btn">${uploadIcon}</button>
                </div>
            </div>
        </div>
        <input type="file" id="import-file-input" accept=".json" style="display: none;">
        <div style="text-align: center; margin-top: 20px; color: var(--text-muted); font-size: 0.8rem; padding-bottom: 20px;">
            OnePercent v1.12
        </div>
    `;

    document.getElementById('setting-theme-card').addEventListener('click', () => {
        const btn = document.getElementById('btn-theme-icon');
        if (btn.classList.contains('icon-animating')) return;
        btn.classList.add('icon-animating');

        setTimeout(() => {
            toggleTheme();
            // Aggiorna UI locale
            let newLabel = 'Chiaro';
            let newIcon = sunIcon;
            if (AppState.theme === 'dark') { newLabel = 'Scuro'; newIcon = moonIcon; }
            else if (AppState.theme === 'gray') { newLabel = 'Grigio'; newIcon = cloudIcon; }
            
            document.getElementById('theme-status').textContent = newLabel;
            btn.innerHTML = newIcon;
            btn.classList.remove('icon-animating');
        }, 150);
    });

    document.getElementById('setting-notif-card').addEventListener('click', async () => {
        const notifCard = document.getElementById('setting-notif-card');
        if (notifCard.dataset.processing) return; // Evita doppi click
        notifCard.dataset.processing = 'true';

        try {
            const currentIsEnabled = localStorage.getItem('notifications_enabled') !== 'false';
            let newIsEnabled = !currentIsEnabled;

            // Se si sta tentando di ABILITARE, chiedi il permesso prima
            if (newIsEnabled) {
                if (typeof SystemNotifier !== 'undefined') {
                    const permissionGranted = await SystemNotifier.requestPermission();
                    if (!permissionGranted) {
                        showAlertModal("Permesso Negato", "Permesso per le notifiche negato. Consenti l'accesso alle notifiche dalle impostazioni di sistema dell'app.");
                        newIsEnabled = false; // Forza lo stato a rimanere disabilitato
                    }
                } else {
                    console.error("SystemNotifier non caricato.");
                }
            }

            localStorage.setItem('notifications_enabled', String(newIsEnabled));
            
            if (!newIsEnabled && typeof SystemNotifier !== 'undefined') {
                SystemNotifier.clearWorkoutNotification();
            }
            
            document.getElementById('notif-status').textContent = newIsEnabled ? 'Abilitate' : 'Disabilitate';
            const slash = document.querySelector('#btn-notif-icon .notif-slash');
            if (slash) {
                slash.classList.toggle('visible', !newIsEnabled);
            }
        } catch (e) {
            console.error("Errore toggle notifiche:", e);
        } finally {
            delete notifCard.dataset.processing;
        }
    });

    document.getElementById('setting-weight-card').addEventListener('click', () => {
        const btn = document.getElementById('btn-weight-icon');
        if (btn.dataset.animating === 'true') return;
        btn.dataset.animating = 'true';

        // Start Flip Out (0 -> 90deg)
        btn.style.transition = 'transform 0.15s ease-in';
        btn.style.transform = 'rotateY(90deg)';

        setTimeout(() => {
            const currentVal = localStorage.getItem('weight_increment') || '2.5';
            const newVal = currentVal === '2.5' ? '2' : '2.5';
            localStorage.setItem('weight_increment', newVal);
            
            document.getElementById('weight-status').textContent = `${newVal} kg`;
            btn.querySelector('.weight-disk').textContent = newVal;
            
            // Prepare Flip In (-90deg -> 0)
            btn.style.transition = 'none';
            btn.style.transform = 'rotateY(-90deg)';
            
            // Force reflow
            void btn.offsetWidth;

            // Start Flip In
            btn.style.transition = 'transform 0.15s ease-out';
            btn.style.transform = 'rotateY(0deg)';

            setTimeout(() => {
                btn.dataset.animating = 'false';
                btn.style.transition = '';
                btn.style.transform = '';
            }, 150);
        }, 150);
    });

    // Export Logic
    document.getElementById('btn-backup-export').addEventListener('click', (e) => {
        e.stopPropagation();
        const btn = e.currentTarget;
        btn.classList.add('click-animating');

        setTimeout(() => {
            const backup = {
                plans: AppState.plans,
                exercises: AppState.exercises,
                timestamp: Date.now(),
                version: 1
            };
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "onepercent_backup_" + new Date().toISOString().split('T')[0] + ".json");
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
            btn.classList.remove('click-animating');
        }, 200);
    });

    // Import Logic
    const fileInput = document.getElementById('import-file-input');
    document.getElementById('btn-backup-import').addEventListener('click', (e) => {
        e.stopPropagation();
        const btn = e.currentTarget;
        btn.classList.add('click-animating');
        fileInput.click();
        setTimeout(() => {
            btn.classList.remove('click-animating');
        }, 200);
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedData = JSON.parse(event.target.result);
                if (!importedData.plans || !importedData.exercises) {
                    showAlertModal("Errore", "Formato file non valido.");
                    fileInput.value = '';
                    return;
                }

                // Configura modale di conferma personalizzata
                const modal = document.getElementById('confirm-modal');
                const titleEl = modal.querySelector('#confirm-modal-title');
                const textEl = modal.querySelector('#confirm-modal-text');
                const confirmBtn = modal.querySelector('#confirm-modal-confirm');
                const cancelBtn = modal.querySelector('#confirm-modal-cancel');

                titleEl.textContent = "Importa Backup";
                textEl.textContent = "Vuoi importare questo backup? I piani verranno aggiunti e gli esercizi mancanti inseriti.";
                textEl.style.whiteSpace = 'normal'; // Reset stile
                
                cancelBtn.classList.remove('hidden');
                confirmBtn.textContent = "Importa";
                confirmBtn.classList.remove('danger-btn');

                const newConfirmBtn = confirmBtn.cloneNode(true);
                confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
                
                const newCancelBtn = cancelBtn.cloneNode(true);
                cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

                newCancelBtn.addEventListener('click', () => {
                    closeModal('confirm-modal');
                    fileInput.value = '';
                });

                newConfirmBtn.addEventListener('click', () => {
                    // 1. Import Exercises (Ignore duplicates by name)
                    let addedExercisesCount = 0;
                    importedData.exercises.forEach(impEx => {
                        const exists = AppState.exercises.some(localEx => 
                            localEx.name.trim().toLowerCase() === impEx.name.trim().toLowerCase()
                        );
                        if (!exists) {
                            if (AppState.exercises.some(e => e.id === impEx.id)) {
                                impEx.id = Date.now() + Math.floor(Math.random() * 100000);
                            }
                            AppState.exercises.push(impEx);
                            addedExercisesCount++;
                        }
                    });
                    
                    AppState.exercises.sort((a, b) => {
                        if (a.muscleGroup < b.muscleGroup) return -1;
                        if (a.muscleGroup > b.muscleGroup) return 1;
                        return a.name.localeCompare(b.name);
                    });

                    // 2. Import Plans (Append as new)
                    importedData.plans.forEach(impPlan => {
                        impPlan.id = Date.now() + Math.floor(Math.random() * 100000);
                        if (impPlan.routines) {
                            impPlan.routines.forEach(routine => {
                                routine.id = Date.now() + Math.floor(Math.random() * 100000);
                            });
                        }
                        AppState.plans.push(impPlan);
                    });

                    saveAppData();
                    
                    // Trasforma la modale in Successo (evita chiudi/apri rapido)
                    titleEl.textContent = "Successo";
                    textEl.style.whiteSpace = 'pre-line';
                    textEl.textContent = `Backup importato!\nEsercizi aggiunti: ${addedExercisesCount}\nPiani aggiunti: ${importedData.plans.length}`;
                    cancelBtn.classList.add('hidden');
                    newConfirmBtn.textContent = "OK";
                    
                    const okBtn = newConfirmBtn.cloneNode(true);
                    newConfirmBtn.parentNode.replaceChild(okBtn, newConfirmBtn);
                    
                    okBtn.addEventListener('click', () => {
                        closeModal('confirm-modal');
                        renderSettings(); 
                    });
                    
                    fileInput.value = '';
                });

                openModal('confirm-modal');

            } catch (err) {
                console.error(err);
                showAlertModal("Errore", "Errore durante la lettura del file.");
                fileInput.value = '';
            }
        };
        reader.readAsText(file);
    });

    setBackAction(() => history.back());
    setFabAction(null);
    switchView('settings');
}