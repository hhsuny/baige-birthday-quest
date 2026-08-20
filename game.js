import {
  VIEW, WORLD_WIDTH, platforms, candleSeeds, enemySeeds,
  drawBackdrop, drawPlatforms, drawDecor, drawCandle, drawEnemy, drawGoal, drawPlayer
} from "./world.js";

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const ui = {
  candles: document.querySelector("#candleCount"), lives: document.querySelector("#lifeCount"),
  start: document.querySelector("#startOverlay"), message: document.querySelector("#messageOverlay"),
  resultIcon: document.querySelector("#resultIcon"), resultKicker: document.querySelector("#resultKicker"),
  resultTitle: document.querySelector("#resultTitle"), resultText: document.querySelector("#resultText"),
  pause: document.querySelector("#pauseButton"), sound: document.querySelector("#soundButton")
};

const keys = { left: false, right: false, jump: false };
let audioContext;
let soundOn = true;
let state = "intro";
let lives = 3;
let camera = 0;
let lastTime = 0;
let jumpLatch = false;
let candles = [];
let enemies = [];

const player = { x: 92, y: 410, w: 36, h: 50, vx: 0, vy: 0, facing: 1, onGround: false, invincible: 0 };

function resetWorld(full = false) {
  if (full) {
    lives = 3;
    candles = candleSeeds.map(([x, y]) => ({ x, y, got: false }));
    enemies = enemySeeds.map((enemy) => ({ ...enemy, w: 38, h: 35, dir: 1, alive: true }));
  }
  Object.assign(player, { x: 92, y: 410, vx: 0, vy: 0, facing: 1, onGround: false, invincible: 0 });
  camera = 0;
  updateHud();
}

function updateHud() {
  ui.candles.textContent = `${candles.filter((item) => item.got).length} / ${candleSeeds.length}`;
  ui.lives.textContent = Array(Math.max(0, lives)).fill("♥").join(" ") || "—";
}

function tone(frequency, duration = .08, type = "square", volume = .035, delay = 0) {
  if (!soundOn) return;
  audioContext ??= new AudioContext();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime + delay);
  gain.gain.setValueAtTime(volume, audioContext.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + delay + duration);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start(audioContext.currentTime + delay);
  oscillator.stop(audioContext.currentTime + delay + duration);
}

function startGame() {
  resetWorld(true);
  state = "running";
  ui.start.classList.remove("is-visible");
  ui.message.classList.remove("is-visible");
  ui.message.hidden = true;
  tone(392); tone(523, .1, "square", .035, .08); tone(659, .14, "square", .035, .16);
}

