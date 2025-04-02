// Configuration
const config = {
  notes: {
    a: 261.63,
    w: 277.18,
    s: 293.66,
    e: 311.13,
    d: 329.63,
    f: 349.23,
    t: 369.99,
    g: 392.0,
    y: 415.3,
    h: 440.0,
    u: 466.16,
    j: 493.88,
    k: 523.25,
    o: 554.37,
    l: 587.33,
  },
  oscModes: ["sine", "square", "sawtooth", "triangle"],
  maxFlowers: 30,
  blood: {
    dropRate: 0.1,
    maxThickness: 155,
    minThickness: 35,
  },
  eerie: {
    baseFreq: 210,
    lfoFreq: 0.3,
    filterFreq: 500,
  },
};

// Application State
let state = {
  oscillators: {},
  flowers: [],
  bloodDrops: [],
  bloodStains: [],
  keyPressTimes: {},
  bloodCoverage: 0,
  currentOscMode: "sine",
  audioStarted: false,
  bloodStarted: false,
  eerieSound: null,
  lfo: null,
  filter: null,
  gain: null,
};

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100);
  angleMode(DEGREES);

  // Initialize audio system
  try {
    state.eerieSound = new p5.Oscillator("sawtooth");
    state.lfo = new p5.Oscillator("sine");
    state.filter = new p5.BandPass();
    state.gain = new p5.Gain();

    // Configure audio routing
    state.eerieSound.disconnect();
    state.lfo.disconnect();
    state.filter.disconnect();
    state.gain.disconnect();

    state.eerieSound.connect(state.filter);
    state.filter.connect(state.gain);
    state.gain.connect(p5.soundOut);

    // Setup modulation
    state.lfo.amp(100);
    state.lfo.freq(config.eerie.lfoFreq);
    state.lfo.connect(state.filter.freq);

    // Initial values
    state.eerieSound.amp(0);
    state.eerieSound.freq(config.eerie.baseFreq);
    state.filter.freq(config.eerie.filterFreq);
    state.filter.res(8);
    state.gain.amp(0.7);
  } catch (error) {
    console.error("Audio initialization error:", error);
  }
}

function draw() {
  background(0);

  if (state.bloodStarted) {
    updateBloodSystem();
    updateEerieSound();
  }

  drawFlowerSystem();
  drawBloodSystem();
  drawUI();
}

function updateBloodSystem() {
  if (random() < config.blood.dropRate && state.bloodCoverage < 100) {
    state.bloodDrops.push({
      x: random(width),
      y: 0,
      thickness: random(config.blood.minThickness, config.blood.maxThickness),
      speed: random(0.1, 0.6),
    });
  }

  for (let i = state.bloodDrops.length - 1; i >= 0; i--) {
    const drop = state.bloodDrops[i];
    drop.y += drop.speed;

    if (drop.y > height) {
      state.bloodStains.push({ x: drop.x, thickness: drop.thickness });
      state.bloodDrops.splice(i, 1);
    }
  }

  let coverage = state.bloodStains.reduce(
    (acc, stain) => acc + stain.thickness * height,
    0
  );

  state.bloodDrops.forEach((drop) => (coverage += drop.thickness * drop.y));

  state.bloodCoverage = min((coverage / (width * height)) * 10, 100);

  // Update the volume of active notes based on blood coverage
  updateNoteVolumes();
}

function updateNoteVolumes() {
  for (const key in state.oscillators) {
    if (state.oscillators[key]) {
      // Calculate volume based on blood coverage
      let volume = map(state.bloodCoverage, 50, 100, 0.8, 0); // Full volume at 50%, muted at 100%
      volume = constrain(volume, 0, 0.8); // Ensure volume stays within valid range

      // Set the new volume
      state.oscillators[key].amp(volume, 0.1);
    }
  }
}

function drawBloodSystem() {
  stroke(0, 100, 70, 100);

  state.bloodStains.forEach((stain) => {
    strokeWeight(stain.thickness);
    line(stain.x, 0, stain.x, height);
  });

  state.bloodDrops.forEach((drop) => {
    strokeWeight(drop.thickness);
    line(drop.x, 0, drop.x, drop.y);
  });
}

function drawFlowerSystem() {
  for (let i = state.flowers.length - 1; i >= 0; i--) {
    const flower = state.flowers[i];
    flower.opacity -= 0.05;
    flower.rotation += flower.rotationSpeed;

    if (flower.opacity <= 0) {
      state.flowers.splice(i, 1);
    } else {
      drawSingleFlower(flower);
    }
  }
}

