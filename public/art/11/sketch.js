// =========================
//       ΠΑΛΕΤΑ ΧΡΩΜΑΤΩΝ
// =========================

// Χρησιμοποιούμε 4 χρώματα από την εικόνα για τα σχήματα
const shapePalette = [
  '#492B8B', // σκούρο μωβ
  '#5B9EE2', // μεσαίο μπλε
  '#C22E96', // έντονο ροζ-μωβ
  '#D765AD'  // ανοιχτό ροζ-μωβ
];

// Δύο χρώματα για το background gradient
let bgColor1 = '#182267';
let bgColor2 = '#19368D';

// =========================
//   ΚΥΡΙΕΣ ΜΕΤΑΒΛΗΤΕΣ
// =========================
let osc, fft, reverb;
let ambientSound, bgImage;
let shapes = [];
let shapeTypes = ['bubble', 'driftwood', 'fish'];
let lastSpawnTime = 0;
let spawnInterval = 800;
let particles = [];
let brush = [];

// Μεταβλητές για το spiral
let mainHue = 280;
let complementaryHue = 420;
let n = 0;
let baseScale = 10;
let spiralRotation = 0.8;
let spiralDisturbance = 0;

// *** Αφαιρέσαμε όλες τις μεταβλητές και κώδικα για την κάμερα ***

// Αστέρια & νεφελώματα
let stars = [];
let nebulaColors = [];
let nebulaNoiseScale = 0.04;

// Offscreen buffer για το background
let bgBuffer;

function preload() {
  ambientSound = loadSound('Space Gina_2.mp3');
  bgImage = loadImage('background.png'); // Δεν χρησιμοποιείται αλλά μπορείς να το κρατήσεις για αργότερα
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  // Χρησιμοποιούμε HSB για κάποια εφέ, αλλά το gradient σχεδιάζεται σε RGB
  colorMode(HSB, 360, 100, 100);
  
  // Δημιουργούμε offscreen buffer με τις διαστάσεις του καμβά
  bgBuffer = createGraphics(width, height);
  bgBuffer.colorMode(HSB, 360, 100, 100);

  // Ξεκινάμε τον ambient ήχο
  userStartAudio();
  ambientSound.loop();
  ambientSound.setVolume(0.8);
  
  // Ξεκινάμε τον oscillator, FFT και reverb
  osc = new p5.Oscillator('sine');
  osc.amp(0);
  osc.start();
  fft = new p5.FFT();
  reverb = new p5.Reverb();
  reverb.process(osc, 3, 2);

  // Δημιουργία αστεριών ώστε να καλύπτουν ολόκληρη την οθόνη
  for (let i = 0; i < 1000; i++) {
    stars.push({
      x: random(width),
      y: random(height),
      size: random(2, 3),
      baseBrightness: random(50, 100),
      twinkleSpeed: random(0.005, 0.02),
      phase: random(TWO_PI)
    });
  }

  // Νεφελώματα
  nebulaColors = [
    color(360, 80, 20, 50),
    color(380, 80, 20, 50),
    color(300, 100, 20, 50)
  ];

  // Πρώτη σχεδίαση του background
  updateBackgroundBuffer();
}

function draw() {
  // Ενημέρωση του background buffer κάθε 30 frames
  if (frameCount % 30 === 0) {
    updateBackgroundBuffer();
  }
  image(bgBuffer, 0, 0);

  // Σύντομες οδηγίες στην οθόνη 
  
  fill(0, 0, 90);
 textSize(20); // μεγαλύτερο μέγεθος κειμένου
textAlign(LEFT, TOP);
let instructions = "Click to interact with sound, shapes and colors.\nUse Arrow keys / Page Up/Down\nto nudge shapes.\n";
text(instructions, 20, 20);
  
  
  // Ρύθμιση ήχου με βάση τη θέση του ποντικιού
  let newFreq = map(mouseX, 0, width, 150, 800);
  osc.freq(newFreq, 0.1);
  
  let mouseSpeed = dist(mouseX, mouseY, pmouseX, pmouseY);
  if (mouseSpeed < 1) {
    osc.amp(0, 0.1);
  } else {
    let newAmp = map(mouseY, 0, height, 0.8, 0.2);
    osc.amp(newAmp, 0.1);
  }
  osc.pan(map(mouseX, 0, width, -1, 1));

  // Ενημέρωση και σχεδίαση της Golden Spiral
  spiralRotation += 0.007;
  let dCenter = dist(mouseX, mouseY, width / 2, height / 2);
  if (dCenter < 150 && mouseIsPressed) {
    spiralDisturbance = min(spiralDisturbance + 0.5, 30);
  }
  spiralDisturbance *= 0.97;

  push();
    translate(width / 2, height / 2);
    rotate(spiralRotation);
    drawGoldenSpiral();
  pop();
  
  // Δημιουργία νέων σχημάτων αν πληρούνται οι συνθήκες
  if (millis() - lastSpawnTime > spawnInterval && shapes.length < 25) {
    let newShape = new OceanicShape(random(width), random(height), random(20, 80), random(shapeTypes));
    shapes.push(newShape);
    lastSpawnTime = millis();
  }

  // Ενημέρωση και σχεδίαση σχημάτων
  for (let shape of shapes) {
    shape.update();
    shape.display();
  }
  
  // Ενημέρωση και σχεδίαση particles
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].display();
    if (particles[i].lifespan <= 0) {
      particles.splice(i, 1);
    }
  }
  
  // Σχεδίαση brush strokes
  for (let i = brush.length - 1; i >= 0; i--) {
    let b = brush[i];
    push();
      colorMode(RGB, 255);
      let c = color(b.colorHex);
      c.setAlpha(255);
      fill(c);
      noStroke();
      ellipse(b.x, b.y, b.size);
    pop();
    b.size *= 0.95;
    if (b.size < 1) {
      brush.splice(i, 1);
    }
  }
  
  // Εφέ κλικ (κύκλος 30px)
  if (mouseIsPressed) {
    fill(mainHue, 100, 100);
    stroke(0);
    strokeWeight(2);
    circle(mouseX, mouseY, 30);
  }
  
  // Πρόσθετα particles βάσει ταχύτητας ποντικιού
  if (mouseIsPressed) {
    let mSpeed = dist(mouseX, mouseY, pmouseX, pmouseY);
    let numParticles = floor(map(mSpeed, 0, 50, 0, 10));
    for (let i = 0; i < numParticles; i++) {
      let p = new Particle(mouseX, mouseY);
      particles.push(p);
    }
  }
}

