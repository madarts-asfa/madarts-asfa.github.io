let x1 = 200, y1 = 200, speedX1 = -2, speedY1 = 2;
let x2 = 300, y2 = 100, speedX2 = -2.2, speedY2 = 2.2;
let x3 = 350, y3 = 50, speedX3 = -2.5, speedY3 = 2.5;
let x4 = 375, y4 = 25, speedX4 = -2.8, speedY4 = 2.8;

let canvas;
var song;
let noiseOffsetX1, noiseOffsetY1, noiseOffsetX2, noiseOffsetY2, noiseOffsetX3, noiseOffsetY3, noiseOffsetX4, noiseOffsetY4;
let timeElapsed = 0;
let transitionTime = 400; // Χρόνος για μετάβαση στη random κίνηση

let startButton;
let started = false;

function preload() {
  song = loadSound("Tidal Lullaby.mp3");
}

function setup() {
  canvas = createCanvas(windowWidth, windowHeight);
  colorMode(RGB);
  background(20, 20, 50);
  stroke(3);

  // Δημιουργία κουμπιού έναρξης
  startButton = createButton("Click to Start");
  startButton.position(width / 2 - 40, height / 2);
  startButton.mousePressed(startAudio);

  noiseOffsetX1 = random(100);
  noiseOffsetY1 = random(100);
  noiseOffsetX2 = random(100);
  noiseOffsetY2 = random(100);
  noiseOffsetX3 = random(100);
  noiseOffsetY3 = random(100);
  noiseOffsetX4 = random(100);
  noiseOffsetY4 = random(100);
}

// Ξεκινάει ο ήχος όταν ο χρήστης πατήσει το κουμπί
function startAudio() {
  song.loop();
  started = true;
  startButton.remove(); // Αφαιρεί το κουμπί μετά την ενεργοποίηση
}

function draw() {
  if (!started) return; // Δεν τρέχει τίποτα αν δεν έχει πατηθεί το κουμπί

  timeElapsed++;

  let pitch = map(x1, 0, width, 1, 1.5); 
  song.rate(pitch);

  let randomnessFactor = map(timeElapsed, transitionTime, transitionTime * 1.5, 0.5, 2, true); 

  let newPos1 = moveRandomized(x1, y1, speedX1, speedY1, noiseOffsetX1, noiseOffsetY1, 100, randomnessFactor);
  x1 = newPos1.x;
  y1 = newPos1.y;
  speedX1 = newPos1.speedX;
  speedY1 = newPos1.speedY;
  noiseOffsetX1 = newPos1.noiseOffsetX;
  noiseOffsetY1 = newPos1.noiseOffsetY;

  let newPos2 = moveRandomized(x2, y2, speedX2, speedY2, noiseOffsetX2, noiseOffsetY2, 50, randomnessFactor);
  x2 = newPos2.x;
  y2 = newPos2.y;
  speedX2 = newPos2.speedX;
  speedY2 = newPos2.speedY;
  noiseOffsetX2 = newPos2.noiseOffsetX;
  noiseOffsetY2 = newPos2.noiseOffsetY;

  let newPos3 = moveRandomized(x3, y3, speedX3, speedY3, noiseOffsetX3, noiseOffsetY3, 25, randomnessFactor);
  x3 = newPos3.x;
  y3 = newPos3.y;
  speedX3 = newPos3.speedX;
  speedY3 = newPos3.speedY;
  noiseOffsetX3 = newPos3.noiseOffsetX;
  noiseOffsetY3 = newPos3.noiseOffsetY;

  let newPos4 = moveRandomized(x4, y4, speedX4, speedY4, noiseOffsetX4, noiseOffsetY4, 12.5, randomnessFactor);
  x4 = newPos4.x;
  y4 = newPos4.y;
  speedX4 = newPos4.speedX;
  speedY4 = newPos4.speedY;
  noiseOffsetX4 = newPos4.noiseOffsetX;
  noiseOffsetY4 = newPos4.noiseOffsetY;

  fill(map(x1, 0, width, 100, 255), 50, 150, 200);
  circle(x1, y1, 100);

  fill(map(x2, 0, width, 150, 255), 100, 200, 200);
  circle(x2, y2, 50);

  fill(map(x3, 0, width, 200, 255), 150, 250, 200);
  circle(x3, y3, 25);

  fill(map(x4, 0, width, 50, 255), 100, 200, 200);
  circle(x4, y4, 12.5);
}

function moveRandomized(x, y, speedX, speedY, noiseOffsetX, noiseOffsetY, radius, randomnessFactor) {
  if (timeElapsed < transitionTime) {
    x += speedX;
    y += speedY;
  } else {
    let noiseX = (noise(noiseOffsetX) * 2 - 1) * randomnessFactor;
    let noiseY = (noise(noiseOffsetY) * 2 - 1) * randomnessFactor;
    
    x += (speedX + noiseX) * randomnessFactor * 0.5;
    y += (speedY + noiseY) * randomnessFactor * 0.5;
    
    noiseOffsetX += 0.01 * randomnessFactor;
    noiseOffsetY += 0.01 * randomnessFactor;

    if (frameCount % int(200 / randomnessFactor) === 0) { 
      speedX += random(-0.3, 0.3) * randomnessFactor;  
      speedY += random(-0.3, 0.3) * randomnessFactor;
    }
  }

  // Επανεμφάνιση των κύκλων αν βγουν από τα όρια
  if (x > width - radius || x < radius) {
    speedX *= -1;
    x = constrain(x, radius, width - radius);
  }
  if (y > height - radius || y < radius) {
    speedY *= -1;
    y = constrain(y, radius, height - radius);
  }

  let speedLimit = 3;
  speedX = constrain(speedX, -speedLimit, speedLimit);
  speedY = constrain(speedY, -speedLimit, speedLimit);

  return { x, y, speedX, speedY, noiseOffsetX, noiseOffsetY };
}

function keyPressed() {
  // if (key === 'f' || key === 'F') fullscreen(!fullscreen());
}
function mousePressed() {
  // fullscreen(!fullscreen());
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  

}