function drawSingleFlower(flower) {
  push();
  translate(flower.x, flower.y);

  // Stem
  stroke(130, 80, 60, flower.opacity);
  strokeWeight(2);
  line(0, 0, 0, height - flower.y);

  // Leaves
  stroke(120, 80, 60, flower.opacity);
  fill(120, 50, 70, flower.opacity);
  for (let i = 0.3; i < 0.8; i += 0.4) {
    drawLeaf(-8, (height - flower.y) * i, 45);
    drawLeaf(8, (height - flower.y) * i, -45);
  }

  // Flower head
  push();
  rotate(flower.rotation);
  const petalLength = flower.size * 0.4;
  for (let i = 0; i < flower.petalCount; i++) {
    rotate(360 / flower.petalCount);
    fill(flower.hue, 90, 90, flower.opacity);
    ellipse(0, -petalLength, flower.size * 0.3, petalLength);
  }
  fill((flower.hue + 180) % 360, 90, 90, flower.opacity);
  ellipse(0, 0, flower.size * 0.3, flower.size * 0.3);
  pop();

  pop();
}

function drawLeaf(xOffset, yPos, angle) {
  push();
  translate(xOffset, yPos);
  rotate(angle);
  ellipse(0, 0, 15, 8);
  pop();
}

function updateEerieSound() {
  const volume = map(state.bloodCoverage, 0, 100, 0, 0.9);
  const filterFreq = map(state.bloodCoverage, 0, 100, 150, 2000);

  state.eerieSound.amp(volume, 0.4);
  state.filter.freq(filterFreq);
  state.filter.res(map(state.bloodCoverage, 0, 100, 5, 15));
}

function keyPressed() {
  if (!state.audioStarted) return;

  if (key === "r") {
    resetSystem();
    return;
  }

  if (key >= "1" && key <= "4") {
    state.currentOscMode = config.oscModes[int(key) - 1];
    return;
  }

  if (config.notes[key] && !state.keyPressTimes[key]) {
    state.keyPressTimes[key] = millis();
    startNote(key);
  }
}

function keyReleased() {
  if (!state.audioStarted || key === "r") return;

  if (config.notes[key] && state.keyPressTimes[key]) {
    const duration = millis() - state.keyPressTimes[key];
    createFlower(duration, key);
    releaseNote(key);
    delete state.keyPressTimes[key];
  }
}

function startNote(key) {
  if (!state.oscillators[key]) {
    try {
      const osc = new p5.Oscillator(state.currentOscMode);
      osc.freq(config.notes[key]);

      // Calculate volume based on blood coverage
      let volume = map(state.bloodCoverage, 50, 100, 0.8, 0); // Full volume at 50%, muted at 100%
      volume = constrain(volume, 0, 0.8); // Ensure volume stays within valid range

      osc.amp(volume, 0.1); // Set the volume
      osc.connect(p5.soundOut); // Explicit output connection
      osc.start();
      state.oscillators[key] = osc;
    } catch (error) {
      console.error("Error starting note:", error);
    }
  }
}

function releaseNote(key) {
  if (state.oscillators[key]) {
    state.oscillators[key].amp(0, 0.8);
    addReverbEffect(key);
    scheduleOscCleanup(key);
  }
}

function addReverbEffect(key) {
  const reverb = new p5.Reverb();
  reverb.process(state.oscillators[key], 2, 1.5, true);
}

function scheduleOscCleanup(key) {
  setTimeout(() => {
    if (state.oscillators[key]) {
      state.oscillators[key].stop();
      delete state.oscillators[key];
    }
  }, 800);
}

function createFlower(duration, key) {
  const size = constrain(duration / 2, 20, 300);
  const minFreq = Math.min(...Object.values(config.notes));
  const maxFreq = Math.max(...Object.values(config.notes));
  const hue = map(config.notes[key], minFreq, maxFreq, 30, 330);

  state.flowers.push({
    x: random(width),
    y: random(height / 4, (height * 3) / 4),
    size: size,
    hue: hue,
    opacity: 100,
    petalCount: floor(random(5, 8)),
    rotation: 0,
    rotationSpeed: random(-0.8, 0.8),
  });

  if (state.flowers.length > config.maxFlowers) {
    state.flowers.shift();
  }
}

function resetSystem() {
  state.bloodDrops = [];
  state.bloodStains = [];
  state.bloodCoverage = 0;
  state.eerieSound.amp(0, 0.5);
}

function drawUI() {
  textAlign(CENTER);
  fill(255);
  noStroke();
  textSize(16);

  if (!state.bloodStarted) {
    text("Click to begin", width / 2, height / 2);
  }
  text(
    `Press keys from A to L to play Panio | 1-4: Change Waveforms | R: Reset`,
    width / 2,
    height - 20
  );
}

function mousePressed() {
  if (!state.audioStarted) {
    getAudioContext()
      .resume()
      .then(() => {
        state.eerieSound.start();
        state.lfo.start();
        state.audioStarted = true;
        state.bloodStarted = true;
      })
      .catch((error) => {
        console.error("Audio start failed:", error);
      });
  }

  if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

