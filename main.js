"use strict";

// Dimensioni di riferimento del gioco (sistema di coordinate BASE)
const BASE_WIDTH = 800;
const BASE_HEIGHT = 500;  // Altezza base: 500px

// Valori di base per gli oggetti di gioco
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

// Variabile globale per il fattore di scala (responsive)
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
let ballSpeedIncrement = 0.5; // Incremento velocità della pallina ad ogni round

// Oggetti di gioco (coordinate e dimensioni nel sistema BASE)
// Il sistema logico di gioco rimane invariato; la scala viene applicata sul contesto
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

// Funzione per ridimensionare il canvas automaticamente (responsive)
function resizeCanvas() {
  const container = document.querySelector(".container");
  const dpr = window.devicePixelRatio || 1;

  // Calcola la larghezza disponibile (98% del container) e l'altezza (80% della viewport)
  let availWidth = container.clientWidth * 0.98;
  let availHeight = window.innerHeight * 0.8;

  // Il fattore di scala è determinato mantenendo il rapporto d'aspetto BASE
  scale = Math.min(availWidth / BASE_WIDTH, availHeight / BASE_HEIGHT);

  let visualWidth = BASE_WIDTH * scale;
  let visualHeight = BASE_HEIGHT * scale;

  // Applica le dimensioni CSS al canvas
  canvas.style.width = visualWidth + "px";
  canvas.style.height = visualHeight + "px";

  // Imposta le dimensioni interne del canvas, moltiplicandole per il devicePixelRatio
  canvas.width = visualWidth * dpr;
  canvas.height = visualHeight * dpr;

  // Resetta il transform e applica la scala combinata (dpr e scale)
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr * scale, dpr * scale);

  // Reimposta le posizioni e le dimensioni degli oggetti in coordinate BASE
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

// Listener per il resize e il caricamento iniziale
window.addEventListener("resize", resizeCanvas);
window.addEventListener("load", resizeCanvas);

// Gestione input da tastiera per il controllo direzionale
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

// Rimuoviamo i listener per il mouse per evitare interferenze con il controllo touch

// Gestione degli input touch (touchstart e touchmove)
canvas.addEventListener("touchstart", function (e) {
  e.preventDefault();
  let touch = e.touches[0];
  let rect = canvas.getBoundingClientRect();
  // Convertiamo la posizione verticale del tocco nel sistema BASE utilizzando rect.height
  let relativeY = ((touch.clientY - rect.top) / rect.height) * BASE_HEIGHT;
  player.y = relativeY - player.height / 2;
}, { passive: false });

canvas.addEventListener("touchmove", function (e) {
  e.preventDefault();
  let touch = e.touches[0];
  let rect = canvas.getBoundingClientRect();
  let relativeY = ((touch.clientY - rect.top) / rect.height) * BASE_HEIGHT;
  player.y = relativeY - player.height / 2;
}, { passive: false });

// Supporto per il joypad rimane invariato
function updateGamepad() {
  let gamepads = navigator.getGamepads();
  if (gamepads[0]) {
    let gp = gamepads[0];
    let axisY = gp.axes[1];
    player.y += axisY * player.speed;
  }
}

// Funzioni di disegno (coordinate nel sistema BASE)
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
  let netWidth = 2, netHeight = 10;
  for (let i = 0; i < BASE_HEIGHT; i += 15) {
    drawRect(BASE_WIDTH / 2 - netWidth / 2, i, netWidth, netHeight, "white");
  }
}

// Funzione di disegno del gioco
function draw() {
  ctx.clearRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
  drawRect(0, 0, BASE_WIDTH, BASE_HEIGHT, "#000");
  drawNet();
  drawRect(player.x, player.y, player.width, player.height, "white");
  drawRect(bot.x, bot.y, bot.width, bot.height, "white");
  drawCircle(ball.x, ball.y, ball.radius, "white");

  // Visualizza lo stage
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("Stage: " + stage, BASE_WIDTH / 4, 30);
}

