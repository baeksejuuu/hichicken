const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// base design size
const baseWidth = 640;
const baseHeight = 360;

// images
let chickenImg = new Image();
chickenImg.src = "images/chicken.gif";

let duckImg = new Image();
duckImg.src = "images/duck.gif";

let flowerImg = new Image();
flowerImg.src = "images/gerbera.png";

// player (chicken)
let player = {
  x: 20,
  y: baseHeight - 66,
  width: 70,
  height: 70,
  dx: 0,
};

// goal
const goalXBase = baseWidth - 80;
const duckYBase = baseHeight - 70;
let reached = false;

// petals
const petals = Array.from({ length: 50 }, () => ({
  x: Math.random() * baseWidth,
  y: Math.random() * baseHeight,
  dy: 0.5 + Math.random() * 0.5,
  rotation: Math.random() * Math.PI * 2,
}));

let floatingHearts = [];
let bigHeartParticles = [];
let heartFootprints = []; 

// flowers
let flowers = Array.from({ length: 6 }, (_, i) => ({
  x: 100 + i * 65,
  y: baseHeight - 30,
  size: 24,
  collected: false,
  shakeOffset: 0,
  shakeDir: Math.random() < 0.5 ? 1 : -1,
}));

// sounds
const collectSound = new Audio("");
const winSound = new Audio("");

// button base properties
const buttonRadiusBase = 30;
const leftButtonBase = { x: 50, y: baseHeight - 175, pressed: false };
const rightButtonBase = { x: baseWidth - 50, y: baseHeight - 175, pressed: false };

// scaled button properties 
let scale = 1;
let buttonRadius = buttonRadiusBase;
let leftButton = { ...leftButtonBase };
let rightButton = { ...rightButtonBase };

// resize canvas scale & button positions
function resizeCanvas() {
  const maxWidth = window.innerWidth - 40;
  const maxHeight = window.innerHeight - 80;

  const scaleX = maxWidth / baseWidth;
  const scaleY = maxHeight / baseHeight;

  scale = Math.min(scaleX, scaleY, 1); 

  canvas.width = baseWidth * scale;
  canvas.height = baseHeight * scale;

  buttonRadius = buttonRadiusBase * scale;
  leftButton.x = leftButtonBase.x * scale;
  leftButton.y = leftButtonBase.y * scale;
  rightButton.x = rightButtonBase.x * scale;
  rightButton.y = rightButtonBase.y * scale;
}

function drawButtons() {
  // left button
  ctx.beginPath();
  ctx.arc(leftButton.x, leftButton.y, buttonRadius, 0, Math.PI * 2);
  ctx.fillStyle = leftButton.pressed ? "rgba(255, 77, 109, 0.8)" : "rgba(255, 182, 217, 0.5)";
  ctx.fill();
  ctx.strokeStyle = "#ff4d6d";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = leftButton.pressed ? "white" : "#ffffffff";
  ctx.font = `${25 * scale}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("⬅", leftButton.x, leftButton.y);

  // right button
  ctx.beginPath();
  ctx.arc(rightButton.x, rightButton.y, buttonRadius, 0, Math.PI * 2);
  ctx.fillStyle = rightButton.pressed ? "rgba(255, 77, 109, 0.8)" : "rgba(255, 182, 217, 0.5)";
  ctx.fill();
  ctx.strokeStyle = "#ff4d6d";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = rightButton.pressed ? "white" : "#ffffffff";
  ctx.font = `${25 * scale}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("➡", rightButton.x, rightButton.y);
}

function drawScene() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // falling petals (scaled)
  petals.forEach(p => {
    p.y += p.dy;
    if (p.y > baseHeight) {
      p.y = 0;
      p.x = Math.random() * baseWidth;
      p.rotation = Math.random() * Math.PI * 2;
    }
    ctx.save();
    ctx.translate(p.x * scale, p.y * scale);
    ctx.rotate(p.rotation);
    ctx.fillStyle = "#ffe4e1";
    ctx.fillRect(-1 * scale, -1 * scale, 2 * scale, 2 * scale);
    ctx.restore();
  });

  // flowers (shake left to right)
  flowers.forEach(f => {
    if (!f.collected) {
      f.shakeOffset += f.shakeDir * 0.06;
      if (f.shakeOffset > 2 || f.shakeOffset < -2) f.shakeDir *= -1;
      ctx.drawImage(flowerImg, (f.x + f.shakeOffset) * scale, f.y * scale, f.size * scale, f.size * scale);
    }
  });

  // floating hearts
  floatingHearts.forEach(h => {
    ctx.font = `${18 * scale}px Arial`;
    ctx.fillStyle = "pink";
    ctx.fillText("💜", h.x * scale, h.y * scale);
    h.y -= 1;
    h.life--;
  });
  floatingHearts = floatingHearts.filter(h => h.life > 0);

  // duck
  ctx.drawImage(duckImg, goalXBase * scale, duckYBase * scale, 65 * scale, 65 * scale);

  // big heart explosion
  bigHeartParticles.forEach(p => {
    ctx.font = `${20 * scale}px Arial`;
    ctx.fillStyle = "red";
    ctx.fillText("💜", p.x * scale, p.y * scale);
    p.y -= p.dy;
    p.life--;
  });
  bigHeartParticles = bigHeartParticles.filter(p => p.life > 0);

  // chicken
  ctx.drawImage(chickenImg, player.x * scale, player.y * scale, player.width * scale, player.height * scale);

  // control buttons
  drawButtons();
}

