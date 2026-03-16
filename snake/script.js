/* --- Inizializzazione Elementi DOM --- */
const canvas = document.getElementById("snakeGame");
const ctx = canvas.getContext("2d"); // Contesto per disegnare sul canvas
const scoreEl = document.getElementById("scoreVal");
const highEl = document.getElementById("highScore");

/* --- Variabili di Stato del Gioco --- */
let box = 15;           // Dimensione di un singolo quadrato (griglia)
let score = 0;          // Punteggio corrente
let gameInterval;       // Variabile per il ciclo di gioco
let currentName = "";   // Nome del giocatore attuale
let d = "RIGHT";        // Direzione iniziale del serpente
let snake = [];         // Array che contiene i segmenti del serpente
let food = {};          // Oggetto per le coordinate del cibo

// Carica e visualizza il Record Storico salvato nel browser
highEl.innerHTML = localStorage.getItem("snakeRecord") || 0;

/* --- Gestione Flusso di Gioco --- */

// Avvia la sessione: legge il nome e passa alla schermata di gioco
function startGame() {
    currentName = document.getElementById("playerName").value.trim() || "Anonimo";
    document.getElementById("menu").classList.add("hidden");
    document.getElementById("game-screen").classList.remove("hidden");
    resetGame();
}

// Resetta le variabili e avvia il loop temporizzato (100ms)
function resetGame() {
    score = 0;
    scoreEl.innerHTML = score;
    d = "RIGHT";
    snake = [{ x: 9 * box, y: 10 * box }]; // Posizione iniziale
    // Posizionamento casuale del primo cibo
    food = { 
        x: Math.floor(Math.random() * 20) * box, 
        y: Math.floor(Math.random() * 20) * box 
    };
    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(draw, 100); // Velocità del gioco
}

/* --- Gestione Dati e Leaderboard --- */

// Salva il punteggio nella classifica locale (top 5)
function saveScore(name, finalScore) {
    let leaderboard = JSON.parse(localStorage.getItem("snakeLeaderboard")) || [];
    leaderboard.push({ name: name, score: finalScore });
    
    // Ordina dal più alto al più basso e taglia ai primi 5
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 5); 
    localStorage.setItem("snakeLeaderboard", JSON.stringify(leaderboard));

    // Aggiorna il record assoluto se superato
    let globalRecord = localStorage.getItem("snakeRecord") || 0;
    if (finalScore > globalRecord) localStorage.setItem("snakeRecord", finalScore);
}

// Mostra la lista dei migliori punteggi nel menu
function showLeaderboard() {
    document.getElementById("menu").classList.add("hidden");
    const board = document.getElementById("leaderboard");
    const list = document.getElementById("leaderboardList");
    board.classList.remove("hidden");
    
    let leaderboard = JSON.parse(localStorage.getItem("snakeLeaderboard")) || [];
    // Genera l'HTML per ogni riga della classifica
    list.innerHTML = leaderboard.map(item => 
        `<li><span>${item.name}</span> <span>${item.score}</span></li>`
    ).join('');
}

function backToMenu() {
    document.getElementById("leaderboard").classList.add("hidden");
    document.getElementById("menu").classList.remove("hidden");
}

/* --- Input Utente --- */

// Ascolta i tasti freccia per cambiare direzione (evitando inversioni a 180°)
document.addEventListener("keydown", (e) => {
    if (e.keyCode == 37 && d != "RIGHT") d = "LEFT";
    else if (e.keyCode == 38 && d != "DOWN") d = "UP";
    else if (e.keyCode == 39 && d != "LEFT") d = "RIGHT";
    else if (e.keyCode == 40 && d != "UP") d = "DOWN";
});

/* --- Logica di Rendering e Collisioni --- */

function draw() {
    // Sfondo del canvas (colore verde chiaro "Game Boy")
    ctx.fillStyle = "#97b997";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Disegna il serpente: testa nera, corpo grigio scuro
    for (let i = 0; i < snake.length; i++) {
        ctx.fillStyle = (i == 0) ? "#000" : "#333";
        ctx.fillRect(snake[i].x, snake[i].y, box - 1, box - 1);
    }

    // Disegna il cibo
    ctx.fillStyle = "#000";
    ctx.fillRect(food.x, food.y, box - 1, box - 1);

    // Calcola la posizione futura della testa
    let snakeX = snake[0].x;
    let snakeY = snake[0].y;

    if (d == "LEFT") snakeX -= box;
    if (d == "UP") snakeY -= box;
    if (d == "RIGHT") snakeX += box;
    if (d == "DOWN") snakeY += box;

    let newHead = { x: snakeX, y: snakeY };

    // Controllo collisioni: bordi o corpo stesso
    if (snakeX < 0 || snakeX >= canvas.width || snakeY < 0 || snakeY >= canvas.height || collision(newHead, snake)) {
        clearInterval(gameInterval);
        saveScore(currentName, score);
        alert("GAME OVER, " + currentName + "! Punteggio: " + score);
        location.reload(); // Ricarica la pagina per resettare tutto
        return;
    }

    // Controllo se il serpente mangia il cibo
    if (snakeX == food.x && snakeY == food.y) {
        score++;
        scoreEl.innerHTML = score;
        // Genera nuove coordinate per il cibo
        food = { 
            x: Math.floor(Math.random() * 20) * box, 
            y: Math.floor(Math.random() * 20) * box 
        };
    } else {
        // Se non mangia, rimuove l'ultimo elemento (movimento standard)
        snake.pop();
    }
    // Aggiunge la nuova testa in cima all'array
    snake.unshift(newHead);
}

// Funzione helper per controllare se la testa tocca un pezzo del corpo
function collision(head, array) {
    for (let i = 0; i < array.length; i++) {
        if (head.x == array[i].x && head.y == array[i].y) return true;
    }
    return false;
}