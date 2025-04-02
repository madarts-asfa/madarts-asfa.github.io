let shapes = [];
let drawingEnabled = true;
let song;
let isPlaying = false;
let startTime;
let bgColor = 0;
let shapeCount = 0;
let rotationSpeed = 0.01;
let fft;
let particleSystem;
let zoom = 1;
let rotationX = 0;
let rotationY = 0;
let targetRotationX = 0;
let targetRotationY = 0;
let easeFactor = 0.1;
let isExploding = false;
let explosionParticles = [];
let isSlowed = false;
let savedFrameCount = 0;
let myFont;

// New variables for background color transition
let targetBgColor;
let currentBgColor = [0, 0, 0];
let colorTransitionSpeed = 0.001;
let lastColorChangeTime = 0;
let colorChangeInterval = 8000; // 8 seconds

let shapeTypes = ["box", "sphere", "torus", "cone", "cylinder", "custom"];
let shapeColors = [
  [255, 0, 100], [0, 255, 100], [100, 0, 255],
  [255, 255, 0], [0, 255, 255], [255, 0, 255]
];

function preload() {
  song = loadSound("Mindtrap_Vlepw_Kyklous.mp3");
  myFont = loadFont('Techno LCD.ttf');
}

function setup() {
  createCanvas(displayWidth, displayHeight, WEBGL); // Use display dimensions
  textFont(myFont);
  colorMode(RGB);
  currentBgColor = [0, 0, 0];
  targetBgColor = getRandomColor();
  startTime = millis();
  lastColorChangeTime = millis();
  
  fft = new p5.FFT();
  song.amp(0.5);
  ambientLight(50);
  particleSystem = new ParticleSystem();
  
  textSize(16);
  textAlign(LEFT, CENTER);
}

function draw() {
  // Update background color transition
  updateBackgroundColor();
  background(currentBgColor[0], currentBgColor[1], currentBgColor[2]);
  
  let spectrum = fft.analyze();
  let energy = isSlowed ? 0 : fft.getEnergy(60, 250);
  let lightIntensity = map(energy, 0, 255, 100, 255);
  
  pointLight(255, 100, 255, 0, -height/2, 500);
  scale(zoom);
  
  rotationX += (targetRotationX - rotationX) * easeFactor;
  rotationY += (targetRotationY - rotationY) * easeFactor;
  rotateX(rotationX);
  rotateY(rotationY);

  // Draw shapes
  for (let i = 0; i < shapes.length; i++) {
    let s = shapes[i];
    
    if (isExploding && !isSlowed) {
      let centerDist = dist(s.x, s.y, width/2, height/2);
      let explosionForce = map(centerDist, 0, width/2, 20, 5);
      let angle = atan2(s.y - height/2, s.x - width/2);
      
      s.x += cos(angle) * explosionForce;
      s.y += sin(angle) * explosionForce;
      s.z += random(-5, 5);
      
      if (s.x < -width || s.x > width*2 || s.y < -height || s.y > height*2) {
        shapes.splice(i, 1);
        i--;
        continue;
      }
    }
    
    push();
    translate(s.x - width/2, s.y - height/2, s.z);
    
    let rotationFactor = map(energy, 0, 255, 0.5, 2);
    let currentFrame = isSlowed ? savedFrameCount : frameCount;
    rotateX(currentFrame * rotationSpeed * rotationFactor);
    rotateY(currentFrame * rotationSpeed * rotationFactor * 0.7);
    
    let sizePulse = 1 + sin(currentFrame * 0.1) * 0.2 * (energy/255);
    let displaySize = s.initialSize * sizePulse;
    
    let shapeColor = color(
      shapeColors[s.typeIndex][0],
      shapeColors[s.typeIndex][1], 
      shapeColors[s.typeIndex][2]
    );
    let glowAmount = map(energy, 0, 255, 50, 200);
    shapeColor = lerpColor(shapeColor, color(255), glowAmount/255);
    emissiveMaterial(shapeColor);
    specularMaterial(shapeColor);
    shininess(100);
    
    if (s.type === "box") box(displaySize);
    else if (s.type === "sphere") sphere(displaySize/2);
    else if (s.type === "torus") torus(displaySize/2, displaySize/4);
    else if (s.type === "cone") cone(displaySize/2, displaySize);
    else if (s.type === "cylinder") cylinder(displaySize/2, displaySize);
    else if (s.type === "custom") drawCustomShape(displaySize);
    
    pop();
  }
  
  if (!isSlowed) {
    particleSystem.update();
  }
  particleSystem.display();
  
  if (!isSlowed) {
    updateExplosionParticles();
  }
  drawInfoBoxes();
}

function updateBackgroundColor() {
  // Check if it's time to increase transition speed
  if (millis() - lastColorChangeTime > colorChangeInterval) {
    colorTransitionSpeed *= 1.5; // Increase speed
    lastColorChangeTime = millis();
  }
  
  // Transition current color toward target color
  for (let i = 0; i < 3; i++) {
    currentBgColor[i] = lerp(currentBgColor[i], targetBgColor[i], colorTransitionSpeed);
    
    // If we're close to the target color, pick a new one
    if (abs(currentBgColor[i] - targetBgColor[i]) < 5) {
      targetBgColor = getRandomColor();
    }
  }
}

function getRandomColor() {
  return [random(50, 200), random(50, 200), random(50, 200)];
}

