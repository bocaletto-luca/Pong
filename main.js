"use strict";

// Dimensioni di riferimento del gioco (base game coordinate system)
const BASE_WIDTH = 800;
const BASE_HEIGHT = 500;

// Valori di base per oggetti di gioco
const baseBall = {
  radius: 8,
  speedX: 4,
  speedY: 4
};

const basePlayer = {
  width: 10,
  height: 80,
  speed: 7
};

const baseBot = {
  width: 10,
  height: 80,
  speed: 4
};

// Variabile globale per la scala corrente (che trasforma il sistema di riferimento BASE in quello visualizzato)
let scale = 1;

// Recupero degli elementi dal DOM
let canvas = document.getElementById("gameCanvas");
let ctx = canvas.getContext("2d");

let homeScreen = document.getElementById("homeScreen");
let gameInfo = document.getElementById("gameInfo");
let stageDisplay = document.getElementById("stageDisplay");

let startBtn = document.getElementById("startBtn");
let recordBtn = document.getElementById("recordBtn");

let playerNameInput = document.getElementById("playerName");

// Variabili di stato della partita
let gameRunning = false;
let playerName = "";
let stage = 1;
let ballSpeedIncrement = 0.5; // Incremento della velocità della pallina per stage

// Oggetti di gioco (le coordinate e dimensioni sono basate sul sistema BASE)
// Il ridimensionamento del canvas tramite transform farà sì che il sistema di riferimento rimanga invariato
let ball = {
  x: BASE_WIDTH / 2,
  y: BASE_HEIGHT / 2,
  radius: baseBall.radius,
  speedX: baseBall.speedX,
  speedY: baseBall.speedY
};

let player = {
  x: 10,
  y: BASE_HEIGHT / 2 - basePlayer.height / 2,
  width: basePlayer.width,
  height: basePlayer.height,
  speed: basePlayer.speed,
  moveUp: false,
  moveDown: false
};

let bot = {
  x: BASE_WIDTH - 20,
  y: BASE_HEIGHT / 2 - baseBot.height / 2,
  width: baseBot.width,
  height: baseBot.height,
  speed: baseBot.speed
};

// Funzione per ridimensionare il canvas automaticamente
function resizeCanvas() {
  const container = document.querySelector(".container");
  const dpr = window.devicePixelRatio || 1;

  // Calcola la larghezza visuale impostando il 98% della larghezza del container
  let availWidth = container.clientWidth * 0.98;
  // Calcola l'altezza disponibile in base alla finestra (80% dell'altezza della viewport, ad esempio)
  let availHeight = window.innerHeight * 0.8;

  // Determina il fattore di scala usando le dimensioni BASE come riferimento,
  // mantenendo inalterato il rapporto d'aspetto
  scale = Math.min(availWidth / BASE_WIDTH, availHeight / BASE_HEIGHT);

  // Dimensioni visuali effettive del canvas (in CSS)
  let visualWidth = BASE_WIDTH * scale;
  let visualHeight = BASE_HEIGHT * scale;

  // Applica le dimensioni in CSS
  canvas.style.width = visualWidth + "px";
  canvas.style.height = visualHeight + "px";

  // Imposta la dimensione interna del canvas in base al devicePixelRatio
  canvas.width = visualWidth * dpr;
  canvas.height = visualHeight * dpr;

  // Resetta la trasformazione e applica una scala che combina dpr e scale
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr * scale, dpr * scale);

  // Reimposta le posizioni e le dimensioni degli oggetti di gioco in coordinate BASE
  ball.x = BASE_WIDTH / 2;
  ball.y = BASE_HEIGHT / 2;
  ball.radius = baseBall.radius;
  ball.speedX = baseBall.speedX;
  ball.speedY = baseBall.speedY;

  player.x = 10;
  player.y = BASE_HEIGHT / 2 - basePlayer.height / 2;
  player.width = basePlayer.width;
  player.height = basePlayer.height;
  player.speed = basePlayer.speed;

  bot.x = BASE_WIDTH - 20;
  bot.y = BASE_HEIGHT / 2 - baseBot.height / 2;
  bot.width = baseBot.width;
  bot.height = baseBot.height;
  bot.speed = baseBot.speed;
}

