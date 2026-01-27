// --- RENDER VISTA ROUTINES (DETTAGLIO PIANO) ---
function renderRoutines(plan, fromHistory = false) {
    document.body.classList.remove('no-scroll');
    document.querySelector('main').style.transform = '';
    document.querySelector('main').classList.remove('calendar-open');

    if (!fromHistory) {
        history.pushState({view: 'routines', planId: plan.id}, plan.name, '#routines');
    }

    document.getElementById('btn-settings').classList.remove('visible');
    const container = Views.routines;

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
                openModal('edit-routine-modal-plan');
            });

            card.querySelector('.delete-routine-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                const routineId = routine.id;

                // Impedisci eliminazione se l'allenamento è in corso
                if (currentWorkoutSession && currentWorkoutSession.routineId === routineId) {
                    showAlertModal("Azione Negata", "Impossibile eliminare la Routine: l'allenamento è in corso.");
                } else {
                    showConfirmationModal(
                        "Elimina Routine",
                        `Sei sicuro di voler eliminare la routine "${routine.name}"?`,
                        () => {
                            plan.routines = plan.routines.filter(r => r.id !== routineId);
                            saveAppData();
                            renderRoutines(plan);
                        }
                    );
                }
            });

            routineListContainer.appendChild(card);
        });
    } else {
        routineListContainer.innerHTML = `
            <div style="text-align: center; padding-top: 40px;">
                <p style="color: var(--text-muted);">Nessuna Routine in questo Piano.</p>
            </div>
        `;
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
    document.getElementById('btn-cancel-edit-routine-plan').onclick = () => { 
        closeModal('edit-routine-modal-plan');
    };
    
    document.getElementById('btn-save-edit-routine-plan').onclick = () => {
        const id = parseFloat(document.getElementById('edit-routine-id-plan').value);
        const name = document.getElementById('edit-routine-name-plan').value.trim();
        
        const routine = plan.routines.find(r => r.id === id);
        if (routine && name) {
            routine.name = name;
            saveAppData();
            closeModal('edit-routine-modal-plan');
            renderRoutines(plan);
        }
    };

    setBackAction(() => history.back());
    
    // FAB: Apre modale creazione routine
    setFabAction(() => {
        document.getElementById('create-routine-name').value = '';
        openModal('create-routine-modal');
    });

    // Gestione Modale Creazione Routine
    document.getElementById('btn-cancel-create-routine').onclick = () => {
        closeModal('create-routine-modal');
    };

    document.getElementById('btn-save-create-routine').onclick = () => {
        const name = document.getElementById('create-routine-name').value.trim();
        if (name) {
            const newRoutine = { id: Date.now(), name: name, exercises: [] };
            if (!plan.routines) plan.routines = [];
            plan.routines.push(newRoutine);
            saveAppData();
            closeModal('create-routine-modal');
            renderRoutines(plan);
        }
    };

    switchView('routines');

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