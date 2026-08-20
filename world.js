export const VIEW = { width: 960, height: 540 };
export const WORLD_WIDTH = 5160;
export const GROUND_Y = 468;

export const platforms = [
  { x: 0, y: 468, w: 760, h: 72 }, { x: 850, y: 468, w: 500, h: 72 },
  { x: 1430, y: 468, w: 770, h: 72 }, { x: 2290, y: 468, w: 570, h: 72 },
  { x: 2960, y: 468, w: 840, h: 72 }, { x: 3900, y: 468, w: 1260, h: 72 },
  { x: 330, y: 365, w: 150, h: 28 }, { x: 560, y: 298, w: 120, h: 28 },
  { x: 920, y: 362, w: 170, h: 28 }, { x: 1170, y: 285, w: 110, h: 28 },
  { x: 1510, y: 355, w: 130, h: 28 }, { x: 1760, y: 300, w: 180, h: 28 },
  { x: 2030, y: 235, w: 110, h: 28 }, { x: 2380, y: 365, w: 160, h: 28 },
  { x: 2650, y: 295, w: 120, h: 28 }, { x: 3060, y: 355, w: 160, h: 28 },
  { x: 3330, y: 282, w: 130, h: 28 }, { x: 3570, y: 355, w: 140, h: 28 },
  { x: 4010, y: 368, w: 150, h: 28 }, { x: 4310, y: 300, w: 170, h: 28 },
  { x: 4600, y: 238, w: 120, h: 28 }
];

export const candleSeeds = [
  [390, 325], [620, 258], [1000, 322], [1225, 245],
  [1845, 260], [2445, 325], [3395, 242], [4660, 198]
];

export const enemySeeds = [
  { x: 610, y: 432, min: 500, max: 730, speed: 0.7 },
  { x: 1030, y: 326, min: 925, max: 1070, speed: 0.8 },
  { x: 1610, y: 432, min: 1480, max: 1870, speed: 0.9 },
  { x: 2460, y: 329, min: 2390, max: 2500, speed: 0.7 },
  { x: 3190, y: 432, min: 3010, max: 3470, speed: 1.0 },
  { x: 4110, y: 432, min: 3990, max: 4280, speed: 1.0 }
];

const colors = { ink: "#172033", grass: "#3caf75", dirt: "#b76d43", light: "#e8a15f" };

function rect(ctx, x, y, w, h, fill, stroke = colors.ink, line = 3) {
  ctx.fillStyle = fill;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = line; ctx.strokeRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
}

function cloud(ctx, x, y, s = 1) {
  ctx.fillStyle = "#fffdf4";
  ctx.fillRect(x, y + 14 * s, 78 * s, 24 * s);
  ctx.fillRect(x + 18 * s, y, 34 * s, 30 * s);
  ctx.fillRect(x + 48 * s, y + 8 * s, 22 * s, 22 * s);
}

export function drawBackdrop(ctx, camera) {
  ctx.fillStyle = "#82d9ed";
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = "#fff3b0";
  ctx.fillRect(70 - camera * .03, 70, 72, 72);
  ctx.fillStyle = "#f7d25c";
  ctx.fillRect(80 - camera * .03, 80, 52, 52);
  const cloudXs = [160, 650, 1130, 1770, 2380, 3020, 3740, 4520, 5140];
  cloudXs.forEach((x, i) => cloud(ctx, x - camera * .22, 90 + (i % 3) * 56, i % 2 ? .75 : 1));
  ctx.fillStyle = "#58b8b0";
  for (let x = -100; x < VIEW.width + 200; x += 180) {
    const sx = x - (camera * .12 % 180);
    ctx.beginPath(); ctx.moveTo(sx, 468); ctx.lineTo(sx + 90, 292); ctx.lineTo(sx + 180, 468); ctx.fill();
  }
  ctx.fillStyle = "#2f9695";
  for (let x = -80; x < VIEW.width + 220; x += 250) {
    const sx = x - (camera * .2 % 250);
    ctx.beginPath(); ctx.moveTo(sx, 468); ctx.lineTo(sx + 125, 338); ctx.lineTo(sx + 250, 468); ctx.fill();
  }
}

export function drawPlatforms(ctx, camera) {
  platforms.forEach((p) => {
    const x = p.x - camera;
    if (x + p.w < -10 || x > VIEW.width + 10) return;
    rect(ctx, x, p.y, p.w, p.h, colors.dirt);
    ctx.fillStyle = colors.grass; ctx.fillRect(x, p.y, p.w, 12);
    ctx.fillStyle = colors.light;
    for (let tx = 12; tx < p.w - 8; tx += 44) ctx.fillRect(Math.round(x + tx), p.y + 30, 16, 8);
  });
}

