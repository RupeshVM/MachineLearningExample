const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const hud = {
  coins: document.getElementById("coins"),
  lives: document.getElementById("lives"),
  status: document.getElementById("status"),
};

const keys = new Set();

const world = {
  gravity: 0.68,
  friction: 0.84,
  cameraX: 0,
  width: 2400,
  height: canvas.height,
  groundY: 430,
};

const player = {
  x: 100,
  y: 120,
  w: 42,
  h: 54,
  vx: 0,
  vy: 0,
  speed: 0.95,
  jumpPower: 14.5,
  onGround: false,
  lives: 3,
  coins: 0,
};

const platforms = [
  { x: 0, y: 430, w: 760, h: 110 },
  { x: 830, y: 430, w: 530, h: 110 },
  { x: 1450, y: 430, w: 420, h: 110 },
  { x: 1940, y: 430, w: 460, h: 110 },
  { x: 300, y: 340, w: 150, h: 22 },
  { x: 530, y: 290, w: 140, h: 22 },
  { x: 1040, y: 320, w: 200, h: 22 },
  { x: 1680, y: 300, w: 170, h: 22 },
];

const coins = [
  { x: 350, y: 300, r: 10, taken: false },
  { x: 560, y: 250, r: 10, taken: false },
  { x: 620, y: 250, r: 10, taken: false },
  { x: 1080, y: 280, r: 10, taken: false },
  { x: 1160, y: 280, r: 10, taken: false },
  { x: 1710, y: 260, r: 10, taken: false },
  { x: 1780, y: 260, r: 10, taken: false },
  { x: 2040, y: 390, r: 10, taken: false },
];

const enemies = [
  { x: 930, y: 398, w: 36, h: 32, minX: 900, maxX: 1260, dir: 1, speed: 1.2 },
  { x: 1510, y: 398, w: 36, h: 32, minX: 1480, maxX: 1830, dir: -1, speed: 1.4 },
  { x: 2080, y: 398, w: 36, h: 32, minX: 1980, maxX: 2340, dir: 1, speed: 1.5 },
];

window.addEventListener("keydown", (event) => {
  const key = event.code;
  if (["ArrowLeft", "ArrowRight", "Space"].includes(key)) {
    event.preventDefault();
  }
  keys.add(key);
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.code);
});

function resetPlayer() {
  player.x = 100;
  player.y = 120;
  player.vx = 0;
  player.vy = 0;
}

function overlap(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function updatePlayer() {
  if (keys.has("ArrowLeft")) player.vx -= player.speed;
  if (keys.has("ArrowRight")) player.vx += player.speed;
  if (keys.has("Space") && player.onGround) {
    player.vy = -player.jumpPower;
    player.onGround = false;
  }

  player.vx *= world.friction;
  player.vy += world.gravity;

  player.x += player.vx;
  player.y += player.vy;

  player.onGround = false;
  for (const platform of platforms) {
    const touching = overlap(player, platform);
    if (!touching) continue;

    const previousBottom = player.y + player.h - player.vy;
    if (previousBottom <= platform.y + 5 && player.vy >= 0) {
      player.y = platform.y - player.h;
      player.vy = 0;
      player.onGround = true;
    }
  }

  if (player.y > world.height + 160) {
    player.lives -= 1;
    hud.status.textContent = "You fell!";
    if (player.lives <= 0) {
      hud.status.textContent = "Game Over - refresh to retry";
      player.lives = 0;
      player.vx = 0;
      player.vy = 0;
    } else {
      resetPlayer();
    }
  }

  if (player.x < 0) player.x = 0;
  if (player.x > world.width - player.w) player.x = world.width - player.w;

  world.cameraX = Math.max(
    0,
    Math.min(player.x - canvas.width / 2, world.width - canvas.width),
  );
}

function updateCoins() {
  for (const coin of coins) {
    if (coin.taken) continue;
    const hitbox = { x: coin.x - coin.r, y: coin.y - coin.r, w: coin.r * 2, h: coin.r * 2 };
    if (overlap(player, hitbox)) {
      coin.taken = true;
      player.coins += 1;
      hud.status.textContent = "Coin!";
    }
  }

  if (player.coins === coins.length) {
    hud.status.textContent = "You win! 90s vibes unlocked.";
  }
}

function updateEnemies() {
  for (const enemy of enemies) {
    enemy.x += enemy.dir * enemy.speed;
    if (enemy.x < enemy.minX || enemy.x + enemy.w > enemy.maxX) {
      enemy.dir *= -1;
    }

    if (overlap(player, enemy)) {
      const stomp = player.vy > 2 && player.y + player.h - enemy.y < 20;
      if (stomp) {
        enemy.x = enemy.minX;
        player.vy = -8;
        hud.status.textContent = "Stomp!";
      } else {
        player.lives -= 1;
        hud.status.textContent = "Ouch!";
        if (player.lives <= 0) {
          player.lives = 0;
          hud.status.textContent = "Game Over - refresh to retry";
        }
        resetPlayer();
      }
    }
  }
}

function drawBackground() {
  ctx.fillStyle = "#67d4ff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 6; i += 1) {
    const x = (i * 430 - world.cameraX * 0.5) % 2600;
    ctx.fillStyle = "#ffffffbb";
    ctx.beginPath();
    ctx.arc(x + 120, 120, 45, 0, Math.PI * 2);
    ctx.arc(x + 165, 110, 35, 0, Math.PI * 2);
    ctx.arc(x + 80, 110, 35, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawWorld() {
  ctx.save();
  ctx.translate(-world.cameraX, 0);

  ctx.fillStyle = "#46ad46";
  for (const platform of platforms) {
    ctx.fillRect(platform.x, platform.y, platform.w, platform.h);
    ctx.fillStyle = "#379637";
    ctx.fillRect(platform.x, platform.y + platform.h - 10, platform.w, 10);
    ctx.fillStyle = "#46ad46";
  }

  for (const coin of coins) {
    if (coin.taken) continue;
    ctx.fillStyle = "#ffd84c";
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, coin.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#9f6900";
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  for (const enemy of enemies) {
    ctx.fillStyle = "#8a4f2b";
    ctx.fillRect(enemy.x, enemy.y, enemy.w, enemy.h);
    ctx.fillStyle = "#fff";
    ctx.fillRect(enemy.x + 6, enemy.y + 8, 8, 8);
    ctx.fillRect(enemy.x + 22, enemy.y + 8, 8, 8);
  }

  ctx.fillStyle = "#e73a2f";
  ctx.fillRect(player.x, player.y, player.w, player.h);
  ctx.fillStyle = "#2d58c8";
  ctx.fillRect(player.x, player.y + 26, player.w, 28);
  ctx.fillStyle = "#ffce9d";
  ctx.fillRect(player.x + 8, player.y + 8, 24, 12);

  ctx.restore();
}

function render() {
  drawBackground();
  drawWorld();
  hud.coins.textContent = `Coins: ${player.coins}/${coins.length}`;
  hud.lives.textContent = `Lives: ${player.lives}`;
}

function tick() {
  if (player.lives > 0 && player.coins < coins.length) {
    updatePlayer();
    updateCoins();
    updateEnemies();
  }
  render();
  requestAnimationFrame(tick);
}

tick();
