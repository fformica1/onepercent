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
            <input type="text" inputmode="decimal" class="workout-input set-weight" value="${s.weight}" placeholder="-">
            <input type="number" class="workout-input set-reps" value="${s.reps}" placeholder="-">
        </div>
    `).join('');

    return `
    <div class="workout-card exercise-editor-card" data-exercise-id="${exercise.id}" data-muscle-group="${exercise.muscleGroup || 'Altro'}">
        <div class="editor-header" style="display: flex; align-items: center; margin-bottom: 10px;">
            <div class="drag-handle" style="padding: 0 10px 0 0;"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg></div>
            <h3 style="flex-grow: 1; margin: 0;">${exercise.name}</h3>
            <button type="button" class="action-btn delete-exercise-btn">
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
    window.scrollTo(0, 0);
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
        renderRoutines(plan);
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
                        : `
                            <div style="text-align: center; padding-top: 40px;">
                                <p style="color: var(--text-muted);">Nessun Esercizio in questa Routine.<br>Aggiungine uno con il pulsante +.</p>
                            </div>
                        `}
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
    let scrollInterval = null;
    let lastClientY = 0;

    const autoScrollLoop = () => {
        if (!draggedItem) return;

        const viewportHeight = window.innerHeight;
        const scrollZone = 100;
        const scrollSpeed = 10;

        if (lastClientY < scrollZone) {
            window.scrollBy(0, -scrollSpeed);
        } else if (lastClientY > viewportHeight - scrollZone) {
            window.scrollBy(0, scrollSpeed);
        }

        scrollInterval = requestAnimationFrame(autoScrollLoop);
    };

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
        lastClientY = clientY;
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

        scrollInterval = requestAnimationFrame(autoScrollLoop);

        document.addEventListener('touchmove', handleDragMove, { passive: false });
        document.addEventListener('mousemove', handleDragMove);
        document.addEventListener('touchend', handleDragEnd);
        document.addEventListener('mouseup', handleDragEnd);
    };

    const handleDragMove = (e) => {
        if (!draggedItem) return;
        e.preventDefault();
        const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
        lastClientY = clientY;
        
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
        if (scrollInterval) {
            cancelAnimationFrame(scrollInterval);
            scrollInterval = null;
        }

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
    exercisesContainer.addEventListener('input', (e) => {
        // Force dot for decimals in weight
        if (e.target.classList.contains('set-weight')) {
            e.target.value = e.target.value.replace(',', '.');
        }
        saveRoutineChanges();
    });

    // Handler per il FAB
    const fabHandler = () => {
        renderExerciseSelector((selectedNames) => {
            // Se ci sono 0 card di esercizi, pulisci il container (per rimuovere il messaggio di stato vuoto)
            if (exercisesContainer.querySelectorAll('.exercise-editor-card').length === 0) {
                exercisesContainer.innerHTML = '';
            }

            selectedNames.forEach(name => {
                const newExercise = { id: Date.now() + Math.random(), name: name, sets: 1, reps: '', rest: '90', weight: '', notes: '', series: [] };

                // Cerca l'ultima performance per questo esercizio per copiare i dati "prev"
                let lastPerformedSeries = null;
                let lastTimestamp = 0;

                const allPlans = [...(AppState.plans || []), ...(AppState.archivedPlans || [])];
                allPlans.forEach(plan => {
                    if (plan.routines) {
                        plan.routines.forEach(routine => {
                            if (routine.lastPerformed && routine.lastPerformed > lastTimestamp) {
                                if (routine.exercises) {
                                    const oldEx = routine.exercises.find(ex => ex.name === name);
                                    if (oldEx && oldEx.series && oldEx.series.some(s => s.prevWeight || s.prevReps)) {
                                        lastTimestamp = routine.lastPerformed;
                                        lastPerformedSeries = oldEx.series;
                                    }
                                }
                            }
                        });
                    }
                });

                if (lastPerformedSeries) {
                    newExercise.series = lastPerformedSeries.map(s => ({
                        weight: s.weight || '', // Copia anche i target
                        reps: s.reps || '',
                        prevWeight: s.prevWeight || '',
                        prevReps: s.prevReps || ''
                    }));
                    newExercise.sets = newExercise.series.length;
                }

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
                        exercisesContainer.innerHTML = `
                            <div style="text-align: center; padding-top: 40px;">
                                <p style="color: var(--text-muted);">Nessun Esercizio in questa Routine.<br>Aggiungine uno con il pulsante +.</p>
                            </div>
                        `;
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
                <input type="text" inputmode="decimal" class="workout-input set-weight" placeholder="-" value="${prevWeight}">
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