// Eventi per gestire il ridimensionamento automatico
window.addEventListener("resize", resizeCanvas);
window.addEventListener("load", resizeCanvas);

// Gestione input da tastiera
document.addEventListener("keydown", function (e) {
  if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
    player.moveUp = true;
  }
  if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
    player.moveDown = true;
  }
});

document.addEventListener("keyup", function (e) {
  if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
    player.moveUp = false;
  }
  if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
    player.moveDown = false;
  }
});

// Controllo mouse: sposta la racchetta del giocatore in base alla posizione verticale
canvas.addEventListener("mousemove", function (e) {
  let rect = canvas.getBoundingClientRect();
  // Convertiamo la posizione del mouse nelle coordinate BASE
  let relativeY = ((e.clientY - rect.top) / parseFloat(canvas.style.height)) * BASE_HEIGHT;
  player.y = relativeY - player.height / 2;
});

// Supporto joypad: polling del Gamepad API
function updateGamepad() {
  let gamepads = navigator.getGamepads();
  if (gamepads[0]) {
    let gp = gamepads[0];
    // L'asse verticale del primo stick (asse[1])
    let axisY = gp.axes[1];
    player.y += axisY * player.speed;
  }
}

// Funzioni di disegno sul canvas (le coordinate sono nel sistema BASE)
function drawRect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function drawCircle(x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fill();
}

function drawNet() {
  ctx.fillStyle = "white";
  let netWidth = 2,
    netHeight = 10;
  for (let i = 0; i < BASE_HEIGHT; i += 15) {
    drawRect(BASE_WIDTH / 2 - netWidth / 2, i, netWidth, netHeight, "white");
  }
}

// Disegna lo stato attuale della partita
function draw() {
  ctx.clearRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
  // Sfondo nero
  drawRect(0, 0, BASE_WIDTH, BASE_HEIGHT, "#000");
  drawNet();
  // Racchetta giocatore
  drawRect(player.x, player.y, player.width, player.height, "white");
  // Racchetta bot
  drawRect(bot.x, bot.y, bot.width, bot.height, "white");
  // Pallina
  drawCircle(ball.x, ball.y, ball.radius, "white");

  // Visualizza lo stage
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("Stage: " + stage, BASE_WIDTH / 4, 30);
}

// Rilevamento collisione della pallina con una racchetta
function collisionDetect(paddle) {
  return (
    ball.x - ball.radius < paddle.x + paddle.width &&
    ball.x + ball.radius > paddle.x &&
    ball.y + ball.radius > paddle.y &&
    ball.y - ball.radius < paddle.y + paddle.height
  );
}

// Resetta la pallina al centro, impostandone la direzione (in base al vincitore del round)
function resetBall(direction) {
  ball.x = BASE_WIDTH / 2;
  ball.y = BASE_HEIGHT / 2;
  if (direction === "player") {
    ball.speedX = baseBall.speedX + stage * ballSpeedIncrement;
    ball.speedY = baseBall.speedY;
  } else {
    ball.speedX = -(baseBall.speedX + stage * ballSpeedIncrement);
    ball.speedY = baseBall.speedY;
  }
}

