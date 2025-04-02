let mainColors = {};
let frames = [];
let lastFrameTime = 0;
let startTime;
let shapeChangeStartTime = null;
let sound1, sound2;
let zoomScale = 1;
let zoomSpeed = 0.01;
let zoomStarted = false;
let reverseZoomStarted = false;
let organicScale = 1;
let dotDiameter = 0.8;
let noiseOffset = 0;
let message = "𓉸";
let messageSize = 15;
let framesToRotate = 0;
let sound2Duration = 83000;
let sound2StartTime = 0;
let sound2IsPlaying = false;
let organicDisappearedTime = null;

function preload() {
  sound1 = loadSound("move.mp3");
  sound2 = loadSound("move.mp3");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100);
  mainColors = generateRandomColors(5);
  startTime = millis();

  sound1.setVolume(0.5);
  sound2.setVolume(0.5);

  sound2.onended = function () {
    sound2IsPlaying = false;
  };
}

function draw() {
  background(10);

  // Κύριο zoom
  translate(width / 2, height / 2);
  scale(zoomScale);
  translate(-width / 2, -height / 2);

  // Σχεδίαση frames
  drawFrame(width, height, mainColors, 0);
  for (let frame of frames) {
    drawFrame(frame.w, frame.h, frame.colors, frame.rotation);
  }

  // Σχεδίαση οργανικού σχήματος
  if (organicScale > 0.01) {
    push();
    translate(width / 2, height / 2);
    scale(organicScale);
    translate(-width / 2, -height / 2);
    drawOrganicShape();
    pop();
  }

  // Μήνυμα
  drawMessage();

  // Δημιουργία νέου frame κάθε 0.5 δευτερόλεπτα
  if (millis() - lastFrameTime > 500) {
    let lastFrameHeight =
      frames.length > 0 ? frames[frames.length - 1].h : height;
    if (lastFrameHeight > dotDiameter + 1) {
      let newW = frames.length > 0 ? frames[frames.length - 1].w * 0.9 : width;
      let newH = frames.length > 0 ? frames[frames.length - 1].h * 0.9 : height;
      let newFrame = {
        w: newW,
        h: newH,
        colors: generateRandomColors(5, random(0.005, 0.02)),
        rotation: 0,
        rotationSpeed: 0,
      };
      frames.push(newFrame);
      lastFrameTime = millis();
      playSound(newFrame.colors);
    }
  }

  // Ενημέρωση χρωμάτων
  updateColors(mainColors);
  for (let frame of frames) {
    updateColors(frame.colors);
    frame.rotation += frame.rotationSpeed;
  }

  // Έναρξη zoom όταν αρχίζει η αλλαγή σχήματος
  if (shapeChangeStartTime !== null && !zoomStarted) {
    zoomStarted = true;
    sound2StartTime = millis();
    sound1.stop();
    if (!sound2IsPlaying) {
      sound2.play();
      sound2IsPlaying = true;
    }
  }

  // Σταμάτημα zoom 20 δευτερόλεπτα πριν τελειώσει ο ήχος
  if (zoomStarted && sound2IsPlaying) {
    let sound2CurrentTime = millis() - sound2StartTime;
    if (sound2CurrentTime > 63000) {
      zoomSpeed = 0;
      if (!reverseZoomStarted) {
        reverseZoomStarted = true;
      }
    } else {
      zoomScale += zoomSpeed;
    }
  }

  // Αντιστροφικό zoom για το οργανικό σχήμα
  if (reverseZoomStarted && organicScale > 0) {
    organicScale -= 0.001;
    if (organicScale <= 0.01) {
      organicScale = 0;
      if (organicDisappearedTime === null) {
        organicDisappearedTime = millis();
      }
    }
  }

  // Restart μετά από 2 δευτερόλεπτα
  if (
    organicDisappearedTime !== null &&
    millis() - organicDisappearedTime > 4000
  ) {
    restartSketch();
  }

  // Αλλαγή σχήματος
  if (frames.length > 0 && millis() - lastFrameTime > 500) {
    if (shapeChangeStartTime === null) {
      shapeChangeStartTime = millis();
    }

    let elapsedTime = millis() - shapeChangeStartTime;
    let framesChanged = min(Math.floor(elapsedTime / 100), frames.length);

    for (let i = frames.length - 1; i >= frames.length - framesChanged; i--) {
      if (frames[i].rotationSpeed === 0) {
        frames[i].rotationSpeed = -0.05;
      }
    }
  }
}

