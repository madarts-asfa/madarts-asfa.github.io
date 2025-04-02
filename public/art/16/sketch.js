let bgLerp = 0;
let sound, fft;
let cols, rows;
let scl = 25;
let w = 3000,
  h = 3000;
let terrain = [];
let colorSets,
  currentColorIndex = 0;
let targetColors, currentColors;
let instructions;
let cam,
  lastColorChange = 0;
let hasStarted = false;
let camPos, camLook;
let isCameraTransitioning = false;
let detailScale = 1.5;

let cameraModes = [
  { pos: [0, -200, 300], look: [0, 0, 0] },
  { pos: [250, -120, 350], look: [0, 0, 0] },
  { pos: [-250, -150, 350], look: [0, 0, 0] },
  { pos: [0, -60, 200], look: [0, 0, 0] },
];
let currentCamIndex = 0;
let targetCamPos, targetCamLook;

function preload() {
  sound = loadSound("japan.mp3");
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  colorMode(RGB, 255);
  fft = new p5.FFT(0.8, 128);
  sound.amp(0.5);
  cam = createCamera();

  camPos = [...cameraModes[currentCamIndex].pos];
  camLook = [...cameraModes[currentCamIndex].look];
  cam.setPosition(...camPos);
  cam.lookAt(...camLook);

  adjustDetail();

  instructions = createDiv(
    "Press 'F' for fullscreen | Press 'Spacebar' to play/pause | Press 'C' to change camera"
  );
  instructions.style("color", "rgba(255, 255, 255, 0.4)");
  instructions.style("font-size", "12px");
  instructions.style("font-family", "Arial, sans-serif");
  instructions.style("position", "absolute");
  instructions.style("text-align", "left");
  instructions.style("padding", "10px");
  positionInstructions();

  colorSets = [{ base: color(255), highlight: color(0) }];
  targetColors = colorSets[0];
  currentColors = {
    base: targetColors.base,
    highlight: targetColors.highlight,
  };
}

function adjustDetail() {
  if (windowWidth < 800) detailScale = 2.5;
  else if (windowWidth < 1400) detailScale = 2;
  else detailScale = 1.5;
  scl = 25 * detailScale;
  cols = floor(w / scl);
  rows = floor(h / scl);
  terrain = Array(cols)
    .fill()
    .map(() => Array(rows).fill(0));
}

function positionInstructions() {
  if (instructions) instructions.position(20, windowHeight - 80);
}

function draw() {
  let bass = fft.getEnergy("bass");
  let brightness = map(bass, 0, 255, 255, 0);
  bgLerp = lerp(bgLerp, brightness, 0.02);
  background(bgLerp);

  let spectrum = fft.analyze();
  let energy = fft.getEnergy("bass", "lowMid");
  let dynamicSensitivity = map(energy, 0, 255, 4.0, 8.0);

  if (millis() - lastColorChange > 4000) {
    changeColors();
    lastColorChange = millis();
  }

  currentColors.base = lerpColor(currentColors.base, targetColors.base, 0.05);
  currentColors.highlight = lerpColor(
    currentColors.highlight,
    targetColors.highlight,
    0.05
  );

  animateCameraTransition();
  let treble = fft.getEnergy("treble");
  let mid = fft.getEnergy("mid");
  let flicker = map(sin(frameCount * 0.1), -1, 1, 150, 255);
  let r = map(treble, 0, 255, 100, 255);
  let g = map(mid, 0, 255, 100, 255);
  let b = map(brightness, 0, 255, 100, 255);

  pointLight(flicker, flicker, flicker, cam.eyeX, cam.eyeY, cam.eyeZ);
  ambientLight(80);
  directionalLight(r, g, b, -0.5, -1, -0.3);
  ambientLight(100);
  directionalLight(255, 255, 255, -0.5, -1, -0.3);
  directionalLight(255, 255, 255, 0.5, -1, 0.3);

  push();
  rotateX(PI / 2);
  translate(-w / 6.5, -h / 8);
  if (sound.isPlaying()) generateTerrain(dynamicSensitivity);
  drawDunes();
  pop();

  if (!isCameraTransitioning) {
    cam.pan(sin(frameCount * 0.001) * 0.0005);
    // Restrict to z-axis rotation by removing tilt
  }
}

function animateCameraTransition() {
  if (isCameraTransitioning) {
    camPos = lerpVector(camPos, targetCamPos, 0.08);
    camLook = lerpVector(camLook, targetCamLook, 0.08);
    cam.setPosition(...camPos);
    cam.lookAt(...camLook);
    if (dist(...camPos, ...targetCamPos) < 1) isCameraTransitioning = false;
  }
}

function changeCameraMode() {
  currentCamIndex = (currentCamIndex + 1) % cameraModes.length;
  targetCamPos = [...cameraModes[currentCamIndex].pos];
  targetCamLook = [...cameraModes[currentCamIndex].look];
  isCameraTransitioning = true;
}

function generateTerrain(sensitivity) {
  let spectrum = fft.analyze();
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      let freqIndex = floor(map(y, 0, rows, 0, spectrum.length));
      let freqValue = spectrum[freqIndex] / 255;
      let noiseVal = noise(x * 0.08, y * 0.08, frameCount * 0.01);
      let shapeMod =
        sin(x * 0.03 + frameCount * 0.01) * cos(y * 0.03 + frameCount * 0.01);
      let combined = (noiseVal + shapeMod * 0.7) / 1.7;
      let subtleWiggle = sin(frameCount * 0.005 + x * 0.05 + y * 0.05) * 20;
      let baseHeight =
        map(combined, 0, 1, -350, 350) * freqValue * sensitivity + subtleWiggle;
      terrain[x][y] = baseHeight;
    }
  }
}

function drawDunes() {
  noFill();
  strokeWeight(0.6);
  for (let y = 0; y < rows - 1; y += 2) {
    beginShape(TRIANGLE_STRIP);
    for (let x = 0; x < cols; x++) {
      let val = map(terrain[x][y], -200, 200, 0, 1);
      let blend = 0.5 + 0.5 * sin(x * 0.05 + frameCount * 0.01);
      let invertedBase = color(
        255 - red(currentColors.base),
        255 - green(currentColors.base),
        255 - blue(currentColors.base)
      );
      let invertedHighlight = color(
        255 - red(currentColors.highlight),
        255 - green(currentColors.highlight),
        255 - blue(currentColors.highlight)
      );
      let duneColor = lerpColor(invertedBase, invertedHighlight, val * blend);
      duneColor.setAlpha(map(val, 0, 1, 100, 255));
      stroke(duneColor);
      vertex(x * scl - w / 30, y * scl - h / 8, terrain[x][y]);
      vertex(x * scl - w / 30, (y + 1) * scl - h / 8, terrain[x][y + 1]);
    }
    endShape();
  }
}

function changeColors() {
  currentColorIndex = (currentColorIndex + 1) % colorSets.length;
  targetColors = colorSets[currentColorIndex];
}

function keyPressed() {
  if (key === " ") {
    if (!hasStarted) {
      sound.play();
      hasStarted = true;
    } else {
      if (sound.isPlaying()) sound.pause();
      else sound.play();
    }
  }
  if (key === "c" || key === "C") changeCameraMode();
}

function lerpVector(v1, v2, amt) {
  return [
    lerp(v1[0], v2[0], amt),
    lerp(v1[1], v2[1], amt),
    lerp(v1[2], v2[2], amt),
  ];
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  positionInstructions();
  adjustDetail();
}
