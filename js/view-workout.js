// Worker per gestire i timer in background senza throttling
const timerWorkerBlob = new Blob([`
    let timer = null;
    self.onmessage = function(e) {
        if (e.data === 'start') {
            if (timer) clearInterval(timer);
            timer = setInterval(() => {
                self.postMessage('tick');
            }, 1000);
        } else if (e.data === 'stop') {
            if (timer) clearInterval(timer);
            timer = null;
        }
    };
`], {type: 'application/javascript'});

let timerWorker = null;

function initTimerWorker() {
    if (!timerWorker) {
        timerWorker = new Worker(URL.createObjectURL(timerWorkerBlob));
        timerWorker.onmessage = () => handleGlobalTick();
    }
}

function handleGlobalTick() {
    const now = Date.now();

    // 1. Aggiorna Timer Allenamento UI
    if (currentWorkoutSession && currentWorkoutSession.startTime) {
        const diff = Math.floor((now - currentWorkoutSession.startTime) / 1000);
        const h = Math.floor(diff / 3600);
        const m = Math.floor((diff % 3600) / 60);
        const timerEl = document.getElementById('workout-timer');
        if (timerEl) timerEl.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }

    // 2. Gestione Timer Recupero
    if (restEndTime > 0) {
        currentRestSeconds = Math.ceil((restEndTime - now) / 1000);
        
        if (currentRestSeconds <= 0) {
            currentRestSeconds = 0;
            restEndTime = 0; // Stop checking
            
            playTimerFinishedSound();

            // Auto-chiusura del timer a schermo intero
            if (typeof RestTimerView !== 'undefined') {
                RestTimerView.close();
            }

            const header = document.querySelector('.workout-header');
            if (header) header.classList.add('rest-finished');

            if (currentWorkoutSession) {
                currentWorkoutSession.restFinished = true;
                saveWorkoutSession();
            }

            // --- LOGICA NOTIFICA FINE RECUPERO ---
            const notificationsEnabled = localStorage.getItem('notifications_enabled') !== 'false';
            if (notificationsEnabled && typeof SystemNotifier !== 'undefined') {
                const routineNameEl = document.querySelector('.workout-routine-name');
                const routineName = routineNameEl ? routineNameEl.textContent : 'Allenamento';
                
                let nextExerciseName = null;
                let setInfo = '';
                let targetInfo = '';

                if (_cardToScrollToAfterRest) {
                    const nextExerciseNameEl = _cardToScrollToAfterRest.querySelector('h3');
                    if (nextExerciseNameEl) nextExerciseName = nextExerciseNameEl.textContent;

                    const rows = Array.from(_cardToScrollToAfterRest.querySelectorAll('.workout-set-row'));
                    const totalSets = rows.length;
                    const nextSetIndex = rows.findIndex(row => !row.querySelector('.workout-checkbox').checked);
                    
                    if (nextSetIndex !== -1) {
                        const row = rows[nextSetIndex];
                        setInfo = `${nextSetIndex + 1}/${totalSets}`;
                        
                        const wInput = row.querySelector('.input-weight');
                        const rInput = row.querySelector('.input-reps');
                        const weight = wInput.value || wInput.placeholder || '-';
                        const reps = rInput.value || rInput.placeholder || '-';
                        
                        targetInfo = `${weight}kg x ${reps}`;
                    }
                }
                
                SystemNotifier.showRestFinishedNotification({ routineName, nextExerciseName, setInfo, targetInfo });
            }

            // Evita lo scroll se l'utente non è nella pagina workout (es. è nella Home o Impostazioni)
            if (AppState.currentView === 'workout' || AppState.currentView === 'restTimer') {
                scrollToActiveExercise();
            }
            _cardToScrollToAfterRest = null;
        }
        updateRestDisplay();

        // Aggiorna il timer a schermo intero se attivo
        if (AppState.currentView === 'restTimer' && typeof RestTimerView !== 'undefined') {
            RestTimerView.update(currentRestSeconds, initialRestSeconds);
        }
    }

    // 3. Aggiorna Notifica Persistente
    updateSystemNotification();
}

let currentRestSeconds = 0;
let initialRestSeconds = 0;
let currentWorkoutSession = null;
let workoutAudioCtx = null;
let wakeLock = null;
let restEndTime = 0;
let _cardToScrollToAfterRest = null;
let keepAliveOscillator = null;

try {
    const savedSession = localStorage.getItem('active_workout_session');
    if (savedSession) currentWorkoutSession = JSON.parse(savedSession);
} catch (e) { console.error('Error restoring session', e); }

function getAbsoluteTop(element) {
    let top = 0;
    let el = element;
    do {
        top += el.offsetTop || 0;
        el = el.offsetParent;
    } while(el);
    return top;
}

function scrollToCard(cardElement) {
    if (!cardElement) return;
    const header = document.querySelector('.workout-header');
    const headerHeight = header ? header.offsetHeight : 0;
    const cardTop = getAbsoluteTop(cardElement);
    const targetScrollY = cardTop - headerHeight;

    window.scrollTo({
        top: targetScrollY,
        behavior: 'smooth'
    });
}

function scrollToActiveExercise() {
    let targetCard = _cardToScrollToAfterRest;

    // Verifica che il riferimento sia ancora valido nel DOM
    if (targetCard && !document.body.contains(targetCard)) {
        targetCard = null;
        _cardToScrollToAfterRest = null;
    }

    // Se non c'è un target immediato, controlla la sessione per recuperare l'ultimo esercizio attivo
    if (!targetCard && currentWorkoutSession && currentWorkoutSession.nextExerciseId) {
        targetCard = document.querySelector(`#active-workout-content .workout-card[data-exercise-id="${currentWorkoutSession.nextExerciseId}"]`);
        // Se lo troviamo, ripristiniamo anche il riferimento globale per il futuro
        if (targetCard) _cardToScrollToAfterRest = targetCard;
    }

    if (targetCard) {
        // Verifica se il target è completato
        const cbs = Array.from(targetCard.querySelectorAll('.workout-checkbox'));
        const isComplete = cbs.length > 0 && cbs.every(cb => cb.checked);

        if (isComplete) {
            // Se è completato, cerca il prossimo incompleto
            targetCard = findNextIncompleteCard(targetCard);
        }
        // Se non è completato, rimaniamo su questo (magnetismo sull'esercizio attivo)
    }

    // Fallback: se ancora nessun target (o tutti completi), cerca il primo incompleto in assoluto
    if (!targetCard) {
        const allCards = Array.from(document.querySelectorAll('#active-workout-content .workout-card'));
        targetCard = allCards.find(card => {
            const cbs = Array.from(card.querySelectorAll('.workout-checkbox'));
            return cbs.length > 0 && !cbs.every(cb => cb.checked);
        });
    }

    if (targetCard) {
        scrollToCard(targetCard);
    }
}

