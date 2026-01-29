const RestTimerView = {
    show(initialSeconds, nextExerciseInfo, totalSeconds) {
        // Controlla se l'opzione è abilitata
        if (localStorage.getItem('fullscreen_timer_enabled') === 'false') return;

        history.pushState({view: 'restTimer'}, 'Recupero', '#restTimer');
        
        // Usa switchView per gestire la visibilità
        switchView('restTimer');

        const container = document.getElementById('view-rest-timer');
        if (!container) return;

        const total = totalSeconds || initialSeconds;

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
            <div id="fullscreen-timer-display" class="rest-timer-fullscreen-display"><span class="rest-timer-current">${initialSeconds}</span><small class="rest-timer-total">/${total}s</small></div>
            
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

    update(seconds, totalSeconds) {
        const display = document.getElementById('fullscreen-timer-display');
        if (display) {
            const current = seconds > 0 ? seconds : 0;
            const total = totalSeconds > 0 ? totalSeconds : 0;
            display.innerHTML = `<span class="rest-timer-current">${current}</span><small class="rest-timer-total">/${total}s</small>`;
        }
    },

    close() {
        // Se siamo nella vista timer, torna indietro
        if (AppState.currentView === 'restTimer') {
            history.back();
        }
    }
};