function renderCalendar() {
    const container = document.getElementById('view-calendar');
    const now = new Date();

    // Nomi mesi e giorni
    const monthNames = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
    const dayNames = ["L", "M", "M", "G", "V", "S", "D"];

    // Mappa dati allenamenti per data: 'YYYY-MM-DD' -> Array di sessioni
    const historyMap = {};

    if (AppState.plans) {
        AppState.plans.forEach(plan => {
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
                                        
                                        if (l.timestamp) {
                                            const session = explicitSessions.find(s => s.timestamp === l.timestamp);
                                            if (session) {
                                                session.exercises.push({ name: ex.name, series: l.seriesData });
                                                matched = true;
                                            }
                                        } else {
                                            // Legacy: cerca sessione senza timestamp
                                            const session = explicitSessions.find(s => !s.timestamp);
                                            if (session) {
                                                session.exercises.push({ name: ex.name, series: l.seriesData });
                                                matched = true;
                                            }
                                        }

                                        if (!matched) {
                                            orphanExercises.push({ name: ex.name, series: l.seriesData, timestamp: l.timestamp });
                                        }
                                    });
                                }
                            });
                        }

                        // 3. Aggiungi sessioni esplicite che hanno esercizi
                        explicitSessions.forEach(s => {
                            if (s.exercises.length > 0) {
                                historyMap[dateKey].push({
                                    routineName: s.routineName,
                                    duration: s.duration,
                                    exercises: s.exercises,
                                    timestamp: s.timestamp
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
                                routineName: routine.name,
                                duration: 0, 
                                exercises: orphanGroups[key],
                                timestamp: key === 'legacy' ? 0 : parseInt(key)
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
            
            // Aggiungi data-date per il click
            const dateAttr = hasWorkout ? `data-date="${dateKey}"` : '';
            html += `<div class="calendar-day ${isToday ? 'today' : ''} ${hasWorkout ? 'has-workout' : ''}" ${dateAttr}>${day}</div>`;
        }

        html += `</div></div>`; // Chiudi grid e card
    }

    html += `</div></div>`; // Chiudi scroller e wrapper
    
    // Container per il riepilogo (inizialmente vuoto/nascosto)
    html += `<div id="calendar-summary-container"></div>`;

    container.innerHTML = html;

    // Scrolla all'ultimo mese (corrente)
    const scroller = container.querySelector('.calendar-scroller');
    if (scroller) scroller.scrollLeft = scroller.scrollWidth;

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

    // Event Listener per i giorni con allenamento
    container.querySelectorAll('.calendar-day.has-workout').forEach(dayEl => {
        dayEl.addEventListener('click', (e) => {
            // Rimuovi selezione precedente
            container.querySelectorAll('.calendar-day.selected').forEach(el => el.classList.remove('selected'));
            dayEl.classList.add('selected');

            const dateKey = dayEl.dataset.date;
            const sessions = historyMap[dateKey]; // Ora è un array
            
            if (sessions && sessions.length > 0) {
                const summaryContainer = document.getElementById('calendar-summary-container');
                
                // Ordina le sessioni dalla più recente alla meno recente
                sessions.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                
                const cardsHtml = sessions.map(session => {
                    // Formatta durata
                    let durationText = '';
                    if (session.duration > 0) {
                        const minutes = Math.floor(session.duration / 60);
                        durationText = `${minutes} min`;
                    }
                    
                    // Formatta lista esercizi
                    const exercisesList = session.exercises.map(ex => {
                        const sets = ex.series.length;
                        const reps = ex.series.length > 0 ? ex.series[0].reps : '-';
                        const weights = ex.series.map(s => (s.weight !== undefined && s.weight !== '') ? `${s.weight}kg` : '-').join(', ');
                        
                        return `<li><span class="summary-ex-name">${ex.name}</span><span class="summary-ex-data">: ${sets} x ${reps} <span style="color:var(--text-muted); font-size:0.85rem;">(${weights})</span></span></li>`;
                    }).join('');

                    return `
                        <div class="calendar-summary-card">
                            <div class="summary-header">
                                <h4>${session.routineName}</h4>
                                <div class="summary-meta">${durationText}</div>
                            </div>
                            <ul class="summary-exercises-list">
                                ${exercisesList}
                            </ul>
                        </div>
                    `;
                }).join('');

                summaryContainer.innerHTML = cardsHtml;
            }
        });
    });
}