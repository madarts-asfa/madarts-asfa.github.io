// Αντιστοίχιση πλήκτρων σε νότες
let notes = {
  a: "C2",
  b: "D2",
  c: "E2",
  d: "F2",
  e: "G2",
  f: "A2",
  g: "B2",
  h: "C3",
  i: "D3",
  j: "F3",
  k: "G3",
  l: "A3",
  m: "C2",
  n: "D2",
  o: "E2",
  p: "F2",
  q: "G2",
  r: "A2",
  s: "B2",
  t: "C3",
  u: "D3",
  v: "F3",
  w: "G3",
  x: "A3",
  y: "C2",
  z: "D2",
};

let synth; // Oscillator για τον ήχο
let shapes = []; // Λίστα για τα σχήματα
let systems = []; // Λίστα για τα συστήματα
let frames = []; // Λίστα για τα πλαίσια

let shrinkSpeed = 0.001; // Ταχύτητα μείωσης μεγέθους πλαισίου
let env; // Envelope για τον έλεγχο του πλάτους
let lastKeyPressTime = 0; // Χρόνος τελευταίας πληκτρολόγησης
let maxShapeSize = 150; // Μέγιστο μέγεθος σχήματος

let targetFrequency = 0; // Μεταβλητή για ομαλή αλλαγή συχνότητας
let stars = []; // Λίστα για τα αστέρια στο background

function setup() {
  createCanvas(windowWidth, windowHeight);

  // Δημιουργία Oscillator που δεν σταματάει
  synth = new p5.Oscillator("sine"); // Χρήση ημιτονοειδούς κύματος
  synth.start(); // Εκκίνηση Oscillator
  synth.amp(0); // Αρχικά, το πλάτος είναι 0

  // Ρύθμιση Envelope για ομαλότερο ήχο
  env = new p5.Env();
  env.setADSR(0.1, 0.2, 0.5, 0.5); // Attack: 0.1s, Decay: 0.2s, Sustain: 0.5, Release: 0.5s
  env.setRange(1000000, 0.1); // Εύρος πλάτους από 0.5 έως 0

  // Σύνδεση του Oscillator στο audio context
  synth.disconnect(); // Αποσύνδεση πρώτα για αποφυγή σφαλμάτων
  synth.connect(); // Επανασύνδεση

  frames.push({ size: 1.0 }); // Προσθήκη αρχικού πλαισίου

  lastKeyPressTime = millis(); // Αρχικοποίηση χρόνου τελευταίας πληκτρολόγησης

  // Δημιουργία αστεριών για το background
  createStars();
}

function draw() {
  background(0); // Μαύρο φόντο

  // Σχεδίαση αστεριών με αναβοσβήσιμο φως
  for (let star of stars) {
    let brightness = map(sin(frameCount * 0.05 + star.x), -1, 1, 50, 255); // Αναβοσβήσιμο φως
    fill(brightness);
    noStroke();
    ellipse(star.x, star.y, star.size, star.size);
  }

  // Ομαλή αλλαγή συχνότητας
  if (synth.getFreq() !== targetFrequency) {
    let newFrequency = lerp(synth.getFreq(), targetFrequency, 0.1); // Γραμμική παρεμβολή
    synth.freq(newFrequency); // Ενημέρωση συχνότητας
  }

  // Ενημέρωση και σχεδίαση πλαισίων
  for (let i = systems.length - 1; i >= 0; i--) {
    let system = systems[i];
    let frame = frames[i];
    let frameWidth = width * frame.size;
    let frameHeight = height * frame.size;
    let frameX = (width - frameWidth) / 2;
    let frameY = (height - frameHeight) / 2;

    // Μείωση μεγέθους πλαισίου
    if (frame.size > 0.001) {
      frame.size -= shrinkSpeed;
    }

    // Έλεγχος αν το πλαισιο έχει φτάσει στο ελάχιστο μέγεθος
    if (frame.size <= 0.001) {
      // Εξαφάνιση όλων των σχημάτων του συστήματος
      for (let shape of system.shapes) {
        let index = shapes.indexOf(shape);
        if (index > -1) {
          shapes.splice(index, 1);
        }
      }
      // Αφαίρεση του συστήματος και του πλαισίου
      systems.splice(i, 1);
      frames.splice(i, 1);
      continue;
    }

    // Σχεδίαση πλαισίου
    stroke(31, 97, 141); // Χρώμα πλαισίου
    strokeWeight(5); // Πάχος γραμμής
    noFill();
    rect(frameX, frameY, frameWidth, frameHeight);

    // Ενημέρωση συστημάτων και σχημάτων
    updateSystems(frameX, frameY, frameWidth, frameHeight, i);
  }
  updateShapes(); // Ενημέρωση θέσης και μεγέθους σχημάτων
  drawLines(); // Σχεδίαση γραμμών μεταξύ σχημάτων

  checkForInactiveShapes(); // Έλεγχος για ανενεργά σχήματα
}

