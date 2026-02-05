function renderCalendar() {
    // Cleanup modale dettagli sessione se esiste (per evitare duplicati nel body)
    const existingModal = document.getElementById('session-details-modal');
    if (existingModal) existingModal.remove();

    const container = document.getElementById('view-calendar');
    container.classList.remove('hidden');
    const now = new Date();

    // Nomi mesi e giorni
    const monthNames = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
    const dayNames = ["L", "M", "M", "G", "V", "S", "D"];

    // Mappa dati allenamenti per data: 'YYYY-MM-DD' -> Array di sessioni
    const historyMap = {};

    const allPlans = [...(AppState.plans || []), ...(AppState.archivedPlans || [])];

    if (allPlans) {
        allPlans.forEach(plan => {
            if (plan.routines) {
                plan.routines.forEach(routine => {
                    // Raccogli tutte le date in cui questa routine o i suoi esercizi sono stati eseguiti
                    const dates = new Set();
                    if (routine.history) routine.history.forEach(h => dates.add(h.date));
                    if (routine.exercises) {
                        routine.exercises.forEach(ex => {
                            if (ex.history) ex.history.forEach(h => dates.add(h.date));
                        });
                    }

                    dates.forEach(date => {
                        const dateKey = new Date(date).toDateString();
                        if (!historyMap[dateKey]) historyMap[dateKey] = [];

                        // 1. Identifica le sessioni esplicite (da routine.history)
                        const explicitSessions = [];
                        if (routine.history) {
                            routine.history.filter(h => h.date === date).forEach(h => {
                                explicitSessions.push({
                                    planId: plan.id,
                                    routineId: routine.id,
                                    routineName: routine.name,
                                    duration: h.duration,
                                    timestamp: h.timestamp,
                                    exercises: []
                                });
                            });
                        }

                        // 2. Distribuisci gli esercizi nelle sessioni
                        const orphanExercises = []; 

                        if (routine.exercises) {
                            routine.exercises.forEach(ex => {
                                if (ex.history) {
                                    const logs = ex.history.filter(h => h.date === date);
                                    logs.forEach(l => {
                                        let matched = false;
                                        
                                        const exercisePayload = {
                                            name: ex.name,
                                            series: l.seriesData,
                                            defaultReps: (l.targetReps !== undefined) ? l.targetReps : ex.reps,
                                            defaultWeight: (l.targetWeight !== undefined) ? l.targetWeight : ex.weight
                                        };
                                        
                                        if (l.timestamp) {
                                            const session = explicitSessions.find(s => s.timestamp === l.timestamp);
                                            if (session) {
                                                session.exercises.push(exercisePayload);
                                                matched = true;
                                            }
                                        } else {
                                            // Legacy: cerca sessione senza timestamp
                                            const session = explicitSessions.find(s => !s.timestamp);
                                            if (session) {
                                                session.exercises.push(exercisePayload);
                                                matched = true;
                                            }
                                        }

                                        if (!matched) {
                                            orphanExercises.push({ ...exercisePayload, timestamp: l.timestamp });
                                        }
                                    });
                                }
                            });
                        }

                        // 3. Aggiungi sessioni esplicite che hanno esercizi
                        explicitSessions.forEach(s => {
                            if (s.exercises.length > 0) {
                                historyMap[dateKey].push({
                                    planId: s.planId,
                                    routineId: s.routineId,
                                    routineName: s.routineName,
                                    duration: s.duration,
                                    exercises: s.exercises,
                                    timestamp: s.timestamp,
                                    dateString: date
                                });
                            }
                        });

                        // 4. Gestisci orfani (crea sessioni implicite)
                        const orphanGroups = {}; 
                        orphanExercises.forEach(exData => {
                            const key = exData.timestamp || 'legacy';
                            if (!orphanGroups[key]) orphanGroups[key] = [];
                            orphanGroups[key].push(exData);
                        });

                        Object.keys(orphanGroups).forEach(key => {
                            historyMap[dateKey].push({
                                planId: plan.id,
                                routineId: routine.id,
                                routineName: routine.name,
                                duration: 0, 
                                exercises: orphanGroups[key],
                                timestamp: key === 'legacy' ? 0 : parseInt(key),
                                dateString: date
                            });
                        });
                    });
                });
            }
        });
    }

    let html = `
        <div style="position: relative;">
            <button id="cal-prev-btn" class="calendar-nav-btn prev">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <button id="cal-next-btn" class="calendar-nav-btn next">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
            <div class="calendar-scroller">
    `;

    // Genera ultimi 6 mesi (incluso corrente)
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const year = d.getFullYear();
        const month = d.getMonth();

        // Costruisci griglia mese
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const startOffset = firstDay === 0 ? 6 : firstDay - 1;

        html += `<div class="calendar-month-card">
            <div class="calendar-header">
                <h3>${monthNames[month]} ${year}</h3>
            </div>
            <div class="calendar-grid">
                ${dayNames.map(dn => `<div class="calendar-day-label">${dn}</div>`).join('')}
        `;

        // Celle vuote iniziali
        for (let j = 0; j < startOffset; j++) {
            html += `<div></div>`;
        }

        // Giorni
        for (let day = 1; day <= daysInMonth; day++) {
            const dateObj = new Date(year, month, day);
            const isToday = (day === now.getDate() && month === now.getMonth() && year === now.getFullYear());
            const dateKey = dateObj.toDateString();
            const hasWorkout = !!historyMap[dateKey];
            
            // Aggiungi data-date per il click (sempre)
            const dateAttr = `data-date="${dateKey}"`;
            html += `<div class="calendar-day ${isToday ? 'today' : ''} ${hasWorkout ? 'has-workout' : ''}" ${dateAttr}>${day}</div>`;
        }

        html += `</div></div>`; // Chiudi grid e card
    }

    html += `</div></div>`; // Chiudi scroller e wrapper
    
    // Container per il riepilogo (inizialmente vuoto/nascosto)
    html += `<div id="calendar-summary-container"></div>`;
    
    // Modale Dettagli Sessione
    html += `
        <div id="session-details-modal" class="modal-overlay hidden">
            <div class="modal-content" style="max-height: 80vh; display: flex; flex-direction: column; padding: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 10px;">
                    <h3 id="sd-routine-name" style="margin: 0; font-size: 1.2rem; color: var(--primary);">Routine</h3>
                    <span id="sd-duration" style="font-size: 0.9rem; color: var(--text-muted); font-weight: 500;">0 min</span>
                </div>
                <div id="sd-exercises-list" style="overflow-y: auto; flex-grow: 1;">
                    <!-- Content injected via JS -->
                </div>
                <div class="modal-actions" style="margin-top: 20px; justify-content: flex-end;">
                    <button id="btn-close-session-details" class="primary-btn" style="width: 100%;">Chiudi</button>
                </div>
            </div>
        </div>
    `;

    container.innerHTML = html;

    // Scrolla all'ultimo mese (corrente)
    const scroller = container.querySelector('.calendar-scroller');
    if (scroller) scroller.scrollLeft = scroller.scrollWidth;

    // Sposta la modale nel body per gestire correttamente lo z-index
    const modalEl = document.getElementById('session-details-modal');
    if (modalEl) document.body.appendChild(modalEl);

    // Gestione pulsanti navigazione
    const prevBtn = container.querySelector('#cal-prev-btn');
    const nextBtn = container.querySelector('#cal-next-btn');
    
    if (prevBtn && nextBtn && scroller) {
        prevBtn.addEventListener('click', (e) => {
            scroller.scrollBy({ left: -scroller.clientWidth, behavior: 'smooth' });
        });
        nextBtn.addEventListener('click', (e) => {
            scroller.scrollBy({ left: scroller.clientWidth, behavior: 'smooth' });
        });
    }

    // Event Listener per TUTTI i giorni
    container.querySelectorAll('.calendar-day').forEach(dayEl => {
        dayEl.addEventListener('click', (e) => {
            // Rimuovi selezione precedente
            container.querySelectorAll('.calendar-day.selected').forEach(el => el.classList.remove('selected'));
            dayEl.classList.add('selected');

            const dateKey = dayEl.dataset.date;
            const sessions = historyMap[dateKey]; // Ora è un array
            const summaryContainer = document.getElementById('calendar-summary-container');
            
            if (sessions && sessions.length > 0) {
                
                // Ordina le sessioni dalla più recente alla meno recente
                sessions.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                
                const cardsHtml = sessions.map((session, index) => {
                    // Formatta durata
                    let durationText = '';
                    if (session.duration > 0) {
                        const minutes = Math.floor(session.duration / 60);
                        durationText = `${minutes} min`;
                    }
                    
                    // Formatta lista esercizi
                    const exercisesList = session.exercises.map(ex => {
                        const sets = ex.series.length;
                        const targetReps = (ex.defaultReps !== undefined && ex.defaultReps !== null && ex.defaultReps !== '') ? ex.defaultReps : '-';
                        
                        return `<li><span class="summary-ex-name">${ex.name}</span><span class="summary-ex-data">: ${sets} x ${targetReps}</span></li>`;
                    }).join('');

                    return `
                        <div class="calendar-summary-card clickable-session-card" data-index="${index}" style="cursor: pointer; -webkit-tap-highlight-color: transparent;">
                            <div class="summary-header" style="display: flex; justify-content: space-between; align-items: center;">
                                <h4>${session.routineName}</h4>
                                <div style="display: flex; align-items: center; gap: 15px;">
                                    ${durationText ? `<div class="summary-meta">${durationText}</div>` : ''}
                                    <button class="action-btn delete-session-btn" data-plan-id="${session.planId}" data-routine-id="${session.routineId}" data-timestamp="${session.timestamp}" data-date-string="${session.dateString}" style="background: transparent; border: none; box-shadow: none; color: var(--text-muted); padding: 0;">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                    </button>
                                </div>
                            </div>
                            <ul class="summary-exercises-list">
                                ${exercisesList}
                            </ul>
                        </div>
                    `;
                }).join('');

                summaryContainer.innerHTML = cardsHtml;
            } else {
                summaryContainer.innerHTML = '<p class="empty-state" style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 0.9rem;">Nessun allenamento.</p>';
            }
        });
    });

    // Gestione Click su Card (Dettagli) e Eliminazione (Delegata sul container del sommario)
    const summaryContainer = document.getElementById('calendar-summary-container');
    if (summaryContainer) {
        summaryContainer.addEventListener('click', (e) => {
            // 1. Gestione Apertura Dettagli
            const card = e.target.closest('.clickable-session-card');
            // Assicuriamoci di non aver cliccato sul pulsante elimina
            if (card && !e.target.closest('.delete-session-btn')) {
                const index = parseInt(card.dataset.index);
                const selectedDay = container.querySelector('.calendar-day.selected');
                
                if (selectedDay) {
                    const dateKey = selectedDay.dataset.date;
                    const sessions = historyMap[dateKey];
                    // Nota: sessions è già ordinato perché historyMap[dateKey] è stato ordinato nel click handler del giorno
                    
                    if (sessions && sessions[index]) {
                        const session = sessions[index];
                        
                        // Popola Modale
                        document.getElementById('sd-routine-name').textContent = session.routineName;
                        
                        let durationText = '-';
                        if (session.duration > 0) {
                            const minutes = Math.floor(session.duration / 60);
                            durationText = `${minutes} min`;
                        }
                        document.getElementById('sd-duration').textContent = durationText;

                        const listContainer = document.getElementById('sd-exercises-list');
                        listContainer.innerHTML = session.exercises.map(ex => {
                            const setsHtml = ex.series.map((s, i) => {
                                const weight = (s.weight !== undefined && s.weight !== '') ? s.weight : '-';
                                const reps = (s.reps !== undefined && s.reps !== '') ? s.reps : '-';
                                return `
                                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; text-align: center; padding: 4px 0; font-size: 0.9rem;">
                                        <span style="color: var(--text-muted);">${i + 1}</span>
                                        <span style="font-weight: 500;">${weight}</span>
                                        <span style="font-weight: 500;">${reps}</span>
                                    </div>
                                `;
                            }).join('');

                            return `
                                <div style="margin-bottom: 20px;">
                                    <h4 style="margin-bottom: 8px; color: var(--text-main); font-size: 1rem;">${ex.name}</h4>
                                    <div style="background-color: var(--bg-body); border-radius: 8px; padding: 10px;">
                                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; text-align: center; margin-bottom: 8px; color: var(--text-muted); font-size: 0.8rem; font-weight: 600;">
                                            <span>Set</span>
                                            <span>Kg</span>
                                            <span>Reps</span>
                                        </div>
                                        ${setsHtml}
                                    </div>
                                </div>
                            `;
                        }).join('');

                        openModal('session-details-modal');
                    }
                }
            }

            // 2. Gestione Eliminazione Allenamento
            const deleteBtn = e.target.closest('.delete-session-btn');
            if (deleteBtn) {
                e.stopPropagation();
                const planId = parseFloat(deleteBtn.dataset.planId);
                const routineId = parseFloat(deleteBtn.dataset.routineId);
                const timestamp = parseFloat(deleteBtn.dataset.timestamp);
                const dateString = deleteBtn.dataset.dateString;

                showConfirmationModal(
                    "Elimina Allenamento",
                    "Sei sicuro di voler eliminare questo allenamento dallo storico? L'azione è irreversibile.",
                    () => {
                        let plan = AppState.plans.find(p => p.id === planId);
                        if (!plan && AppState.archivedPlans) {
                            plan = AppState.archivedPlans.find(p => p.id === planId);
                        }

                        if (plan) {
                            const routine = plan.routines.find(r => r.id === routineId);
                            if (routine) {
                                // Rimuovi dallo storico della routine
                                if (routine.history) {
                                    routine.history = routine.history.filter(h => {
                                        if (timestamp > 0) return h.timestamp !== timestamp;
                                        return h.date !== dateString;
                                    });
                                }
                                // Rimuovi dallo storico degli esercizi
                                if (routine.exercises) {
                                    routine.exercises.forEach(ex => {
                                        if (ex.history) {
                                            ex.history = ex.history.filter(h => {
                                                if (timestamp > 0) return h.timestamp !== timestamp;
                                                return h.date !== dateString;
                                            });
                                        }
                                    });
                                }
                                saveAppData();
                                renderCalendar();
                                // Ripristina la vista sul giorno selezionato
                                const dateKey = new Date(dateString).toDateString();
                                setTimeout(() => {
                                    const dayEl = container.querySelector(`.calendar-day[data-date="${dateKey}"]`);
                                    if (dayEl) dayEl.click();
                                }, 50);
                            }
                        }
                    }
                );
            }
        });
    }

    // Listener chiusura modale dettagli
    const closeDetailsBtn = document.getElementById('btn-close-session-details');
    if (closeDetailsBtn) {
        closeDetailsBtn.onclick = () => closeModal('session-details-modal');
    }

    // Seleziona oggi di default
    const todayEl = container.querySelector('.calendar-day.today');
    if (todayEl) {
        todayEl.click();
    }
}