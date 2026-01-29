// --- LISTA ESERCIZI DEFAULT ---
function getDefaultExercises() {
    const list = [
        // Petto
        { name: "Panca Piana", group: "Petto" },
        { name: "Panca Inclinata", group: "Petto" },
        { name: "Panca Piana Manubri", group: "Petto" },
        { name: "Panca Inclinata Manubri", group: "Petto" },
        { name: "Panca Piana Multipower", group: "Petto" },
        { name: "Panca Inclinata Multipower", group: "Petto" },
        { name: "Chest Press", group: "Petto" },
        { name: "Chest Press presa Stretta", group: "Petto" },
        { name: "Incline Chest Press", group: "Petto" },
        { name: "Croci Panca Piana", group: "Petto" },
        { name: "Croci Panca Inclinata", group: "Petto" },
        { name: "Croci ai Cavi", group: "Petto" },
        { name: "Pec Fly", group: "Petto" },
        { name: "Dip alle Parallele", group: "Petto" },
        { name: "Push Up", group: "Petto" },
        // Dorso
        { name: "Deadlift", group: "Dorso" },
        { name: "Lat Machine", group: "Dorso" },
        { name: "Lat Pulldown", group: "Dorso" },
        { name: "Pull Down", group: "Dorso" },
        { name: "Pulley", group: "Dorso" },
        { name: "Rematore Manubri", group: "Dorso" },
        { name: "Rematore Bilanciere", group: "Dorso" },
        { name: "Rematore al Cavo", group: "Dorso" },
        { name: "T Bar", group: "Dorso" },
        { name: "Pull Up", group: "Dorso" },
        { name: "Chin Up", group: "Dorso" },
        { name: "Iperestensioni", group: "Dorso" },
        // Spalle
        { name: "Military Press", group: "Spalle" },
        { name: "Lento Avanti Manubri", group: "Spalle" },
        { name: "Alzate Laterali", group: "Spalle" },
        { name: "Alzate Frontali", group: "Spalle" },
        { name: "Alzate Laterali ai Cavi", group: "Spalle" },
        { name: "Alzate Frontali ai Cavi", group: "Spalle" },
        { name: "Shoulder Press", group: "Spalle" },
        { name: "Shoulder Press presa Stretta", group: "Spalle" },
        { name: "Arnold Press", group: "Spalle" },
        // Deltoidi Posteriori
        { name: "Reverse Pec Deck", group: "Deltoidi Posteriori" },
        { name: "Alzate Posteriori Manubri", group: "Deltoidi Posteriori" },
        { name: "Face Pull", group: "Deltoidi Posteriori" },
        // Trapezio
        { name: "Scrollate Manubri", group: "Trapezio" },
        { name: "Scrollate Bilanciere", group: "Trapezio" },
        // Quadricipiti
        { name: "Squat", group: "Quadricipiti" },
        { name: "Leg Press", group: "Quadricipiti" },
        { name: "Squat al Multipower", group: "Quadricipiti" },
        { name: "Leg Extention", group: "Quadricipiti" },
        { name: "Affondi bulgari", group: "Quadricipiti" },
        { name: "Affondi Manubri", group: "Quadricipiti" },
        { name: "Hack Squat", group: "Quadricipiti" },
        // Femorali
        { name: "Leg Curl Seduto", group: "Femorali" },
        { name: "Leg Curl Sdraiato", group: "Femorali" },
        { name: "Leg Curl in Piedi", group: "Femorali" },
        { name: "Stacchi Rumeni Manubri", group: "Femorali" },
        { name: "Stacchi Rumeni Bilanciere", group: "Femorali" },
        { name: "Good Morning", group: "Femorali" },
        // Bicipiti
        { name: "Curl Manubri", group: "Bicipiti" },
        { name: "Curl Hammer Manubri", group: "Bicipiti" },
        { name: "Curl al Cavo", group: "Bicipiti" },
        { name: "Curl al Cavo con Corda", group: "Bicipiti" },
        { name: "Curl Bilanciere EZ", group: "Bicipiti" },
        { name: "Curl Bilanciere", group: "Bicipiti" },
        // Tricipiti
        { name: "Push Down", group: "Tricipiti" },
        { name: "Push Down Corda", group: "Tricipiti" },
        { name: "Push Down V Bar", group: "Tricipiti" },
        { name: "Overhead Extention", group: "Tricipiti" },
        { name: "Overhead Extention Manubri", group: "Tricipiti" },
        { name: "Kick Back", group: "Tricipiti" },
        { name: "French Press Bilanciere", group: "Tricipiti" },
        { name: "French Press Manubri", group: "Tricipiti" },
        // Glutei
        { name: "Hip Trust", group: "Glutei" },
        { name: "Glute Kickback ai Cavi", group: "Glutei" },
        { name: "Abduzioni ai Cavi", group: "Glutei" },
        { name: "Abduzioni alla Macchina", group: "Glutei" },
        // Addome
        { name: "Plank", group: "Addome" },
        { name: "Crunch", group: "Addome" },
        { name: "Leg Raise", group: "Addome" },
        { name: "Russian Twist", group: "Addome" },
        { name: "Sit Up", group: "Addome" },
        { name: "Mountain Climber", group: "Addome" },
        // Polpacci
        { name: "Polpacci", group: "Polpacci" },
        { name: "Calf Machine", group: "Polpacci" },
        { name: "Calf Seduto", group: "Polpacci" },
        { name: "Calf alla Pressa", group: "Polpacci" },
        // Avambracci
        { name: "Wrist Curl", group: "Avambracci" },
        { name: "Reverse Curl", group: "Avambracci" }
    ];

    // Ordina per Gruppo Muscolare, poi per Nome
    list.sort((a, b) => {
        if (a.group < b.group) return -1;
        if (a.group > b.group) return 1;
        return a.name.localeCompare(b.name);
    });

    return list.map((ex, index) => ({
        id: Date.now() + index,
        name: ex.name,
        muscleGroup: ex.group
    }));
}