export function drawDecor(ctx, camera) {
  const signs = [{x:170, text:"帛"}, {x:1380, text:"GO!"}, {x:2890, text:"B"}, {x:4790, text:"生日"}];
  signs.forEach((s) => {
    const x = s.x - camera;
    if (x < -80 || x > VIEW.width + 40) return;
    rect(ctx, x, 384, 54, 44, "#ffc93c"); rect(ctx, x + 23, 428, 8, 40, "#172033", null);
    ctx.fillStyle = colors.ink; ctx.font = "bold 17px 'Microsoft YaHei'"; ctx.textAlign = "center"; ctx.fillText(s.text, x + 27, 412);
  });
  for (let x = 220; x < WORLD_WIDTH; x += 610) {
    const sx = x - camera;
    if (sx < -60 || sx > VIEW.width + 60) continue;
    ctx.fillStyle = "#fff"; ctx.fillRect(sx, 438, 7, 30);
    ctx.fillStyle = x % 3 ? "#e84435" : "#ffc93c";
    ctx.fillRect(sx - 8, 430, 10, 10); ctx.fillRect(sx + 4, 426, 10, 10); ctx.fillRect(sx - 1, 419, 10, 10);
  }
}

export function drawCandle(ctx, candle, camera, time) {
  const x = candle.x - camera;
  if (x < -30 || x > VIEW.width + 30 || candle.got) return;
  const bob = Math.sin(time * .006 + candle.x) * 4;
  rect(ctx, x, candle.y + bob, 15, 28, "#fff4d4", colors.ink, 2);
  ctx.fillStyle = "#e84435"; ctx.fillRect(x + 3, candle.y + 5 + bob, 3, 19);
  ctx.fillRect(x + 9, candle.y + 5 + bob, 3, 19);
  ctx.fillStyle = "#ffc93c"; ctx.fillRect(x + 3, candle.y - 10 + bob, 9, 11);
  ctx.fillStyle = "#fff"; ctx.fillRect(x + 6, candle.y - 7 + bob, 3, 4);
}

export function drawEnemy(ctx, enemy, camera, time) {
  const x = enemy.x - camera;
  if (x < -50 || x > VIEW.width + 50 || !enemy.alive) return;
  const bounce = Math.abs(Math.sin(time * .01 + enemy.x)) * 3;
  rect(ctx, x, enemy.y + bounce, 38, 35, "#9e62c7");
  ctx.fillStyle = "#fff"; ctx.fillRect(x + 7, enemy.y + 9 + bounce, 8, 9); ctx.fillRect(x + 24, enemy.y + 9 + bounce, 8, 9);
  ctx.fillStyle = colors.ink; ctx.fillRect(x + 10, enemy.y + 12 + bounce, 4, 6); ctx.fillRect(x + 24, enemy.y + 12 + bounce, 4, 6);
  ctx.fillRect(x + 5, enemy.y + 31 + bounce, 11, 6); ctx.fillRect(x + 24, enemy.y + 31 + bounce, 11, 6);
}

export function drawGoal(ctx, camera, collected) {
  const x = 4960 - camera;
  if (x < -140 || x > VIEW.width + 140) return;
  rect(ctx, x + 70, 330, 8, 138, "#fff");
  ctx.fillStyle = "#e84435"; ctx.fillRect(x + 78, 338, 58, 34);
  ctx.fillStyle = "#fff"; ctx.font = "bold 13px 'Courier New'"; ctx.textAlign = "center"; ctx.fillText("BAIGE", x + 107, 359);
  rect(ctx, x, 413, 112, 55, "#ffb8a8");
  ctx.fillStyle = "#fff4d4"; ctx.fillRect(x + 5, 400, 102, 24);
  ctx.fillStyle = "#ffc93c";
  for (let i = 0; i < Math.max(1, collected); i++) ctx.fillRect(x + 8 + i * 13, 386, 5, 16);
  ctx.fillStyle = colors.ink; ctx.font = "bold 13px 'Microsoft YaHei'"; ctx.fillText("生日快乐", x + 56, 450);
}

export function drawPlayer(ctx, p, camera, time) {
  const x = p.x - camera, y = p.y;
  ctx.save();
  if (p.facing < 0) { ctx.translate(x + p.w, 0); ctx.scale(-1, 1); }
  else ctx.translate(x, 0);
  const walk = p.onGround && Math.abs(p.vx) > .3 ? Math.sin(time * .018) * 3 : 0;
  ctx.fillStyle = "#e84435"; ctx.fillRect(2, y, 27, 10); ctx.fillRect(8, y - 5, 18, 7);
  ctx.fillStyle = "#ffd2a1"; ctx.fillRect(6, y + 10, 23, 15);
  ctx.fillStyle = colors.ink; ctx.fillRect(22, y + 13, 5, 5);
  ctx.fillStyle = "#147d91"; ctx.fillRect(5, y + 25, 27, 22);
  ctx.fillStyle = "#fff"; ctx.fillRect(8, y + 28, 5, 13); ctx.fillRect(25, y + 28, 5, 13);
  ctx.fillStyle = colors.ink; ctx.fillRect(3, y + 44 + walk, 14, 6); ctx.fillRect(22, y + 44 - walk, 14, 6);
  ctx.restore();
}
