let player;
let enemies = [];
let buildings = [];
let stones = [];
let flags = [];
let enemyBombs = [];
let gameState = "start";
let score = 0;
let keys = {};
let font;
let song;
let lastStoneEarned = 0;
let lastEnemyAttack = 0;
let enemySpawnCount = 1;
let lastEnemySpawnTime = 0;
let glowingBuildings = [];

function preload() {
  font = loadFont("8-bit-pusab.ttf");
  song = loadSound("tetris.mp3");
}

function setup() {
  createCanvas(displayWidth, displayHeight);
  textFont(font);

  player = {
    x: 100,
    y: height - 120,
    w: 32,
    h: 48,
    speed: 5,
    jumpForce: 12,
    velY: 0,
    isJumping: false,
    ammo: 50,
    health: 100,
  };

  // Create 9 buildings spread across the display
  for (let i = 0; i < 9; i++) {
    buildings.push({
      x: 50 + i * 80,
      y: height - 150 - 50,
      w: 70,
      h: 150,
      health: 50,
      hasFlag: true,
    });
  }

  if (!song.isPlaying()) {
    song.loop();
  }
}

function draw() {
  background(135, 206, 235);

  // Draw ground with grass
  fill(34, 139, 34);
  rect(0, height - 50, width, 50);
  fill(124, 252, 0);
  for (let x = 0; x < width; x += 20) {
    triangle(x, height - 50, x + 10, height - 70, x + 20, height - 50);
  }

  if (gameState === "start") {
    drawStartScreen();
  } else if (gameState === "playing") {
    runGame();
  } else if (gameState === "gameover") {
    drawGameOverScreen();
  } else if (gameState === "victory") {
    drawVictoryScreen();
  }
}

function drawStartScreen() {
  fill(0);
  textSize(32);
  text("FREE PALESTINE", width / 2, height / 3);
  textSize(16);
  text("Press S to start", width / 2, height / 2);
  text(
    "ARROWS to move, SPACE to jump, X to throw stone",
    width / 2,
    height / 2 + 50
  );
  drawPalestineFlag(width / 2 - 30, height / 2 + 100, 60, 40);
}

function drawGameOverScreen() {
  background(200, 0, 0);
  fill(255);
  textSize(32);
  text("CAPITALISTS WIN. RESIST AGAIN", width / 4, height / 2);
  textSize(16);
  text("Press S to restart", width / 2, height / 2 + 50);
}

function drawVictoryScreen() {
  background(0, 100, 50);
  fill(255);
  textSize(32);
  text("YOU LIBERATED THE LAND!", width / 3, height / 2);
  textSize(16);
  text("Press S to restart", width / 2, height / 2 + 50);

  for (let flag of flags) {
    fill(100);
    rect(flag.x, flag.y, 5, flag.poleHeight);
    drawPalestineFlag(flag.x, flag.y, flag.w, flag.h);
  }
}

function runGame() {
  if (millis() - lastEnemySpawnTime > 10000) {
    enemySpawnCount++;
    lastEnemySpawnTime = millis();
  }

  if (frameCount % 120 === 0 && enemies.length < enemySpawnCount) {
    spawnEnemy();
  }

  if (millis() - lastStoneEarned > 5000) {
    player.ammo += 1;
    lastStoneEarned = millis();
  }

  handleInput();
  updatePlayer();
  updateEnemies();
  updateBuildings();
  updateStones();
  updateFlags();
  updateBombs();
  updateGlowingBuildings();
  drawHUD();

  let allFlagsReplaced = true;
  for (let b of buildings) {
    if (b.hasFlag) {
      allFlagsReplaced = false;
      break;
    }
  }

  if (allFlagsReplaced) {
    gameState = "victory";
  }

  if (player.health <= 0) {
    gameState = "gameover";
  }
}

function updateGlowingBuildings() {
  for (let i = glowingBuildings.length - 1; i >= 0; i--) {
    let gb = glowingBuildings[i];
    gb.timer--;

    let glowAlpha = map(gb.timer, 60, 0, 100, 0);
    fill(255, 255, 255, glowAlpha);
    rect(gb.x - 10, gb.y - 10, gb.w + 20, gb.h + 20, 5);

    if (gb.timer <= 0) {
      glowingBuildings.splice(i, 1);
    }
  }
}

function spawnEnemy() {
  let enemyType = floor(random(2));
  let enemySize = enemyType === 1 ? 3 : 1;

  enemies.push({
    x: width,
    y: height - (enemyType === 1 ? 140 : 100),
    w: 32 * enemySize,
    h: 48 * enemySize,
    speed: 2,
    health: 30 * enemySize,
    type: enemyType,
    attackCooldown: 0,
  });
}

function spawnEnemyBomb(enemy) {
  enemyBombs.push({
    x: enemy.x,
    y: enemy.y + enemy.h,
    w: 10,
    h: 10,
    velY: 3,
    damage: 10,
  });
}