function restartSketch() {
  mainColors = generateRandomColors(5);
  frames = [];
  lastFrameTime = 0;
  startTime = millis();
  shapeChangeStartTime = null;
  zoomScale = 1;
  zoomSpeed = 0.01;
  zoomStarted = false;
  reverseZoomStarted = false;
  organicScale = 1;
  organicDisappearedTime = null;

  sound1.stop();
  sound2.stop();
  sound2IsPlaying = false;
}

function drawFrame(w, h, colorObj, rotation) {
  let c = lerpColor(
    colorObj.colors[colorObj.currentColorIndex],
    colorObj.colors[colorObj.nextColorIndex],
    colorObj.transitionProgress
  );
  fill(c);
  noStroke();
  rectMode(CENTER);
  drawingContext.shadowBlur = 50;
  drawingContext.shadowColor = color(255, 255, 255, 40);
  push();
  translate(width / 2, height / 2);
  rotate(rotation);
  rect(0, 0, w * zoomScale, h * zoomScale);
  pop();
  drawingContext.shadowBlur = 0;
}

function updateColors(colorObj) {
  colorObj.transitionProgress += colorObj.transitionSpeed;
  if (colorObj.transitionProgress >= 1) {
    colorObj.transitionProgress = 0;
    colorObj.currentColorIndex = colorObj.nextColorIndex;
    colorObj.nextColorIndex =
      (colorObj.nextColorIndex + 1) % colorObj.colors.length;
  }
}

function generateRandomColors(numColors, speed = 0.01) {
  let colors = [];
  let palette = [
    color(220, 75, 20),
    color(280, 75, 20),
    color(0, 0, 10),
    color(200, 75, 30),
    color(240, 75, 25),
  ];
  for (let i = 0; i < numColors; i++) {
    colors.push(palette[floor(random(palette.length))]);
  }
  return {
    colors: colors,
    currentColorIndex: 0,
    nextColorIndex: 1,
    transitionProgress: 0,
    transitionSpeed: speed,
  };
}

function drawOrganicShape() {
  fill(255, 255, 255, 200);
  noStroke();
  drawingContext.shadowBlur = 10;
  drawingContext.shadowColor = color(255, 255, 255, 80);
  beginShape();
  for (let angle = 0; angle < TWO_PI; angle += 0.1) {
    let r = map(
      noise(cos(angle) * 2, sin(angle) * 2, noiseOffset),
      0,
      1,
      -20,
      20
    );
    let radius = (dotDiameter * zoomScale) / 2 + r;
    let x = width / 2 + radius * cos(angle);
    let y = height / 2 + radius * sin(angle);
    vertex(x, y);
  }
  endShape(CLOSE);
  noiseOffset += 0.02;
  drawingContext.shadowBlur = 0;
}

function drawMessage() {
  if (message === "") return;
  push();
  blendMode(SCREEN);
  drawingContext.shadowBlur = 50;
  drawingContext.shadowColor = color(255, 255, 255, 255);
  fill(255);
  noStroke();
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  let currentSize = min(
    messageSize * zoomScale * 1.5,
    ((dotDiameter * zoomScale) / 2) * 0.75
  );
  textSize(currentSize);
  text(message, width / 2, height / 2);
  blendMode(BLEND);
  drawingContext.shadowBlur = 0;
  pop();
}

function playSound(colors) {
  if (colors?.colors?.length > 0) {
    let hueValue = hue(colors.colors[0]);
    sound1.setVolume(0.5);
    sound1.rate(map(hueValue, 0, 360, 0.5, 1.5));
    sound1.play();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