//
// BACKGROUND BUFFER
//
function updateBackgroundBuffer() {
  bgBuffer.clear();
  
  // Gradient σε RGB για πλήρη κάλυψη της οθόνης
  bgBuffer.colorMode(RGB, 255);
  let c1 = color(bgColor1);
  let c2 = color(bgColor2);
  for (let y = 0; y <= height; y++) {
    let amt = map(y, 0, height, 0, 1);
    let gradCol = lerpColor(c1, c2, amt);
    bgBuffer.stroke(gradCol);
    bgBuffer.line(0, y, width, y);
  }
  
  // Νεφελώματα (με HSB)
  bgBuffer.colorMode(HSB, 360, 100, 100);
  bgBuffer.noStroke();
  for (let x = 0; x <= width; x += 20) {
    for (let y = 0; y <= height; y += 20) {
      let noiseValue = noise(x * nebulaNoiseScale, y * nebulaNoiseScale, frameCount * 0.005);
      let colIndex = floor(map(noiseValue, 0, 1, 0, nebulaColors.length));
      let col = nebulaColors[colIndex];
      col.setAlpha(map(noiseValue, 0, 1, 10, 50));
      bgBuffer.fill(col);
      bgBuffer.ellipse(x, y, 20, 20);
    }
  }
  
  // Αστέρια με εφέ "twinkle"
  for (let star of stars) {
    let twinkle = sin(frameCount * star.twinkleSpeed + star.phase) * 10;
    let currentBrightness = constrain(star.baseBrightness + twinkle, 0, 100);
    bgBuffer.fill(0, 0, currentBrightness);
    bgBuffer.noStroke();
    bgBuffer.ellipse(star.x, star.y, star.size, star.size);
  }
}

//
// GOLDEN SPIRAL
//
function drawGoldenSpiral() {
  for (let i = 0; i < n; i++) {
    let angle = i * PI * 0.618;
    let radius = baseScale * sqrt(i);
    let noiseOffsetX = map(noise(i, frameCount * 0.02), 0, 1, -spiralDisturbance, spiralDisturbance);
    let noiseOffsetY = map(noise(i + 100, frameCount * 0.02), 0, 1, -spiralDisturbance, spiralDisturbance);
    let x = radius * cos(angle) + noiseOffsetX;
    let y = radius * sin(angle) + noiseOffsetY;
    let size = map(sin(frameCount * 0.04 + i * 0.1), -1, 1, 5 + spiralDisturbance, 20 + spiralDisturbance);
    
    colorMode(HSB, 360, 100, 100);
    let col = color(lerp(mainHue, complementaryHue, i / n), 80, 40, 100);
    fill(col);
    noStroke();
    ellipse(x, y, size);
    ellipse(-x, -y, size);
  }
  n += 5;
}

