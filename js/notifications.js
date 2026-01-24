// js/notifications.js

const SystemNotifier = {

    isAndroid: /android/i.test(navigator.userAgent),

    /**
     * Requests permission to show notifications.
     * Should be called upon a user gesture.
     * @returns {Promise<boolean>} - True if permission is granted.
     */
    async requestPermission() {
        if (!('Notification' in window)) {
            console.log("Questo browser non supporta le notifiche di sistema.");
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        // Tenta sempre la richiesta per rilevare cambiamenti nelle impostazioni di sistema
        try {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        } catch (e) {
            return false;
        }
    },

    /**
     * Shows or updates the workout notification.
     * @param {object} options
     * @param {string} options.workoutTime - e.g., "00:15"
     * @param {string} options.restTime - e.g., "01:30" or null if not resting
     * @param {string} options.routineName - e.g., "Sessione A"
     * @param {string} options.nextExerciseName - e.g., "Panca Piana"
     * @param {string} options.setInfo - e.g., "1/3"
     * @param {string} options.targetInfo - e.g., "100kg x 8"
     */
    updateWorkoutNotification({ workoutTime, restTime, routineName, nextExerciseName, setInfo, targetInfo }) {
        if (Notification.permission !== 'granted') {
            return;
        }

        if (this.isAndroid) {
            // Android: La logica per la notifica persistente andrà qui
            this.showAndroidPersistentNotification({ workoutTime, restTime, routineName, nextExerciseName, setInfo, targetInfo }); 
        }
    },

    /**
     * Hides the workout notification.
     */
    clearWorkoutNotification() {
        if (Notification.permission !== 'granted') {
            return;
        }
        
        if (!('serviceWorker' in navigator)) return;

        // Chiude le notifiche dell'app tramite il service worker
        navigator.serviceWorker.ready.then(registration => {
            registration.getNotifications({ tag: 'onepercent-rest-finished' }).then(notifications => {
                notifications.forEach(notification => notification.close());
            });
            registration.getNotifications({ tag: 'onepercent-workout-status' }).then(notifications => {
                notifications.forEach(notification => notification.close());
            });
        });
    },

    // --- Implementazioni specifiche per piattaforma (da dettagliare) ---

    showAndroidPersistentNotification({ workoutTime, restTime, routineName, nextExerciseName, setInfo, targetInfo }) {
        if (!('serviceWorker' in navigator)) return;

        // Titolo: Se c'è recupero mostra il tempo, altrimenti il nome della routine
        const title = restTime ? `Recupero: ${restTime}` : routineName;
        
        // Body: ➜ 1/3 Panca Piana: 100kg x 8
        let body = 'Allenamento in corso';
        if (nextExerciseName) {
            body = `➜ ${setInfo ? setInfo + ' ' : ''}${nextExerciseName}${targetInfo ? ': ' + targetInfo : ''}`;
        }

        navigator.serviceWorker.ready.then(registration => {
            registration.showNotification(title, {
                body: body,
                icon: './notification-icon.png',
                badge: './notification-icon.png',
                tag: 'onepercent-workout-status', // Tag fisso per aggiornare la stessa notifica
                silent: true,      // Niente suono/vibrazione
                renotify: false,   // Niente avviso visivo/sonoro sugli aggiornamenti
                ongoing: true      // Rende la notifica persistente (non cancellabile con swipe su Android)
            });
        });
    },

    /**
     * Mostra una notifica singola per iOS (e altri non-Android) quando il recupero è finito.
     * @param {object} options
     * @param {string} options.routineName - Es. "Sessione A"
     * @param {string} options.nextExerciseName - Es. "Panca Piana"
     * @param {string} options.setInfo - Es. "1/3"
     * @param {string} options.targetInfo - Es. "100kg x 8"
     */
    showRestFinishedNotification({ routineName, nextExerciseName, setInfo, targetInfo }) {
        if (Notification.permission !== 'granted' || this.isAndroid || !('serviceWorker' in navigator)) {
            return;
        }

        const title = routineName;
        let body = "Recupero terminato\nAllenamento completato!";
        if (nextExerciseName) {
            body = `Recupero terminato\n➜ ${setInfo ? setInfo + ' ' : ''}${nextExerciseName}${targetInfo ? ': ' + targetInfo : ''}`;
        }
        
        navigator.serviceWorker.ready.then(registration => {
            registration.showNotification(title, { 
                body, 
                icon: './notification-icon.png', 
                badge: './notification-icon.png',
                tag: 'onepercent-rest-finished', 
                renotify: true 
            });
        });
    }
};