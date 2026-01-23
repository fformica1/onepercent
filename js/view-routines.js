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

// --- RENDER SELETTORE ESERCIZI ---
function renderExerciseSelector(onConfirm, onCancel, fromHistory = false) {
    document.querySelector('main').style.transform = '';
    document.querySelector('main').classList.remove('calendar-open');

    if (!fromHistory) {
        history.pushState({view: 'exerciseSelector'}, 'Seleziona Esercizi', '#exerciseSelector');
    }

    document.getElementById('btn-settings').classList.remove('visible');
    const container = Views.exerciseSelector;
    let selectedExercises = [];
    const MUSCLE_GROUPS = ['Tutti', 'Addome', 'Bicipiti', 'Dorso', 'Femorali', 'Glutei', 'Petto', 'Polpacci', 'Quadricipiti', 'Spalle', 'Tricipiti', 'Altro'];
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
            <input type="text" id="search-exercise" placeholder="Cerca..." style="width: 100%;">
            <div id="muscle-filter-chips" class="filter-chips-container">
                ${MUSCLE_GROUPS.map(g => `<button class="filter-chip ${currentFilter === g ? 'active' : ''}" data-group="${g}">${g}</button>`).join('')}
            </div>
        </div>

        <div id="selector-list-container" class="selector-list"></div>

        <div id="floating-confirm-container" class="floating-confirm-container hidden">
            <button id="btn-confirm-selection" class="primary-btn">Aggiungi</button>
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
    document.getElementById('search-exercise').addEventListener('input', (e) => {
        currentSearch = e.target.value;
        renderList();
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
                `Sei sicuro di voler eliminare "${exercise.name}" dal database? Verrà rimosso da tutte le routine.`,
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
    const modal = document.getElementById('exercise-modal');
    
    function openModal(exercise = null) {
        modal.classList.remove('hidden');
        document.body.classList.add('no-scroll');
        if (exercise) {
            document.getElementById('modal-title').textContent = "Modifica Esercizio";
            document.getElementById('modal-ex-id').value = exercise.id;
            document.getElementById('modal-ex-name').value = exercise.name;
            document.getElementById('modal-ex-group').value = exercise.muscleGroup;
        } else {
            document.getElementById('modal-title').textContent = "Nuovo Esercizio";
            document.getElementById('modal-ex-id').value = "";
            document.getElementById('modal-ex-name').value = "";
            document.getElementById('modal-ex-group').value = "Petto";
        }
    }

    document.getElementById('modal-cancel').addEventListener('click', () => { 
        modal.classList.add('hidden'); 
        document.body.classList.remove('no-scroll'); 
    });
    
    document.getElementById('modal-save').addEventListener('click', () => {
        const id = document.getElementById('modal-ex-id').value;
        const name = document.getElementById('modal-ex-name').value.trim();
        const group = document.getElementById('modal-ex-group').value;

        if (!name) return;

        if (id) { // Modifica
            const ex = AppState.exercises.find(e => e.id == id);
            if (ex) { ex.name = name; ex.muscleGroup = group; }
        } else { // Crea
            AppState.exercises.push({ id: Date.now(), name: name, muscleGroup: group });
        }
        saveAppData();
        modal.classList.add('hidden');
        document.body.classList.remove('no-scroll');
        renderList();
    });

    // FAB: Apre Modale Creazione
    setBackAction(() => history.back());
    setFabAction(() => openModal(null)); // Il FAB ora apre la modale di creazione

    switchView('exerciseSelector');
}

// --- RENDER EDITOR ROUTINE ---
function renderExerciseEditorHTML(exercise) {
    // Inizializza series se non esiste (migrazione dati legacy)
    let seriesData = exercise.series || [];
    if (seriesData.length === 0) {
        const setsCount = parseInt(exercise.sets) || 3;
        for(let i=0; i<setsCount; i++) {
            seriesData.push({
                reps: (exercise.reps !== undefined && exercise.reps !== null) ? exercise.reps : '',
                weight: (exercise.weight !== undefined && exercise.weight !== null) ? exercise.weight : ''
            });
        }
    }

    const rowsHtml = seriesData.map((s, i) => `
        <div class="workout-set-row editor-set-row editor-grid-layout">
            <span class="set-number">${i + 1}</span>
            <input type="number" class="workout-input set-weight" value="${s.weight}" placeholder="-">
            <input type="number" class="workout-input set-reps" value="${s.reps}" placeholder="-">
        </div>
    `).join('');

    return `
    <div class="workout-card exercise-editor-card" data-exercise-id="${exercise.id}" data-muscle-group="${exercise.muscleGroup || 'Altro'}">
        <div class="editor-header" style="display: flex; align-items: center; margin-bottom: 10px;">
            <div class="drag-handle" style="padding: 0 10px 0 0;"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg></div>
            <h3 style="flex-grow: 1; margin: 0;">${exercise.name}</h3>
            <button type="button" class="delete-exercise-btn" style="color: var(--text-muted);">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
        </div>
        
        <input type="text" class="workout-notes-input" data-field="notes" value="${exercise.notes || ''}" placeholder="Note...">
        
        <div class="workout-rest-info">
             Recupero: <input type="number" class="workout-rest-input" data-field="rest" value="${exercise.rest || ''}" placeholder="90"> s
        </div>

        <div class="editor-sets-table">
            <div class="workout-sets-header editor-grid-layout">
                <span>Set</span>
                <span>Kg</span>
                <span>Reps</span>
            </div>
            <div class="editor-sets-container">
                ${rowsHtml}
            </div>
            <div class="workout-quick-actions" style="display: flex; justify-content: center; gap: 20px; margin-top: 15px;">
                <button type="button" class="quick-btn btn-remove-set">-</button>
                <button type="button" class="quick-btn btn-add-set">+</button>
            </div>
        </div>
    </div>
    `;
}

function renderRoutineEditor(routineId, planId, fromHistory = false) {
    document.querySelector('main').style.transform = '';
    document.querySelector('main').classList.remove('calendar-open');

    if (!fromHistory) {
        history.pushState({view: 'routineEditor', routineId, planId}, 'Editor Routine', '#routineEditor');
    }

    document.getElementById('btn-settings').classList.remove('visible');
    const container = Views.routineEditor;
    const plan = AppState.plans.find(p => p.id === planId);
    if (!plan) return; // Safety check
    const routine = plan.routines.find(r => r.id === routineId);

    if (!routine) {
        renderPlanDetail(plan);
        return;
    }

    // Funzione di salvataggio automatico
    const saveRoutineChanges = () => {
        const exerciseCards = document.querySelectorAll('.exercise-editor-card');
        const updatedExercises = [];

        exerciseCards.forEach(card => {
            const exId = parseFloat(card.dataset.exerciseId);
            const originalExercise = routine.exercises.find(e => e.id === exId);

            const setRows = card.querySelectorAll('.editor-set-row');
            const newSeries = [];
            setRows.forEach((row, index) => {
                const originalSeriesData = (originalExercise && originalExercise.series && originalExercise.series[index]) ? originalExercise.series[index] : {};
                newSeries.push({
                    ...originalSeriesData, // Mantiene prevWeight, completed, etc.
                    weight: row.querySelector('.set-weight').value, // Aggiorna il target weight
                    reps: row.querySelector('.set-reps').value      // Aggiorna il target reps
                });
            });
            
            const exerciseDataFromDOM = {
                id: exId,
                name: card.querySelector('h3').textContent,
                muscleGroup: card.dataset.muscleGroup,
                notes: card.querySelector('[data-field="notes"]').value,
                rest: card.querySelector('[data-field="rest"]').value,
                series: newSeries,
                sets: newSeries.length,
                reps: newSeries.length > 0 ? newSeries[0].reps : '',
                weight: newSeries.length > 0 ? newSeries[0].weight : ''
            };
            
            // Unisce i dati originali con quelli modificati nel DOM
            const finalExercise = originalExercise ? { ...originalExercise, ...exerciseDataFromDOM } : exerciseDataFromDOM;
            
            updatedExercises.push(finalExercise);
        });

        const planIndex = AppState.plans.findIndex(p => p.id === planId);
        if (planIndex !== -1) {
            const routineIndex = AppState.plans[planIndex].routines.findIndex(r => r.id === routineId);
            if (routineIndex !== -1) {
                AppState.plans[planIndex].routines[routineIndex].exercises = updatedExercises;
                saveAppData();
            }
        }
    };

    container.innerHTML = `
        <div id="form-edit-routine">
            <div class="form-group">
                <h2 style="color:var(--primary); margin-bottom:10px; text-align: center;">${routine.name}</h2>
            </div>
            
            <div class="form-group">
                <div id="edit-exercises-container">
                    ${routine.exercises && routine.exercises.length > 0 
                        ? routine.exercises.map(ex => renderExerciseEditorHTML(ex)).join('') 
                        : '<p class="empty-state">Nessun esercizio in questa routine.</p>'}
                </div>
            </div>
        </div>
    `;

    const exercisesContainer = document.getElementById('edit-exercises-container');

    // Drag and Drop Logic for Exercises
    let draggedItem = null;
    let placeholder = null;
    let dragOffsetY = 0;
    const containerEl = exercisesContainer;

    const handleDragStart = (e) => {
        const handle = e.target.closest('.drag-handle');
        if (!handle) return;
        if (e.type === 'touchstart') e.preventDefault();

        const card = handle.closest('.exercise-editor-card');
        if (!card) return;

        draggedItem = card;
        
        // 1. Calcola offset basandosi sulla card ATTUALE (espansa)
        const rect = card.getBoundingClientRect();
        const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
        dragOffsetY = clientY - rect.top;
        
        // 2. Crea Placeholder (Clone per mantenere dimensioni identiche)
        placeholder = card.cloneNode(true);
        placeholder.classList.add('dragging-placeholder');
        
        // 3. Prepara la card reale per il trascinamento (Fixed)
        draggedItem.style.width = `${rect.width}px`;
        draggedItem.style.height = 'auto'; // Lascia che si adatti al contenuto compattato
        draggedItem.style.position = 'fixed';
        draggedItem.style.zIndex = '1000';
        draggedItem.style.top = `${rect.top}px`;
        draggedItem.style.left = `${rect.left}px`;
        draggedItem.style.margin = '0';
        draggedItem.classList.add('dragging-item-active');
        
        // Inserisci placeholder PRIMA di attivare dragging-active
        containerEl.insertBefore(placeholder, draggedItem);
        
        // 4. Compatta la lista
        containerEl.classList.add('dragging-active');

        document.addEventListener('touchmove', handleDragMove, { passive: false });
        document.addEventListener('mousemove', handleDragMove);
        document.addEventListener('touchend', handleDragEnd);
        document.addEventListener('mouseup', handleDragEnd);
    };

    const handleDragMove = (e) => {
        if (!draggedItem) return;
        e.preventDefault();
        const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
        
        // Muovi Card Reale
        draggedItem.style.top = `${clientY - dragOffsetY}px`;

        // Trova dove posizionare il placeholder
        // Escludiamo draggedItem e placeholder dalla lista dei target
        const siblings = [...containerEl.querySelectorAll('.exercise-editor-card:not(.dragging-item-active):not(.dragging-placeholder)')];
        
        const nextSibling = siblings.find(sibling => {
            const box = sibling.getBoundingClientRect();
            return clientY < box.top + box.height / 2;
        });

        // Ottimizzazione: se la posizione non cambia, non fare nulla
        const currentNextSibling = placeholder.nextElementSibling;
        if (nextSibling === currentNextSibling) return;

        // FLIP Animation: 1. Capture positions (First)
        const state = siblings.map(el => ({ el, top: el.getBoundingClientRect().top }));

        // 2. Apply DOM change (Last)
        if (nextSibling) {
            containerEl.insertBefore(placeholder, nextSibling);
        } else {
            containerEl.appendChild(placeholder);
        }

        // 3. Invert & Play
        state.forEach(obj => {
            const newTop = obj.el.getBoundingClientRect().top;
            const diff = obj.top - newTop;
            if (diff !== 0) {
                obj.el.style.transition = 'none';
                obj.el.style.transform = `translateY(${diff}px)`;
                // Force reflow
                void obj.el.offsetHeight;
                obj.el.style.transition = 'transform 0.3s cubic-bezier(0.2, 0, 0, 1)';
                obj.el.style.transform = '';
            }
        });
    };

    const handleDragEnd = () => {
        if (draggedItem) {
            // Ripristina la card nella posizione del placeholder
            if (placeholder && placeholder.parentNode) {
                containerEl.insertBefore(draggedItem, placeholder);
                placeholder.remove();
            }
            placeholder = null;

            // Reset stili
            draggedItem.style.position = '';
            draggedItem.style.zIndex = '';
            draggedItem.style.top = '';
            draggedItem.style.left = '';
            draggedItem.style.width = '';
            draggedItem.style.height = '';
            draggedItem.style.margin = '';
            draggedItem.classList.remove('dragging-item-active');
            
            draggedItem = null;
        }
        containerEl.classList.remove('dragging-active');

        document.removeEventListener('touchmove', handleDragMove);
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('touchend', handleDragEnd);
        document.removeEventListener('mouseup', handleDragEnd);
        
        // Salva il nuovo ordine
        saveRoutineChanges();
    };

    exercisesContainer.querySelectorAll('.drag-handle').forEach(handle => {
        handle.addEventListener('touchstart', handleDragStart, { passive: false });
        handle.addEventListener('mousedown', handleDragStart);
    });

    // Smart Input Logic (Auto-clear on focus, restore on empty blur)
    exercisesContainer.addEventListener('focusin', (e) => {
        if (e.target.classList.contains('set-weight') || e.target.classList.contains('set-reps') || e.target.dataset.field === 'rest') {
            e.target.dataset.prevValue = e.target.value;
            e.target.value = '';
            
            // Nascondi placeholder
            if (e.target.placeholder) {
                e.target.dataset.prevPlaceholder = e.target.placeholder;
                e.target.placeholder = '';
            }
        }
    });
    exercisesContainer.addEventListener('focusout', (e) => {
        if (e.target.classList.contains('set-weight') || e.target.classList.contains('set-reps') || e.target.dataset.field === 'rest') {
            // Ripristina placeholder
            if (e.target.dataset.prevPlaceholder) {
                e.target.placeholder = e.target.dataset.prevPlaceholder;
            }
            if (e.target.value.trim() === '') {
                e.target.value = e.target.dataset.prevValue || '';
            }
        }
    });

    // Auto-save su input
    exercisesContainer.addEventListener('input', () => {
        saveRoutineChanges();
    });

    // Handler per il FAB
    const fabHandler = () => {
        renderExerciseSelector((selectedNames) => {
            const emptyState = exercisesContainer.querySelector('.empty-state');
            if (emptyState) emptyState.remove();

            selectedNames.forEach(name => {
                const newExercise = { id: Date.now() + Math.random(), name: name, sets: 1, reps: '', rest: '', weight: '', notes: '', series: [] };
                const div = document.createElement('div');
                div.innerHTML = renderExerciseEditorHTML(newExercise);
                const newCard = div.firstElementChild;

                const handle = newCard.querySelector('.drag-handle');
                handle.addEventListener('touchstart', handleDragStart, { passive: false });
                handle.addEventListener('mousedown', handleDragStart);

                exercisesContainer.appendChild(newCard);
            });
            saveRoutineChanges();
            // Torna indietro all'editor (chiudendo il selettore nella history)
            history.back();
        }, () => history.back()); // OnCancel ora usa history.back()
    };

    setFabAction(fabHandler);

    // Previene la chiusura della tastiera quando si usano i pulsanti +/-
    const preventFocusLoss = (e) => {
        if (e.target.classList.contains('btn-add-set') || e.target.classList.contains('btn-remove-set')) {
            e.preventDefault();
            if (e.type === 'touchstart') {
                e.target.click();
            }
        }
    };
    exercisesContainer.addEventListener('mousedown', preventFocusLoss);
    exercisesContainer.addEventListener('touchstart', preventFocusLoss, { passive: false });

    exercisesContainer.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.delete-exercise-btn');
        if (deleteBtn) {
            const card = deleteBtn.closest('.exercise-editor-card');
            const exerciseName = card.querySelector('h3').textContent;
            showConfirmationModal(
                "Rimuovi Esercizio",
                `Sei sicuro di voler rimuovere "${exerciseName}" da questa routine?`,
                () => {
                    card.remove();
                    if (exercisesContainer.querySelectorAll('.exercise-editor-card').length === 0) {
                        exercisesContainer.innerHTML = '<p class="empty-state">Nessun esercizio in questa routine.</p>';
                    }
                    saveRoutineChanges();
                }
            );
        }

        // Aggiungi Serie
        if (e.target.classList.contains('btn-add-set')) {
            const card = e.target.closest('.exercise-editor-card');
            const container = card.querySelector('.editor-sets-container');
            const currentSets = container.children.length;

            // Copia valori dalla serie precedente
            let prevWeight = '';
            let prevReps = '';
            if (currentSets > 0) {
                const lastRow = container.lastElementChild;
                prevWeight = lastRow.querySelector('.set-weight').value;
                prevReps = lastRow.querySelector('.set-reps').value;
            }

            const newRow = document.createElement('div');
            newRow.className = 'workout-set-row editor-set-row editor-grid-layout';
            newRow.innerHTML = `
                <span class="set-number">${currentSets + 1}</span>
                <input type="number" class="workout-input set-weight" placeholder="-" value="${prevWeight}">
                <input type="number" class="workout-input set-reps" placeholder="-" value="${prevReps}">
            `;
            container.appendChild(newRow);
            saveRoutineChanges();
        }

        // Rimuovi Serie
        if (e.target.classList.contains('btn-remove-set')) {
            const card = e.target.closest('.exercise-editor-card');
            const container = card.querySelector('.editor-sets-container');
            if (container.children.length > 1) {
                container.lastElementChild.remove();
                saveRoutineChanges();
            }
        }
    });

    setBackAction(() => history.back());
    // Il FAB è configurato sopra
    switchView('routineEditor');

    // Check for overflow and animate (Routine Editor)
    setTimeout(() => {
        document.querySelectorAll('.exercise-editor-card h3').forEach(el => {
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