//
// ΚΛΑΣΕΙΣ ΓΙΑ ΣΧΗΜΑΤΑ
//
class OceanicShape {
  constructor(x, y, size, type) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.type = type;
    this.velX = random(-6, 6);
    this.velY = random(-6, 6);
    this.colorHex = random(shapePalette);
    this.trail = [];
    this.changeDirectionInterval = floor(random(30, 120));
    this.directionCounter = 0;
  }
  
  update() {
    this.directionCounter++;
    if (this.directionCounter > this.changeDirectionInterval) {
      this.velX = random(-8, 8);
      this.velY = random(-8, 8);
      this.directionCounter = 0;
      this.changeDirectionInterval = floor(random(30, 120));
    }
    let dMouse = dist(mouseX, mouseY, this.x, this.y);
    if (dMouse < 50) {
      this.velX += random(-8, 8);
      this.velY += random(-8, 8);
    }
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 10) {
      this.trail.shift();
    }
    this.x += this.velX;
    this.y += this.velY;
    if (this.x < 0 || this.x > width) this.velX *= -1;
    if (this.y < 0 || this.y > height) this.velY *= -1;
  }
  
  display() {
    push();
    colorMode(RGB, 255);
    for (let i = 0; i < this.trail.length; i++) {
      let alphaVal = map(i, 0, this.trail.length, 50, 255);
      let c = color(this.colorHex);
      c.setAlpha(alphaVal);
      fill(c);
      noStroke();
      if (this.type === 'bubble') {
        ellipse(this.trail[i].x, this.trail[i].y, this.size * 0.8);
      } else if (this.type === 'driftwood') {
        rect(this.trail[i].x, this.trail[i].y, this.size * 1.2, this.size * 0.4);
      } else if (this.type === 'fish') {
        triangle(
          this.trail[i].x, this.trail[i].y,
          this.trail[i].x - this.size * 0.4, this.trail[i].y + this.size * 0.4,
          this.trail[i].x + this.size * 0.4, this.trail[i].y + this.size * 0.4
        );
      }
    }
    let mainC = color(this.colorHex);
    fill(mainC);
    noStroke();
    if (this.type === 'bubble') {
      ellipse(this.x, this.y, this.size);
    } else if (this.type === 'driftwood') {
      rect(this.x, this.y, this.size * 1.5, this.size * 0.5);
    } else if (this.type === 'fish') {
      triangle(
        this.x, this.y,
        this.x - this.size * 0.5, this.y + this.size * 0.5,
        this.x + this.size * 0.5, this.y + this.size * 0.5
      );
    }
    pop();
  }
}

class Particle {
  constructor(x, y, colHex) {
    this.x = x;
    this.y = y;
    this.size = random(5, 15);
    this.velX = random(-1, 1);
    this.velY = random(-1, 1);
    this.colorHex = colHex ? colHex : random(shapePalette);
    this.lifespan = 255;
  }
  
  update() {
    this.x += this.velX;
    this.y += this.velY;
    this.lifespan -= 5;
  }
  
  display() {
    push();
    colorMode(RGB, 255);
    let c = color(this.colorHex);
    c.setAlpha(this.lifespan);
    fill(c);
    noStroke();
    ellipse(this.x, this.y, this.size);
    pop();
  }
}

//
// INTERACTION EVENTS
//
function mousePressed() {
  // Τυχαία αλλαγή των HSB για το spiral
  mainHue = random(200, 250);
  complementaryHue = random(200, 250);
  
  // Αλλαγή των χρωμάτων των σχημάτων
  for (let shape of shapes) {
    shape.colorHex = random(shapePalette);
  }
  
  // Ενίσχυση σχήματος αν κλικάρουμε πάνω του
  for (let shape of shapes) {
    let d = dist(mouseX, mouseY, shape.x, shape.y);
    if (d < shape.size) {
      shape.velX *= 4;
      shape.velY *= 4;
      particles.push(new Particle(shape.x, shape.y, shape.colorHex));
    }
  }
}

function mouseDragged() {
  let bColHex = random(shapePalette);
  brush.push({
    x: mouseX,
    y: mouseY,
    size: random(10, 30),
    colorHex: bColHex
  });
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  bgBuffer = createGraphics(width, height);
  bgBuffer.colorMode(HSB, 360, 100, 100);
  
  // Επαναδημιουργία αστεριών για τη νέα διάσταση
  stars = [];
  for (let i = 0; i < 1000; i++) {
    stars.push({
      x: random(width),
      y: random(height),
      size: random(2, 3),
      baseBrightness: random(50, 100),
      twinkleSpeed: random(0.005, 0.02),
      phase: random(TWO_PI)
    });
  }
  updateBackgroundBuffer();
}

function doubleClicked() {
}

function keyPressed() {
  // Μετακίνηση όλων των σχημάτων με τα βελάκια & Page Up/Page Down (με αλλαγή 20 pixels)
  if (keyCode === LEFT_ARROW) {
    for (let shape of shapes) {
      shape.x = max(0, shape.x - 20);
    }
  } else if (keyCode === RIGHT_ARROW) {
    for (let shape of shapes) {
      shape.x = min(width, shape.x + 20);
    }
  } else if (keyCode === UP_ARROW || keyCode === 33) { // Up Arrow ή Page Up (33)
    for (let shape of shapes) {
      shape.y = max(0, shape.y - 20);
    }
  } else if (keyCode === DOWN_ARROW || keyCode === 34) { // Down Arrow ή Page Down (34)
    for (let shape of shapes) {
      shape.y = min(height, shape.y + 20);
    }
  } else if (key === 'f' || key === 'F') {
  } else {
    // Εξαγωγή εικόνας και καθάρισμα του canvas
    save("export.png");
    background(0);
  }
}
