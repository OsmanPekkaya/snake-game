const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");

// Grid settings
const GRID = 24; // 24x24
const CELL = canvas.width / GRID;

// Storage
const STORAGE_KEY = "snake_best_v2";
let best = Number(localStorage.getItem(STORAGE_KEY) || 0);
bestEl.textContent = best;

// Game state
let paused = false;
let snake, food, score, speedMs, lastStep;
let dir, nextDir;

// Helpers
const same = (a, b) => a.x === b.x && a.y === b.y;
const randCell = () => ({ x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) });

function spawnFood() {
  let f = randCell();
  while (snake.some(s => same(s, f))) f = randCell();
  return f;
}

function setBestIfNeeded() {
  if (score > best) {
    best = score;
    localStorage.setItem(STORAGE_KEY, String(best));
    bestEl.textContent = best;
  }
}

function reset() {
  paused = false;
  dir = { x: 1, y: 0 };
  nextDir = { x: 1, y: 0 };
  snake = [{ x: 8, y: 12 }, { x: 7, y: 12 }, { x: 6, y: 12 }];
  food = spawnFood();
  score = 0;
  speedMs = 110; // start speed
  lastStep = 0;
  scoreEl.textContent = score;
}

function drawGrid() {
  ctx.strokeStyle = "rgba(255,255,255,0.04)";
  ctx.lineWidth = 1;
  for (let i = 1; i < GRID; i++) {
    ctx.beginPath();
    ctx.moveTo(i * CELL, 0);
    ctx.lineTo(i * CELL, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i * CELL);
    ctx.lineTo(canvas.width, i * CELL);
    ctx.stroke();
  }
}

function drawCell(x, y, fill) {
  ctx.fillStyle = fill;
  ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
}

function step() {
  dir = nextDir;

  const head = snake[0];
  const newHead = { x: head.x + dir.x, y: head.y + dir.y };

  // Wall collision
  if (newHead.x < 0 || newHead.x >= GRID || newHead.y < 0 || newHead.y >= GRID) {
    setBestIfNeeded();
    reset();
    return;
  }

  // Self collision
  if (snake.some((s, i) => i !== 0 && same(s, newHead))) {
    setBestIfNeeded();
    reset();
    return;
  }

  snake.unshift(newHead);

  // Eat
  if (same(newHead, food)) {
    score++;
    scoreEl.textContent = score;

    // speed up every 5 points (to a cap)
    if (score % 5 === 0 && speedMs > 60) speedMs -= 6;

    food = spawnFood();
  } else {
    snake.pop();
  }
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background
  ctx.fillStyle = "#11111a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawGrid();

  // Food
  drawCell(food.x, food.y, "#eaeaf2");

  // Snake
  snake.forEach((s, i) => {
    drawCell(s.x, s.y, i === 0 ? "#ffffff" : "rgba(255,255,255,0.75)");
  });

  // Pause overlay
  if (paused) {
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#ffffff";
    ctx.font = "700 24px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 2);
    ctx.font = "14px system-ui";
    ctx.fillText("Press Space to resume", canvas.width / 2, canvas.height / 2 + 26);
  }
}

function loop(ts) {
  if (!paused) {
    if (!lastStep) lastStep = ts;
    const elapsed = ts - lastStep;
    if (elapsed >= speedMs) {
      step();
      lastStep = ts;
    }
  }
  render();
  requestAnimationFrame(loop);
}

// Keyboard controls
window.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();

  if (k === " " || k === "spacebar") {
    paused = !paused;
    return;
  }
  if (k === "r") {
    reset();
    return;
  }

  let nd = null;
  if (k === "arrowup" || k === "w") nd = { x: 0, y: -1 };
  if (k === "arrowdown" || k === "s") nd = { x: 0, y: 1 };
  if (k === "arrowleft" || k === "a") nd = { x: -1, y: 0 };
  if (k === "arrowright" || k === "d") nd = { x: 1, y: 0 };
  if (!nd) return;

  // prevent instant reverse
  if (nd.x === -dir.x && nd.y === -dir.y) return;

  nextDir = nd;
});

// Touch swipe controls (mobile)
let touchStartX = 0, touchStartY = 0;
canvas.addEventListener("touchstart", (e) => {
  if (!e.touches || !e.touches[0]) return;
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}, { passive: true });

canvas.addEventListener("touchend", (e) => {
  if (!e.changedTouches || !e.changedTouches[0]) return;
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;

  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  const threshold = 18; // px

  if (absX < threshold && absY < threshold) return;

  let nd;
  if (absX > absY) {
    nd = dx > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 };
  } else {
    nd = dy > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 };
  }

  if (nd.x === -dir.x && nd.y === -dir.y) return;
  nextDir = nd;
}, { passive: true });

// Start
reset();
requestAnimationFrame(loop);