function drawPixelArt(x, y, colors, pixels, sizeMultiplier = 1) {
  for (let row = 0; row < pixels.length; row++) {
    for (let col = 0; col < pixels[row].length; col++) {
      if (pixels[row][col] > 0) {
        fill(colors[pixels[row][col] - 1]);
        rect(
          x + col * 4 * sizeMultiplier,
          y + row * 4 * sizeMultiplier,
          4 * sizeMultiplier,
          4 * sizeMultiplier
        );
      }
    }
  }
}

function handleInput() {
  if (keys[LEFT_ARROW]) player.x -= player.speed;
  if (keys[RIGHT_ARROW]) player.x += player.speed;
  if (keys[32] && !player.isJumping) {
    player.velY = -player.jumpForce;
    player.isJumping = true;
  }
  if (keys[88] && player.ammo > 0 && frameCount % 10 === 0) {
    throwStone();
  }
  player.x = constrain(player.x, 0, width - player.w);
}

function updatePlayer() {
  player.velY += 0.5;
  player.y += player.velY;

  if (player.y + player.h > height - 50) {
    player.y = height - 50 - player.h;
    player.velY = 0;
    player.isJumping = false;
  }

  for (let b of buildings) {
    if (
      player.x + player.w > b.x &&
      player.x < b.x + b.w &&
      player.y + player.h > b.y &&
      player.y + player.h < b.y + 10 &&
      player.velY > 0
    ) {
      player.y = b.y - player.h;
      player.velY = 0;
      player.isJumping = false;
    }
  }

  const playerColors = [
    [30, 30, 30],
    [200, 100, 100],
    [0, 100, 100],
  ];
  const playerPixels = [
    [0, 1, 1, 1, 1, 0],
    [1, 1, 1, 1, 1, 1],
    [1, 2, 2, 2, 2, 1],
    [1, 2, 2, 2, 2, 1],
    [1, 3, 3, 3, 3, 1],
    [0, 3, 3, 3, 3, 0],
    [0, 0, 3, 3, 0, 0],
    [0, 1, 1, 1, 1, 0],
    [1, 1, 0, 0, 1, 1],
  ];
  drawPixelArt(player.x, player.y, playerColors, playerPixels);

  if (player.health <= 0) {
    gameState = "gameover";
  }
}

function throwStone() {
  player.ammo--;
  stones.push({
    x: player.x + player.w / 2,
    y: player.y,
    w: 8,
    h: 8,
    velX: 7,
    velY: -2,
  });
}

function updateStones() {
  for (let i = stones.length - 1; i >= 0; i--) {
    let s = stones[i];
    s.x += s.velX;
    s.y += s.velY;
    s.velY += 0.2;

    fill(100);
    rect(s.x, s.y, s.w, s.h);
    fill(150);
    rect(s.x + 2, s.y + 2, 4, 4);

    if (s.x > width || s.y > height - 50) {
      stones.splice(i, 1);
    }
  }
}

function updateEnemies() {
  for (let i = enemies.length - 1; i >= 0; i--) {
    let e = enemies[i];
    e.x -= e.speed;

    if (e.attackCooldown > 0) e.attackCooldown--;

    if (abs(e.x - player.x) <= 50 && e.attackCooldown === 0) {
      spawnEnemyBomb(e);
      e.attackCooldown = 60;
    }

    if (e.type === 0) {
      const enemyColors = [
        [255, 0, 0],
        [30, 30, 30],
        [200, 200, 200],
      ];
      const enemyPixels = [
        [0, 1, 1, 1, 1, 0],
        [1, 1, 1, 1, 1, 1],
        [1, 2, 2, 2, 2, 1],
        [1, 2, 2, 2, 2, 1],
        [1, 3, 3, 3, 3, 1],
        [0, 3, 3, 3, 3, 0],
        [0, 0, 3, 3, 0, 0],
        [0, 1, 1, 1, 1, 0],
        [1, 1, 0, 0, 1, 1],
      ];
      drawPixelArt(e.x, e.y, enemyColors, enemyPixels);
    } else {
      const tankColors = [
        [100, 100, 100],
        [30, 30, 30],
      ];
      const tankPixels = [
        [0, 0, 1, 1, 0, 0],
        [1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1],
        [2, 2, 2, 2, 2, 2],
        [0, 0, 2, 2, 0, 0],
      ];
      drawPixelArt(e.x, e.y, tankColors, tankPixels, 3);
    }

    if (
      e.x + e.w > player.x &&
      e.x < player.x + player.w &&
      e.y + e.h > player.y &&
      e.y < player.y + player.h
    ) {
      player.health -= 10;
      enemies.splice(i, 1);
      continue;
    }

    for (let j = stones.length - 1; j >= 0; j--) {
      let s = stones[j];
      if (
        s.x + s.w > e.x &&
        s.x < e.x + e.w &&
        s.y + s.h > e.y &&
        s.y < e.y + e.h
      ) {
        e.health -= 10;
        stones.splice(j, 1);

        if (e.health <= 0) {
          enemies.splice(i, 1);
          score += 50 * (e.type === 1 ? 3 : 1);
        }
        break;
      }
    }

    if (e.x + e.w < 0) {
      enemies.splice(i, 1);
    }
  }
}

