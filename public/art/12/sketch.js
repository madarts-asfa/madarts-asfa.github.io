let x, y;
let d = 50;
let count = 0;
let pic;
let song;
let eyePic;
let targets = [];
let bgColor = [255, 0, 255];
let spring = 0.05;
let easing = 0.05;
let started = false;
let showTargets = false;
let resetButton;
let gameOverSound;
let gameOverPlayed = false;
let gameOverRepeatCount = 0; // Track repetitions

// Target settings
let targetW = 60;
let spacing = 10;
let latinNumbers = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV"];
let startTime;
let fullBodyImg; // Variable for the fullbody image

function preload() {
  song = loadSound("drumambientsounds.mp3");
  pic = loadImage("face_texture.jpg");
  eyePic = loadImage("eye_texture.jpg");
  gameOverSound = loadSound("cyborg-game-over.mp3"); // Load game-over sound
  fullBodyImg = loadImage("fullbody.jpg"); // Load the fullbody image
  targetClickSound = loadSound("tankdrum.wav"); 



}

function setup() {
  createCanvas(windowWidth, windowHeight);
  resetShapes();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function resetShapes() {
  started = false;
  showTargets = false;
  x = width / 2;
  y = height / 2;
  startTime = millis();
  gameOverPlayed = false;
  gameOverRepeatCount = 0; // Reset repeat count
  shuffleArray(latinNumbers); // Shuffle the latin numbers array
  targets = [];
  
  for (let i = 0; i < 15; i++) {
    targets.push({
      x: random(100, width - 100),
      y: random(100, height - 100),
      size: random(50, 80),
      color: color(random(255), random(255), random(255), 150),
      speedX: random(-1, 1),
      speedY: random(-1, 1),
      number: latinNumbers[i],
      showMessage: false,  // Message is hidden at start
      blinkOpacity: 255,
      blinkSpeed: random(2, 4)
    });
  }
}

function draw() {
  if (!started) {
    showStartScreen();
    return;
  }

  if (showTargets) {
    drawTargetGrid();
    return;
  }

  let elapsedTime = (millis() - startTime) / 1000;
  let darkness = map(elapsedTime % 10, 0, 10, 0, 80);

  background(bgColor[0] - darkness, bgColor[1] - darkness, bgColor[2] - darkness);

  let targetX = mouseX;
  let targetY = mouseY;
  x += (targetX - x) * easing;
  y += (targetY - y) * easing;
  x += (width / 2 - x) * spring;
  y += (height / 2 - y) * spring;

  tint(255, 150);
  image(pic, x - width / 2, y - height / 2, width, height);
  noTint();

  for (let target of targets) {
    target.x += target.speedX * (mouseX - width / 2) * 0.001;
    target.y += target.speedY * (mouseY - height / 2) * 0.001;

    fill(target.color);
    ellipse(target.x, target.y, target.size);

    fill(0);
    textSize(20);
    textAlign(CENTER, CENTER);
    text(target.number, target.x, target.y - 5);

    if (random(1) < 0.005) {
      target.blinkOpacity = 50;
    } else {
      target.blinkOpacity = 255;
    }

    fill(0, 0, 0, target.blinkOpacity);
    textSize(14);
    text("Find the lucky number", target.x, target.y + 20);

    //  Show "Push the red rectangle!" only when clicked on III, IV, XII
    if (target.showMessage) {
      fill(255, 0, 0);
      textSize(40);
      text("Push the red rectangle!", target.x, target.y + 50);
    }
  }

  count += 0.1;
  push();
  translate(width / 2, height / 2);
  rotate(count);
  rectMode(CENTER);
  fill(255, 0, 0, 150);
  noStroke();
  rect(0, 0, 50, 50);
  pop();
}

function showStartScreen() {
  // Set the background to the fullbody image
  background(255);
  imageMode(CENTER);
  image(fullBodyImg, width / 2, height / 2, width, height);

  fill(255);
  textAlign(CENTER, CENTER);
  textSize(32);
  text("Start to play the music", width / 2, height / 2);

  // Make the "find the lucky number" text blink and shine in purple
  let blinkOpacity = sin(frameCount * 0.1) * 127 + 128; // Create a smooth blinking effect
  fill(128, 0, 128, blinkOpacity); // Purple color with dynamic opacity
  textSize(24);
  text("Find the lucky number", width / 2, height / 2 + 50);

  // Optional shining effect (changing brightness)
  let shineEffect = sin(frameCount * 0.05) * 50 + 100; // Make the purple shine
  fill(128, 0, 128, shineEffect);
  text("Find the lucky number", width / 2, height / 2 + 50);
}

function drawTargetGrid() {
  let elapsedTime = (millis() - startTime) / 1000;
  let darkness = map(elapsedTime % 10, 0, 10, 0, 80);
  background(220 - darkness);

  for (let target of targets) {
    let eyeOffsetX = map(mouseX, 0, width, -target.size * 0.1, target.size * 0.1);
    let eyeOffsetY = map(mouseY, 0, height, -target.size * 0.1, target.size * 0.1);
    let shouldBlink = random(1) < 0.005;
    let blinkAlpha = shouldBlink ? 50 : 255;

    push();
    translate(target.x, target.y);
    noStroke();
    fill(255, 100, 0, blinkAlpha);
    ellipse(0, 0, target.size);
    fill(180, 0, 200, blinkAlpha);
    ellipse(0, 0, target.size * 0.75);
    fill(255, blinkAlpha);
    ellipse(0, 0, target.size * 0.5);
    imageMode(CENTER);
    image(eyePic, eyeOffsetX, eyeOffsetY, target.size * 0.6, target.size * 0.6);
    pop();
  }

  let blinkOpacity = sin(frameCount * 0.1) * 127 + 128;
  fill(255, 0, 255, blinkOpacity);
  textSize(24);
  textAlign(CENTER, CENTER);
  text("Τhe avatar fooled you! You can't look at yourself, only the avatar can see you!", width / 2, height - 50);

  if (!gameOverPlayed) {
    song.stop();
    playGameOverSound();
    gameOverPlayed = true;
  }

  if (!resetButton) {
    resetButton = createButton("⬅ Go Back");
    resetButton.position(20, 20);
    resetButton.mousePressed(resetShapes);
  }
}

function playGameOverSound() {
  if (gameOverRepeatCount < 3) {
    gameOverSound.play();
    gameOverRepeatCount++;
    setTimeout(playGameOverSound, gameOverSound.duration() * 1000 + 500);
  }
}

function mousePressed() {
  if (!started) {
    started = true;
    song.loop();
    startTime = millis();
  } else {
    let d = dist(mouseX, mouseY, width / 2, height / 2);
    if (d < 25) {
      showTargets = true;
    }

    //  Check if user clicked on III, IV, or XII
    for (let target of targets) {
      let tDist = dist(mouseX, mouseY, target.x, target.y);
      if (tDist < target.size / 2) {
        if (target.number === "III" || target.number === "IV" || target.number === "XII") {
          target.showMessage = true; // Show message only when clicked
           targetClickSound.play(); // Play sound when target is clicked
        }
      }
    }
  }
}

// Function to shuffle the array
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(random(i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}