// Funzione principale di update: gestisce la logica del gioco e richiama il rendering
function update() {
  if (!gameRunning) return;

  updateGamepad();

  // Movimento giocatore
  if (player.moveUp && player.y > 0) {
    player.y -= player.speed;
  }
  if (player.moveDown && player.y + player.height < BASE_HEIGHT) {
    player.y += player.speed;
  }

  // Aggiornamento della posizione della pallina
  ball.x += ball.speedX;
  ball.y += ball.speedY;

  // Controllo dei rimbalzi verticali
  if (ball.y - ball.radius < 0 || ball.y + ball.radius > BASE_HEIGHT) {
    ball.speedY = -ball.speedY;
  }

  // Collisione con la racchetta del giocatore
  if (collisionDetect(player)) {
    ball.speedX = Math.abs(ball.speedX);
    let collidePoint = ball.y - (player.y + player.height / 2);
    ball.speedY = collidePoint * 0.35;
  }

  // Collisione con la racchetta del bot
  if (collisionDetect(bot)) {
    ball.speedX = -Math.abs(ball.speedX);
    let collidePoint = ball.y - (bot.y + bot.height / 2);
    ball.speedY = collidePoint * 0.35;
  }

  // Controllo se la pallina esce dalla finestra: se a sinistra, game over
  if (ball.x - ball.radius < 0) {
    gameOver();
    return;
  }

  // Se la pallina esce a destra, il giocatore vince il round
  if (ball.x + ball.radius > BASE_WIDTH) {
    stage++;
    stageDisplay.innerText = stage;
    // Incrementa la velocità del bot per aumentare la difficoltà
    bot.speed += 0.5;
    resetBall("player");
  }

  // Aggiorna la posizione del bot (funzione delegata in bot.js)
  // Se la logica del bot non è qui, assicurati che la funzione updateBotAI esista
  if (typeof updateBotAI === "function") {
    updateBotAI(bot, ball, stage);
  } else {
    // Logica di base per il bot: semplicemente lo fa muovere verso la pallina
    if (bot.y + bot.height / 2 < ball.y) {
      bot.y += bot.speed;
    } else {
      bot.y -= bot.speed;
    }
    // Limita il movimento del bot entro i confini
    if (bot.y < 0) bot.y = 0;
    if (bot.y + bot.height > BASE_HEIGHT) bot.y = BASE_HEIGHT - bot.height;
  }

  draw();
  requestAnimationFrame(update);
}

// Funzione di Game Over: registra il punteggio e ripristina lo stato iniziale
function gameOver() {
  gameRunning = false;
  let recordData = JSON.parse(localStorage.getItem("recordData")) || [];
  let recordEntry = {
    name: playerName,
    stage: stage,
    date: new Date().toLocaleString()
  };
  recordData.push(recordEntry);
  localStorage.setItem("recordData", JSON.stringify(recordData));
  alert("Game Over! " + playerName + ", hai raggiunto lo stage " + stage + ".");
  resetGame();
}

// Reset della partita e ritorno alla home
function resetGame() {
  stage = 1;
  stageDisplay.innerText = stage;
  ball.x = BASE_WIDTH / 2;
  ball.y = BASE_HEIGHT / 2;
  ball.speedX = baseBall.speedX;
  ball.speedY = baseBall.speedY;
  player.y = BASE_HEIGHT / 2 - player.height / 2;
  bot.y = BASE_HEIGHT / 2 - bot.height / 2;
  bot.speed = baseBot.speed;

  canvas.classList.add("hidden");
  gameInfo.classList.add("hidden");
  homeScreen.style.display = "block";
}

// Inizio della partita: controlla che il nome sia inserito, nasconde la schermata iniziale e avvia il ciclo di update
function startGame() {
  // Assicuriamoci che il canvas sia dimensionato correttamente
  resizeCanvas();

  playerName = playerNameInput.value.trim();
  if (playerName === "") {
    alert("Inserisci il tuo nome per iniziare la partita.");
    return;
  }
  homeScreen.style.display = "none";
  canvas.classList.remove("hidden");
  gameInfo.classList.remove("hidden");
  gameRunning = true;
  stage = 1;
  stageDisplay.innerText = stage;
  resetBall("bot");
  requestAnimationFrame(update);
}

// Visualizza i record memorizzati
function showRecords() {
  let recordList = document.getElementById("recordList");
  recordList.innerHTML = "";
  let recordData = JSON.parse(localStorage.getItem("recordData")) || [];
  recordData.sort((a, b) => b.stage - a.stage);
  recordData.forEach((record) => {
    let li = document.createElement("li");
    li.className = "list-group-item bg-dark text-white";
    li.textContent = record.name + " - Stage: " + record.stage + " - " + record.date;
    recordList.appendChild(li);
  });
  $("#recordModal").modal("show");
}

// Binding dei pulsanti
startBtn.addEventListener("click", startGame);
recordBtn.addEventListener("click", showRecords);