// --- PIANI DEFAULT ---
function getDefaultPlans(allExercises) {
    const baseId = Date.now();
    let idCounter = 1000;

    // Helper per creare un'istanza di esercizio per la routine
    const findEx = (name, sets, reps, rest) => {
        const template = allExercises.find(e => e.name === name);
        const exName = template ? template.name : name;
        const exGroup = template ? template.muscleGroup : 'Altro';

        return {
            id: baseId + (idCounter++),
            name: exName,
            muscleGroup: exGroup,
            sets: sets,
            reps: String(reps),
            rest: rest,
            notes: '',
            series: [],
            history: []
        };
    };

    const pushSession = [
        findEx("Panca Piana", 4, 6, 180),
        findEx("Military Press", 3, 6, 150),
        findEx("Panca Inclinata Manubri", 3, 10, 90), // Panca Inclinata Manubri
        findEx("Alzate Laterali", 3, 10, 60),
        findEx("Dip alle Parallele", 3, 10, 90),
        findEx("Push Down con Corda", 3, 10, 60)
    ];

    const pullSession = [
        findEx("Deadlift", 3, 6, 180),
        findEx("Pull Up", 4, 6, 150),
        findEx("Rematore con Bilanciere", 3, 10, 90),
        findEx("Lat Machine", 3, 10, 90),
        findEx("Face Pull", 3, 10, 60),
        findEx("Curl con Bilanciere EZ", 3, 10, 90)
    ];

    const legsSession = [
        findEx("Squat", 4, 6, 180),
        findEx("Leg Press", 3, 6, 150),
        findEx("Stacchi Rumeni", 3, 10, 90),
        findEx("Affondi con Manubri", 3, 10, 90),
        findEx("Leg Extention", 3, 10, 60),
        findEx("Leg Curl", 3, 10, 60)
    ];

    return [{
        id: baseId,
        name: "Push Pull Legs",
        description: "Programma base su 3 giorni",
        routines: [
            { id: baseId + 1, name: "Push (Spinta)", exercises: pushSession },
            { id: baseId + 2, name: "Pull (Tirata)", exercises: pullSession },
            { id: baseId + 3, name: "Legs (Gambe)", exercises: legsSession }
        ]
    }];
}

// --- INIZIALIZZAZIONE DATI ---
let exercises = JSON.parse(localStorage.getItem('gym_exercises'));
if (!exercises) {
    exercises = getDefaultExercises();
} else if (exercises.length > 0 && typeof exercises[0] === 'string') {
    // Migrazione da vecchio formato (array di stringhe) a nuovo (array di oggetti)
    exercises = exercises.map((name, index) => ({
        id: Date.now() + index,
        name: name,
        muscleGroup: 'Altro'
    }));
}

let plans = JSON.parse(localStorage.getItem('gym_plans'));
if (!plans || plans.length === 0) {
    plans = getDefaultPlans(exercises);
}

let archivedPlans = JSON.parse(localStorage.getItem('gym_archived_plans'));
if (!archivedPlans) {
    archivedPlans = [];
}

let activePlanId = JSON.parse(localStorage.getItem('gym_activePlanId'));

// Se c'è almeno un piano ma nessun piano attivo (o ID non valido), seleziona il primo
if (plans.length > 0) {
    const isActiveValid = plans.some(p => p.id === activePlanId);
    if (!activePlanId || !isActiveValid) {
        activePlanId = plans[0].id;
        localStorage.setItem('gym_activePlanId', JSON.stringify(activePlanId));
    }
} else if (activePlanId) {
    activePlanId = null;
    localStorage.removeItem('gym_activePlanId');
}

// --- STATO DELL'APP ---
const AppState = {
    plans: plans,
    exercises: exercises,
    archivedPlans: archivedPlans,
    activePlanId: activePlanId,
    theme: localStorage.getItem('gym_theme') || 'gray',
    currentView: 'home'
};

// --- FUNZIONE PER SALVARE TUTTI I DATI ---
function saveAppData() {
    localStorage.setItem('gym_plans', JSON.stringify(AppState.plans));
    localStorage.setItem('gym_exercises', JSON.stringify(AppState.exercises));
    localStorage.setItem('gym_archived_plans', JSON.stringify(AppState.archivedPlans));
    localStorage.setItem('gym_activePlanId', JSON.stringify(AppState.activePlanId));
    localStorage.setItem('gym_theme', AppState.theme);
}

// Salva lo stato iniziale se è stato generato ora (primo avvio)
if (!localStorage.getItem('gym_plans')) {
    saveAppData();
}