function findNextIncompleteCard(currentCardElement) {
    const allCards = Array.from(document.querySelectorAll('#active-workout-content .workout-card'));
    const currentIndex = allCards.findIndex(card => card === currentCardElement);

    if (currentIndex === -1) return null;
    
    // 1. Cerca dalla posizione corrente fino alla fine
    for (let i = currentIndex + 1; i < allCards.length; i++) {
        const nextCard = allCards[i];
        const checkboxes = nextCard.querySelectorAll('.workout-checkbox');
        if (checkboxes.length === 0) continue; // Salta card senza serie
        const isComplete = Array.from(checkboxes).every(cb => cb.checked);
        if (!isComplete) {
            return nextCard;
        }
    }

    // 2. Se non trova nulla, ricomincia dall'inizio (ricerca circolare)
    for (let i = 0; i < currentIndex; i++) {
        const nextCard = allCards[i];
        const checkboxes = nextCard.querySelectorAll('.workout-checkbox');
        if (checkboxes.length === 0) continue; // Salta card senza serie
        const isComplete = Array.from(checkboxes).every(cb => cb.checked);
        if (!isComplete) {
            return nextCard;
        }
    }
    return null; // Tutti gli esercizi sono completi
}

function saveWorkoutSession() {
    if (currentWorkoutSession) {
        localStorage.setItem('active_workout_session', JSON.stringify(currentWorkoutSession));
    }
}

function updateSystemNotification() {
    if (typeof SystemNotifier === 'undefined') return;
    
    const notificationsEnabled = localStorage.getItem('notifications_enabled') !== 'false';
    if (!notificationsEnabled) return;

    const routineNameEl = document.querySelector('.workout-routine-name');
    const routineName = routineNameEl ? routineNameEl.textContent : 'OnePercent';
    
    const info = getNextExerciseInfo();
    
    SystemNotifier.updateWorkoutNotification({
        workoutTime: document.getElementById('workout-timer').textContent,
        currentRest: (currentRestSeconds > 0) ? currentRestSeconds : null,
        totalRest: (initialRestSeconds > 0) ? initialRestSeconds : null,
        routineName: routineName,
        nextExerciseName: info.name,
        setInfo: info.setInfo,
        targetInfo: info.targetInfo
    });
}

function getNextExerciseInfo() {
    // Determina il prossimo esercizio
    let nextExerciseName = '';
    let setInfo = '';
    let targetInfo = '';
    
    // 1. Se c'è un recupero attivo, usiamo la card target del recupero
    let targetCard = _cardToScrollToAfterRest;
    
    // 2. Se non c'è recupero (o target nullo), cerchiamo il primo esercizio incompleto
    if (!targetCard) {
        const allCards = Array.from(document.querySelectorAll('#active-workout-content .workout-card'));
        targetCard = allCards.find(card => {
            const cbs = Array.from(card.querySelectorAll('.workout-checkbox'));
            return cbs.length > 0 && !cbs.every(cb => cb.checked);
        });
    }
    
    if (targetCard) {
        const h3 = targetCard.querySelector('h3');
        if (h3) nextExerciseName = h3.textContent;

        // Estrai info serie corrente
        const rows = Array.from(targetCard.querySelectorAll('.workout-set-row'));
        const totalSets = rows.length;
        // Trova la prima serie non completata
        const nextSetIndex = rows.findIndex(row => {
            const cb = row.querySelector('.workout-checkbox');
            return cb && !cb.checked;
        });
        
        if (nextSetIndex !== -1) {
            const row = rows[nextSetIndex];
            setInfo = `${nextSetIndex + 1}/${totalSets}`;
            
            const wInput = row.querySelector('.input-weight');
            const rInput = row.querySelector('.input-reps');
            // Usa il valore inserito o il placeholder (target)
            const weight = wInput.value || wInput.placeholder || '-';
            const reps = rInput.value || rInput.placeholder || '-';
            
            targetInfo = `${weight}kg x ${reps}`;
        }
    } else {
        nextExerciseName = "Allenamento completato";
    }
    
    return { name: nextExerciseName, setInfo, targetInfo };
}

function updateRestDisplay() {
    const display = document.getElementById('rest-timer-display');
    if (display) {
        display.innerHTML = `<span class="rest-timer-current">${currentRestSeconds > 0 ? currentRestSeconds : 0}</span><small class="rest-timer-total">/${initialRestSeconds > 0 ? initialRestSeconds : 0}s</small>`;
    }
    updateSystemNotification();
}

function playTimerFinishedSound() {
    if (!workoutAudioCtx) return;
    
    const now = workoutAudioCtx.currentTime;

    const playBeep = (startTime) => {
        const osc = workoutAudioCtx.createOscillator();
        const gain = workoutAudioCtx.createGain();

        osc.connect(gain);
        gain.connect(workoutAudioCtx.destination);

        osc.type = 'square'; // Suono "secco" e digitale
        osc.frequency.setValueAtTime(880, startTime);

        gain.gain.setValueAtTime(1, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.1);

        osc.start(startTime);
        osc.stop(startTime + 0.1);
    };

    playBeep(now);
    playBeep(now + 0.15); // Secondo beep ravvicinato
}

function enableKeepAlive() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    if (!workoutAudioCtx) {
        workoutAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (workoutAudioCtx.state === 'suspended') {
        workoutAudioCtx.resume().catch(() => {});
    }
    
    if (keepAliveOscillator) return; // Già attivo

    try {
        if (isIOS) {
            // iOS: Usa il metodo più robusto con buffer audio silenzioso per mantenere l'app attiva.
            const silentBuffer = workoutAudioCtx.createBuffer(1, 1, 22050);
            const source = workoutAudioCtx.createBufferSource();
            source.buffer = silentBuffer;
            source.loop = true;
            source.connect(workoutAudioCtx.destination);
            source.start();
            keepAliveOscillator = source;
        } else {
            // Android e altri: Mantiene il metodo esistente con oscillatore che funziona correttamente.
            const oscillator = workoutAudioCtx.createOscillator();
            const gain = workoutAudioCtx.createGain();
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(20, workoutAudioCtx.currentTime); 
            gain.gain.setValueAtTime(0.001, workoutAudioCtx.currentTime); 
            oscillator.connect(gain);
            gain.connect(workoutAudioCtx.destination);
            oscillator.start();
            keepAliveOscillator = oscillator;
        }
    } catch (e) {
        console.error("Failed to enable Web Audio keep-alive:", e);
    }
}

