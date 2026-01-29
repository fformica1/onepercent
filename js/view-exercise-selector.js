// --- RENDER SELETTORE ESERCIZI ---
function renderExerciseSelector(onConfirm, onCancel, fromHistory = false) {
    window.scrollTo(0, 0);
    document.querySelector('main').style.transform = '';
    document.querySelector('main').classList.remove('calendar-open');

    if (!fromHistory) {
        history.pushState({view: 'exerciseSelector'}, 'Seleziona Esercizi', '#exerciseSelector');
    }

    document.getElementById('btn-settings').classList.remove('visible');
    const container = Views.exerciseSelector;
    let selectedExercises = [];
    const MUSCLE_GROUPS = ['Tutti', 'Addome', 'Avambracci', 'Bicipiti', 'Deltoidi Posteriori', 'Dorso', 'Femorali', 'Glutei', 'Petto', 'Polpacci', 'Quadricipiti', 'Spalle', 'Trapezio', 'Tricipiti', 'Altro'];
    let currentFilter = 'Tutti';
    let currentSearch = '';

    // Cleanup modali precedenti se presenti nel body
    const modalIds = ['exercise-modal'];
    modalIds.forEach(id => { const el = document.getElementById(id); if(el) el.remove(); });

    const renderList = () => {
        const listContainer = document.getElementById('selector-list-container');
        
        // Filtra esercizi
        const filtered = AppState.exercises.filter(ex => {
            const matchGroup = currentFilter === 'Tutti' || ex.muscleGroup === currentFilter;
            const matchSearch = ex.name.toLowerCase().includes(currentSearch.toLowerCase());
            return matchGroup && matchSearch;
        });

        // Ordina alfabeticamente
        filtered.sort((a, b) => a.name.localeCompare(b.name));

        listContainer.innerHTML = filtered.map(ex => `
            <div class="selector-item ${selectedExercises.includes(ex.name) ? 'selected' : ''}" data-name="${ex.name}" data-id="${ex.id}">
                <div class="exercise-checkbox-wrapper" style="display:flex; align-items:center; flex-grow:1; cursor:pointer;">
                    <div class="minimal-checkbox ${selectedExercises.includes(ex.name) ? 'checked' : ''}"></div>
                    <div style="display:flex; flex-direction:column; margin-left:15px; min-width: 0;">
                        <span class="exercise-name">${ex.name}</span>
                        <span class="exercise-group-name">${ex.muscleGroup}</span>
                    </div>
                </div>
                <div class="selector-actions">
                    <button class="action-btn edit-btn" data-id="${ex.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                    </button>
                    <button class="action-btn delete-btn" data-id="${ex.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            </div>
        `).join('');

        // Gestione bottone conferma flottante
        const confirmContainer = document.getElementById('floating-confirm-container');
        if (selectedExercises.length > 0) {
            confirmContainer.classList.remove('hidden');
            document.getElementById('btn-confirm-selection').textContent = `Aggiungi (${selectedExercises.length})`;
        } else {
            confirmContainer.classList.add('hidden');
        }

        // Check for overflow and animate (Exercise Selector)
        setTimeout(() => {
            listContainer.querySelectorAll('.selector-item .exercise-name').forEach(el => {
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
    };

    // HTML Struttura
    container.innerHTML = `
        <div class="view-header" style="justify-content: center;">
            <h2>Seleziona Esercizi</h2>
        </div>
        
        <div class="selector-controls" style="flex-direction: column;">
            <input type="text" id="search-exercise" placeholder="Cerca..." style="width: 100%; border-radius: 12px;">
            <div id="muscle-filter-chips" class="filter-chips-container">
                ${MUSCLE_GROUPS.map(g => `<button class="filter-chip ${currentFilter === g ? 'active' : ''}" data-group="${g}" style="border-radius: 20px;">${g}</button>`).join('')}
            </div>
        </div>

        <div id="selector-list-container" class="selector-list"></div>

        <div id="floating-confirm-container" class="floating-confirm-container hidden">
            <button id="btn-confirm-selection" class="primary-btn" style="font-weight: normal;">Aggiungi</button>
        </div>

        <!-- Modale Crea/Modifica -->
        <div id="exercise-modal" class="modal-overlay hidden">
            <div class="modal-content">
                <h3 id="modal-title" style="margin-bottom:15px;">Nuovo Esercizio</h3>
                <input type="hidden" id="modal-ex-id">
                <div class="form-group">
                    <label class="form-label">Nome</label>
                    <input type="text" id="modal-ex-name" class="form-input">
                </div>
                <div class="form-group">
                    <label class="form-label">Gruppo Muscolare</label>
                    <select id="modal-ex-group" class="form-input">
                        ${MUSCLE_GROUPS.filter(g => g !== 'Tutti').map(g => `<option value="${g}">${g}</option>`).join('')}
                    </select>
                </div>
                <div class="modal-actions">
                    <button id="modal-cancel" class="secondary-btn">Annulla</button>
                    <button id="modal-save" class="primary-btn">Salva</button>
                </div>
            </div>
        </div>
    `;

    // Sposta le modali nel body per gestire correttamente lo z-index
    modalIds.forEach(id => document.body.appendChild(document.getElementById(id)));

    renderList();

    // --- EVENT LISTENERS ---

    // Filtri
    const searchInput = document.getElementById('search-exercise');
    searchInput.addEventListener('input', (e) => {
        currentSearch = e.target.value;
        renderList();
    });
    searchInput.addEventListener('focus', (e) => {
        if (e.target.value) {
            e.target.value = '';
            currentSearch = '';
            renderList();
        }
    });

    document.getElementById('muscle-filter-chips').addEventListener('click', (e) => {
        if (e.target.classList.contains('filter-chip')) {
            currentFilter = e.target.dataset.group;
            // Aggiorna UI attiva
            document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            e.target.classList.add('active');
            renderList();
        }
    });

    // Gestione Lista (Selezione, Edit, Delete)
    document.getElementById('selector-list-container').addEventListener('click', (e) => {
        // Delete
        const deleteBtn = e.target.closest('.delete-btn');
        if (deleteBtn) {
            e.stopPropagation();
            const id = parseFloat(deleteBtn.dataset.id);
            const exercise = AppState.exercises.find(ex => ex.id === id);
            if (!exercise) return;

            showConfirmationModal(
                "Elimina Esercizio",
                `Sei sicuro di voler eliminare "${exercise.name}"? Verrà rimosso da tutte le routine.`,
                () => {
                    AppState.exercises = AppState.exercises.filter(ex => ex.id !== id);
                    // Rimuove l'esercizio da tutte le routine in tutti i piani
                    AppState.plans.forEach(plan => {
                        plan.routines.forEach(routine => {
                            routine.exercises = routine.exercises.filter(exInRoutine => exInRoutine.id !== id);
                        });
                    });
                    saveAppData();
                    renderList();
                }
            );
            return;
        }

        // Edit
        const editBtn = e.target.closest('.edit-btn');
        if (editBtn) {
            e.stopPropagation();
            const id = parseFloat(editBtn.dataset.id);
            const ex = AppState.exercises.find(e => e.id === id);
            openModal(ex);
            return;
        }

        // Selezione
        const checkboxWrapper = e.target.closest('.exercise-checkbox-wrapper');
        if (checkboxWrapper) {
            const name = checkboxWrapper.closest('.selector-item').dataset.name;
            if (selectedExercises.includes(name)) {
                selectedExercises = selectedExercises.filter(ex => ex !== name);
            } else {
                selectedExercises.push(name);
            }
            renderList(); // Rerender per aggiornare stato UI
        }
    });

    // Conferma Selezione
    document.getElementById('btn-confirm-selection').addEventListener('click', () => {
        onConfirm(selectedExercises);
    });

    // --- MODALE ---
    
    function openModal(exercise = null) {
        window.openModal('exercise-modal'); // Usa la funzione globale
        if (exercise) {
            document.getElementById('modal-title').textContent = "Modifica Esercizio";
            document.getElementById('modal-ex-id').value = exercise.id;
            document.getElementById('modal-ex-name').value = exercise.name;
            document.getElementById('modal-ex-group').value = exercise.muscleGroup;
        } else {
            document.getElementById('modal-title').textContent = "Nuovo Esercizio";
            document.getElementById('modal-ex-id').value = "";
            document.getElementById('modal-ex-name').value = "";
            document.getElementById('modal-ex-group').value = "Altro";
        }
    }

    document.getElementById('modal-cancel').addEventListener('click', () => { 
        closeModal('exercise-modal');
    });
    
    document.getElementById('modal-save').addEventListener('click', () => {
        const id = document.getElementById('modal-ex-id').value;
        const name = document.getElementById('modal-ex-name').value.trim();
        const group = document.getElementById('modal-ex-group').value;

        if (!name) return;

        if (id) { // Modifica
            const numericId = parseFloat(id);
            const ex = AppState.exercises.find(e => e.id === numericId);
            if (ex) { 
                const oldName = ex.name;
                ex.name = name; 
                ex.muscleGroup = group; 

                // 1. Aggiorna la selezione corrente se l'esercizio era selezionato (Fix bug conteggio)
                const selIndex = selectedExercises.indexOf(oldName);
                if (selIndex !== -1) {
                    selectedExercises[selIndex] = name;
                }

                // 2. Propaga la modifica a tutte le routine esistenti (Preserva storico e coerenza)
                AppState.plans.forEach(plan => {
                    if (plan.routines) {
                        plan.routines.forEach(routine => {
                            if (routine.exercises) {
                                routine.exercises.forEach(routineEx => {
                                    if (routineEx.name === oldName) {
                                        routineEx.name = name;
                                        routineEx.muscleGroup = group;
                                    }
                                });
                            }
                        });
                    }
                });
            }
        } else { // Crea
            AppState.exercises.push({ id: Date.now(), name: name, muscleGroup: group });
        }
        saveAppData();
        closeModal('exercise-modal');
        renderList();
    });

    // FAB: Apre Modale Creazione
    setBackAction(() => history.back());
    setFabAction(() => openModal(null)); // Il FAB ora apre la modale di creazione

    switchView('exerciseSelector');
}