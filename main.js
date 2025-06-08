"use strict";

// Recupero gli elementi dal DOM
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

// Oggetto pallina
let ball = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: 8,
  speedX: 4,
  speedY: 4
};

// Oggetto giocatore
let player = {
  x: 10,
  y: canvas.height / 2 - 40,
  width: 10,
  height: 80,
  speed: 7,
  moveUp: false,
  moveDown: false
};

// Oggetto bot (avversario)
let bot = {
  x: canvas.width - 20,
  y: canvas.height / 2 - 40,
  width: 10,
  height: 80,
  speed: 4 // velocità iniziale del bot
};

// Gestione input da tastiera
document.addEventListener("keydown", function(e) {
  if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
    player.moveUp = true;
  }
  if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
    player.moveDown = true;
  }
});

document.addEventListener("keyup", function(e) {
  if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
    player.moveUp = false;
  }
  if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
    player.moveDown = false;
  }
});

// Controllo mouse: sposta la racchetta del giocatore in base alla posizione verticale
canvas.addEventListener("mousemove", function(e) {
  let rect = canvas.getBoundingClientRect();
  let relativeY = e.clientY - rect.top;
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

// Funzioni di disegno sul canvas
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
  for (let i = 0; i < canvas.height; i += 15) {
    drawRect(canvas.width / 2 - netWidth / 2, i, netWidth, netHeight, "white");
  }
}

// Disegna lo stato attuale della partita
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Sfondo nero
  drawRect(0, 0, canvas.width, canvas.height, "#000");
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
  ctx.fillText("Stage: " + stage, canvas.width / 4, 30);
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
  ball.x = canvas.width / 2;
  ball.y = canvas.height / 2;
  if (direction === "player") {
    ball.speedX = 4 + stage * ballSpeedIncrement;
    ball.speedY = 4;
  } else {
    ball.speedX = -(4 + stage * ballSpeedIncrement);
    ball.speedY = 4;
  }
}

// Funzione principale di update: gestisce la logica di gioco e richiama il rendering
function update() {
  if (!gameRunning) return;

  updateGamepad();

  // Movimento giocatore
  if (player.moveUp && player.y > 0) {
    player.y -= player.speed;
  }
  if (player.moveDown && player.y + player.height < canvas.height) {
    player.y += player.speed;
  }

  // Aggiornamento posizione della pallina
  ball.x += ball.speedX;
  ball.y += ball.speedY;

  // Gestione dei rimbalzi verticale
  if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
    ball.speedY = -ball.speedY;
  }

  // Collisione con il giocatore
  if (collisionDetect(player)) {
    ball.speedX = Math.abs(ball.speedX);
    let collidePoint = ball.y - (player.y + player.height / 2);
    ball.speedY = collidePoint * 0.35;
  }

  // Collisione con il bot
  if (collisionDetect(bot)) {
    ball.speedX = -Math.abs(ball.speedX);
    let collidePoint = ball.y - (bot.y + bot.height / 2);
    ball.speedY = collidePoint * 0.35;
  }

  // Se la pallina esce a sinistra: il giocatore ha mancato, Game Over
  if (ball.x - ball.radius < 0) {
    gameOver();
    return;
  }

  // Se la pallina esce a destra: il bot ha mancato, il giocatore vince il round
  if (ball.x + ball.radius > canvas.width) {
    stage++;
    stageDisplay.innerText = stage;
    // Incrementa la velocità del bot per aumentare la difficoltà
    bot.speed += 0.5;
    resetBall("player");
  }

  // Movimento del bot, delegato a bot.js
  updateBotAI(bot, ball, stage);

  draw();
  requestAnimationFrame(update);
}

// Funzione di Game Over: registra il punteggio e ripristina lo stato iniziale
function gameOver() {
  gameRunning = false;
  // Simuliamo il salvataggio in record.json tramite localStorage
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
  ball.x = canvas.width / 2;
  ball.y = canvas.height / 2;
  ball.speedX = 4;
  ball.speedY = 4;
  player.y = canvas.height / 2 - player.height / 2;
  bot.y = canvas.height / 2 - bot.height / 2;
  bot.speed = 4;

  canvas.classList.add("hidden");
  gameInfo.classList.add("hidden");
  homeScreen.style.display = "block";
}

// Ridimensiona l'area di gioco
function resizeCanvas() {
  const container = document.querySelector('.container');
  const dpr = window.devicePixelRatio || 1;

  // Impostiamo la larghezza visuale pari al 98% della larghezza del container.
  const visualWidth = container.clientWidth * 0.98;
  const visualHeight = 400; // Puoi renderla dinamica se preferisci

  // Applica le dimensioni in CSS
  canvas.style.width = visualWidth + 'px';
  canvas.style.height = visualHeight + 'px';

  // Imposta le dimensioni interne del canvas, moltiplicando per il devicePixelRatio
  canvas.width = visualWidth * dpr;
  canvas.height = visualHeight * dpr;

  // Resetta la trasformazione e scala il contesto, per evitare accumuli multipli
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);

  // Se necessario, riallinea gli oggetti del gioco in base alla nuova larghezza
  // Per esempio, puoi posizionare la pallina e le racchette al centro:
  ball.x = visualWidth / 2;
  ball.y = visualHeight / 2;
  player.y = visualHeight / 2 - player.height / 2;
  bot.y = visualHeight / 2 - bot.height / 2;
}

// Inizio della partita: controlla che il nome sia inserito, nasconde la schermata iniziale e avvia il ciclo di update
function startGame() {
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
  // Ordina per stage discendente
  recordData.sort((a, b) => b.stage - a.stage);
  recordData.forEach(record => {
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
