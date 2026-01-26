const RestTimerView = {
    show(initialSeconds, nextExerciseInfo) {
        // Controlla se l'opzione è abilitata
        if (localStorage.getItem('fullscreen_timer_enabled') !== 'true') return;

        history.pushState({view: 'restTimer'}, 'Recupero', '#restTimer');
        
        // Usa switchView per gestire la visibilità
        switchView('restTimer');

        const container = document.getElementById('view-rest-timer');
        if (!container) return;

        let nextExerciseContent;
        if (nextExerciseInfo.name) {
            const nameText = `➜ ${nextExerciseInfo.name}`;
            let detailsText = '';
            if (nextExerciseInfo.setInfo || nextExerciseInfo.targetInfo) {
                detailsText = `${nextExerciseInfo.setInfo ? nextExerciseInfo.setInfo + ' -' : ''} ${nextExerciseInfo.targetInfo || ''}`.trim();
            }
            
            nextExerciseContent = `
                <span class="next-exercise-name">${nameText}</span>
                ${detailsText ? `<span class="next-exercise-details">${detailsText}</span>` : ''}
            `;
        } else {
            nextExerciseContent = 'Allenamento completato!';
        }

        container.innerHTML = `
            <button id="btn-back-rest-timer" class="rest-timer-fullscreen-back-btn">←</button>
            <div id="fullscreen-timer-display" class="rest-timer-fullscreen-display">${formatRestTime(initialSeconds)}</div>
            
            <div class="rest-timer-fullscreen-controls">
                <button id="btn-fs-rest-minus" class="rest-btn-fullscreen">-15</button>
                <button id="btn-fs-rest-plus" class="rest-btn-fullscreen">+15</button>
                <button id="btn-fs-rest-skip" class="rest-btn-fullscreen skip-btn-fullscreen">Skip</button>
            </div>

            <div class="rest-timer-fullscreen-next-exercise">
                ${nextExerciseContent}
            </div>
        `;

        container.querySelector('#btn-back-rest-timer').onclick = () => {
            this.close();
        };

        // Event listeners per i controlli del timer
        container.querySelector('#btn-fs-rest-minus').onclick = () => typeof adjustRestTimer === 'function' && adjustRestTimer(-15);
        container.querySelector('#btn-fs-rest-plus').onclick = () => typeof adjustRestTimer === 'function' && adjustRestTimer(15);
        container.querySelector('#btn-fs-rest-skip').onclick = () => {
            if (typeof skipRestTimer === 'function') skipRestTimer();
            this.close();
        };
    },

    update(seconds) {
        const display = document.getElementById('fullscreen-timer-display');
        if (display) {
            display.textContent = formatRestTime(seconds > 0 ? seconds : 0);
        }
    },

    close() {
        // Se siamo nella vista timer, torna indietro
        if (AppState.currentView === 'restTimer') {
            history.back();
        }
    }
};