function disableKeepAlive() {
    if (keepAliveOscillator) {
        try { keepAliveOscillator.stop(); keepAliveOscillator.disconnect(); } catch(e) {}
        keepAliveOscillator = null;
    }
}

function startRestTimer(seconds, nextCardToFocus = null, showFullscreen = true, totalSecondsForResume = null) {
    _cardToScrollToAfterRest = nextCardToFocus;

    // Pulisci notifiche precedenti all'avvio di un nuovo timer per evitare accumuli
    if (typeof SystemNotifier !== 'undefined') SystemNotifier.clearWorkoutNotification();

    // Inizializza/Sblocca AudioContext su interazione utente
    if (!workoutAudioCtx) {
        workoutAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (workoutAudioCtx.state === 'suspended') {
        workoutAudioCtx.resume();
    }

    const header = document.querySelector('.workout-header');
    if (header) header.classList.remove('rest-finished');

    const total = totalSecondsForResume !== null ? totalSecondsForResume : seconds;
    initialRestSeconds = total;

    if (currentWorkoutSession) {
        currentWorkoutSession.restFinished = false;
        restEndTime = Date.now() + (seconds * 1000);
        currentWorkoutSession.restEndTime = restEndTime;
        currentWorkoutSession.initialRestSeconds = total;
        if (nextCardToFocus) {
            currentWorkoutSession.nextExerciseId = nextCardToFocus.dataset.exerciseId;
        }
        saveWorkoutSession();
    }

    currentRestSeconds = seconds;
    updateRestDisplay();
    
    // Se non abbiamo salvato in sessione (es. test), calcoliamo comunque locale
    if (!currentWorkoutSession) restEndTime = Date.now() + (seconds * 1000);

    // Apri Timer Fullscreen se abilitato
    if (showFullscreen && typeof RestTimerView !== 'undefined') {
        RestTimerView.show(seconds, getNextExerciseInfo(), total);
    }
}

function adjustRestTimer(seconds) {
    if (restEndTime <= 0) return;

    restEndTime += (seconds * 1000);
    initialRestSeconds += seconds;
    if (initialRestSeconds < 0) initialRestSeconds = 0;

    const now = Date.now();
    currentRestSeconds = Math.ceil((restEndTime - now) / 1000);
    if (currentWorkoutSession) {
        currentWorkoutSession.restEndTime = restEndTime;
        currentWorkoutSession.initialRestSeconds = initialRestSeconds;
        saveWorkoutSession();
    }
    
    if (currentRestSeconds < 0) currentRestSeconds = 0;
    
    // Se si aggiunge tempo, si annulla lo scroll automatico
    if (seconds > 0) _cardToScrollToAfterRest = null;

    // Se aggiungo tempo e il timer non è a 0, rimuovo il verde
    if (currentRestSeconds > 0) {
        const header = document.querySelector('.workout-header');
        if (header) header.classList.remove('rest-finished');
        if (currentWorkoutSession) {
            currentWorkoutSession.restFinished = false;
            saveWorkoutSession();
        }
    }
    updateRestDisplay();
    if (AppState.currentView === 'restTimer' && typeof RestTimerView !== 'undefined') {
        RestTimerView.update(currentRestSeconds, initialRestSeconds);
    }
}

function skipRestTimer() {
    if (restEndTime <= 0) return;

    scrollToActiveExercise();
    _cardToScrollToAfterRest = null;
    restEndTime = 0;
    currentRestSeconds = 0;
    const header = document.querySelector('.workout-header');
    if (header) header.classList.remove('rest-finished');
    if (currentWorkoutSession) {
        currentWorkoutSession.restFinished = false;
        saveWorkoutSession();
    }
    if (currentWorkoutSession) {
        delete currentWorkoutSession.restEndTime;
        saveWorkoutSession();
    }
    updateRestDisplay();
    if (AppState.currentView === 'restTimer' && typeof RestTimerView !== 'undefined') {
        RestTimerView.update(currentRestSeconds, initialRestSeconds);
    }
}

// --- MODALE STORICO ESERCIZIO ---
function renderExerciseHistoryModal(exerciseId, routine) {
    const modal = document.getElementById('exercise-history-modal');
    if (!modal) return;

    const exercise = routine.exercises.find(ex => ex.id === exerciseId);
    if (!exercise) return;

    document.getElementById('exercise-history-modal-title').textContent = `Storico: ${exercise.name}`;
    const historyContent = document.getElementById('exercise-history-content');
    historyContent.innerHTML = ''; // Clear previous content

    if (!exercise.history || exercise.history.length === 0) {
        historyContent.innerHTML = '<p class="empty-state">Nessun dato storico disponibile per questo esercizio.</p>';
    } else {
        let historyHtml = '';
        exercise.history.slice().reverse().forEach(entry => { // Reverse to show most recent first
            const date = new Date(entry.date).toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' });
            historyHtml += `
                <div class="history-entry">
                    <h4>${date}</h4>
                    <div class="history-series-list">
            `;
            entry.seriesData.forEach((s, index) => {
                historyHtml += `
                        <div class="history-series-item">
                            <span>Set ${index + 1}:</span>
                            <span>${s.weight || '-'}kg x ${s.reps || '-'}</span>
                        </div>
                `;
            });
            historyHtml += `
                    </div>
                </div>
            `;
        });
        historyContent.innerHTML = historyHtml;
    }

    openModal('exercise-history-modal');

    document.getElementById('btn-close-exercise-history-modal').onclick = () => {
        closeModal('exercise-history-modal');
    };
}

// --- WAKE LOCK & DIMMING LOGIC ---
async function activateWakeLock() {
    if ('wakeLock' in navigator) {
        try {
            wakeLock = await navigator.wakeLock.request('screen');
        } catch (err) {
            console.error(`${err.name}, ${err.message}`);
        }
    }
}

function deactivateWakeLock() {
    if (wakeLock) {
        wakeLock.release().catch(() => {});
        wakeLock = null;
    }
}

// Re-acquisisci Wake Lock se l'app torna visibile
document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible' && document.getElementById('view-workout') && !document.getElementById('view-workout').classList.contains('hidden')) {
        const actionBtn = document.getElementById('btn-workout-action');
        if (actionBtn && actionBtn.textContent === "Fine") {
            await activateWakeLock();
        }
    }
});

