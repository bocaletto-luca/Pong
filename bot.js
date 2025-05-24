"use strict";

/**
 * updateBotAI: Aggiorna la posizione della racchetta del bot in base alla posizione della pallina e allo stage corrente.
 *
 * @param {Object} bot - L'oggetto racchetta del bot, con proprietà x, y, width, height e speed.
 * @param {Object} ball - L'oggetto pallina, con proprietà x, y, radius, speedX e speedY.
 * @param {number} stage - Il livello corrente del gioco, che influenza l'abilità del bot.
 */
function updateBotAI(bot, ball, stage) {
  let targetY;

  // Se la pallina si muove verso il bot, il bot la segue; altrimenti ritorna al centro.
  if (ball.speedX > 0) {
    // Imposta il target in modo che il centro della racchetta si allinei con la pallina.
    targetY = ball.y - bot.height / 2;
    // Calcola un margine d'errore: a stage bassi l'errore è maggiore, a stage alti il bot è più preciso.
    let maxError = Math.max(30 - stage, 2); // L'errore non scende mai sotto 2.
    let errorOffset = (Math.random() * 2 * maxError) - maxError;
    targetY += errorOffset;
  } else {
    // Se la pallina si sta allontanando, il bot ritorna verso il centro del canvas.
    targetY = (canvas.height - bot.height) / 2;
  }
  
  // Muovi la racchetta del bot gradualmente in base alla velocità impostata.
  if (bot.y < targetY) {
    bot.y += bot.speed;
  } else if (bot.y > targetY) {
    bot.y -= bot.speed;
  }
  
  // Garantiamo che la racchetta rimanga entro i limiti del canvas.
  if (bot.y < 0) {
    bot.y = 0;
  } else if (bot.y + bot.height > canvas.height) {
    bot.y = canvas.height - bot.height;
  }
}