function updateBuildings() {
  for (let i = buildings.length - 1; i >= 0; i--) {
    let b = buildings[i];

    fill(150);
    rect(b.x, b.y, b.w, b.h);
    fill(200, 200, 100);
    for (let wy = b.y + 10; wy < b.y + b.h - 10; wy += 15) {
      for (let wx = b.x + 10; wx < b.x + b.w - 10; wx += 15) {
        rect(wx, wy, 8, 8);
      }
    }

    if (b.hasFlag) {
      drawIsraeliFlag(b.x + b.w / 2 - 15, b.y - 30, 30, 20);
    }

    for (let j = stones.length - 1; j >= 0; j--) {
      let s = stones[j];
      if (
        s.x + s.w > b.x &&
        s.x < b.x + b.w &&
        s.y + s.h > b.y &&
        s.y < b.y + b.h
      ) {
        b.health -= 10;
        stones.splice(j, 1);

        if (b.health <= 0) {
          glowingBuildings.push({
            x: b.x,
            y: b.y,
            w: b.w,
            h: b.h,
            timer: 60,
          });

          flags.push({
            x: b.x + b.w / 2 - 15,
            y: b.y - 60,
            w: 30,
            h: 40,
            poleHeight: 60,
          });

          b.hasFlag = false;
          b.health = 50;
          score += 100;
        }
        break;
      }
    }
  }
}

function updateBombs() {
  for (let i = enemyBombs.length - 1; i >= 0; i--) {
    let bomb = enemyBombs[i];
    bomb.y += bomb.velY;

    fill(0);
    rect(bomb.x, bomb.y, bomb.w, bomb.h);
    fill(255, 0, 0);
    rect(bomb.x + 2, bomb.y + 2, bomb.w - 4, bomb.h - 4);

    if (
      bomb.x + bomb.w > player.x &&
      bomb.x < player.x + player.w &&
      bomb.y + bomb.h > player.y &&
      bomb.y < player.y + player.h
    ) {
      player.health -= bomb.damage;
      enemyBombs.splice(i, 1);
      continue;
    }

    if (bomb.y > height - 50) {
      enemyBombs.splice(i, 1);
    }
  }
}

function updateFlags() {
  for (let flag of flags) {
    fill(100);
    rect(flag.x, flag.y, 5, flag.poleHeight);
    drawPalestineFlag(flag.x, flag.y, flag.w, flag.h);
  }
}

function drawPalestineFlag(x, y, w, h) {
  fill(0, 0, 0);
  rect(x + 5, y, w - 5, h / 3);
  fill(255, 255, 255);
  rect(x + 5, y + h / 3, w - 5, h / 3);
  fill(0, 100, 50);
  rect(x + 5, y + (2 * h) / 3, w - 5, h / 3);
  fill(200, 0, 0);
  triangle(x + 5, y, x + 5, y + h, x + w / 2, y + h / 2);
}

function drawIsraeliFlag(x, y, w, h) {
  fill(255);
  rect(x, y, w, h);
  fill(0, 0, 100);
  rect(x, y, w, h / 6);
  rect(x, y + (h * 5) / 6, w, h / 6);

  // Draw 6-pointed star (Star of David)
  fill(100, 100, 100);
  beginShape();
  let centerX = x + w / 2;
  let centerY = y + h / 2;
  let radius = h / 6;
  for (let i = 0; i < 12; i++) {
    let angle = (i * TWO_PI) / 12;
    let r = i % 2 === 0 ? radius : radius * 0.4;
    let px = centerX + cos(angle) * r;
    let py = centerY + sin(angle) * r;
    vertex(px, py);
  }
  endShape(CLOSE);
}

function drawHUD() {
  fill(0);
  textSize(16);
  text("HEALTH: " + player.health, 100, 30);
  text("STONES: " + player.ammo, 300, 30);
  text("SCORE: " + score, 500, 30);
  text("ISRAELI TROOPS: " + enemySpawnCount, 700, 30);
}

function keyPressed() {
  keys[keyCode] = true;

  if (
    (key === "s" || key === "S") &&
    (gameState === "start" ||
      gameState === "gameover" ||
      gameState === "victory")
  ) {
    gameState = "playing";
    player.health = 100;
    player.ammo = 50;
    score = 0;
    enemies = [];
    buildings = [];
    flags = [];
    enemyBombs = [];
    glowingBuildings = [];
    enemySpawnCount = 1;
    for (let i = 0; i < 9; i++) {
      buildings.push({
        x: 50 + i * 80,
        y: height - 150 - 50,
        w: 70,
        h: 150,
        health: 50,
        hasFlag: true,
      });
    }
    lastStoneEarned = millis();
    lastEnemyAttack = millis();
    lastEnemySpawnTime = millis();
  }

  if (key === "f" || key === "F") {
    // let fs = fullscreen();
    // fullscreen(!fs);
    // resizeCanvas(displayWidth, displayHeight);
  }
}

function keyReleased() {
  keys[keyCode] = false;
}

function windowResized() {
  resizeCanvas(displayWidth, displayHeight);
}
