let bgLerp = 0;
let sound, fft;
let cols, rows;
let scl = 25;
let w = 3000, h = 3000;
let terrain = [];
let colorSets, currentColorIndex = 0;
let targetColors, currentColors;
let instructions;
let cam, lastColorChange = 0;
let hasStarted = false;
let camPos, camLook;
let isCameraTransitioning = false;
let detailScale = 1.5;


  let cameraModes = [
  { pos: [-250, -150, 350], look: [-100, 0, 0] },
  { pos: [0, -60, 200], look: [0, 0, 0] },
  { pos: [0, -200, 300], look: [0, 0, 0] },
  { pos: [250, -120, 350], look: [0, 0, 0] },
 
];

// let cameraModes = [
//  { pos: [250, -820, 300], look: [0, 0, 0] },
//   { pos: [-250, -620, 350], look: [0, 0, 0] },
//   { pos: [-250, -420, 350], look: [0, 0, 0] },
//   { pos: [0, -320, 200], look: [0, 0, 0] }
// ];

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

  instructions = createDiv("Press 'Spacebar' to play/pause | Press 'C' to change camera");
  instructions.style("color", "rgba(255, 255, 255, 0.4)");
  instructions.style("font-size", "12px");
  instructions.style("font-family", "Arial, sans-serif");
  instructions.style("position", "absolute");
  instructions.style("text-align", "left");
  instructions.style("padding", "10px");
  positionInstructions();

  colorSets = [
    { base: color(255), highlight: color(0) },
    { base: color(30, 30, 80), highlight: color(200, 200, 255) },
    { base: color(90, 0, 40), highlight: color(240, 200, 255) },
    { base: color(0, 50, 30), highlight: color(100, 255, 180) },
    { base: color(100, 50, 0), highlight: color(255, 200, 150) }
  ];

  let startIndex = floor(random(colorSets.length));
targetColors = colorSets[startIndex];
currentColorIndex = startIndex;

  currentColors = { base: targetColors.base, highlight: targetColors.highlight };
}

function adjustDetail() {
  if (windowWidth < 800) detailScale = 2.5;
  else if (windowWidth < 1400) detailScale = 2;
  else detailScale = 1.5;
  scl = 25 * detailScale;
  cols = floor(w / scl);
  rows = floor(h / scl);
  terrain = Array(cols).fill().map(() => Array(rows).fill(0));
}

function positionInstructions() {
  if (instructions) instructions.position(20, windowHeight - 80);
}

function draw() {
  let bass = fft.getEnergy("bass");
  let brightness = map(bass, 0, 200, 255, 30);

 bgLerp = lerp(bgLerp, brightness, 0.05);

  background(bgLerp);
  // background(0);


  let spectrum = fft.analyze();
  let energy = fft.getEnergy("bass", "lowMid");
  let dynamicSensitivity = map(energy, 0, 255, 4.0, 8.0);

  let lowEnergy = fft.getEnergy("lowMid");
  if (millis() - lastColorChange > 6000 && lowEnergy < 100) {
    changeColors();
    lastColorChange = millis();
  }

  currentColors.base = lerpColor(currentColors.base, targetColors.base, 0.05);
  currentColors.highlight = lerpColor(currentColors.highlight, targetColors.highlight, 0.05);

  animateCameraTransition();

  let treble = fft.getEnergy("treble");
  let mid = fft.getEnergy("mid");
  let flicker = map(sin(frameCount * 0.1), -1, 1, 150, 255);
  let r = map(treble, 0, 255, 100, 255);
  let g = map(mid, 0, 255, 100, 255);
  let b = map(brightness, 0, 255, 100, 255);

  // Lights
  pointLight(flicker, flicker, flicker, cam.eyeX, cam.eyeY, cam.eyeZ);
  ambientLight(80);
  directionalLight(r, g, b, -0.5, -1, -0.3);
  ambientLight(100);
  directionalLight(150, 150, 255, -1, -0.6, -0.3);
  directionalLight(255, 255, 255, 0.5, -1, 0.3);

  
  let centralPulse = map(bass, 0, 255, 100, 255);
  pointLight(centralPulse, centralPulse * 0.8, centralPulse * 0.6, 0, -50, 0);

  // Draw dunes
  push();
  rotateX(PI / 2);
  translate(-w / 6.5, -h / 8);
  if (sound.isPlaying()) generateTerrain(dynamicSensitivity);
  drawDunes(brightness);
  pop();

  if (!isCameraTransitioning) {
    cam.pan(sin(frameCount * 0.001) * 0.0005);
  }
  
  setTimeout(() => {
  changeColors();
}, 5000);

}

function drawDunes(bgBrightness) {
  noFill();
  strokeWeight(0.6);

  // Compute contrast based on background
  let brightnessFactor = 2.0;


  for (let y = 0; y < rows - 1; y += 2) {
    beginShape(TRIANGLE_STRIP);
    for (let x = 0; x < cols; x++) {
      let val = map(terrain[x][y], -200, 200, 0, 1);
      let blend = 0.5 + 0.5 * sin(x * 0.05 + frameCount * 0.01);
let duneColor = lerpColor(currentColors.base, currentColors.highlight, val * blend);


      
      let finalR = constrain(red(duneColor) * brightnessFactor, 0, 255);
      let finalG = constrain(green(duneColor) * brightnessFactor, 0, 255);
      let finalB = constrain(blue(duneColor) * brightnessFactor, 0, 255);
stroke(color(finalR, finalG, finalB, 255));



      vertex(x * scl - w / 30, y * scl - h / 8, terrain[x][y]);
      vertex(x * scl - w / 30, (y + 1) * scl - h / 8, terrain[x][y + 1]);
    }
    endShape();
  }
}

function generateTerrain(sensitivity) {
  let spectrum = fft.analyze();
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      let freqIndex = floor(map(y, 0, rows, 0, spectrum.length));
      let freqValue = spectrum[freqIndex] / 255;
      let noiseVal = noise(x * 0.08, y * 0.08, frameCount * 0.01);
      let shapeMod = sin(x * 0.03 + frameCount * 0.01) * cos(y * 0.03 + frameCount * 0.01);
      let combined = (noiseVal + shapeMod * 0.7) / 1.7;
      let subtleWiggle = sin(frameCount * 0.005 + x * 0.05 + y * 0.05) * 20;
   let baseHeight = map(combined, 0, 1, -350, 350) * freqValue * sensitivity + subtleWiggle;

      terrain[x][y] = baseHeight;
    }
  }
}

function changeColors() {
  currentColorIndex = (currentColorIndex + 1) % colorSets.length;
  targetColors = colorSets[currentColorIndex];
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

function keyPressed() {
  if (key === ' ') {
    if (!hasStarted) {
      sound.play();
      hasStarted = true;
    } else {
      if (sound.isPlaying()) sound.pause();
      else sound.play();
    }
  }
  if (key === 'c' || key === 'C') changeCameraMode();
}

function lerpVector(v1, v2, amt) {
  return [
    lerp(v1[0], v2[0], amt),
    lerp(v1[1], v2[1], amt),
    lerp(v1[2], v2[2], amt)
  ];
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  positionInstructions();
  adjustDetail();
}
