let x1 = 200, y1 = 200, speedX1 = -2, speedY1 = 2;
let x2 = 300, y2 = 100, speedX2 = -2, speedY2 = 2;
let x3 = 350, y3 = 50, speedX3 = -2, speedY3 = 2;
let x4 = 375, y4 = 25, speedX4 = -2, speedY4 = 2;

let angle = 0;
let step = 0.5;
let imgHuman;
let positions = [];
let gridSize;
let visibility = [];
let showHuman = true;
let untitledSound, celebrationSound;
let hintDisplayed = true;
let soundStarted = false;
let userInteracted = false;
let circlesVisible = false;

let colorTrail = [];
let firstScratchCompleted = false;
let secondScratchCompleted = false;
let score = 0;
let startTime;
let elapsedTime;
let difficultyLevel = 1;
let circles = [];
let lastSwitchTime = 0;
let collectedCircles = 0;
let maxCircles = 8;
let circleSpeedMultiplier = 0.5;
let showCongratsMessage = false;
let congratsMessageTimeout = 0;
let showCompletionMessage = false;
let resetVisibilityTimeout = 2000;

// Particle System
let particles = [];
const PARTICLE_LIFETIME = 60;

function preload() {
  imgHuman = loadImage("human2.png");
  untitledSound = loadSound('untitled.mp3');
  celebrationSound = loadSound('celebration.mp3');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100);
  rectMode(CENTER);
  angleMode(DEGREES);
  strokeWeight(2);
  
  gridSize = calculateGridSize();
  initializeGrid();

  startTime = millis();
  untitledSound.loop();
  untitledSound.setVolume(0.50);
  soundStarted = true;
}

function calculateGridSize() {
  let minDimension = min(windowWidth, windowHeight);
  return minDimension / 6.5;
}

function initializeGrid() {
  positions = [];
  visibility = [];
  for (let x = 0; x < width; x += gridSize) {
    for (let y = 0; y < height; y += gridSize) {
      positions.push({ x: x + gridSize / 2, y: y + gridSize / 2 });
      visibility.push(255);
    }
  }
}

function draw() {
  let hueValue = (frameCount / 4) % 360;
  background(hueValue, 100, 20);

  // UI Elements
  textSize(20);
  fill(255);
  textAlign(LEFT, TOP);
  text("Difficulty: " + difficultyLevel, 20, 20);
  text("Score: " + score, 20, 50);

  if (secondScratchCompleted) {
    elapsedTime = (millis() - startTime) / 1000;
    text("Time: " + elapsedTime.toFixed(2) + " seconds", 20, 80);
  }

  if (hintDisplayed && !userInteracted) {
    textSize(30);
    textAlign(CENTER, CENTER);
    fill(255, 50, 100);
    text("1. Clear the Grid carefully and listen!", width / 2, height / 7 + 40);
    text("Press F for Fullscreen", width / 2, height - 10);
    textSize(25);
    text("2. Click to Start and Discover More!", width / 2, height / 2 + 120);
    
    
  }

  // Grid and Particles
  let allSquaresInvisible = true;
  if (!firstScratchCompleted) {
    for (let i = 0; i < positions.length; i++) {
      let d = dist(mouseX, mouseY, positions[i].x, positions[i].y);
      if (d < 100) {
        visibility[i] -= difficultyLevel * 50;
        visibility[i] = max(visibility[i], 0);

        let trailHue = (frameCount / 10 + i * 10) % 360;
        let trailColor = color(trailHue, 100, 100, 50);
        fill(trailColor);
        noStroke();
        rect(positions[i].x, positions[i].y, gridSize, gridSize);
        
        if (random() < 0.2) {
          createParticle(positions[i].x, positions[i].y, trailHue);
        }
      }
      if (visibility[i] > 0) allSquaresInvisible = false;
      
      let cellHue = (hueValue + 180) % 360;
      stroke(cellHue, 100, 100);
      fill(0, 0, 60, visibility[i]);
      rect(positions[i].x, positions[i].y, gridSize, gridSize);
    }
  }
  
  updateParticles();

  // Game progression
  if (allSquaresInvisible && !firstScratchCompleted) {
    firstScratchCompleted = true;
    difficultyLevel = 2;
    initializeCircles(4);
  }
  
  if (allSquaresInvisible && !secondScratchCompleted) {
    secondScratchCompleted = true;
    if (!celebrationSound.isPlaying()) {
      celebrationSound.play();
    }
  }

  // Sound pitch adjustment
  let pitch = map(difficultyLevel, 1, 4, 1.0, 1.4);
  untitledSound.rate(pitch);

  // Human image
  if (!fullscreen()) {
    let distance = dist(mouseX, mouseY, width / 2, height / 2);
    let imgSize = map(distance, 0, width / 2, 50, 200);
    imageMode(CENTER);
    push();
    translate(width / 2, height / 2);
    rotate(angle);
    image(imgHuman, 0, 0, imgSize, imgSize);
    pop();
    angle += step;
  }

  // Messages
  if (showCongratsMessage) {
    textSize(40);
    textAlign(CENTER, CENTER);
    fill(360 - hueValue / 2, 100, 100);
    text("Congratulations! Now you need MORE!", width / 2, height / 2);
    if (millis() - congratsMessageTimeout > 2000) {
      showCongratsMessage = false;
    }
  }
  
  if (showCompletionMessage) {
    textSize(40);
    textAlign(CENTER, CENTER);
    fill(360 - hueValue / 2, 100, 100);
    text("Congratulations! Mission accomplished!", width / 2, height / 2);
  }
  
  // Circles
  if (difficultyLevel >= 2 && !showCompletionMessage) {
    drawMovingCircles();
    textSize(25);
    fill(255);
    textAlign(CENTER, CENTER);
    text("Collect all circles to proceed: " + collectedCircles + "/" + circles.length, width / 2, height - 50);
  }
  
  // Mouse trail
  let trailColor = color(hueValue, 100, 100, 150);
  colorTrail.push({ x: mouseX, y: mouseY, size: 30, color: trailColor });
  if (colorTrail.length > 20) colorTrail.shift();
  for (let trail of colorTrail) {
    fill(trail.color);
    noStroke();
    ellipse(trail.x, trail.y, trail.size);
  }
}