function createStars() {
  stars = []; // Εκκαθάριση παλιών αστεριών
  for (let i = 0; i < 200; i++) {
    stars.push({
      x: random(width),
      y: random(height),
      size: random(1, 3),
      brightness: random(100, 255),
    });
  }
}

function keyPressed() {
  // Αν το πλήκτρο είναι μεταξύ 'a' και 'z'
  if (key >= "a" && key <= "z") {
    playNoteForKey(key); // Παίξε νότα
    createRandomShape(); // Δημιούργησε τυχαίο σχήμα
    lastKeyPressTime = millis(); // Ενημέρωση χρόνου τελευταίας πληκτρολόγησης
  }
}

function keyReleased() {
  env.triggerRelease(); // Ενεργοποίηση release phase
}

function playNoteForKey(key) {
  let note = notes[key]; // Βρες τη νότα από το πλήκτρο
  let freq = getFrequency(note); // Μετατροπή νότας σε συχνότητα
  targetFrequency = freq; // Ορίζουμε τη νέα συχνότητα
  synth.amp(env); // Εφαρμόζουμε το envelope στο πλάτος
  env.triggerAttack(); // Ενεργοποίηση attack phase
}

function createRandomShape() {
  // Δημιουργία τυχαίου σχήματος
  let x = random(width);
  let y = random(height);
  let size = random(50, maxShapeSize);
  let shapeColor = color(random(255), random(255), random(255), 150);
  let shapeType = random([
    "circle",
    "square",
    "triangle",
    "rectangle",
    "polygon",
    "star",
    "rhombus",
  ]);
  let targetX = random(width);
  let targetY = random(height);
  let speed = random(1, 2);

  shapes.push({
    x: x,
    y: y,
    size: size,
    initialSize: size,
    color: shapeColor,
    growing: true,
    targetX: targetX,
    targetY: targetY,
    speed: speed,
    type: shapeType,
    reachedTarget: false,
    angle: 0,
    rotationSpeed: random(-0.01, 0.01),
    velocity: createVector(random(-0.1, 0.1), random(-0.1, 0.1)),
    assignedToSystem: false,
    lightIntensity: 0, // Ένταση φωτός για το σχήμα
  });
}

function updateShapes() {
  for (let shape of shapes) {
    if (shape.growing) {
      shape.size += 8; // Αύξηση μεγέθους
      if (shape.size > maxShapeSize) {
        shape.size = maxShapeSize; // Περιορισμός μεγέθους
      }
    }

    if (!shape.reachedTarget) {
      let dx = shape.targetX - shape.x;
      let dy = shape.targetY - shape.y;

      if (abs(dx) < 0.1 && abs(dy) < 0.1) {
        shape.x = shape.targetX;
        shape.y = shape.targetY;
        shape.reachedTarget = true;
      } else {
        shape.x += dx * 0.07;
        shape.y += dy * 0.07;
      }
    }

    // Εφέ φωτός και σκιάς
    shape.lightIntensity = map(
      sin(frameCount * 0.05 + shape.x),
      -1,
      1,
      50,
      255
    );
    drawShapeWithLight(shape); // Σχεδίαση σχήματος με φως και σκιά
  }

  checkForNewSystem(); // Έλεγχος για δημιουργία νέου συστήματος
}

function drawShapeWithLight(shape) {
  push();
  translate(shape.x, shape.y);
  rotate(shape.angle);

  // Σκιά
  drawingContext.shadowBlur = 20;
  drawingContext.shadowColor = color(
    shape.color.levels[0],
    shape.color.levels[1],
    shape.color.levels[2],
    100
  );

  // Φως
  fill(
    shape.color.levels[0],
    shape.color.levels[1],
    shape.color.levels[2],
    shape.lightIntensity
  );
  noStroke();

  switch (shape.type) {
    case "circle":
      ellipse(0, 0, shape.size, shape.size);
      break;
    case "square":
      rectMode(CENTER);
      rect(0, 0, shape.size, shape.size);
      break;
    case "triangle":
      triangle(
        0,
        -shape.size / 2,
        -shape.size / 2,
        shape.size / 2,
        shape.size / 2,
        shape.size / 2
      );
      break;
    case "rectangle":
      rectMode(CENTER);
      rect(0, 0, shape.size, shape.size / 2);
      break;
    case "polygon":
      drawPolygon(0, 0, shape.size / 2, 6);
      break;
    case "star":
      drawStar(0, 0, shape.size / 2, shape.size / 4, 5);
      break;
    case "rhombus":
      drawRhombus(0, 0, shape.size, shape.size / 2);
      break;
  }
  pop();
}

function drawLines() {
  for (let system of systems) {
    for (let lineData of system.lines) {
      stroke(255);
      strokeWeight(2);
      line(
        lineData.startShape.x,
        lineData.startShape.y,
        lineData.endShape.x,
        lineData.endShape.y
      );
    }
  }
}

