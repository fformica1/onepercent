// --- RENDER VISTA PIANI ---
function renderPlans(fromHistory = false) {
    document.body.classList.remove('no-scroll');
    document.querySelector('main').style.transform = '';
    document.querySelector('main').classList.remove('calendar-open');

    if (!fromHistory) {
        history.pushState({view: 'plans'}, 'Piani', '#plans');
    }

    document.getElementById('btn-settings').classList.remove('visible');
    const plansContainer = Views.plans;

    // Cleanup modali precedenti se presenti nel body
    const modalIds = ['edit-plan-modal', 'create-plan-modal'];
    modalIds.forEach(id => { const el = document.getElementById(id); if(el) el.remove(); });

    plansContainer.innerHTML = `
        <div class="view-header" style="justify-content: center;">
            <h2>Piani di Allenamento</h2>
        </div>
        <div id="plans-list-container" class="card-list"></div>

        <!-- Modal Edit Plan -->
        <div id="edit-plan-modal" class="modal-overlay hidden">
            <div class="modal-content">
                <h3 style="margin-bottom:15px;">Modifica Piano</h3>
                <input type="hidden" id="edit-plan-id">
                <div class="form-group">
                    <label class="form-label">Nome Piano</label>
                    <input type="text" id="edit-plan-name" class="form-input">
                </div>
                <div class="modal-actions">
                    <button id="btn-cancel-edit-plan" class="secondary-btn">Annulla</button>
                    <button id="btn-save-edit-plan" class="primary-btn">Salva</button>
                </div>
            </div>
        </div>

        <!-- Modal Create Plan -->
        <div id="create-plan-modal" class="modal-overlay hidden">
            <div class="modal-content">
                <h3 style="margin-bottom:15px;">Nuovo Piano</h3>
                <div class="form-group">
                    <label class="form-label">Nome Piano</label>
                    <input type="text" id="create-plan-name" class="form-input" placeholder="Es. Massa Inverno">
                </div>
                <div class="modal-actions">
                    <button id="btn-cancel-create-plan" class="secondary-btn">Annulla</button>
                    <button id="btn-save-create-plan" class="primary-btn">Crea</button>
                </div>
            </div>
        </div>
    `;

    // Sposta le modali nel body per gestire correttamente lo z-index
    modalIds.forEach(id => document.body.appendChild(document.getElementById(id)));

    const listContainer = document.getElementById('plans-list-container');
    
    if (AppState.plans.length === 0) {
        listContainer.innerHTML = `
            <div style="text-align: center; padding-top: 40px;">
                <p style="color: var(--text-muted);">Nessun Piano di Allenamento disponibile.</p>
            </div>
        `;
    } else {
        listContainer.innerHTML = '';
        AppState.plans.forEach(plan => {
            const card = document.createElement('div');
            card.className = 'routine-card';
            card.dataset.planId = plan.id;
            if (plan.id === AppState.activePlanId) {
                card.classList.add('active-plan');
            }
            
            const isChecked = plan.id === AppState.activePlanId ? 'checked' : '';
            
            const routineNames = plan.routines && plan.routines.length > 0 
                ? plan.routines.map(r => r.name).join(', ') 
                : 'Nessuna routine';

            card.innerHTML = `
                <div class="plan-checkbox-wrapper" data-plan-id="${plan.id}">
                    <div class="minimal-checkbox ${isChecked}"></div>
                </div>
                <div style="flex-grow: 1; padding-left: 10px; min-width: 0;">
                    <h3>${plan.name}</h3>
                    <small style="color: var(--text-muted); display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${routineNames}</small>
                </div>
                <div style="display:flex; gap:5px; align-items:center;">
                    <button class="action-btn edit-plan-btn" data-id="${plan.id}" title="Modifica">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                    </button>
                    <button class="action-btn delete-plan-btn" data-id="${plan.id}" title="Elimina">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            `;
            listContainer.appendChild(card);
        });
    }

    listContainer.onclick = (e) => {
        const target = e.target;

        // Delete
        const deleteBtn = target.closest('.delete-plan-btn');
        if (deleteBtn) {
            e.stopPropagation();
            const id = parseInt(deleteBtn.dataset.id, 10);

            // Impedisci eliminazione se l'allenamento è in corso in questo piano
            if (currentWorkoutSession && currentWorkoutSession.planId === id) {
                showAlertModal("Azione Negata", "Impossibile eliminare il Piano: un allenamento è in corso.");
            } else {
                const plan = AppState.plans.find(p => p.id === id);
                if (!plan) return;

                showConfirmationModal(
                    "Elimina Piano",
                    `Sei sicuro di voler Eliminare il Piano "${plan.name}"? Questa azione è irreversibile.`,
                    () => {
                        const planIdToArchive = id;
                        const planIndex = AppState.plans.findIndex(p => p.id === planIdToArchive);

                        if (planIndex > -1) {
                            const [planToArchive] = AppState.plans.splice(planIndex, 1);
                            if (!AppState.archivedPlans) AppState.archivedPlans = [];
                            AppState.archivedPlans.push(planToArchive);

                            if (AppState.activePlanId === planIdToArchive) {
                                AppState.activePlanId = null;
                                // Se ci sono altri piani, seleziona il primo disponibile
                                if (AppState.plans.length > 0) {
                                    AppState.activePlanId = AppState.plans[0].id;
                                }
                            }
                            saveAppData();
                            renderPlans();
                        }
                    }, "Elimina"
                );
            }
            return;
        }

        // Edit
        const editBtn = target.closest('.edit-plan-btn');
        if (editBtn) {
            e.stopPropagation();
            const id = parseInt(editBtn.dataset.id, 10);
            const plan = AppState.plans.find(p => p.id === id);
            if (plan) {
                document.getElementById('edit-plan-id').value = plan.id;
                document.getElementById('edit-plan-name').value = plan.name;
                openModal('edit-plan-modal');
            }
            return;
        }

        // Select
        if (target.closest('.plan-checkbox-wrapper')) {
            e.stopPropagation();
            const planId = parseInt(target.closest('.plan-checkbox-wrapper').dataset.planId, 10);
            AppState.activePlanId = planId;
            saveAppData();
            renderPlans(true); // Aggiorna UI checkbox senza push history
            return; // STOP: Non aprire i dettagli
        }
        const card = target.closest('.routine-card');
        if (card) {
            const planId = parseInt(card.dataset.planId, 10);
            const plan = AppState.plans.find(p => p.id === planId);
            if (plan) renderRoutines(plan);
        }
    };

    // Modal Events
    document.getElementById('btn-cancel-edit-plan').onclick = () => { 
        closeModal('edit-plan-modal');
    };
    
    document.getElementById('btn-save-edit-plan').onclick = () => {
        const id = parseInt(document.getElementById('edit-plan-id').value, 10);
        const name = document.getElementById('edit-plan-name').value.trim();
        
        const plan = AppState.plans.find(p => p.id === id);
        if (plan && name) {
            plan.name = name;
            saveAppData();
            closeModal('edit-plan-modal');
            renderPlans();
        }
    };

    setBackAction(() => history.back());
    
    // FAB: Apre modale creazione piano
    setFabAction(() => {
        document.getElementById('create-plan-name').value = '';
        openModal('create-plan-modal');
    });

    // Gestione Modale Creazione Piano
    document.getElementById('btn-cancel-create-plan').onclick = () => {
        closeModal('create-plan-modal');
    };

    document.getElementById('btn-save-create-plan').onclick = () => {
        const name = document.getElementById('create-plan-name').value.trim();
        if (name) {
            const newPlan = { id: Date.now(), name: name, description: '', routines: [] };
            AppState.plans.push(newPlan);
            // Se è l'unico piano (o non ce n'era uno attivo), selezionalo automaticamente
            if (AppState.plans.length === 1 || !AppState.activePlanId) {
                AppState.activePlanId = newPlan.id;
            }
            saveAppData();
            closeModal('create-plan-modal');
            renderPlans();
        }
    };

    switchView('plans');

    // Check for overflow and animate (Plan Names)
    setTimeout(() => {
        document.querySelectorAll('#plans-list-container .routine-card h3').forEach(el => {
            if (el.scrollWidth > el.clientWidth) {
                const text = el.textContent;
                const offset = el.clientWidth - el.scrollWidth;
                el.style.setProperty('--scroll-offset', `${offset}px`);
                el.innerHTML = `<span class="scroll-inner">${text}</span>`;
                el.classList.add('scrolling-text-once');
                el.addEventListener('animationend', () => {
                    el.classList.remove('scrolling-text-once');
                    el.innerHTML = text;
                }, { once: true });
            }
        });
    }, 150);
}