function triggerExplosion() {
  if (shapes.length === 0 || isSlowed) return;
  
  isExploding = true;
  
  for (let i = 0; i < 500; i++) {
    explosionParticles.push({
      pos: createVector(0, 0, 0),
      vel: p5.Vector.random3D().mult(random(5, 20)),
      life: 255,
      size: random(3, 8),
      color: color(random(255), random(255), random(255))
    });
  }
  
  setTimeout(() => {
    isExploding = false;
    shapeCount = 0;
  }, 2000);
}

function updateExplosionParticles() {
  for (let i = explosionParticles.length - 1; i >= 0; i--) {
    let p = explosionParticles[i];
    p.pos.add(p.vel);
    p.life -= 3;
    
    push();
    translate(p.pos.x, p.pos.y, p.pos.z);
    noStroke();
    p.color.setAlpha(p.life);
    fill(p.color);
    sphere(p.size);
    pop();
    
    if (p.life <= 0) explosionParticles.splice(i, 1);
  }
}

function mouseMoved() {
  targetRotationX = map(mouseY, 0, height, -PI/3, PI/3);
  targetRotationY = map(mouseX, 0, width, -PI/3, PI/3);
}

function mouseWheel(event) {
  zoom += event.delta * -0.001;
  zoom = constrain(zoom, 0.5, 3);
  return false;
}

function mousePressed() {
  if (!drawingEnabled || isExploding || isSlowed) return;

  if (!isPlaying) {
    song.play();
    isPlaying = true;
  }

  let shapeTypeIndex = Math.floor(shapeCount / 10) % shapeTypes.length;
  shapes.push({
    x: mouseX,
    y: mouseY,
    z: random(-100, 100),
    initialSize: random(30, 80),
    type: shapeTypes[shapeTypeIndex],
    typeIndex: shapeTypeIndex
  });
  shapeCount++;
  
  for (let i = 0; i < 50; i++) {
    particleSystem.addParticle(mouseX - width/2, mouseY - height/2, 0);
  }
}

function drawCustomShape(size) {
  beginShape();
  for (let i = 0; i < 10; i++) {
    let angle = TWO_PI * i / 10;
    vertex(
      cos(angle) * size,
      sin(angle) * size,
      sin(angle * 3) * size/3
    );
  }
  endShape(CLOSE);
}

function keyPressed() {
  if (key === " ") {
    if (isSlowed) {
      song.rate(1.0);
      isSlowed = false;
    } else {
      song.rate(0.75);
      savedFrameCount = frameCount;
      isSlowed = true;
    }
    drawingEnabled = !drawingEnabled;
  } 
  else if (key === 'c') shapes = [];
  else if (key === 'b') {
    // Toggle between dark mode and colored mode
    if (currentBgColor[0] < 50) { // If dark
      currentBgColor = getRandomColor();
      targetBgColor = getRandomColor();
    } else {
      currentBgColor = [0, 0, 0];
      targetBgColor = [0, 0, 0];
    }
  }
  else if (key === 'r') {
    shapes = []; // Clear all shapes
    zoom = 1;
    targetRotationX = 0;
    targetRotationY = 0;
    song.rate(1.0);
    isSlowed = false;
    colorTransitionSpeed = 0.001; // Reset color transition speed
  }
  else if (key === 'e' && !isSlowed) triggerExplosion();
  else if (key === 'f') { // Toggle fullscreen

  }
}

function drawInfoBoxes() {
  let elapsedTime = (millis() - startTime) / 1000;
  
  // Save current WEBGL state
  push();
  
  // Switch to 2D rendering for text
  resetMatrix();
  drawingContext.disable(drawingContext.DEPTH_TEST);
  
  // Set orthographic projection for 2D text
  ortho(-width/2, width/2, -height/2, height/2, -1000, 1000);
  
  // Position at screen depth (z = 0)
  translate(0, 0, 0);
  
  // Draw text
  fill(255);
  noStroke();
  textSize(20);
  
  // Center text
  textAlign(CENTER, CENTER);
  text("F: fullscreen | Move & Click | Wheel in & out | E: explode | Space: freeze | R: reset | Dance", 
       0, height/2 - 25);
  
  // Restore WEBGL state
  drawingContext.enable(drawingContext.DEPTH_TEST);
  pop();
}

class ParticleSystem {
  constructor() {
    this.particles = [];
  }
  
  addParticle(x, y, z) {
    this.particles.push({
      pos: createVector(x, y, z),
      vel: p5.Vector.random3D().mult(random(0.5, 2)),
      life: 255,
      size: random(2, 5),
      color: color(random(150, 255), random(150, 255), random(150, 255))
    });
  }
  
  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      let p = this.particles[i];
      p.pos.add(p.vel);
      p.life -= 3;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }
  
  display() {
    for (let p of this.particles) {
      push();
      translate(p.pos.x, p.pos.y, p.pos.z);
      noStroke();
      p.color.setAlpha(p.life);
      fill(p.color);
      sphere(p.size * (p.life/255));
      pop();
    }
  }
}

function windowResized() {
  resizeCanvas(displayWidth, displayHeight);
}

function fullscreenChanged() {
  if (fullscreen()) {
    resizeCanvas(displayWidth, displayHeight);
  } else {
    resizeCanvas(displayWidth, displayHeight);
  }
}