// js/notifications.js

const SystemNotifier = {

    isAndroid: /android/i.test(navigator.userAgent),
    isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),

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
     * @param {number|null} options.currentRest - e.g., 85 or null
     * @param {number|null} options.totalRest - e.g., 90 or null
     * @param {string} options.routineName - e.g., "Sessione A"
     * @param {string} options.nextExerciseName - e.g., "Panca Piana"
     * @param {string} options.setInfo - e.g., "1/3"
     * @param {string} options.targetInfo - e.g., "100kg x 8"
     */
    updateWorkoutNotification({ workoutTime, currentRest, totalRest, routineName, nextExerciseName, setInfo, targetInfo }) {
        if (Notification.permission !== 'granted') {
            return;
        }

        if (this.isAndroid) {
            this.showAndroidPersistentNotification({ workoutTime, currentRest, totalRest, routineName, nextExerciseName, setInfo, targetInfo }); 
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
            // Chiude TUTTE le notifiche dell'app per garantire la pulizia completa
            registration.getNotifications().then(notifications => {
                notifications.forEach(notification => notification.close());
            });
        });
    },

    // --- Implementazioni specifiche per piattaforma (da dettagliare) ---

    getAdaptiveIcon() {
        // Se il sistema è in modalità chiara, usa l'icona dell'app (che ha sfondo/colore scuro)
        // per contrastare con lo sfondo bianco della notifica.
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            return './w-notification-icon.png';
        }
        return './notification-icon.png';
    },

    showAndroidPersistentNotification({ workoutTime, currentRest, totalRest, routineName, nextExerciseName, setInfo, targetInfo }) {
        if (!('serviceWorker' in navigator)) return;

        // Titolo: Se c'è recupero mostra il tempo, altrimenti il nome della routine
        let title;
        if (currentRest !== null && totalRest !== null && totalRest > 0) {
            title = `Recupero: ${currentRest}/${totalRest}s`;
        } else if (currentRest !== null) {
            title = `Recupero: ${currentRest}s`;
        } else {
            title = routineName;
        }

        // Body: ➜ 1/3 Panca Piana: 100kg x 8
        let body = 'Allenamento in corso';
        if (nextExerciseName) {
            body = `➜ ${setInfo ? setInfo + ' ' : ''}${nextExerciseName}${targetInfo ? ': ' + targetInfo : ''}`;
        }

        navigator.serviceWorker.ready.then(registration => {
            registration.showNotification(title, {
                body: body,
                icon: this.getAdaptiveIcon(),
                badge: './notification-icon.png',
                tag: 'onepercent-workout-status', // Tag fisso per aggiornare la stessa notifica
                silent: true,      // Niente suono/vibrazione
                renotify: false,   // Niente avviso visivo/sonoro sugli aggiornamenti
                ongoing: true      // Rende la notifica persistente (non cancellabile con swipe su Android)
            });
        });
    },

    /**
     * Schedules a notification for when the rest timer finishes. (Primarily for iOS)
     * This delegates the timing to the Service Worker for background reliability.
     * @param {object} options - Notification content and timing.
     */
    scheduleRestFinishedNotification({ endTime, routineName, nextExerciseName, setInfo, targetInfo }) {
        const notificationsEnabled = localStorage.getItem('notifications_enabled') !== 'false';
        if (!notificationsEnabled || Notification.permission !== 'granted' || !this.isIOS || !('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
            return;
        }

        navigator.serviceWorker.controller.postMessage({
            type: 'SCHEDULE_IOS_REST_NOTIFICATION',
            endTime,
            routineName,
            nextExerciseName,
            setInfo,
            targetInfo
        });
    },

    /**
     * Cancels any pending scheduled rest notification. (Primarily for iOS)
     */
    cancelScheduledRestNotification() {
        if (!this.isIOS || !('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
            return;
        }
        navigator.serviceWorker.controller.postMessage({ type: 'CANCEL_IOS_REST_NOTIFICATION' });
    }
};