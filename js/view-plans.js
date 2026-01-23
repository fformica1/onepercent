// --- MODALE DI CONFERMA GLOBALE ---
function showConfirmationModal(title, message, onConfirm) {
    const modal = document.getElementById('confirm-modal');
    if (!modal) return;

    modal.querySelector('#confirm-modal-title').textContent = title;
    modal.querySelector('#confirm-modal-text').textContent = message;

    const confirmBtn = modal.querySelector('#confirm-modal-confirm');
    const cancelBtn = modal.querySelector('#confirm-modal-cancel');

    // Reset stato pulsanti (in caso sia stato usato showAlertModal)
    cancelBtn.classList.remove('hidden');
    confirmBtn.textContent = "Elimina";
    confirmBtn.classList.add('danger-btn');

    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    newConfirmBtn.addEventListener('click', () => {
        onConfirm();
        modal.classList.add('hidden');
        document.body.classList.remove('no-scroll');
    });

    const newCancelBtn = cancelBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
    newCancelBtn.addEventListener('click', () => { modal.classList.add('hidden'); document.body.classList.remove('no-scroll'); });
    
    modal.classList.remove('hidden');
    document.body.classList.add('no-scroll');
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
    newConfirmBtn.addEventListener('click', () => { modal.classList.add('hidden'); document.body.classList.remove('no-scroll'); });
    
    modal.classList.remove('hidden');
    document.body.classList.add('no-scroll');
}

