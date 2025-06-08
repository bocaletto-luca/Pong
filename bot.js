/**
 * updateBotAI: Updates the bot paddle's position based on the ball's position and the current stage.
 *
 * @param {Object} bot - The bot paddle object, with properties x, y, width, height, and speed.
 * @param {Object} ball - The ball object, with properties x, y, radius, speedX, and speedY.
 * @param {number} stage - The current game level, which influences the bot’s precision.
 */
function updateBotAI(bot, ball, stage) {
  // Use BASE_HEIGHT (the game’s base height) for the calculations.
  let targetY;
  
  // When the ball is moving toward the bot, follow it; otherwise, return to the center.
  if (ball.speedX > 0) {
    // Set the target so that the center of the bot paddle aligns with the ball’s y.
    targetY = ball.y - bot.height / 2;
    // Calculate an error margin: at lower stages the error is larger; at higher stages the bot is more precise.
    let maxError = Math.max(30 - stage, 2); // The error will never go below 2.
    let errorOffset = (Math.random() * 2 * maxError) - maxError;
    targetY += errorOffset;
  } else {
    // If the ball is moving away, return to the center of the game area.
    targetY = (BASE_HEIGHT - bot.height) / 2;
  }
  
  // Gradually move the bot paddle toward the target position.
  if (bot.y < targetY) {
    bot.y += bot.speed;
    if (bot.y > targetY) bot.y = targetY;
  } else if (bot.y > targetY) {
    bot.y -= bot.speed;
    if (bot.y < targetY) bot.y = targetY;
  }
  
  // Clamp the bot paddle within the limits of the game area using BASE_HEIGHT.
  if (bot.y < 0) {
    bot.y = 0;
  } else if (bot.y + bot.height > BASE_HEIGHT) {
    bot.y = BASE_HEIGHT - bot.height;
  }
}
