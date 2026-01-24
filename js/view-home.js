// --- RENDER HOME ---
let homeDragHandlers = null;

function renderHome(fromHistory = false) {
    // Reset transform se torniamo alla home
    document.querySelector('main').style.transform = '';
    document.querySelector('main').classList.remove('calendar-open');
    document.body.classList.remove('no-scroll');
    const fab = document.getElementById('fab-action');
    if(fab) {
        fab.classList.remove('fab-hidden');
        fab.style.transform = '';
    }

    if (!fromHistory) {
        history.pushState({view: 'home'}, 'Home', '#home');
    }
    switchView('home');

    const settingsBtn = document.getElementById('btn-settings');
    if(settingsBtn) settingsBtn.classList.add('visible');
    
    // Pulizia listener precedenti se presenti
    if (homeDragHandlers) {
        document.removeEventListener('touchmove', homeDragHandlers.move);
        document.removeEventListener('touchend', homeDragHandlers.end);
        homeDragHandlers = null;
    }

    const listContainer = document.getElementById('routines-list');
    listContainer.innerHTML = '';
    
    const activePlan = AppState.plans.find(p => p.id === AppState.activePlanId);

    let activeSessionRoutineId = null;
    try {
        const savedSession = localStorage.getItem('active_workout_session');
        if (savedSession) {
            const session = JSON.parse(savedSession);
            if (session.startTime) {
                activeSessionRoutineId = session.routineId;
            }
        }
    } catch (e) { console.error(e); }

    if (activePlan && activePlan.routines && activePlan.routines.length > 0) {
        // Inserisci Maniglia e Citazione (Area Attiva Calendario)
        listContainer.innerHTML = `
            <div id="calendar-trigger-area" style="touch-action: none; cursor: pointer; padding-bottom: 10px; -webkit-tap-highlight-color: transparent;">
                <div class="calendar-handle-container">
                    <svg class="calendar-handle-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
                <p class="quote" style="margin: 0;">Migliora l'1% ogni giorno.</p>
            </div>
            <h2 style="text-align: center; margin-bottom: 15px; color: var(--text-main);">${activePlan.name}</h2>
        `;

        activePlan.routines.forEach(routine => {
            const card = document.createElement('div');
            card.className = 'routine-card';
            
            let timeLabel = '';
            if (routine.lastPerformed) {
                const lastDate = new Date(routine.lastPerformed);
                const today = new Date();
                lastDate.setHours(0,0,0,0);
                today.setHours(0,0,0,0);
                
                const diffTime = today - lastDate;
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays === 0) timeLabel = 'Oggi';
                else if (diffDays === 1) timeLabel = 'Ieri';
                else timeLabel = `${diffDays} gg`;
            }

            if (routine.id === activeSessionRoutineId) {
                card.classList.add('active-plan');
                timeLabel = 'IN CORSO';
            }

            card.innerHTML = `
                <div style="flex-grow: 1; min-width: 0;"><h3>${routine.name}</h3></div>
                ${timeLabel ? `<span style="font-size: 0.85rem; color: var(--text-muted); margin-left: 10px; white-space: nowrap;">${timeLabel}</span>` : ''}
            `;
            card.addEventListener('click', () => { 
                renderWorkout(routine.id, activePlan.id);
            });
            listContainer.appendChild(card);
        });

        // --- LOGICA DRAG CALENDARIO ---
        const handle = document.getElementById('calendar-trigger-area');
        const mainEl = document.querySelector('main');
        let startY = 0;
        let currentY = 0;
        let isDragging = false;
        let wasDragged = false;
        // MAX_DRAG dinamico: altezza finestra - 80px (lascia visibile solo la maniglia in basso)
        const MAX_DRAG = window.innerHeight - 80;

        const closeCalendarState = () => {
            mainEl.style.transform = `translateY(0px)`;
            mainEl.classList.remove('calendar-open');
            document.body.classList.remove('no-scroll');
            const fab = document.getElementById('fab-action');
            if(fab) fab.style.transform = `translateY(0px)`;
            const settingsBtn = document.getElementById('btn-settings');
            if(settingsBtn) settingsBtn.classList.add('visible');
            setBackAction(null);

            // Se siamo nello stato calendar (URL #calendar), torniamo indietro nella history
            if (history.state && history.state.view === 'calendar') {
                // Ritardo per permettere all'animazione di chiusura di completarsi prima del refresh
                setTimeout(() => {
                    if (history.state && history.state.view === 'calendar') history.back();
                }, 300);
            }
        };

        const openCalendarState = () => {
            mainEl.style.transform = `translateY(${MAX_DRAG}px)`;
            mainEl.classList.add('calendar-open');
            document.body.classList.add('no-scroll');
            const fab = document.getElementById('fab-action');
            if(fab) fab.style.transform = `translateY(${MAX_DRAG}px)`;
            const settingsBtn = document.getElementById('btn-settings');
            if(settingsBtn) settingsBtn.classList.remove('visible');
            setBackAction(closeCalendarState);

            // Aggiungi stato alla history per intercettare il tasto indietro
            if (!history.state || history.state.view !== 'calendar') {
                history.pushState({view: 'calendar'}, 'Calendario', '#calendar');
            }
        };

        // Inizializza calendario (nascosto sotto)
        renderCalendar();

        handle.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
            // Se il calendario è già aperto (main spostato), startY deve considerare l'offset
            const currentTransform = new WebKitCSSMatrix(window.getComputedStyle(mainEl).transform).m42;
            if (currentTransform > 0) startY -= currentTransform;
            // Nota: L'evento è attaccato direttamente alla maniglia (handle), quindi isDragging sarà true solo se si tocca lì.
            
            isDragging = true;
            wasDragged = false;
            mainEl.style.transition = 'none'; // Rimuovi transizione durante il drag
            const fab = document.getElementById('fab-action');
            if (fab) fab.style.transition = 'none';
        }, { passive: false });

        const onTouchMove = (e) => {
            if (!isDragging) return;
            wasDragged = true;
            currentY = e.touches[0].clientY;
            let delta = currentY - startY;

            // Limiti
            if (delta < 0) delta = 0;
            if (delta > MAX_DRAG) delta = MAX_DRAG; // Limite rigido

            mainEl.style.transform = `translateY(${delta}px)`;
            const fab = document.getElementById('fab-action');
            if (fab) fab.style.transform = `translateY(${delta}px)`;
        };

        const onTouchEnd = () => {
            if (!isDragging) return;
            isDragging = false;
            mainEl.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)';
            const fab = document.getElementById('fab-action');
            if (fab) fab.style.transition = '';
            
            const currentTransform = new WebKitCSSMatrix(window.getComputedStyle(mainEl).transform).m42;
            
            // Logica di Snap intelligente:
            // Se è aperto, basta trascinare su del 20% per chiudere (soglia 0.8).
            // Se è chiuso, basta trascinare giù del 20% per aprire (soglia 0.2).
            const isOpen = mainEl.classList.contains('calendar-open');
            const threshold = isOpen ? 0.8 : 0.2;

            if (currentTransform > MAX_DRAG * threshold) {
                openCalendarState();
            } else {
                closeCalendarState();
            }
        };

        // Gestione Click (Toggle)
        handle.addEventListener('click', (e) => {
            if (wasDragged) return; // Se è stato trascinato, ignora il click

            const isClosed = !mainEl.classList.contains('calendar-open');
            const fab = document.getElementById('fab-action');
            
            mainEl.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)';
            if (fab) fab.style.transition = '';

            if (isClosed) {
                openCalendarState();
            } else {
                closeCalendarState();
            }
        });

        document.addEventListener('touchmove', onTouchMove, { passive: false });
        document.addEventListener('touchend', onTouchEnd);
        homeDragHandlers = { move: onTouchMove, end: onTouchEnd };

    } else {
        listContainer.innerHTML = `
            <p class="quote">Migliora l'1% ogni giorno.</p>
            <p class="empty-state">Nessun piano attivo selezionato.</p>
            <p class="empty-state-secondary">Vai nella sezione Piani per selezionarne uno.</p>
        `;
    }
    setBackAction(null);
    const pencilIcon = '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>';
    setFabAction(() => renderPlans(), pencilIcon);

    // Check for overflow and animate
    setTimeout(() => {
        document.querySelectorAll('#routines-list .routine-card h3').forEach(el => {
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