// Particle functions
function createParticle(x, y, hue) {
  particles.push({
    x: x,
    y: y,
    size: random(5, 15),
    color: color(hue, 100, 100, 100),
    life: PARTICLE_LIFETIME,
    velocity: { x: random(-2, 2), y: random(-2, 2) }
  });
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.x += p.velocity.x;
    p.y += p.velocity.y;
    p.life--;
    
    noStroke();
    fill(p.color.levels[0], p.color.levels[1], p.color.levels[2], map(p.life, 0, PARTICLE_LIFETIME, 0, 100));
    ellipse(p.x, p.y, p.size);
    
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function initializeCircles(numCircles) {
  circles = [];
  for (let i = 0; i < numCircles; i++) {
    circles.push({
      x: random(width),
      y: random(height),
      size: random(20, 50),
      speedX: random(-2, 2) * circleSpeedMultiplier,
      speedY: random(-2, 2) * circleSpeedMultiplier,
      visible: true
    });
  }
}

function drawMovingCircles() {
  for (let i = 0; i < circles.length; i++) {
    if (circles[i].visible) {
      let circleHue = (frameCount / 10 + i * 50) % 360;
      
      // Glow effect
      drawingContext.shadowBlur = 15;
      drawingContext.shadowColor = color(circleHue, 100, 100).toString();
      fill(circleHue, 100, 100);
      circle(circles[i].x, circles[i].y, circles[i].size);
      drawingContext.shadowBlur = 0;
      
      // Movement
      circles[i].x += circles[i].speedX;
      circles[i].y += circles[i].speedY;
      
      // Bounce off edges
      if (circles[i].x < 0 || circles[i].x > width) circles[i].speedX *= -1;
      if (circles[i].y < 0 || circles[i].y > height) circles[i].speedY *= -1;
      
      // Collection check
      if (dist(mouseX, mouseY, circles[i].x, circles[i].y) < circles[i].size / 2) {
        circles[i].visible = false;
        collectedCircles++;
        score += 10 * difficultyLevel;
        
        // Create collection particles
        for (let j = 0; j < 10; j++) {
          createParticle(circles[i].x, circles[i].y, circleHue);
        }
        
        // Level progression
        if (collectedCircles >= circles.length) {
          difficultyLevel++;
          if (difficultyLevel <= 4) {
            initializeCircles(Math.min(Math.pow(2, difficultyLevel), maxCircles));
            circleSpeedMultiplier += 0.25;
            showCongratsMessage = true;
            congratsMessageTimeout = millis();
          } else {
            showCompletionMessage = true;
            difficultyLevel = 4;
            if (!celebrationSound.isPlaying()) {
              celebrationSound.play();
            }
          }
          collectedCircles = 0;
        }
      }
    }
  }
}

function mousePressed() {
  if (!userInteracted) {
    userInteracted = true;
    hintDisplayed = false;
    circlesVisible = true;
    // Ενεργοποίηση fullscreen με πρώτο κλικ (προαιρετικό)
    // fullscreen(true);
  }
}

function keyPressed() {
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  gridSize = calculateGridSize();
  initializeGrid();
}