const canvas = document.getElementById("snakeGame");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("scoreVal");
const highEl = document.getElementById("highScore");

let box = 15, score = 0, gameInterval, currentName = "";
let d = "RIGHT", snake = [], food = {};

// Carica Record Globale
highEl.innerHTML = localStorage.getItem("snakeRecord") || 0;

function startGame() {
    currentName = document.getElementById("playerName").value.trim() || "Anonimo";
    document.getElementById("menu").classList.add("hidden");
    document.getElementById("game-screen").classList.remove("hidden");
    resetGame();
}

function resetGame() {
    score = 0;
    scoreEl.innerHTML = score;
    d = "RIGHT";
    snake = [{ x: 9 * box, y: 10 * box }];
    food = { x: Math.floor(Math.random() * 20) * box, y: Math.floor(Math.random() * 20) * box };
    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(draw, 100);
}

function saveScore(name, finalScore) {
    let leaderboard = JSON.parse(localStorage.getItem("snakeLeaderboard")) || [];
    leaderboard.push({ name: name, score: finalScore });
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 5); // Tiene solo i primi 5
    localStorage.setItem("snakeLeaderboard", JSON.stringify(leaderboard));

    let globalRecord = localStorage.getItem("snakeRecord") || 0;
    if (finalScore > globalRecord) localStorage.setItem("snakeRecord", finalScore);
}

function showLeaderboard() {
    document.getElementById("menu").classList.add("hidden");
    const board = document.getElementById("leaderboard");
    const list = document.getElementById("leaderboardList");
    board.classList.remove("hidden");
    
    let leaderboard = JSON.parse(localStorage.getItem("snakeLeaderboard")) || [];
    list.innerHTML = leaderboard.map(item => `<li><span>${item.name}</span> <span>${item.score}</span></li>`).join('');
}

function backToMenu() {
    document.getElementById("leaderboard").classList.add("hidden");
    document.getElementById("menu").classList.remove("hidden");
}

function showRecords() {
    alert("Il record attuale è: " + (localStorage.getItem("snakeRecord") || 0));
}

document.addEventListener("keydown", (e) => {
    if (e.keyCode == 37 && d != "RIGHT") d = "LEFT";
    else if (e.keyCode == 38 && d != "DOWN") d = "UP";
    else if (e.keyCode == 39 && d != "LEFT") d = "RIGHT";
    else if (e.keyCode == 40 && d != "UP") d = "DOWN";
});

function draw() {
    ctx.fillStyle = "#97b997";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < snake.length; i++) {
        ctx.fillStyle = (i == 0) ? "#000" : "#333";
        ctx.fillRect(snake[i].x, snake[i].y, box - 1, box - 1);
    }

    ctx.fillStyle = "#000";
    ctx.fillRect(food.x, food.y, box - 1, box - 1);

    let snakeX = snake[0].x;
    let snakeY = snake[0].y;

    if (d == "LEFT") snakeX -= box;
    if (d == "UP") snakeY -= box;
    if (d == "RIGHT") snakeX += box;
    if (d == "DOWN") snakeY += box;

    let newHead = { x: snakeX, y: snakeY };

    if (snakeX < 0 || snakeX >= canvas.width || snakeY < 0 || snakeY >= canvas.height || collision(newHead, snake)) {
        clearInterval(gameInterval);
        saveScore(currentName, score);
        alert("GAME OVER, " + currentName + "! Punteggio: " + score);
        location.reload();
        return;
    }

    if (snakeX == food.x && snakeY == food.y) {
        score++;
        scoreEl.innerHTML = score;
        food = { x: Math.floor(Math.random() * 20) * box, y: Math.floor(Math.random() * 20) * box };
    } else {
        snake.pop();
    }
    snake.unshift(newHead);
}

function collision(head, array) {
    for (let i = 0; i < array.length; i++) {
        if (head.x == array[i].x && head.y == array[i].y) return true;
    }
    return false;
}