// --- RENDER WORKOUT ---
function renderWorkout(routineId, planId, fromHistory = false) {
    document.body.classList.remove('no-scroll');
    // Fix bug header: resetta trasformazioni del main (ereditate dal calendario)
    document.querySelector('main').style.transform = '';
    document.querySelector('main').classList.remove('calendar-open');

    if (!fromHistory) {
        history.pushState({view: 'workout', routineId, planId}, 'Allenamento', '#workout');
    }

    // Reset del riferimento alla card per lo scroll automatico (poiché il DOM viene rigenerato)
    _cardToScrollToAfterRest = null;

    // Disabilita il ripristino automatico dello scroll del browser per garantire che il magnetismo funzioni
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }

    const container = Views.workout;
    const plan = AppState.plans.find(p => p.id === planId);
    const routine = plan ? plan.routines.find(r => r.id === routineId) : null;

    // Check se c'è una sessione attiva GLOBALE
    // FIX: Considera attiva solo se ha un startTime (allenamento effettivamente iniziato)
    const isSessionActive = !!currentWorkoutSession && !!currentWorkoutSession.startTime;

    // FIX: Se c'è una sessione "bozza" (senza startTime) di un'altra routine, puliscila per evitare conflitti
    if (currentWorkoutSession && !currentWorkoutSession.startTime && (currentWorkoutSession.routineId !== routineId || currentWorkoutSession.planId !== planId)) {
        currentWorkoutSession = null;
        localStorage.removeItem('active_workout_session');
    }

    // Check se stiamo riprendendo la sessione attiva SPECIFICA (quella corrente)
    const isResuming = isSessionActive && 
                       currentWorkoutSession.planId === planId && 
                       currentWorkoutSession.routineId === routineId;
    
    // Modalità Sola Lettura: c'è un allenamento attivo MA non è questo
    const isReadOnly = isSessionActive && !isResuming;

    // Aggiunge/Rimuove la classe dal body per lo stile della modalità sola lettura
    if (isReadOnly) {
        document.body.classList.add('workout-readonly');
    } else {
        document.body.classList.remove('workout-readonly');
    }

    if (!routine) {
        showAlertModal('Errore', 'Routine non trovata.');
        renderHome();
        switchView('home');
        return;
    }

    // Calcola il recupero iniziale per la visualizzazione (primo esercizio)
    let firstRest = 90;
    if (routine.exercises && routine.exercises.length > 0) {
        firstRest = routine.exercises[0].rest || 90;
    }

    // Se NON stiamo riprendendo la stessa sessione E NON siamo in sola lettura (quindi nuovo allenamento legittimo)
    if (!isResuming && !isReadOnly) {
        if (timerWorker) timerWorker.postMessage('stop');
        disableKeepAlive();
        currentRestSeconds = 0;
        restEndTime = 0;
        currentWorkoutSession = null;
        localStorage.removeItem('active_workout_session');
        initialRestSeconds = firstRest;

        // RESET LOGIC: Prepara la routine per una nuova sessione
        // Sposta i valori "fatti" dell'ultima volta in "target" e pulisce gli input
        routine.exercises.forEach(ex => {
            if (ex.series) {
                ex.series.forEach(s => {
                    s.completed = false;
                    // Reset dei valori della sessione corrente
                    // Nota: s.weight e s.reps sono ora considerati i valori "Target" (dal Piano) e non vengono cancellati
                    s.sessionWeight = '';
                    s.sessionReps = '';
                });
            }
        });
        saveAppData();
    } else if (isResuming && currentWorkoutSession) {
        if (currentWorkoutSession.initialRestSeconds) {
            initialRestSeconds = currentWorkoutSession.initialRestSeconds;
        } else {
            initialRestSeconds = firstRest;
        }
    } else {
        initialRestSeconds = firstRest;
    }

    // Helper per attributo disabled
    const disabledAttr = isReadOnly ? 'disabled' : '';

    // Genera HTML per gli esercizi
    const exercisesHtml = routine.exercises.map(ex => {
        const setsCount = parseInt(ex.sets) || 3; // Default a 3 serie se non specificato
        const seriesData = ex.series || []; // Dati specifici per serie
        let setsHtml = '';
        
        for (let i = 1; i <= setsCount; i++) {
            const s = seriesData[i-1] || {};
            
            // Target: usa i valori del Piano (s.weight/s.reps)
            const hasTargetWeight = (s.weight !== undefined && s.weight !== '');
            const hasTargetReps = (s.reps !== undefined && s.reps !== '');
            
            // Se la serie specifica non ha un target, usa il default dell'esercizio (ex.weight/ex.reps)
            const targetWeight = hasTargetWeight ? s.weight : (ex.weight || '0');
            const targetReps = hasTargetReps ? s.reps : (ex.reps || '0');
            
            const prevData = (s.prevWeight) ? `${s.prevWeight}kg x ${s.prevReps}` : "-";

            // Stato corrente: Valori inseriti nella sessione OPPURE Target (in bianco)
            // Se c'è un valore di sessione, usa quello. Altrimenti se c'è un target, usa quello come valore precompilato.
            const finalWeight = (s.sessionWeight !== undefined && s.sessionWeight !== '') ? s.sessionWeight : targetWeight;
            const finalReps = (s.sessionReps !== undefined && s.sessionReps !== '') ? s.sessionReps : targetReps;

            const valWeight = finalWeight !== '' ? `value="${finalWeight}"` : '';
            const valReps = finalReps !== '' ? `value="${finalReps}"` : '';
            
            const showCompleted = s.completed && !isReadOnly;
            const checkedAttr = showCompleted ? 'checked' : '';
            const rowClass = showCompleted ? 'workout-set-row completed' : 'workout-set-row';

            setsHtml += `
                <div class="${rowClass}">
                    <span class="set-number">${i}</span>
                    <span class="prev-data clickable-prev-data" data-exercise-id="${ex.id}">${prevData}</span>
                    <input type="text" inputmode="decimal" class="workout-input input-weight" placeholder="-" ${valWeight} ${disabledAttr}>
                    <input type="number" class="workout-input input-reps" placeholder="-" ${valReps} ${disabledAttr}>
                    <input type="checkbox" class="workout-checkbox" data-rest="${ex.rest || 90}" ${checkedAttr} ${disabledAttr}>
                </div>
            `;
        }

        const quickActionsHtml = isReadOnly ? '' : `
                <div class="workout-quick-actions">
                    <div class="quick-action-group">
                        <button class="quick-btn btn-remove-set">-</button>
                        <button class="quick-btn btn-add-set">+</button>
                    </div>
                    <div class="quick-action-group">
                        <button class="quick-btn btn-val-minus" data-type="weight">-</button>
                        <button class="quick-btn btn-val-plus" data-type="weight">+</button>
                    </div>
                    <div class="quick-action-group">
                        <button class="quick-btn btn-val-minus" data-type="reps">-</button>
                        <button class="quick-btn btn-val-plus" data-type="reps">+</button>
                    </div>
                </div>`;

        return `
            <div class="workout-card" data-exercise-id="${ex.id}">
                <h3>${ex.name}</h3>
                
                <input type="text" class="workout-notes-input" placeholder="Note..." value="${ex.notes || ''}" ${disabledAttr}>
                <div class="workout-rest-info">
                    Recupero: <input type="number" class="workout-rest-input" value="${ex.rest || 90}" ${disabledAttr}> s
                </div>

                <div class="workout-sets-header">
                    <span>Set</span>
                    <span>Prev</span>
                    <span>Kg</span>
                    <span>Reps</span>
                    <span>✓</span>
                </div>
                <div class="workout-sets-container">
                    ${setsHtml}
                </div>
                
                ${quickActionsHtml}
            </div>
        `;
    }).join('');

    // Pulsante Modifica Routine (visibile solo se workout iniziato e non in sola lettura)
    const editBtnStyle = (isResuming && !isReadOnly) ? 'display: flex;' : 'display: none;';
    const editRoutineBtnHtml = !isReadOnly ? `
        <div id="container-edit-routine-btn" style="${editBtnStyle} justify-content: flex-end; padding: 20px 20px 40px 20px;">
            <button id="btn-edit-active-routine" style="
                width: 56px; height: 56px; border-radius: 50%; 
                background-color: var(--text-main); color: var(--bg-body); 
                border: none; box-shadow: 0 4px 10px rgba(0,0,0,0.3);
                display: flex; align-items: center; justify-content: center; cursor: pointer;
            ">
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
            </button>
        </div>
    ` : '';

    const actionButtonHtml = isReadOnly 
        ? `<button class="end-workout-btn" style="opacity:0.5; cursor:default; border-radius: 12px;">Vista</button>`
        : `<button id="btn-workout-action" class="end-workout-btn" style="border-radius: 12px;">Inizia</button>`;

    // Cleanup modali precedenti se presenti nel body
    const modalIds = ['end-workout-modal'];
    modalIds.forEach(id => { const el = document.getElementById(id); if(el) el.remove(); });

    container.innerHTML = `
        <div class="workout-header">
            <div class="workout-header-top">
                <button id="btn-back-workout" class="back-btn" style="margin-right:0; padding-right:5px;">←</button>
                <h2 class="workout-routine-name" style="flex-grow: 1;">${routine.name}</h2>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div id="workout-timer" class="workout-timer">00:00</div>
                    ${actionButtonHtml}
                </div>
            </div>
            <div class="workout-header-bottom" style="${isReadOnly ? 'display:none;' : ''}">
                <span id="rest-timer-display" class="rest-timer-large"><span class="rest-timer-current">0</span><small class="rest-timer-total">/${initialRestSeconds}s</small></span>
                <div class="rest-timer-controls">
                    <button id="btn-rest-minus" class="rest-btn" style="border-radius: 12px;">-15</button>
                    <button id="btn-rest-plus" class="rest-btn" style="border-radius: 12px;">+15</button>
                    <button id="btn-rest-skip" class="rest-btn skip-btn" style="border-radius: 12px;">Skip</button>
                </div>
            </div>
        </div>
        <!-- Modale Fine Allenamento -->
        <div id="end-workout-modal" class="modal-overlay hidden">
            <div class="modal-content">
                <h3 style="margin-bottom: 15px;">Termina Allenamento</h3>
                <p style="margin-bottom: 20px;">Vuoi salvare l'allenamento o uscire senza salvare?</p>
                <div class="modal-actions" style="flex-direction: column; gap: 10px;">
                    <button id="btn-save-workout" class="primary-btn">Salva e Termina</button>
                    <button id="btn-discard-workout" class="secondary-btn">Esci senza salvare</button>
                    <button id="btn-cancel-modal" class="secondary-btn">Annulla</button>
                </div>
            </div>
        </div>
        <div id="active-workout-content">${exercisesHtml}${editRoutineBtnHtml}</div>
    `;

    // Sposta le modali nel body per gestire correttamente lo z-index
    modalIds.forEach(id => document.body.appendChild(document.getElementById(id)));

    const header = container.querySelector('.workout-header');
    if (isResuming && currentWorkoutSession.restFinished && header) {
        header.classList.add('rest-finished');
    }

    const exercisesArea = document.getElementById('active-workout-content');

    // Gestione dinamica padding-top per header fisso
    if (header) {
        const updateHeaderHeight = () => {
            const height = header.offsetHeight;
            document.body.style.setProperty('--workout-header-height', `${height}px`);
        };
        updateHeaderHeight();
        const resizeObserver = new ResizeObserver(() => updateHeaderHeight());
        resizeObserver.observe(header);
    }

    // Gestione click sulla colonna "Prev" per aprire lo storico
    exercisesArea.addEventListener('click', (e) => {
        if (e.target.classList.contains('clickable-prev-data')) {
            // Impedisci l'apertura dello storico se in modalità sola lettura
            if (isReadOnly) return;

            const exerciseId = parseFloat(e.target.dataset.exerciseId);
            renderExerciseHistoryModal(exerciseId, routine);
        }
    });

    // Gestione click pulsante modifica routine in corso
    const editRoutineBtn = document.getElementById('btn-edit-active-routine');
    if (editRoutineBtn) {
        editRoutineBtn.onclick = () => {
            renderRoutineEditor(routineId, planId);
        };
    }


    const timerEl = document.getElementById('workout-timer');
    
    let isWorkoutStarted = isResuming && currentWorkoutSession && currentWorkoutSession.startTime;

    // Helper: Avvia/Ripristina Timer UI
    const startWorkoutTimerUI = (startTime) => {
        initTimerWorker();
        timerWorker.postMessage('start');
        // Primo aggiornamento immediato
        handleGlobalTick();
    };

    // Se stiamo riprendendo, ripristina UI
    if (isWorkoutStarted) {
        const actionBtn = document.getElementById('btn-workout-action');
        if (actionBtn) {
            actionBtn.textContent = "Fine";
            actionBtn.classList.add('active-state');
        }
        startWorkoutTimerUI(currentWorkoutSession.startTime);
        updateRestDisplay();
        activateWakeLock();
        enableKeepAlive();
        
        // Ripristina timer recupero se attivo
        if (currentWorkoutSession.restEndTime) {
            const now = Date.now();
            const remaining = Math.ceil((currentWorkoutSession.restEndTime - now) / 1000);
            if (remaining > 0) {
                // FIX: Recupera il riferimento DOM alla card attiva per ripristinare _cardToScrollToAfterRest
                let activeCard = null;
                if (currentWorkoutSession.nextExerciseId) {
                    activeCard = document.querySelector(`#active-workout-content .workout-card[data-exercise-id="${currentWorkoutSession.nextExerciseId}"]`);
                }
                
                // Fallback: se l'esercizio salvato non esiste più (es. cancellato), associa il timer al primo incompleto
                if (!activeCard) {
                     const allCards = Array.from(document.querySelectorAll('#active-workout-content .workout-card'));
                     activeCard = allCards.find(card => {
                        const cbs = Array.from(card.querySelectorAll('.workout-checkbox'));
                        return cbs.length > 0 && !cbs.every(cb => cb.checked);
                    });
                    if (activeCard) {
                        currentWorkoutSession.nextExerciseId = activeCard.dataset.exerciseId;
                        saveWorkoutSession();
                    }
                }
                
                startRestTimer(remaining, activeCard, false, currentWorkoutSession.initialRestSeconds);
            }
            else if (!currentWorkoutSession.restFinished) { /* Opzionale: gestire fine timer mentre offline */ }
        }

        // Scroll automatico intelligente (riprende dall'ultimo esercizio attivo)
        setTimeout(() => {
            scrollToActiveExercise();
        }, 400); // Aumentato a 400ms per attendere fine transizione e layout stabile
    }

    // Helper: Inizializza sessione se modifico qualcosa prima di start
    const ensureSessionInitialized = () => {
        if (!currentWorkoutSession) {
            currentWorkoutSession = {
                planId,
                routineId,
                startTime: null,
                originalRoutineJSON: JSON.stringify(routine)
            };
            localStorage.setItem('active_workout_session', JSON.stringify(currentWorkoutSession));
        }
    };

    // Funzione Avvio Sessione
    const startSession = () => {
        ensureSessionInitialized();
        const actionBtn = document.getElementById('btn-workout-action');
        isWorkoutStarted = true;
        actionBtn.textContent = "Fine";
        actionBtn.classList.add('active-state');
        
        const editContainer = document.getElementById('container-edit-routine-btn');
        if (editContainer) editContainer.style.display = 'flex';
        
        if (!currentWorkoutSession.startTime) {
            currentWorkoutSession.startTime = Date.now();
            localStorage.setItem('active_workout_session', JSON.stringify(currentWorkoutSession));
        }

        startWorkoutTimerUI(currentWorkoutSession.startTime);
        activateWakeLock();
        enableKeepAlive();
        updateSystemNotification();
    };

    // Smart Input Logic
    exercisesArea.addEventListener('focusin', (e) => {
        if (e.target.classList.contains('input-weight') || e.target.classList.contains('input-reps') || e.target.classList.contains('workout-rest-input')) {
            e.target.dataset.prevValue = e.target.value;
            e.target.value = '';
            
            // Nascondi placeholder se presente per avere il box completamente vuoto
            if (e.target.placeholder) {
                e.target.dataset.prevPlaceholder = e.target.placeholder;
                e.target.placeholder = '';
            }
        }
    });
    exercisesArea.addEventListener('focusout', (e) => {
        if (e.target.classList.contains('input-weight') || e.target.classList.contains('input-reps') || e.target.classList.contains('workout-rest-input')) {
            // Ripristina placeholder
            if (e.target.dataset.prevPlaceholder) {
                e.target.placeholder = e.target.dataset.prevPlaceholder;
            }
            if (e.target.value.trim() === '') {
                e.target.value = e.target.dataset.prevValue;
                // Forza l'aggiornamento dello stato (dispatch input) per ripristinare il valore salvato nei dati
                e.target.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }
    });

    // Rest Time Input Logic (Aggiorna il timer delle checkbox al volo)
    exercisesArea.addEventListener('input', (e) => {
        if (e.target.classList.contains('workout-rest-input')) {
            const newRest = parseInt(e.target.value) || 0;
            const card = e.target.closest('.workout-card');
            if (card) {
                card.querySelectorAll('.workout-checkbox').forEach(cb => {
                    cb.dataset.rest = newRest;
                });

                // SALVATAGGIO DATI (Recupero)
                const exerciseId = parseFloat(card.dataset.exerciseId);
                const exercise = routine.exercises.find(ex => ex.id === exerciseId);
                
                if (exercise) {
                    exercise.rest = newRest;
                    saveAppData();
                }
            }
        }
    });

    // Notes Input Logic (Salva le note al volo)
    exercisesArea.addEventListener('input', (e) => {
        if (e.target.classList.contains('workout-notes-input')) {
            const newNotes = e.target.value;
            const card = e.target.closest('.workout-card');
            if (card) {
                const exerciseId = parseFloat(card.dataset.exerciseId);
                const exercise = routine.exercises.find(ex => ex.id === exerciseId);
                
                if (exercise) {
                    exercise.notes = newNotes;
                    saveAppData();
                };
            }
        }
    });

    // Input Logic per Peso e Reps (Salva immediatamente mentre scrivi)
    exercisesArea.addEventListener('input', (e) => {
        if (e.target.classList.contains('input-weight') || e.target.classList.contains('input-reps')) {
            // Force dot for decimals in weight
            if (e.target.classList.contains('input-weight')) {
                e.target.value = e.target.value.replace(',', '.');
            }

            const row = e.target.closest('.workout-set-row');
            const card = e.target.closest('.workout-card');
            const setIndex = parseInt(row.querySelector('.set-number').textContent) - 1;
            const exerciseId = parseFloat(card.dataset.exerciseId);
            const exercise = routine.exercises.find(ex => ex.id === exerciseId);
            
            if (exercise) {
                ensureSessionInitialized();
                if (!exercise.series) exercise.series = [];
                while (exercise.series.length <= setIndex) {
                    exercise.series.push({ weight: '', reps: '', prevWeight: '', prevReps: '', sessionWeight: '', sessionReps: '' });
                }
                
                // Aggiorna i valori della sessione
                if (e.target.classList.contains('input-weight')) {
                    exercise.series[setIndex].sessionWeight = e.target.value;
                }
                if (e.target.classList.contains('input-reps')) {
                    exercise.series[setIndex].sessionReps = e.target.value;
                }

                saveAppData();
            }
        }
    });

    // Quick Actions Logic
    exercisesArea.addEventListener('click', (e) => {
        const card = e.target.closest('.workout-card');
        if (!card) return;
        const container = card.querySelector('.workout-sets-container');

        // Add Set
        if (e.target.classList.contains('btn-add-set')) {
            const currentSets = container.children.length;
            // Copia valori ultima serie
            let prevWeight = '0', prevReps = '0';
            if (currentSets > 0) {
                const lastRow = container.lastElementChild;
                // Prendi solo il value (che ora contiene anche il target se presente)
                prevWeight = lastRow.querySelector('.input-weight').value;
                prevReps = lastRow.querySelector('.input-reps').value;
            }
            
            const valWeight = prevWeight ? `value="${prevWeight}"` : '';
            const valReps = prevReps ? `value="${prevReps}"` : '';

            const newRow = document.createElement('div');
            newRow.className = 'workout-set-row';
            newRow.innerHTML = `
                <span class="set-number">${currentSets + 1}</span>
                <span class="prev-data">-</span>
                <input type="text" inputmode="decimal" class="workout-input input-weight" placeholder="-" ${valWeight}>
                <input type="number" class="workout-input input-reps" placeholder="-" ${valReps}>
                <input type="checkbox" class="workout-checkbox" data-rest="${card.querySelector('.workout-rest-input').value || 90}">
            `;
            container.appendChild(newRow);

            // AGGIORNAMENTO STATO: Salva l'aggiunta della serie
            const exerciseId = parseFloat(card.dataset.exerciseId);
            const exercise = routine.exercises.find(ex => ex.id === exerciseId);
            if (exercise) {
                ensureSessionInitialized();
                if (!exercise.series) exercise.series = [];
                // Sincronizza array se necessario (riempie buchi se presenti)
                while (exercise.series.length < currentSets) exercise.series.push({});
                
                // Recupera i valori target (standard) dell'ultima serie per copiarli
                let defaultWeight = '0';
                let defaultReps = '0';
                if (exercise.series.length > 0) {
                    const lastSeries = exercise.series[exercise.series.length - 1];
                    defaultWeight = lastSeries.weight || '0';
                    defaultReps = lastSeries.reps || '0';
                }

                // Aggiungi nuova serie
                exercise.series.push({ weight: defaultWeight, reps: defaultReps, prevWeight: '', prevReps: '', sessionWeight: '', sessionReps: '' });
                exercise.sets = exercise.series.length;
                saveAppData();
            }
        }

        // Remove Set
        if (e.target.classList.contains('btn-remove-set')) {
            if (container.children.length > 1) {
                container.lastElementChild.remove();

                // AGGIORNAMENTO STATO: Salva la rimozione della serie
                const exerciseId = parseFloat(card.dataset.exerciseId);
                const exercise = routine.exercises.find(ex => ex.id === exerciseId);
                if (exercise) {
                    ensureSessionInitialized();
                    const newCount = container.children.length;
                    exercise.sets = newCount;
                    // Taglia l'array dei dati se necessario
                    if (exercise.series && exercise.series.length > newCount) {
                        exercise.series = exercise.series.slice(0, newCount);
                    }
                    saveAppData();
                }
            }
        }

        // Adjust Values (+/-)
        if (e.target.classList.contains('btn-val-plus') || e.target.classList.contains('btn-val-minus')) {
            const type = e.target.dataset.type; // 'weight' or 'reps'
            const isPlus = e.target.classList.contains('btn-val-plus');
                            
            const weightStep = parseFloat(localStorage.getItem('weight_increment')) || 2.5;
            const step = type === 'weight' ? weightStep : 1;
            
            // Determina input target: prima serie non completata
            const rows = Array.from(container.querySelectorAll('.workout-set-row'));
            let targetRow = rows.find(row => !row.querySelector('.workout-checkbox').checked);
            
            // Se tutte completate, usa l'ultima
            if (!targetRow && rows.length > 0) {
                targetRow = rows[rows.length - 1];
            }

            let targetInput = targetRow ? targetRow.querySelector(`.input-${type}`) : null;

            if (targetInput) {
                let val = parseFloat(targetInput.value) || parseFloat(targetInput.placeholder) || 0;
                val = isPlus ? val + step : val - step;
                if (val < 0) val = 0;
                targetInput.value = val;
                // Aggiorna anche placeholder per coerenza visiva se vuoto
                if(targetInput.value === '') targetInput.placeholder = val;

                // Forza l'evento input per salvare i dati nello stato
                targetInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }
    });

    // Checkbox Listener (Delegato per gestire anche serie dinamiche)
    exercisesArea.addEventListener('change', (e) => {
        if (e.target.classList.contains('workout-checkbox')) {
            const row = e.target.closest('.workout-set-row');
            const card = e.target.closest('.workout-card');
            
            if (e.target.checked) {
                if (!isWorkoutStarted) startSession();
                
                // Logica di scorrimento: determina a quale card scrollare dopo il recupero
                let cardToScrollTo = null;
                const allCheckboxes = Array.from(card.querySelectorAll('.workout-checkbox'));
                const allChecked = allCheckboxes.every(cb => cb.checked);

                if (allChecked) {
                    // Esercizio completato, cerca il prossimo (anche tornando indietro)
                    cardToScrollTo = findNextIncompleteCard(card);
                } else {
                    // Esercizio non ancora completato, si scrolla su questo stesso per la prossima serie
                    cardToScrollTo = card;
                }

                const restTime = parseInt(e.target.dataset.rest) || 90;
                startRestTimer(restTime, cardToScrollTo);
                row.classList.add('completed');

                // SALVATAGGIO DATI (Per storico "Prev" e default prossimo allenamento)
                const exerciseId = parseFloat(card.dataset.exerciseId);
                const exercise = routine.exercises.find(ex => ex.id === exerciseId);
                
                if (exercise) {
                    const setIndex = parseInt(row.querySelector('.set-number').textContent) - 1;
                    const weightInput = row.querySelector('.input-weight');
                    const repsInput = row.querySelector('.input-reps');
                    
                    // Usa il valore inserito, altrimenti usa il placeholder (target)
                    const weightVal = weightInput.value !== '' ? weightInput.value : weightInput.placeholder;
                    const repsVal = repsInput.value !== '' ? repsInput.value : repsInput.placeholder;

                    // Assicura che l'array series esista e sia abbastanza lungo
                    if (!exercise.series) exercise.series = [];
                    while (exercise.series.length <= setIndex) {
                        exercise.series.push({ weight: '', reps: '', prevWeight: '', prevReps: '', sessionWeight: '', sessionReps: '' });
                    }
                    exercise.series[setIndex].completed = true;

                    // Aggiorna conteggio totale serie se aumentate dinamicamente
                    exercise.sets = Math.max(exercise.sets, exercise.series.length);

                    saveAppData();
                }
            } else {
                row.classList.remove('completed');
                // Rimuovi stato completato
                const exerciseId = parseFloat(card.dataset.exerciseId);
                const exercise = routine.exercises.find(ex => ex.id === exerciseId);
                if (exercise && exercise.series) {
                    const setIndex = parseInt(row.querySelector('.set-number').textContent) - 1;
                    if (exercise.series[setIndex]) {
                        exercise.series[setIndex].completed = false;
                        saveAppData();
                    }
                }
            }
        }
    });

    // Tasto Indietro: Esce senza chiedere conferma, mantiene stato attivo
    document.getElementById('btn-back-workout').onclick = () => {
        deactivateWakeLock();

        // FIX: Se l'allenamento NON è iniziato (è solo una bozza), annulla le modifiche ed esci
        if (currentWorkoutSession && !currentWorkoutSession.startTime) {
            if (currentWorkoutSession.originalRoutineJSON) {
                const original = JSON.parse(currentWorkoutSession.originalRoutineJSON);
                const p = AppState.plans.find(p => p.id === planId);
                if (p) {
                    const rIndex = p.routines.findIndex(r => r.id === routineId);
                    if (rIndex !== -1) {
                        p.routines[rIndex] = original;
                        saveAppData();
                    }
                }
            }
            currentWorkoutSession = null;
            localStorage.removeItem('active_workout_session');
            disableKeepAlive();
        }

        history.back();
    };

    // Tasto Azione (Inizia / Fine)
    const actionBtn = document.getElementById('btn-workout-action');
    if (actionBtn) {
        actionBtn.onclick = () => {
            if (!isWorkoutStarted) {
                startSession();
            } else {
                // Apre modale conferma
                openModal('end-workout-modal');
            }
        }
    };

    // Gestione Modale Fine Allenamento
    document.getElementById('btn-cancel-modal').onclick = () => {
        closeModal('end-workout-modal');
    };

    document.getElementById('btn-save-workout').onclick = () => {
        deactivateWakeLock();
        disableKeepAlive();
        if (typeof SystemNotifier !== 'undefined') SystemNotifier.clearWorkoutNotification();

        const workoutDuration = currentWorkoutSession && currentWorkoutSession.startTime ? Math.floor((Date.now() - currentWorkoutSession.startTime) / 1000) : 0; // in seconds
        const workoutDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const sessionTimestamp = Date.now();

        // I dati sono già salvati "on the fly". Puliamo solo lo stato.
        if (timerWorker) timerWorker.postMessage('stop');
        currentWorkoutSession = null;
        restEndTime = 0;

        let hasAnyCompletedSeries = false;
        // Save historical data for each exercise in the routine
        routine.exercises.forEach(ex => {
            const completedSeriesData = [];
            ex.series.forEach(s => {
                if (s.completed) {
                    // Calcola i valori effettivi usati (Sessione > Target Serie > Target Esercizio)
                    const targetWeight = (s.weight !== undefined && s.weight !== '') ? s.weight : (ex.weight || '');
                    const targetReps = (s.reps !== undefined && s.reps !== '') ? s.reps : (ex.reps || '');
                    
                    const finalWeight = (s.sessionWeight !== undefined && s.sessionWeight !== '') ? s.sessionWeight : targetWeight;
                    const finalReps = (s.sessionReps !== undefined && s.sessionReps !== '') ? s.sessionReps : targetReps;

                    // Aggiorna Prev per il prossimo allenamento
                    s.prevWeight = finalWeight;
                    s.prevReps = finalReps;

                    completedSeriesData.push({
                        weight: finalWeight,
                        reps: finalReps
                    });
                }
            });

            if (completedSeriesData.length > 0) {
                hasAnyCompletedSeries = true;
                if (!ex.history) {
                    ex.history = [];
                }
                ex.history.push({
                    date: workoutDate,
                    timestamp: sessionTimestamp,
                    seriesData: completedSeriesData,
                    targetReps: ex.reps || '',
                    targetWeight: ex.weight || ''
                });
                if (ex.history.length > 30) ex.history = ex.history.slice(ex.history.length - 30);
            }
        });
        
        // Salva un riepilogo a livello di routine (per la durata)
        if (hasAnyCompletedSeries) { // Salva solo se l'allenamento è stato effettivamente fatto
            if (!routine.history) {
                routine.history = [];
            }
            // Non rimuoviamo più i log precedenti per permettere sessioni multiple
            routine.history.push({ 
                date: workoutDate, 
                duration: workoutDuration,
                timestamp: sessionTimestamp
            });
            if (routine.history.length > 50) routine.history = routine.history.slice(routine.history.length - 50);
        }
        
        routine.lastPerformed = Date.now();
        saveAppData();

        localStorage.removeItem('active_workout_session');
        
        // FIX iOS: Se la modale è nella history, torna indietro di 2 step (Modale -> Workout -> Home)
        if (window.history.state && window.history.state.modalOpen === 'end-workout-modal') {
            history.go(-2);
        } else {
            closeModal('end-workout-modal'); // Pulisce solo visivamente se non è in history
            history.back();
        }
    };

    document.getElementById('btn-discard-workout').onclick = () => {
        deactivateWakeLock();
        disableKeepAlive();
        if (typeof SystemNotifier !== 'undefined') SystemNotifier.clearWorkoutNotification();

        // Ripristina lo stato precedente (annulla modifiche sessione)
        if (currentWorkoutSession && currentWorkoutSession.originalRoutineJSON) {
            const original = JSON.parse(currentWorkoutSession.originalRoutineJSON);
            const p = AppState.plans.find(p => p.id === planId);
            if (p) {
                const rIndex = p.routines.findIndex(r => r.id === routineId);
                if (rIndex !== -1) {
                    p.routines[rIndex] = original;
                    saveAppData();
                }
            }
        }
        if (timerWorker) timerWorker.postMessage('stop');
        currentWorkoutSession = null;
        restEndTime = 0;
        localStorage.removeItem('active_workout_session');
        
        // FIX iOS: Se la modale è nella history, torna indietro di 2 step (Modale -> Workout -> Home)
        if (window.history.state && window.history.state.modalOpen === 'end-workout-modal') {
            history.go(-2);
        } else {
            closeModal('end-workout-modal'); // Pulisce solo visivamente se non è in history
            history.back();
        }
    };

    // Rest Timer Listeners
    document.getElementById('btn-rest-minus').onclick = () => adjustRestTimer(-15);
    document.getElementById('btn-rest-plus').onclick = () => adjustRestTimer(15);
    document.getElementById('btn-rest-skip').onclick = () => skipRestTimer();

    setFabAction(null); // No FAB during workout
    switchView('workout');
}

// Listener per messaggi dal Service Worker (Click Notifica)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'NAVIGATE_TO_ACTIVE_EXERCISE') {
            if (AppState.currentView === 'workout') {
                scrollToActiveExercise();
            } else {
                // Se non siamo nella vista workout, prova a ripristinare la sessione
                try {
                    const savedSession = localStorage.getItem('active_workout_session');
                    if (savedSession) {
                        const session = JSON.parse(savedSession);
                        if (session.startTime) {
                            renderWorkout(session.routineId, session.planId);
                        }
                    }
                } catch(e) {}
            }
        }
    });
}