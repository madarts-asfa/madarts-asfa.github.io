// ========= GLOBAL VARIABLES =========
let regions = [];
let allImages = [];
let imageIndex = 0; // for cycling through images
const rows = 3;
const cols = 7;
const numTiles = rows * cols;

let lastEnergyUpdate = 0;
let lastInteractionTime = 0;

let bgSound;
let bgSound2;
let fft;

let showCredits = false;
let debug = false;
let soundEnabled = true; // for the sound control overlay
let musicStarted = false; // tracks if music was started

// ========= ENERGY CATEGORIES =========
let energyCategories = ["bass", "lowMid", "mid", "highMid", "treble"];

// ---------- Credits Drawing Function ----------
function drawCredits() {
  // Calculate rectangle size (80% of canvas width, 80px tall) and center it.
  let rectWidth = width * 0.8;
  let rectHeight = 80;
  let rectX = (width - rectWidth) / 2;
  let rectY = (height - rectHeight) / 2;

  // Draw semi-transparent dark gray rectangle.
  fill(50, 50, 50, 150);
  noStroke();
  rect(rectX, rectY, rectWidth, rectHeight, 10);

  // Draw white text in the center.
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(16);
  let msg =
    "Sound Brylie Christopher Oxley - Ethereal Cafe\nInspiration and code taken from Happy Coding: https://happycoding.io/tutorials/p5js/images/poorly-coded-cats";
  text(msg, width / 2, height / 2);
}

// ---------- Sound Control Overlay (Bottom Left) ----------
function drawSoundControl() {
  let controlW = 120;
  let controlH = 30;
  let controlX = 10;
  let controlY = height - controlH - 10;

  fill(100, 100, 100, 200);
  noStroke();
  rect(controlX, controlY, controlW, controlH, 5);

  fill(245); // off-white
  textAlign(CENTER, CENTER);
  textSize(14);
  let txt = soundEnabled ? "sound on" : "sound off";
  text(txt, controlX + controlW / 2, controlY + controlH / 2);
}

// ---------- Music Start Control (Center) ----------
function drawMusicStartControl() {
  let rectWidth = width * 0.6;
  let rectHeight = 60;
  let rectX = (width - rectWidth) / 2;
  let rectY = (height - rectHeight) / 2;

  fill(30, 30, 30, 200); // dark semi-transparent background
  noStroke();
  rect(rectX, rectY, rectWidth, rectHeight, 10);

  fill(245); // off-white
  textAlign(CENTER, CENTER);
  textSize(20);
  textStyle(BOLD);
  text("Start the Music!", width / 2, height / 2);
}

// ========= PRELOAD =========
function preload() {
  // Load images "1.png" to "21.png" from the "images/" folder.
  for (let i = 1; i <= numTiles; i++) {
    let img = loadImage(`images/${i}.png`);
    img.myIndex = i; // store image number for logging
    allImages.push(img);
  }
  // Load the background sounds.
  bgSound = loadSound("EtherealCafe.mp3");
  bgSound2 = loadSound("pianomess2.mp3");
}

// ========= SETUP =========
function setup() {
  createCanvas(windowWidth, windowHeight);
  background(32);

  lastInteractionTime = millis();

  // Resize each image by a factor of 4.
  for (let img of allImages) {
    img.resize(img.width / 4, img.height / 4);
  }

  // Randomize the order of images.
  allImages = shuffle(allImages, true);

  // Create FFT.
  fft = new p5.FFT();

  // Determine region size.
  let regW = width / cols;
  let regH = height / rows;

  // Create 21 regions (3 rows x 7 columns).
  for (let i = 0; i < numTiles; i++) {
    let col = i % cols;
    let rowIndex = floor(i / cols);
    let x = col * regW;
    let y = rowIndex * regH;
    let img = getNextImage(); // Each region gets one assigned image.

    // Assign an energy category randomly.
    let energyCat = random(energyCategories);
    console.log(
      "Tile " +
        (i + 1) +
        " : image " +
        img.myIndex +
        " | Energy Category: " +
        energyCat
    );

    let r = new Region(x, y, regW, regH, img);
    r.energyCategory = energyCat;

    // Assign a random activation delay (0 to 10 seconds, in ms)
    r.activationTime = random(0, 10000);
    regions.push(r);
  }

  // Do not start sound automatically; wait for user to click the center overlay.
}

// ========= DRAW =========
function draw() {
  background(32);

  // Check for inactivity.
  if (millis() - lastInteractionTime > 120000) {
    resetSketch();
    return;
  }

  // If music hasn't been started (i.e. no sound playing), show the "Start the Music!" overlay.
  if (!musicStarted && !bgSound.isPlaying()) {
    drawMusicStartControl();
    drawSoundControl();
    return;
  }

  // Draw sound control overlay on top.
  drawSoundControl();

  // Show credits if toggled.
  if (showCredits) {
    drawCredits();
  }

  // Analyze the sound.
  let spectrum = fft.analyze();

  // For each region, check its assigned energy category.
  for (let r of regions) {
    let energy = fft.getEnergy(r.energyCategory);
    let toActivate = false;
    if (r.energyCategory == "bass") {
      toActivate = energy > 200;
    } else if (r.energyCategory == "lowMid") {
      toActivate = energy > 187;
    } else if (r.energyCategory == "mid") {
      toActivate = energy > 120;
    } else if (r.energyCategory == "highMid") {
      toActivate = energy > 80;
    } else {
      toActivate = energy > 20;
    }
    if (toActivate) {
      r.activatedUntil = millis() + 300;
    }
    if (debug) {
      console.log(
        "Tile " +
          regions.indexOf(r) +
          " energy cat:" +
          r.energyCategory +
          " energy:" +
          energy +
          " activate? " +
          String(toActivate)
      );
    }
  }

  // Update and draw each region.
  for (let r of regions) {
    if (!r.active && millis() >= r.activationTime) {
      r.active = true;
      r.buffer.background(0);
    }
    r.update();
    r.draw();
  }
}