// Verifica la collisione fra la pallina e una racchetta
function collisionDetect(paddle) {
  return (
    ball.x - ball.radius < paddle.x + paddle.width &&
    ball.x + ball.radius > paddle.x &&
    ball.y + ball.radius > paddle.y &&
    ball.y - ball.radius < paddle.y + paddle.height
  );
}

// Resetta la pallina al centro e imposta la direzione (in base al round vinto)
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

// Funzione principale di aggiornamento (game loop)
function update() {
  if (!gameRunning) return;

  updateGamepad();

  // Movimento controllato tramite tasti
  if (player.moveUp && player.y > 0) {
    player.y -= player.speed;
  }
  if (player.moveDown && player.y + player.height < BASE_HEIGHT) {
    player.y += player.speed;
  }

  // Aggiorna la posizione della pallina
  ball.x += ball.speedX;
  ball.y += ball.speedY;

  // Rimbalzo verticale della pallina
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

  // Se la pallina esce a sinistra, il giocatore perde
  if (ball.x - ball.radius < 0) {
    gameOver();
    return;
  }

  // Se la pallina esce a destra, il giocatore vince il round
  if (ball.x + ball.radius > BASE_WIDTH) {
    stage++;
    stageDisplay.innerText = stage;
    bot.speed += 0.5;
    resetBall("player");
  }

  // Movimento automatico del bot
  if (typeof updateBotAI === "function") {
    updateBotAI(bot, ball, stage);
  } else {
    if (bot.y + bot.height / 2 < ball.y) {
      bot.y += bot.speed;
    } else {
      bot.y -= bot.speed;
    }
    if (bot.y < 0) bot.y = 0;
    if (bot.y + bot.height > BASE_HEIGHT) bot.y = BASE_HEIGHT - bot.height;
  }

  draw();
  requestAnimationFrame(update);
}

// Funzione di Game Over: salva il record e resetta il gioco
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

// Reset della partita e ritorno alla schermata iniziale
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

// Funzione per mostrare il countdown (3,2,1) prima dell'inizio del gioco
function startCountdown(callback) {
  let countdownOverlay = document.createElement("div");
  countdownOverlay.id = "countdownOverlay";
  countdownOverlay.style.position = "absolute";
  
  // Posiziona l'overlay direttamente sopra il canvas in base alla sua posizione attuale
  let rect = canvas.getBoundingClientRect();
  countdownOverlay.style.top = rect.top + "px";
  countdownOverlay.style.left = rect.left + "px";
  countdownOverlay.style.width = rect.width + "px";
  countdownOverlay.style.height = rect.height + "px";
  countdownOverlay.style.display = "flex";
  countdownOverlay.style.alignItems = "center";
  countdownOverlay.style.justifyContent = "center";
  countdownOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
  countdownOverlay.style.zIndex = "1000";
  countdownOverlay.style.fontSize = "48px";
  countdownOverlay.style.color = "white";
  countdownOverlay.innerText = "3";
  
  document.body.appendChild(countdownOverlay);
  
  let count = 3;
  let interval = setInterval(function () {
    count--;
    if (count > 0) {
      countdownOverlay.innerText = count;
    } else {
      clearInterval(interval);
      document.body.removeChild(countdownOverlay);
      callback();
    }
  }, 1000);
}

// Avvia la partita: mostra il countdown e poi avvia il game loop
function startGame() {
  resizeCanvas(); // Assicura che il canvas sia dimensionato correttamente
  
  playerName = playerNameInput.value.trim();
  if (playerName === "") {
    alert("Inserisci il tuo nome per iniziare la partita.");
    return;
  }
  
  homeScreen.style.display = "none";
  canvas.classList.remove("hidden");
  gameInfo.classList.remove("hidden");
  
  startCountdown(function () {
    gameRunning = true;
    stage = 1;
    stageDisplay.innerText = stage;
    resetBall("bot");
    requestAnimationFrame(update);
  });
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
