const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const bubbleRadius = 15;
const colors = ["red", "blue", "green", "yellow", "purple", "orange"];
const itemTypes = ["bomb", "dual", "color"]; // 아이템 종류

let bubbles = []; // 중심 원판
let shooter = { x: canvas.width/2, y: 40, dx: 0, dy: 0, active: false, color: randomColor(), item: null };
let rotationSpeed = 0;
const center = { x: canvas.width/2, y: canvas.height/2 };

// 초기 배치
function initBubbles() {
  const rows = 5;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < rows; col++) {
      const offsetX = (row % 2) * bubbleRadius;
      const x = center.x + (col - rows/2) * bubbleRadius * 2 + offsetX;
      const y = center.y + (row - rows/2) * bubbleRadius * 1.8;

      // 아이템 구슬 확률 (10%)
      let item = null;
      if (Math.random() < 0.1) {
        item = itemTypes[Math.floor(Math.random() * itemTypes.length)];
      }

      bubbles.push({ x, y, color: randomColor(), item, angle: 0 });
    }
  }
}

// 랜덤 색상
function randomColor() {
  return colors[Math.floor(Math.random() * colors.length)];
}

// 발사체 그리기
function drawShooter() {
  ctx.beginPath();
  ctx.arc(shooter.x, shooter.y, bubbleRadius, 0, Math.PI * 2);
  ctx.fillStyle = shooter.color;
  ctx.fill();
  ctx.closePath();

  if (shooter.item) {
    ctx.fillStyle = "black";
    ctx.fillText(shooter.item[0].toUpperCase(), shooter.x - 4, shooter.y + 4);
  }
}

// 구슬 그리기
function drawBubbles() {
  bubbles.forEach(b => {
    ctx.beginPath();
    ctx.arc(b.x, b.y, bubbleRadius, 0, Math.PI * 2);
    ctx.fillStyle = b.color;
    ctx.fill();
    ctx.closePath();

    if (b.item) {
      ctx.fillStyle = "black";
      ctx.fillText(b.item[0].toUpperCase(), b.x - 4, b.y + 4);
    }
  });
}

// 충돌 체크
function checkCollision() {
  for (let i = 0; i < bubbles.length; i++) {
    const b = bubbles[i];
    const dx = shooter.x - b.x;
    const dy = shooter.y - b.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < bubbleRadius * 2) {
      // 구슬 추가
      bubbles.push({ x: shooter.x, y: shooter.y, color: shooter.color, item: shooter.item, angle: 0 });

      // 아이템 효과 적용
      if (shooter.item) {
        applyItemEffect(shooter, b);
      }

      // 매칭 검사
      checkMatches();

      // 충돌 방향에 따른 회전
      rotationSpeed = (shooter.dx > 0 ? 0.02 : -0.02);

      // 새 발사체
      shooter = { x: canvas.width/2, y: 40, dx: 0, dy: 0, active: false, color: randomColor(), item: randomItemChance() };
      return true;
    }
  }
  return false;
}

// 아이템 랜덤 생성 (발사체 전용, 확률 15%)
function randomItemChance() {
  if (Math.random() < 0.15) {
    return itemTypes[Math.floor(Math.random() * itemTypes.length)];
  }
  return null;
}

// 아이템 효과
function applyItemEffect(shooter, targetBubble) {
  if (shooter.item === "bomb") {
    // 반경 6개 이상 제거
    bubbles = bubbles.filter(b => {
      let dx = b.x - targetBubble.x;
      let dy = b.y - targetBubble.y;
      return Math.sqrt(dx * dx + dy * dy) > bubbleRadius * 6;
    });
  }
  if (shooter.item === "dual") {
    // 이웃 구슬 2개 색깔도 같이 터짐
    bubbles = bubbles.filter(b => {
      let dx = b.x - targetBubble.x;
      let dy = b.y - targetBubble.y;
      return Math.sqrt(dx * dx + dy * dy) > bubbleRadius * 2.5;
    });
  }
  if (shooter.item === "color") {
    // 랜덤 색상 하나 전체 제거
    let targetColor = targetBubble.color;
    bubbles = bubbles.filter(b => b.color !== targetColor);
  }
}

// 같은 색 매칭 검사 (3개 이상 붙으면 제거)
function checkMatches() {
  let toRemove = new Set();
  for (let i = 0; i < bubbles.length; i++) {
    let group = [bubbles[i]];
    for (let j = 0; j < bubbles.length; j++) {
      if (i === j) continue;
      let dx = bubbles[i].x - bubbles[j].x;
      let dy = bubbles[i].y - bubbles[j].y;
      let dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < bubbleRadius * 2.2 && bubbles[i].color === bubbles[j].color) {
        group.push(bubbles[j]);
      }
    }
    if (group.length >= 3) {
      group.forEach(b => toRemove.add(b));
    }
  }
  bubbles = bubbles.filter(b => !toRemove.has(b));
}

// 원판 회전
function rotateBubbles() {
  if (rotationSpeed === 0) return;

  bubbles.forEach(b => {
    let dx = b.x - center.x;
    let dy = b.y - center.y;

    let angle = Math.atan2(dy, dx) + rotationSpeed;
    let dist = Math.sqrt(dx * dx + dy * dy);

    b.x = center.x + Math.cos(angle) * dist;
    b.y = center.y + Math.sin(angle) * dist;
  });

  rotationSpeed *= 0.99;
  if (Math.abs(rotationSpeed) < 0.001) rotationSpeed = 0;
}

// 메인 루프
function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawBubbles();
  drawShooter();

  if (shooter.active) {
    shooter.x += shooter.dx;
    shooter.y += shooter.dy;
    if (checkCollision()) return;
  }

  rotateBubbles();
  requestAnimationFrame(update);
}

// 마우스 클릭 → 발사
canvas.addEventListener("click", (e) => {
  if (!shooter.active) {
    const rect = canvas.getBoundingClientRect();
    const targetX = e.clientX - rect.left;
    const targetY = e.clientY - rect.top;
    const angle = Math.atan2(targetY - shooter.y, targetX - shooter.x);
    shooter.dx = Math.cos(angle) * 5;
    shooter.dy = Math.sin(angle) * 5;
    shooter.active = true;
  }
});

// 초기화
initBubbles();
update();