// ========= REGION CLASS =========
class Region {
  constructor(x, y, w, h, img) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.img = img; // Assigned image (remains constant)
    this.active = false;
    this.activationTime = 0; // Time (ms) when region becomes active
    this.energyCategory = "mid"; // default (will be overwritten in setup)
    this.buffer = createGraphics(w, h);
    this.buffer.background(0);
    this.lastStampTime = 0;
    this.scalar = 0.25;
    this.activatedUntil = 0;
  }

  update() {
    if (this.active) {
      if (millis() - this.lastStampTime > 200) {
        this.lastStampTime = millis();
        let stamp = this.colorize(this.img);
        let xPos = random(-stamp.width, this.w);
        let yPos = random(-stamp.height, this.h);
        this.buffer.image(
          stamp,
          xPos,
          yPos,
          stamp.width * this.scalar,
          stamp.height * this.scalar
        );
        stamp.remove();
      }
    }
  }

  draw() {
    if (millis() < this.activatedUntil) {
      image(this.buffer, this.x, this.y);
    } else {
      fill(0);
      noStroke();
      rect(this.x, this.y, this.w, this.h);
    }
  }

  colorize(img) {
    let pg = createGraphics(img.width, img.height);
    let tintColor = color(random(255), random(255), random(255));
    img.loadPixels();
    for (let y = 0; y < img.height; y++) {
      for (let x = 0; x < img.width; x++) {
        let i = (y * img.width + x) * 4;
        if (img.pixels[i + 3] > 0) {
          pg.set(x, y, tintColor);
        }
      }
    }
    pg.updatePixels();
    return pg;
  }
}

// ========= HELPER: Returns the next image (cycling through allImages)
function getNextImage() {
  let img = allImages[imageIndex];
  imageIndex = (imageIndex + 1) % allImages.length;
  return img;
}

// ========= FULLSCREEN TOGGLE, CREDITS, & SOUND CONTROL (KEYBOARD) =========
function keyPressed() {
  lastInteractionTime = millis();
  if (key === "c" || key === "C") {
    showCredits = !showCredits;
  } else if (key === "f" || key === "F") {
    fullscreen(!fullscreen());
    setTimeout(windowResized, 50);
  }
}

// ========= MOUSE/KEY INTERACTION =========
function mouseMoved() {
  lastInteractionTime = millis();
}
function mousePressed() {
  lastInteractionTime = millis();
  // If music hasn't started, check if mouse is in the central overlay.
  if (!musicStarted && !bgSound.isPlaying()) {
    let rectWidth = width * 0.6;
    let rectHeight = 60;
    let rectX = (width - rectWidth) / 2;
    let rectY = (height - rectHeight) / 2;
    if (
      mouseX >= rectX &&
      mouseX <= rectX + rectWidth &&
      mouseY >= rectY &&
      mouseY <= rectY + rectHeight
    ) {
      musicStarted = true;
      if (soundEnabled) {
        bgSound.loop();
      }
    }
  }

  // Check if mouse is in the sound control area (bottom left).
  let controlW = 120;
  let controlH = 30;
  let controlX = 10;
  let controlY = height - controlH - 10;
  if (
    mouseX >= controlX &&
    mouseX <= controlX + controlW &&
    mouseY >= controlY &&
    mouseY <= controlY + controlH
  ) {
    soundEnabled = !soundEnabled;
    if (soundEnabled) {
      bgSound.loop();
    } else {
      bgSound.stop();
      bgSound2.stop();
    }
  }
}

// ========= WINDOW RESIZED =========
function windowResized() {
  let oldW = width;
  let oldH = height;
  resizeCanvas(windowWidth, windowHeight);
  background(32);

  let newRegW = windowWidth / cols;
  let newRegH = windowHeight / rows;

  for (let i = 0; i < regions.length; i++) {
    let r = regions[i];
    let col = i % cols;
    let rowIndex = floor(i / cols);
    r.x = col * newRegW;
    r.y = rowIndex * newRegH;
    r.w = newRegW;
    r.h = newRegH;

    let oldBuffer = r.buffer;
    r.buffer = createGraphics(newRegW, newRegH);
    r.buffer.background(32);
    r.buffer.image(oldBuffer, 0, 0, newRegW, newRegH);
  }
}

// ========= RESET SKETCH =========
function resetSketch() {
  bgSound.stop();
  bgSound2.stop();

  regions = [];
  imageIndex = 0;
  lastInteractionTime = millis();
  allImages = shuffle(allImages, true);

  let regW = width / cols;
  let regH = height / rows;

  for (let i = 0; i < numTiles; i++) {
    let col = i % cols;
    let rowIndex = floor(i / cols);
    let x = col * regW;
    let y = rowIndex * regH;
    let img = getNextImage();
    let energyCat = random(energyCategories);
    console.log(
      "RESET: Tile " +
        (i + 1) +
        " : image " +
        img.myIndex +
        " | Energy Category: " +
        energyCat
    );
    let r = new Region(x, y, regW, regH, img);
    r.energyCategory = energyCat;
    r.activationTime = random(0, 10000);
    regions.push(r);
  }

  if (soundEnabled) {
    bgSound.loop();
  }
  musicStarted = false;
}