function intersects(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function movePlayer(dt) {
  const direction = Number(keys.right) - Number(keys.left);
  const accel = player.onGround ? .72 : .4;
  if (direction) {
    player.vx += direction * accel * dt;
    player.facing = direction;
  } else player.vx *= Math.pow(.78, dt);
  player.vx = Math.max(-6.2, Math.min(6.2, player.vx));

  if (keys.jump && player.onGround && !jumpLatch) {
    player.vy = -13.2;
    player.onGround = false;
    jumpLatch = true;
    tone(320, .06); tone(470, .08, "square", .025, .05);
  }
  if (!keys.jump) jumpLatch = false;
  if (!keys.jump && player.vy < -5) player.vy += .65 * dt;

  player.x += player.vx * dt;
  player.x = Math.max(0, Math.min(WORLD_WIDTH - player.w, player.x));
  platforms.forEach((platform) => {
    if (!intersects(player, platform)) return;
    if (player.vx > 0) player.x = platform.x - player.w;
    else if (player.vx < 0) player.x = platform.x + platform.w;
    player.vx = 0;
  });

  const previousBottom = player.y + player.h;
  player.vy += .72 * dt;
  player.vy = Math.min(15, player.vy);
  player.y += player.vy * dt;
  player.onGround = false;
  platforms.forEach((platform) => {
    if (!intersects(player, platform)) return;
    if (player.vy >= 0 && previousBottom <= platform.y + 6) {
      player.y = platform.y - player.h;
      player.vy = 0;
      player.onGround = true;
    } else if (player.vy < 0) {
      player.y = platform.y + platform.h;
      player.vy = 0;
    }
  });
  if (player.y > VIEW.height + 90) loseLife();
}

function updateEnemies(dt) {
  enemies.forEach((enemy) => {
    if (!enemy.alive) return;
    enemy.x += enemy.speed * enemy.dir * dt;
    if (enemy.x < enemy.min || enemy.x > enemy.max) enemy.dir *= -1;
    if (!intersects(player, enemy) || player.invincible > 0) return;
    const playerBottom = player.y + player.h;
    if (player.vy > 1 && playerBottom < enemy.y + 21) {
      enemy.alive = false;
      player.vy = -8;
      tone(150, .06); tone(95, .12, "square", .04, .05);
    } else loseLife();
  });
}

function collectCandles() {
  candles.forEach((candle) => {
    const hitbox = { x: candle.x, y: candle.y - 10, w: 15, h: 38 };
    if (!candle.got && intersects(player, hitbox)) {
      candle.got = true;
      updateHud();
      tone(740, .07); tone(990, .1, "square", .03, .06);
    }
  });
}

function loseLife() {
  if (state !== "running" || player.invincible > 0) return;
  lives -= 1;
  updateHud();
  tone(130, .2, "sawtooth", .05);
  if (lives <= 0) {
    showResult(false);
    return;
  }
  const saved = candles.filter((item) => item.got).length;
  resetWorld(false);
  player.invincible = 1000;
  camera = Math.max(0, Math.min(player.x - 180, WORLD_WIDTH - VIEW.width));
  ui.candles.textContent = `${saved} / ${candleSeeds.length}`;
}

function showResult(won) {
  state = won ? "won" : "lost";
  ui.resultIcon.textContent = won ? "★" : "↻";
  ui.resultKicker.textContent = won ? "LEVEL CLEAR!" : "TRY AGAIN";
  ui.resultTitle.textContent = won ? "生日快乐，帛鸽！" : "差一点就到了";
  ui.resultText.textContent = won
    ? "愿你的新一岁，每一关都有惊喜，每一次起跳都抵达更好的地方。"
    : "勇气不会耗尽。整理好披风，再向蛋糕出发吧。";
  ui.message.hidden = false;
  ui.message.classList.add("is-visible");
  if (won) [523, 659, 784, 1047].forEach((note, i) => tone(note, .18, "square", .035, i * .12));
}

function update(dt) {
  if (state !== "running") return;
  player.invincible = Math.max(0, player.invincible - dt * 16.67);
  movePlayer(dt);
  updateEnemies(dt);
  collectCandles();
  camera += (Math.max(0, Math.min(player.x - 300, WORLD_WIDTH - VIEW.width)) - camera) * .09 * dt;
  if (player.x > 4915) showResult(true);
}

function draw(time) {
  drawBackdrop(ctx, camera);
  drawDecor(ctx, camera);
  drawPlatforms(ctx, camera);
  candles.forEach((candle) => drawCandle(ctx, candle, camera, time));
  enemies.forEach((enemy) => drawEnemy(ctx, enemy, camera, time));
  drawGoal(ctx, camera, candles.filter((item) => item.got).length);
  if (player.invincible <= 0 || Math.floor(time / 80) % 2) drawPlayer(ctx, player, camera, time);
  if (state === "paused") {
    ctx.fillStyle = "rgba(23,32,51,.55)"; ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    ctx.fillStyle = "#fff"; ctx.font = "bold 38px 'Microsoft YaHei'"; ctx.textAlign = "center"; ctx.fillText("暂停", VIEW.width / 2, VIEW.height / 2);
  }
}

function frame(time) {
  const dt = Math.min(2, (time - lastTime) / 16.67 || 1);
  lastTime = time;
  update(dt);
  draw(time);
  requestAnimationFrame(frame);
}

function setKey(event, pressed) {
  const keyMap = { ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right", ArrowUp: "jump", KeyW: "jump", Space: "jump" };
  if (keyMap[event.code]) { keys[keyMap[event.code]] = pressed; event.preventDefault(); }
  if (pressed && event.code === "KeyP") togglePause();
}

function togglePause() {
  if (state === "running") state = "paused";
  else if (state === "paused") state = "running";
  ui.pause.textContent = state === "paused" ? "▶" : "Ⅱ";
  ui.pause.setAttribute("aria-label", state === "paused" ? "继续游戏" : "暂停游戏");
}

document.addEventListener("keydown", (event) => setKey(event, true));
document.addEventListener("keyup", (event) => setKey(event, false));
document.querySelector("#startButton").addEventListener("click", startGame);
document.querySelector("#againButton").addEventListener("click", startGame);
document.querySelector("#restartButton").addEventListener("click", startGame);
ui.pause.addEventListener("click", togglePause);
ui.sound.addEventListener("click", () => { soundOn = !soundOn; ui.sound.textContent = soundOn ? "♪" : "×"; });

document.querySelectorAll("[data-control]").forEach((button) => {
  const control = button.dataset.control;
  const set = (pressed) => { keys[control] = pressed; button.classList.toggle("is-pressed", pressed); };
  button.addEventListener("pointerdown", (event) => { event.preventDefault(); button.setPointerCapture(event.pointerId); set(true); });
  ["pointerup", "pointercancel", "lostpointercapture"].forEach((name) => button.addEventListener(name, () => set(false)));
});

resetWorld(true);
requestAnimationFrame(frame);