function update() {
  if (!reached) {
    if (leftButton.pressed && !rightButton.pressed) {
      player.dx = -3;
    } else if (rightButton.pressed && !leftButton.pressed) {
      player.dx = 3;
    } else {
      player.dx = 0;
    }

    player.x += player.dx;
    if (player.x < 0) player.x = 0;
    if (player.x > baseWidth - player.width) player.x = baseWidth - player.width;

    // collect flowers
    flowers.forEach(f => {
      if (!f.collected &&
        player.x < f.x + f.size &&
        player.x + player.width > f.x &&
        player.y < f.y + f.size &&
        player.y + player.height > f.y
      ) {
        f.collected = true;
        collectSound.play();
        floatingHearts.push({ x: f.x, y: f.y, life: 40 });
      }
    });

    // reach duck
    if (player.x >= goalXBase - 20) {
      reached = true;
      winSound.play();
      spawnBigHeartExplosion();
      showPopupMessage();
    }
  }
}

function spawnBigHeartExplosion() {
  for (let i = 0; i < 20; i++) {
    bigHeartParticles.push({
      x: goalXBase + Math.random() * 40,
      y: player.y + Math.random() * 40,
      dy: Math.random() * 2 + 1,
      life: 50,
    });
  }
}

function showPopupMessage() {
  const popup = document.createElement("div");
  popup.innerHTML = `
    <div class="popup-header">You made it!</div>
    <p class="popup-text">Across any distance, they still collide.</p>
    <button class="popup-btn">Close</button>
  `;

  popup.style.position = "absolute";
  popup.style.top = "50%";
  popup.style.left = "50%";
  popup.style.transform = "translate(-50%, -50%) scale(1)";
  popup.style.background = "linear-gradient(135deg, #fff0f9, #ffe4ec)";
  popup.style.padding = "20px";
  popup.style.borderRadius = "20px";
  popup.style.boxShadow = "0 8px 25px rgba(0, 0, 0, 0.15)";
  popup.style.textAlign = "center";
  popup.style.width = "300px";
  popup.style.maxWidth = "90vw";
  popup.style.animation = "popupFadeIn 0.4s ease forwards";
  popup.style.zIndex = "1000";
  popup.style.border = "3px solid #ffb6d9";
  popup.style.fontFamily = "'Poppins', sans-serif";

  document.body.appendChild(popup);

  const header = popup.querySelector(".popup-header");
  header.style.fontSize = "20px";
  header.style.color = "#6a336d";
  header.style.marginBottom = "10px";
  header.style.fontWeight = "bold";

  const text = popup.querySelector(".popup-text");
  text.style.color = "#6a336d";
  text.style.fontSize = "14px";
  text.style.lineHeight = "1.5";
  text.style.marginBottom = "20px";

  const button = popup.querySelector(".popup-btn");
  button.style.background = "#ffb6d9";
  button.style.border = "none";
  button.style.padding = "10px 20px";
  button.style.borderRadius = "30px";
  button.style.color = "white";
  button.style.cursor = "pointer";
  button.style.fontWeight = "bold";
  button.style.transition = "all 0.3s ease";
  button.addEventListener("mouseover", () => (button.style.background = "#ff4d6d"));
  button.addEventListener("mouseout", () => (button.style.background = "#ffb6d9"));
  button.addEventListener("click", () => popup.remove());

  const style = document.createElement("style");
  style.innerHTML = `
    @keyframes popupFadeIn {
      from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
      to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    }
  `;
  document.head.appendChild(style);
}

// helper to check if point inside a circle
function isInsideCircle(px, py, cx, cy, r) {
  return Math.hypot(px - cx, py - cy) <= r;
}

// pointer for buttons with scaling
canvas.addEventListener("pointerdown", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (isInsideCircle(x, y, leftButton.x, leftButton.y, buttonRadius)) {
    leftButton.pressed = true;
  }
  if (isInsideCircle(x, y, rightButton.x, rightButton.y, buttonRadius)) {
    rightButton.pressed = true;
  }
});

canvas.addEventListener("pointerup", (e) => {
  leftButton.pressed = false;
  rightButton.pressed = false;
});

canvas.addEventListener("pointercancel", (e) => {
  leftButton.pressed = false;
  rightButton.pressed = false;
});

window.addEventListener("resize", resizeCanvas);

resizeCanvas();

function loop() {
  drawScene();
  update();
  requestAnimationFrame(loop);
}

loop();