// --- RENDER DETTAGLIO PIANO ---
function renderPlanDetail(plan, fromHistory = false) {
    document.body.classList.remove('no-scroll');
    document.querySelector('main').style.transform = '';
    document.querySelector('main').classList.remove('calendar-open');

    if (!fromHistory) {
        history.pushState({view: 'planDetail', planId: plan.id}, plan.name, '#planDetail');
    }

    document.getElementById('btn-settings').classList.remove('visible');
    const container = Views.planDetail;

    // Cleanup modali precedenti se presenti nel body
    const modalIds = ['edit-routine-modal-plan', 'create-routine-modal'];
    modalIds.forEach(id => { const el = document.getElementById(id); if(el) el.remove(); });

    container.innerHTML = `
        <div class="view-header" style="justify-content: center;">
            <h2>${plan.name}</h2>
        </div>
        <div id="plan-routines-list" class="card-list"></div>

        <!-- Modal Edit Routine Name (in Plan Detail) -->
        <div id="edit-routine-modal-plan" class="modal-overlay hidden">
            <div class="modal-content">
                <h3 style="margin-bottom:15px;">Modifica Nome Routine</h3>
                <input type="hidden" id="edit-routine-id-plan">
                <div class="form-group">
                    <label class="form-label">Nome Routine</label>
                    <input type="text" id="edit-routine-name-plan" class="form-input">
                </div>
                <div class="modal-actions">
                    <button id="btn-cancel-edit-routine-plan" class="secondary-btn">Annulla</button>
                    <button id="btn-save-edit-routine-plan" class="primary-btn">Salva</button>
                </div>
            </div>
        </div>

        <!-- Modal Create Routine -->
        <div id="create-routine-modal" class="modal-overlay hidden">
            <div class="modal-content">
                <h3 style="margin-bottom:15px;">Nuova Routine</h3>
                <div class="form-group">
                    <label class="form-label">Nome Routine</label>
                    <input type="text" id="create-routine-name" class="form-input" placeholder="Es. Petto e Tricipiti">
                </div>
                <div class="modal-actions">
                    <button id="btn-cancel-create-routine" class="secondary-btn">Annulla</button>
                    <button id="btn-save-create-routine" class="primary-btn">Crea</button>
                </div>
            </div>
        </div>
    `;

    // Sposta le modali nel body per gestire correttamente lo z-index
    modalIds.forEach(id => document.body.appendChild(document.getElementById(id)));

    const routineListContainer = document.getElementById('plan-routines-list');
    if (plan.routines && plan.routines.length > 0) {
        plan.routines.forEach(routine => {
            const card = document.createElement('div');
            card.className = 'routine-card';
            card.dataset.id = routine.id;
            
            const exerciseNames = routine.exercises && routine.exercises.length > 0 
                ? routine.exercises.map(e => e.name).join(', ') 
                : 'Nessun esercizio';

            card.innerHTML = `
                <div class="drag-handle" style="padding-left: 0; padding-right: 10px;"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg></div>
                <div style="flex-grow:1;" class="routine-click-area">
                    <h3>${routine.name}</h3>
                    <small style="color: var(--text-muted); display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${exerciseNames}</small>
                </div>
                <div style="display:flex; gap:5px; align-items:center;">
                    <button class="action-btn edit-routine-btn" data-id="${routine.id}" title="Modifica Nome">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                    </button>
                    <button class="action-btn delete-routine-btn" data-id="${routine.id}" title="Elimina">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            `;
            
            // Gestione click area principale
            card.querySelector('.routine-click-area').addEventListener('click', () => renderRoutineEditor(routine.id, plan.id));
            
            // Gestione pulsanti azione
            card.querySelector('.edit-routine-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                document.getElementById('edit-routine-id-plan').value = routine.id;
                document.getElementById('edit-routine-name-plan').value = routine.name;
                document.getElementById('edit-routine-modal-plan').classList.remove('hidden');
                document.body.classList.add('no-scroll');
            });

            card.querySelector('.delete-routine-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                const routineId = routine.id;

                // Impedisci eliminazione se l'allenamento è in corso
                if (currentWorkoutSession && currentWorkoutSession.routineId === routineId) {
                    showAlertModal("Azione Negata", "Impossibile eliminare la routine: l'allenamento è in corso.");
                } else {
                    showConfirmationModal(
                        "Elimina Routine",
                        `Sei sicuro di voler eliminare la routine "${routine.name}"?`,
                        () => {
                            plan.routines = plan.routines.filter(r => r.id !== routineId);
                            saveAppData();
                            renderPlanDetail(plan);
                        }
                    );
                }
            });

            routineListContainer.appendChild(card);
        });
    } else {
        routineListContainer.innerHTML = '<p class="empty-state">Nessuna routine in questo piano.</p>';
    }

    // Drag and Drop Logic for Routines
    let draggedItem = null;
    let ghost = null;
    let ghostOffsetY = 0;
    const dragListContainer = routineListContainer;

    const handleDragStart = (e) => {
        const handle = e.target.closest('.drag-handle');
        if (!handle) return;
        if (e.type === 'touchstart') e.preventDefault(); // Previene lo scroll su mobile

        const card = handle.closest('.routine-card');
        if (!card) return;

        draggedItem = card;

        // Crea Ghost
        const rect = card.getBoundingClientRect();
        ghost = card.cloneNode(true);
        ghost.classList.add('dragging-ghost');
        ghost.style.width = `${rect.width}px`;
        ghost.style.height = `${rect.height}px`;
        ghost.style.top = `${rect.top}px`;
        ghost.style.left = `${rect.left}px`;
        document.body.appendChild(ghost);

        // Nascondi originale
        draggedItem.classList.add('dragging-placeholder');

        const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
        ghostOffsetY = clientY - rect.top;

        document.addEventListener('touchmove', handleDragMove, { passive: false });
        document.addEventListener('mousemove', handleDragMove);
        document.addEventListener('touchend', handleDragEnd);
        document.addEventListener('mouseup', handleDragEnd);
    };

    const handleDragMove = (e) => {
        if (!ghost) return;
        e.preventDefault();
        const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
        
        // Muovi Ghost
        ghost.style.top = `${clientY - ghostOffsetY}px`;

        const siblings = [...dragListContainer.querySelectorAll('.routine-card')];
        const nextSibling = siblings.find(sibling => {
            if (sibling === draggedItem) return false;
            const box = sibling.getBoundingClientRect();
            return clientY < box.top + box.height / 2;
        });

        if (nextSibling !== draggedItem.nextElementSibling && nextSibling !== draggedItem) {
            const state = siblings.map(el => ({ el, top: el.getBoundingClientRect().top }));
            dragListContainer.insertBefore(draggedItem, nextSibling);
            state.forEach(obj => {
                const newTop = obj.el.getBoundingClientRect().top;
                const diff = obj.top - newTop;
                if (diff !== 0 && obj.el !== draggedItem) {
                    obj.el.style.transition = 'none';
                    obj.el.style.transform = `translateY(${diff}px)`;
                    void obj.el.offsetHeight;
                    obj.el.style.transition = 'transform 0.3s cubic-bezier(0.2, 0, 0, 1)';
                    obj.el.style.transform = '';
                }
            });
        }
    };

    const handleDragEnd = () => {
        if (ghost) {
            ghost.remove();
            ghost = null;
        }
        if (draggedItem) {
            draggedItem.classList.remove('dragging-placeholder');
            draggedItem = null;
            
            document.removeEventListener('touchmove', handleDragMove);
            document.removeEventListener('mousemove', handleDragMove);
            document.removeEventListener('touchend', handleDragEnd);
            document.removeEventListener('mouseup', handleDragEnd);
            
            // Aggiorna ordine dati
            const newOrderIds = [...dragListContainer.querySelectorAll('.routine-card')].map(el => parseFloat(el.dataset.id));
            plan.routines.sort((a, b) => newOrderIds.indexOf(a.id) - newOrderIds.indexOf(b.id));
            saveAppData();
        }
    };

    dragListContainer.addEventListener('touchstart', handleDragStart, { passive: false });
    dragListContainer.addEventListener('mousedown', handleDragStart);

    // Modal Events
    const modal = document.getElementById('edit-routine-modal-plan');
    document.getElementById('btn-cancel-edit-routine-plan').onclick = () => { 
        modal.classList.add('hidden'); 
        document.body.classList.remove('no-scroll'); 
    };
    
    document.getElementById('btn-save-edit-routine-plan').onclick = () => {
        const id = parseFloat(document.getElementById('edit-routine-id-plan').value);
        const name = document.getElementById('edit-routine-name-plan').value.trim();
        
        const routine = plan.routines.find(r => r.id === id);
        if (routine && name) {
            routine.name = name;
            saveAppData();
            modal.classList.add('hidden');
            document.body.classList.remove('no-scroll');
            renderPlanDetail(plan);
        }
    };

    setBackAction(() => history.back());
    
    // FAB: Apre modale creazione routine
    setFabAction(() => {
        document.getElementById('create-routine-name').value = '';
        document.getElementById('create-routine-modal').classList.remove('hidden');
        document.body.classList.add('no-scroll');
    });

    // Gestione Modale Creazione Routine
    document.getElementById('btn-cancel-create-routine').onclick = () => {
        document.getElementById('create-routine-modal').classList.add('hidden');
        document.body.classList.remove('no-scroll');
    };

    document.getElementById('btn-save-create-routine').onclick = () => {
        const name = document.getElementById('create-routine-name').value.trim();
        if (name) {
            const newRoutine = { id: Date.now(), name: name, exercises: [] };
            if (!plan.routines) plan.routines = [];
            plan.routines.push(newRoutine);
            saveAppData();
            document.getElementById('create-routine-modal').classList.add('hidden');
            document.body.classList.remove('no-scroll');
            renderPlanDetail(plan);
        }
    };

    switchView('planDetail');

    // Check for overflow and animate (Routine Names)
    setTimeout(() => {
        document.querySelectorAll('#plan-routines-list .routine-card h3').forEach(el => {
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
        listContainer.innerHTML = '<p class="empty-state">Nessun piano creato. Inizia creandone uno nuovo.</p>';
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
                showAlertModal("Azione Negata", "Impossibile eliminare il piano: un allenamento è in corso.");
            } else {
                const plan = AppState.plans.find(p => p.id === id);
                if (!plan) return;

                showConfirmationModal(
                    "Elimina Piano",
                    `Sei sicuro di voler eliminare il piano "${plan.name}" e tutte le sue routine? L'azione è irreversibile.`,
                    () => {
                        AppState.plans = AppState.plans.filter(p => p.id !== id);
                        if (AppState.activePlanId === id) AppState.activePlanId = null;
                        saveAppData();
                        renderPlans();
                    }
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
                document.getElementById('edit-plan-modal').classList.remove('hidden');
                document.body.classList.add('no-scroll');
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
            if (plan) renderPlanDetail(plan);
        }
    };

    // Modal Events
    const modal = document.getElementById('edit-plan-modal');
    document.getElementById('btn-cancel-edit-plan').onclick = () => { 
        modal.classList.add('hidden'); 
        document.body.classList.remove('no-scroll'); 
    };
    
    document.getElementById('btn-save-edit-plan').onclick = () => {
        const id = parseInt(document.getElementById('edit-plan-id').value, 10);
        const name = document.getElementById('edit-plan-name').value.trim();
        
        const plan = AppState.plans.find(p => p.id === id);
        if (plan && name) {
            plan.name = name;
            saveAppData();
            modal.classList.add('hidden');
            document.body.classList.remove('no-scroll');
            renderPlans();
        }
    };

    setBackAction(() => history.back());
    
    // FAB: Apre modale creazione piano
    setFabAction(() => {
        document.getElementById('create-plan-name').value = '';
        document.getElementById('create-plan-modal').classList.remove('hidden');
        document.body.classList.add('no-scroll');
    });

    // Gestione Modale Creazione Piano
    document.getElementById('btn-cancel-create-plan').onclick = () => {
        document.getElementById('create-plan-modal').classList.add('hidden');
        document.body.classList.remove('no-scroll');
    };

    document.getElementById('btn-save-create-plan').onclick = () => {
        const name = document.getElementById('create-plan-name').value.trim();
        if (name) {
            const newPlan = { id: Date.now(), name: name, description: '', routines: [] };
            AppState.plans.push(newPlan);
            saveAppData();
            document.getElementById('create-plan-modal').classList.add('hidden');
            document.body.classList.remove('no-scroll');
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