function updateSystems(frameX, frameY, frameWidth, frameHeight, frameIndex) {
  let borderOffset = 10;

  if (frameIndex < systems.length) {
    let system = systems[frameIndex];

    for (let shape of system.shapes) {
      shape.x += shape.velocity.x;
      shape.y += shape.velocity.y;
      shape.angle += shape.rotationSpeed;

      if (shape.x < frameX + borderOffset) {
        shape.x = frameX + borderOffset;
        shape.velocity.x *= -1;
      }
      if (shape.x > frameX + frameWidth - borderOffset) {
        shape.x = frameX + frameWidth - borderOffset;
        shape.velocity.x *= -1;
      }
      if (shape.y < frameY + borderOffset) {
        shape.y = frameY + borderOffset;
        shape.velocity.y *= -1;
      }
      if (shape.y > frameY + frameHeight - borderOffset) {
        shape.y = frameY + frameHeight - borderOffset;
        shape.velocity.y *= -1;
      }
    }

    for (let lineData of system.lines) {
      let shape1 = lineData.startShape;
      let shape2 = lineData.endShape;

      let dx = shape1.x - shape2.x;
      let dy = shape1.y - shape2.y;
      let distance = sqrt(dx * dx + dy * dy);

      if (distance > 100) {
        shape1.velocity.x -= dx * 0.0001;
        shape1.velocity.y -= dy * 0.0001;
        shape2.velocity.x += dx * 0.0001;
        shape2.velocity.y += dy * 0.0001;
      }

      if (distance < 50) {
        shape1.velocity.x += dx * 0.0001;
        shape1.velocity.y += dy * 0.0001;
        shape2.velocity.x -= dx * 0.0001;
        shape2.velocity.y -= dy * 0.0001;
      }
    }
  }
}

function checkForNewSystem() {
  let readyShapes = shapes.filter(
    (shape) => shape.reachedTarget && !shape.assignedToSystem
  );
  if (readyShapes.length >= 4) {
    let newSystem = {
      shapes: readyShapes.slice(-4),
      lines: [],
    };

    for (let shape of newSystem.shapes) {
      shape.assignedToSystem = true;
    }

    for (let i = 0; i < newSystem.shapes.length; i++) {
      let shape1 = newSystem.shapes[i];
      let shape2 = newSystem.shapes[(i + 1) % newSystem.shapes.length];
      newSystem.lines.push({
        startShape: shape1,
        endShape: shape2,
      });
    }

    systems.push(newSystem);
    frames.push({ size: 1.0 });
  }
}

function checkForInactiveShapes() {
  let currentTime = millis();
  let inactiveTime = 10000;

  if (currentTime - lastKeyPressTime > inactiveTime) {
    let readyShapes = shapes.filter(
      (shape) => shape.reachedTarget && !shape.assignedToSystem
    );

    if (readyShapes.length > 0 && readyShapes.length < 4) {
      for (let shape of readyShapes) {
        let index = shapes.indexOf(shape);
        if (index > -1) {
          shapes.splice(index, 1);
        }
      }
    }
  }
}

function drawPolygon(x, y, radius, npoints) {
  let angle = TWO_PI / npoints;
  beginShape();
  for (let a = 0; a < TWO_PI; a += angle) {
    let sx = x + cos(a) * radius;
    let sy = y + sin(a) * radius;
    vertex(sx, sy);
  }
  endShape(CLOSE);
}

function drawStar(x, y, radius1, radius2, npoints) {
  let angle = TWO_PI / npoints;
  let halfAngle = angle / 2.0;
  beginShape();
  for (let a = 0; a < TWO_PI; a += angle) {
    let sx = x + cos(a) * radius2;
    let sy = y + sin(a) * radius2;
    vertex(sx, sy);
    sx = x + cos(a + halfAngle) * radius1;
    sy = y + sin(a + halfAngle) * radius1;
    vertex(sx, sy);
  }
  endShape(CLOSE);
}

function drawRhombus(x, y, width, height) {
  beginShape();
  vertex(x - width / 2, y);
  vertex(x, y - height / 2);
  vertex(x + width / 2, y);
  vertex(x, y + height / 2);
  endShape(CLOSE);
}

function getFrequency(note) {
  let frequencies = {
    C2: 65.41,
    "C#2": 69.3,
    D2: 73.42,
    "D#2": 77.78,
    E2: 82.41,
    F2: 87.31,
    "F#2": 92.5,
    G2: 98.0,
    "G#2": 103.83,
    A2: 110.0,
    "A#2": 116.54,
    B2: 123.47,
    C3: 130.81,
    "C#3": 138.59,
    D3: 146.83,
    "D#3": 155.56,
    E3: 164.81,
    F3: 174.61,
    "F#3": 185.0,
    G3: 196.0,
    "G#3": 207.65,
    A3: 220.0,
    "A#3": 233.08,
    B3: 246.94,
  };
  return frequencies[note] || 65.41; // Επιστροφή συχνότητας ή προεπιλεγμένης τιμής
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight); // Αυτόματη προσαρμογή μεγέθους canvas
  createStars(); // Δημιουργία νέων αστεριών για το νέο μέγεθος canvas
}

