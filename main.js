(function () {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score');
  const promo = document.getElementById('promo');
  const gameOver = document.getElementById('gameOver');
  const playAgainBtn = document.getElementById('playAgain');
  const retryBtn = document.getElementById('retry');
  const restartBtn = document.getElementById('restart');

  const DESIGN_WIDTH = 360;
  const DESIGN_HEIGHT = 640;
  let deviceScale = window.devicePixelRatio || 1;

  const player = {
    x: DESIGN_WIDTH / 2,
    y: DESIGN_HEIGHT - 70,
    width: 78,
    height: 22,
    speed: 340,
    targetX: null,
  };

  const items = [];
  let score = 0;
  let lastTime = 0;
  let spawnTimer = 0;
  let playing = true;
  let flashTimer = 0;

  const promoCode = 'USDT-10WIN';
  document.getElementById('promoCode').textContent = promoCode;

  const gradients = {
    coin: ctx.createLinearGradient(0, 0, 0, 20),
    sky: ctx.createRadialGradient(DESIGN_WIDTH / 2, DESIGN_HEIGHT * 0.18, 10, DESIGN_WIDTH / 2, DESIGN_HEIGHT * 0.18, DESIGN_WIDTH / 1.2),
    bomb: ctx.createLinearGradient(0, 0, 0, 20),
  };

  gradients.coin.addColorStop(0, '#fff26a');
  gradients.coin.addColorStop(0.5, '#f7e952');
  gradients.coin.addColorStop(1, '#d9c13b');

  gradients.bomb.addColorStop(0, '#ff7b7b');
  gradients.bomb.addColorStop(1, '#c92a2a');

  gradients.sky.addColorStop(0, 'rgba(93, 214, 255, 0.2)');
  gradients.sky.addColorStop(1, 'rgba(10, 17, 28, 0)');

  function resizeCanvas() {
    deviceScale = window.devicePixelRatio || 1;
    canvas.style.width = '100%';
    canvas.style.maxWidth = '440px';
    const cssWidth = DESIGN_WIDTH;
    const cssHeight = DESIGN_HEIGHT;
    canvas.width = cssWidth * deviceScale;
    canvas.height = cssHeight * deviceScale;
    ctx.setTransform(deviceScale, 0, 0, deviceScale, 0, 0);
  }

  function resetGame() {
    items.length = 0;
    score = 0;
    scoreEl.textContent = score;
    spawnTimer = 0;
    playing = true;
    flashTimer = 0;
    promo.classList.remove('visible');
    gameOver.classList.remove('visible');
    player.x = DESIGN_WIDTH / 2;
  }

  function spawnItem() {
    const size = 20;
    const x = 10 + Math.random() * (DESIGN_WIDTH - size - 20);
    const speed = 120 + Math.random() * 80 + score * 6;
    const bombChance = Math.min(0.45, 0.25 + score * 0.02);
    const isBomb = Math.random() < bombChance;
    items.push({ x, y: -size, size, speed, type: isBomb ? 'bomb' : 'coin' });
  }

  function movePlayer(dt) {
    if (player.targetX != null) {
      const dx = player.targetX - player.x;
      player.x += dx * Math.min(1, dt * 8);
    }
  }

  const keys = new Set();
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.add('left');
    if (e.key === 'ArrowRight' || e.key === 'd') keys.add('right');
  });
  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.delete('left');
    if (e.key === 'ArrowRight' || e.key === 'd') keys.delete('right');
  });

  function applyKeyboard(dt) {
    let dir = 0;
    if (keys.has('left')) dir -= 1;
    if (keys.has('right')) dir += 1;
    if (dir !== 0) {
      player.x += dir * player.speed * dt;
      player.targetX = null;
    }
  }

  function clampPlayer() {
    const half = player.width / 2;
    player.x = Math.max(half, Math.min(DESIGN_WIDTH - half, player.x));
  }

  function updateItems(dt) {
    for (let i = items.length - 1; i >= 0; i -= 1) {
      const item = items[i];
      item.y += item.speed * dt;

      if (checkCollision(item)) {
        if (item.type === 'coin') {
          score += 1;
          scoreEl.textContent = score;
          if (score >= 10) winGame();
        } else {
          loseGame();
        }
        items.splice(i, 1);
        continue;
      }

      if (item.y > DESIGN_HEIGHT + 40) items.splice(i, 1);
    }
  }

  function checkCollision(item) {
    const halfW = player.width / 2;
    const halfH = player.height / 2;
    return (
      item.x + item.size > player.x - halfW &&
      item.x < player.x + halfW &&
      item.y + item.size > player.y - halfH &&
      item.y < player.y + halfH
    );
  }

  function winGame() {
    playing = false;
    promo.classList.add('visible');
  }

  function loseGame() {
    playing = false;
    flashTimer = 0.5;
    gameOver.classList.add('visible');
  }

  function drawBackground() {
    ctx.fillStyle = gradients.sky;
    ctx.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);

    ctx.setLineDash([8, 12]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 2;
    for (let i = 1; i < 3; i += 1) {
      const y = (DESIGN_HEIGHT / 3) * i;
      ctx.beginPath();
      ctx.moveTo(12, y);
      ctx.lineTo(DESIGN_WIDTH - 12, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(148, 168, 197, 0.9)';
    ctx.font = '600 13px "Inter", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Лови монетки, избегай красные бомбы!', 16, 26);
  }

  function drawPlayer() {
    const { x, y, width, height } = player;
    const left = x - width / 2;
    const top = y - height / 2;

    ctx.fillStyle = '#0f1b2c';
    ctx.strokeStyle = 'rgba(125, 243, 92, 0.45)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(left, top, width, height, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(114, 211, 255, 0.25)';
    ctx.fillRect(left + 6, top + 4, width - 12, height / 2);
  }

  function drawCoin(coin) {
    const { x, y, size } = coin;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = gradients.coin;
    ctx.strokeStyle = '#2a1f07';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.roundRect(0, 0, size, size, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#0a1120';
    ctx.font = 'bold 12px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', size / 2, size / 2 + 0.5);
    ctx.restore();
  }

  function drawBomb(bomb) {
    const { x, y, size } = bomb;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = gradients.bomb;
    ctx.strokeStyle = '#1a0b0b';
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.roundRect(0, 0, size, size, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#0a1120';
    ctx.font = 'bold 12px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('X', size / 2, size / 2 + 0.5);
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
    drawBackground();

    items.forEach((item) => {
      if (item.type === 'coin') drawCoin(item);
      else drawBomb(item);
    });
    drawPlayer();

    if (flashTimer > 0) {
      ctx.fillStyle = `rgba(255, 0, 0, ${flashTimer * 0.8})`;
      ctx.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
    }
  }

  function loop(timestamp) {
    const dt = Math.min(0.05, (timestamp - lastTime) / 1000 || 0);
    lastTime = timestamp;

    if (playing) {
      spawnTimer += dt;
      if (spawnTimer > 0.9) {
        spawnItem();
        spawnTimer = 0;
      }
      applyKeyboard(dt);
      movePlayer(dt);
      clampPlayer();
      updateItems(dt);
    }

    flashTimer = Math.max(0, flashTimer - dt);

    draw();
    requestAnimationFrame(loop);
  }

  function pointerToCanvasX(evt) {
    const rect = canvas.getBoundingClientRect();
    const ratio = DESIGN_WIDTH / rect.width;
    return (evt.clientX - rect.left) * ratio;
  }

  let dragging = false;
  ['pointerdown', 'pointermove'].forEach((type) => {
    canvas.addEventListener(type, (evt) => {
      dragging = true;
      player.targetX = pointerToCanvasX(evt);
    });
  });
  window.addEventListener('pointerup', () => {
    dragging = false;
  });

  restartBtn.addEventListener('click', resetGame);
  playAgainBtn.addEventListener('click', resetGame);
  retryBtn.addEventListener('click', resetGame);

  window.addEventListener('resize', resizeCanvas);

  resizeCanvas();
  requestAnimationFrame(loop);
})();
