// --- LISTA ESERCIZI DEFAULT ---
function getDefaultExercises() {
    const list = [
        // Petto
        { name: "Panca Piana", group: "Petto" },
        { name: "Panca Inclinata", group: "Petto" },
        { name: "Spinte Panca Piana", group: "Petto" },
        { name: "Spinte Panca Inclinata", group: "Petto" },
        { name: "Panca Piana Multipower", group: "Petto" },
        { name: "Panca Inclinata Multipower", group: "Petto" },
        { name: "Chest Press", group: "Petto" },
        { name: "Croci ai Cavi", group: "Petto" },
        { name: "Pec Fly", group: "Petto" },
        // Dorso
        { name: "Deadlift", group: "Dorso" },
        { name: "Lat Machine", group: "Dorso" },
        { name: "Lat Pulldown", group: "Dorso" },
        { name: "Pull Down", group: "Dorso" },
        { name: "Pulley", group: "Dorso" },
        { name: "Rematore con Manubri", group: "Dorso" },
        { name: "Rematore con Bilanciere", group: "Dorso" },
        { name: "T Bar", group: "Dorso" },
        // Spalle
        { name: "Military Press", group: "Spalle" },
        { name: "Lento Avanti con Manubri", group: "Spalle" },
        { name: "Alzate Laterali", group: "Spalle" },
        { name: "Alzate Frontali", group: "Spalle" },
        { name: "Alzate Laterali ai Cavi", group: "Spalle" },
        { name: "Shoulder Press", group: "Spalle" },
        // Quadricipiti
        { name: "Squat", group: "Quadricipiti" },
        { name: "Leg Press", group: "Quadricipiti" },
        { name: "Squat al Multipower", group: "Quadricipiti" },
        { name: "Leg Extention", group: "Quadricipiti" },
        { name: "Affondi", group: "Quadricipiti" },
        // Femorali
        { name: "Leg Curl", group: "Femorali" },
        { name: "Stacchi Rumeni", group: "Femorali" },
        // Bicipiti
        { name: "Curl con Manubri", group: "Bicipiti" },
        { name: "Curl Hammer", group: "Bicipiti" },
        { name: "Curl al Cavo", group: "Bicipiti" },
        { name: "Curl al Cavo con Corda", group: "Bicipiti" },
        { name: "Curl EZ", group: "Bicipiti" },
        // Tricipiti
        { name: "Push Down", group: "Tricipiti" },
        { name: "Push Down con Corda", group: "Tricipiti" },
        { name: "Overhead Extention", group: "Tricipiti" },
        { name: "Kick Back", group: "Tricipiti" },
        // Glutei
        { name: "Hip Trust", group: "Glutei" },
        // Addome
        { name: "Plank", group: "Addome" },
        { name: "Crunch", group: "Addome" },
        // Polpacci
        { name: "Polpacci", group: "Polpacci" },
        { name: "Calf Machine", group: "Polpacci" }
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
        if (!template) return null;
        return {
            id: baseId + (idCounter++),
            name: template.name,
            muscleGroup: template.muscleGroup,
            sets: sets,
            reps: String(reps),
            rest: rest,
            notes: '',
            series: [],
            history: []
        };
    };

    const sessionA = [
        findEx("Squat", 3, 6, 120),
        findEx("Panca Piana", 3, 6, 120),
        findEx("Rematore con Bilanciere", 3, 8, 120),
        findEx("Leg Curl", 3, 10, 90),
        findEx("Alzate Laterali ai Cavi", 3, 10, 90),
        findEx("Curl con Manubri", 3, 10, 90),
        findEx("Push Down", 3, 10, 90)
    ].filter(e => e);

    const sessionB = [
        findEx("Stacchi Rumeni", 3, 6, 120),
        findEx("Military Press", 3, 6, 120),
        findEx("Lat Machine", 3, 8, 120),
        findEx("Leg Extention", 3, 10, 90),
        findEx("Spinte Panca Inclinata", 3, 10, 90),
        findEx("Push Down con Corda", 3, 10, 90),
        findEx("Curl al Cavo con Corda", 3, 10, 90)
    ].filter(e => e);

    const sessionC = [
        findEx("Leg Press", 3, 6, 120),
        findEx("Pulley", 3, 8, 90),
        findEx("Chest Press", 3, 10, 90),
        findEx("Hip Trust", 3, 10, 90),
        findEx("Shoulder Press", 3, 10, 90),
        findEx("Curl Hammer", 3, 10, 90),
        findEx("Overhead Extention", 3, 10, 90)
    ].filter(e => e);

    return [
        {
            id: baseId,
            name: "Full Body",
            routines: [
                { id: baseId + 1, name: "Sessione A", exercises: sessionA },
                { id: baseId + 2, name: "Sessione B", exercises: sessionB },
                { id: baseId + 3, name: "Sessione C", exercises: sessionC }
            ]
        }
    ];
}

// --- INIZIALIZZAZIONE DATI ---
let exercises = JSON.parse(localStorage.getItem('gym_exercises'));
if (!exercises) {
    exercises = getDefaultExercises();
} else if (exercises.length > 0 && typeof exercises[0] === 'string') {
    // Migrazione immediata (String -> Object) per supportare getDefaultPlans
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

let activePlanId = JSON.parse(localStorage.getItem('gym_activePlanId'));
if (!activePlanId && plans.length > 0) {
    activePlanId = plans[0].id;
}

// --- STATO DELL'APP ---
const AppState = {
    plans: plans,
    exercises: exercises,
    activePlanId: activePlanId,
    theme: localStorage.getItem('gym_theme') || 'gray',
    currentView: 'home'
};

// --- FUNZIONE PER SALVARE TUTTI I DATI ---
function saveAppData() {
    localStorage.setItem('gym_plans', JSON.stringify(AppState.plans));
    localStorage.setItem('gym_exercises', JSON.stringify(AppState.exercises));
    localStorage.setItem('gym_activePlanId', JSON.stringify(AppState.activePlanId));
    localStorage.setItem('gym_theme', AppState.theme);
}

// Salva lo stato iniziale se è stato generato ora (primo avvio)
if (!localStorage.getItem('gym_plans')) {
    saveAppData();
}