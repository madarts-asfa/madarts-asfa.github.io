// === GLOBAL VARIABLES ===
let imgArray = []; // All images loaded from assets
let pieces = []; // Puzzle pieces on screen
let selectedPiece = null;
let dragMode = "none"; // "move" or "rotate"
let offsetX = 0,
  offsetY = 0;
let initialMouseAngle = 0,
  initialRotation = 0;
let pressX, pressY; // For detecting click vs. drag
let dragged = false; // Flag for drag detection

// Flags for help & initial message
let helpVisible = false;
let showInitialMessage = true;

// Plus‑sign spawning variables
let plusSignPressed = false;
let plusSignStartTime = 0;
let lastSpawnTime = 0;
const plusArea = { x1: 10, y1: 10, x2: 50, y2: 50 }; // bounds for plus sign
let spawnIndex; // Next image index for extra pieces

// Sound
let bgSound;

// === PRELOAD ===
function preload() {
  // Load images "1.png" to "34.png" from assets.
  for (let i = 1; i <= 34; i++) {
    let imagename = `assets/${i}.png`;
    imgArray.push(loadImage(imagename));
  }
  bgSound = loadSound("assets/sequoia.mp3");
}

// === SETUP ===
function setup() {
  createCanvas(windowWidth, windowHeight);
  imageMode(CENTER);

  resetCanvas(); // Build initial pieces

  // Request fullscreen by default.

  bgSound.loop();

  // Show initial instructions for 6 seconds.
  setTimeout(() => {
    showInitialMessage = false;
  }, 6000);
}

// Reset the canvas to the initial state.
function resetCanvas() {
  pieces = [];
  for (let i = 0; i < imgArray.length; i++) {
    pieces.push(new PuzzlePiece(imgArray[i]));
  }
  spawnIndex = 0;
  selectedPiece = null;
}

// === DRAW LOOP ===
function draw() {
  // Plain light grey background.
  background(230);

  // --- Repulsion: Make pieces avoid crowding ---
  let separationThreshold = 100;
  for (let i = 0; i < pieces.length; i++) {
    let p = pieces[i];
    if (p === selectedPiece) continue;
    let forceX = 0,
      forceY = 0;
    for (let j = 0; j < pieces.length; j++) {
      if (i === j) continue;
      let other = pieces[j];
      let d = dist(p.x, p.y, other.x, other.y);
      if (d < separationThreshold) {
        let diffX = p.x - other.x;
        let diffY = p.y - other.y;
        let mag = sqrt(diffX * diffX + diffY * diffY);
        if (mag > 0) {
          diffX /= mag;
          diffY /= mag;
        }
        let repulse = (separationThreshold - d) * 0.05;
        forceX += diffX * repulse;
        forceY += diffY * repulse;
      }
    }
    if (p.vx !== undefined && p.vy !== undefined) {
      p.vx += forceX;
      p.vy += forceY;
    } else {
      if (p.swimVX === undefined) {
        p.swimVX = 0;
        p.swimVY = 0;
      }
      p.swimVX += forceX;
      p.swimVY += forceY;
      p.swimVX = constrain(p.swimVX, -1, 1);
      p.swimVY = constrain(p.swimVY, -1, 1);
    }
  }

  // --- Update & Display Pieces ---
  for (let piece of pieces) {
    if (piece.vx !== undefined && piece.vy !== undefined) {
      piece.x += piece.vx;
      piece.y += piece.vy;
      if (piece.x < piece.halfWidth) {
        piece.x = piece.halfWidth;
        piece.vx = abs(piece.vx);
      } else if (piece.x > width - piece.halfWidth) {
        piece.x = width - piece.halfWidth;
        piece.vx = -abs(piece.vx);
      }
      if (piece.y < piece.halfHeight) {
        piece.y = piece.halfHeight;
        piece.vy = abs(piece.vy);
      } else if (piece.y > height - piece.halfHeight) {
        piece.y = height - piece.halfHeight;
        piece.vy = -abs(piece.vy);
      }
      piece.vx *= 0.9;
      piece.vy *= 0.9;
      if (abs(piece.vx) < 0.1 && abs(piece.vy) < 0.1) {
        delete piece.vx;
        delete piece.vy;
      }
    } else if (!piece.activated) {
      if (piece.swimVX === undefined) {
        piece.swimVX = random(-0.5, 0.5);
        piece.swimVY = random(-0.5, 0.5);
      }
      piece.swimVX += map(noise(piece.noiseX), 0, 1, -0.05, 0.05);
      piece.swimVY += map(noise(piece.noiseY), 0, 1, -0.05, 0.05);
      piece.swimVX *= 0.99;
      piece.swimVY *= 0.99;
      piece.x += piece.swimVX;
      piece.y += piece.swimVY;
      if (piece.x < piece.halfWidth || piece.x > width - piece.halfWidth) {
        piece.swimVX *= -1;
        piece.x = constrain(piece.x, piece.halfWidth, width - piece.halfWidth);
      }
      if (piece.y < piece.halfHeight || piece.y > height - piece.halfHeight) {
        piece.swimVY *= -1;
        piece.y = constrain(
          piece.y,
          piece.halfHeight,
          height - piece.halfHeight
        );
      }
      piece.noiseX += 0.01;
      piece.noiseY += 0.01;
      piece.rotation += piece.rotationSpeed;
    }
    piece.display();
  }

  // --- Draw the Plus Sign (upper‑left) ---
  drawPlusSign();

  // --- Spawn New Piece from Plus Sign ---
  if (plusSignPressed) {
    if (
      millis() - plusSignStartTime >= 3000 &&
      millis() - lastSpawnTime >= 500
    ) {
      spawnNewPiece();
      lastSpawnTime = millis();
    }
  }

  // --- Draw Overlays ---
  if (helpVisible) {
    drawHelpMenu();
  } else if (showInitialMessage) {
    drawInitialMessage();
  }

  drawSoundOverlay();
  drawHelpButton();
}

// --- SOUND OVERLAY FUNCTIONS ---
function drawSoundOverlay() {
  let x = 10;
  let y = height - 40;
  let w = 120;
  let h = 30;
  fill(150, 150, 150, 200);
  noStroke();
  rectMode(CORNER);
  rect(x, y, w, h, 5);
  fill(255);
  textSize(14);
  textAlign(LEFT, CENTER);
  let txt = bgSound.isPlaying() ? "Sound: On" : "Sound: Off";
  text(txt, x + 10, y + h / 2);
}

function overSoundOverlay(mx, my) {
  let x = 10;
  let y = height - 40;
  let w = 120;
  let h = 30;
  return mx >= x && mx <= x + w && my >= y && my <= y + h;
}

// --- HELP BUTTON FUNCTIONS ---
function drawHelpButton() {
  let x = 140;
  let y = height - 40;
  let w = 80;
  let h = 30;
  fill(150, 150, 150, 200);
  noStroke();
  rectMode(CORNER);
  rect(x, y, w, h, 5);
  fill(255);
  textSize(14);
  textAlign(LEFT, CENTER);
  text("Help", x + 10, y + h / 2);
}

function overHelpButton(mx, my) {
  let x = 140;
  let y = height - 40;
  let w = 80;
  let h = 30;
  return mx >= x && mx <= x + w && my >= y && my <= y + h;
}

// --- MOUSE & TOUCH INTERACTION ---
function mousePressed() {
  if (overSoundOverlay(mouseX, mouseY)) {
    if (bgSound.isPlaying()) {
      bgSound.pause();
    } else {
      bgSound.loop();
    }
    return;
  }
  if (overHelpButton(mouseX, mouseY)) {
    helpVisible = !helpVisible;
    return;
  }

  if (mouseButton === LEFT) {
    if (overPlusSign(mouseX, mouseY)) {
      plusSignPressed = true;
      plusSignStartTime = millis();
      spawnNewPiece();
      lastSpawnTime = millis();
      return;
    }
    pressX = mouseX;
    pressY = mouseY;
    dragged = false;
    if (selectedPiece && selectedPiece.containsPoint(mouseX, mouseY)) {
      dragMode = "move";
      offsetX = selectedPiece.x - mouseX;
      offsetY = selectedPiece.y - mouseY;
    } else {
      let found = false;
      for (let i = pieces.length - 1; i >= 0; i--) {
        let piece = pieces[i];
        if (piece.containsPoint(mouseX, mouseY)) {
          selectedPiece = piece;
          pieces.splice(i, 1);
          pieces.push(piece);
          dragMode = "move";
          offsetX = piece.x - mouseX;
          offsetY = piece.y - mouseY;
          piece.activated = true;
          piece.justSelected = true;
          found = true;
          break;
        }
      }
      if (!found && selectedPiece) {
        dragMode = "rotate";
        initialMouseAngle = atan2(
          mouseY - selectedPiece.y,
          mouseX - selectedPiece.x
        );
        initialRotation = selectedPiece.rotation;
      }
    }
  } else if (mouseButton === RIGHT) {
    if (selectedPiece) {
      selectedPiece.activated = false;
      selectedPiece.tintIndex = 7; // Reset tint (state 7 is our "base" state)
      selectedPiece = null;
    }
  }
}

function mouseDragged() {
  if (mouseButton === LEFT && selectedPiece) {
    dragged = true;
    if (dragMode === "move") {
      selectedPiece.x = mouseX + offsetX;
      selectedPiece.y = mouseY + offsetY;
    } else if (dragMode === "rotate") {
      let currentAngle = atan2(
        mouseY - selectedPiece.y,
        mouseX - selectedPiece.x
      );
      selectedPiece.rotation =
        initialRotation + (currentAngle - initialMouseAngle);
    }
  }
}

function mouseReleased() {
  if (mouseButton === LEFT) {
    if (plusSignPressed) {
      plusSignPressed = false;
    }
    if (
      !dragged &&
      selectedPiece &&
      selectedPiece.containsPoint(pressX, pressY)
    ) {
      if (selectedPiece.justSelected) {
        selectedPiece.justSelected = false;
      } else {
        // Cycle tint: 9 states (0-8): 0-3 red, 4-7 blue, 8 = reset.
        selectedPiece.tintIndex = (selectedPiece.tintIndex + 1) % 9;
      }
    }
    dragMode = "none";
  }
}

function mouseWheel(event) {
  if (selectedPiece && selectedPiece.containsPoint(mouseX, mouseY)) {
    selectedPiece.scale += -event.delta * 0.001;
    selectedPiece.scale = max(0.1, selectedPiece.scale);
  }
  return false;
}

// --- KEYBOARD & WINDOW RESIZE ---
function keyPressed() {
  if (key === "h" || key === "H") {
    helpVisible = !helpVisible;
  } else if (key === "f" || key === "F") {
    // fullscreen(!fullscreen());
  } else if (key === "r" || key === "R") {
    resetCanvas();
  } else if (keyCode === BACKSPACE || keyCode === DELETE) {
    if (selectedPiece) {
      let index = pieces.indexOf(selectedPiece);
      if (index > -1) {
        pieces.splice(index, 1);
      }
      selectedPiece = null;
    }
  }
}

function windowResized() {
  let oldWidth = width;
  let oldHeight = height;
  resizeCanvas(windowWidth, windowHeight);
  let scaleX = windowWidth / oldWidth;
  let scaleY = windowHeight / oldHeight;
  for (let piece of pieces) {
    piece.x *= scaleX;
    piece.y *= scaleY;
  }
}

// --- HELPER DRAWING FUNCTIONS ---
function drawInitialMessage() {
  // Message at the bottom.
  let msg = "Watch or play. H for help. R to reset.";
  textFont("Arial");
  textStyle(BOLD);
  textSize(16);
  let tw = textWidth(msg);
  let padding = 20;
  let rectW = tw + padding * 2;
  let rectH = 40;
  fill(30, 30, 30, 204);
  noStroke();
  rectMode(CENTER);
  rect(width / 2, height - 50, rectW, rectH, 10);
  fill(240);
  textAlign(CENTER, CENTER);
  text(msg, width / 2, height - 50);

  // Title message in the middle.
  let titleMsg = "Some Assembly Required";
  textSize(32);
  fill(255, 0, 0);
  textAlign(CENTER, CENTER);
  text(titleMsg, width / 2, height / 2);
}

function drawHelpMenu() {
  let helpLines = [
    { label: "Move: ", text: "Left click & drag inside a piece" },
    { label: "Rotate: ", text: "Left click & drag outside a piece" },
    {
      label: "Tint: ",
      text: "After selection, subsequent clicks cycle 4 red, 4 blue & 1 reset",
    },
    { label: "Scale: ", text: "Scroll over a piece" },
    { label: "Free: ", text: "Right click (or double-finger tap) to release" },
    {
      label: "Delete: ",
      text: "Press Backspace/Delete to remove selected piece",
    },
    {
      label: "Plus Sign: ",
      text: "Click plus sign (upper left) to add a piece; hold >3 sec to spawn repeatedly",
    },
    // { label: "F: ", text: "Toggle Fullscreen" },
    { label: "H: ", text: "Show/Hide Help" },
    { label: "R: ", text: "Reset canvas" },
    { label: "Music: ", text: "Sequoia by SalmonLikeTheFish" },
  ];

  let padding = 20;
  let lineHeight = 30;
  textFont("Arial");
  let maxLineWidth = 0;
  for (let line of helpLines) {
    textStyle(BOLD);
    let labelW = textWidth(line.label + " ");
    textStyle(NORMAL);
    let textW = textWidth(line.text);
    maxLineWidth = max(maxLineWidth, labelW + textW);
  }
  let boxW = maxLineWidth + padding * 2;
  let boxH = helpLines.length * lineHeight + padding * 2;

  fill(30, 30, 30, 204);
  noStroke();
  rectMode(CENTER);
  rect(width / 2, height / 2, boxW, boxH, 10);

  let currentY = height / 2 - boxH / 2 + padding;
  for (let line of helpLines) {
    textStyle(BOLD);
    fill(240);
    textAlign(LEFT, CENTER);
    text(line.label, width / 2 - boxW / 2 + padding, currentY);
    textStyle(NORMAL);
    text(
      line.text,
      width / 2 - boxW / 2 + padding + textWidth(line.label + " "),
      currentY
    );
    currentY += lineHeight;
  }
}

function drawPlusSign() {
  let x = 30,
    y = 30,
    size = 40;
  fill(100);
  noStroke();
  rectMode(CENTER);
  rect(x, y, size / 4, size);
  rect(x, y, size, size / 4);
}

function overPlusSign(x, y) {
  return (
    x >= plusArea.x1 && x <= plusArea.x2 && y >= plusArea.y1 && y <= plusArea.y2
  );
}

function spawnNewPiece() {
  let newPiece = new PuzzlePiece(imgArray[spawnIndex]);
  spawnIndex = (spawnIndex + 1) % imgArray.length;
  newPiece.x = 30;
  newPiece.y = 30;
  newPiece.activated = false;
  newPiece.tintIndex = 8; // Reset tint state (8 = base state: no tint)
  newPiece.vx = random(-120, 120);
  newPiece.vy = random(-120, 120);
  pieces.push(newPiece);
}

// --- PUZZLE PIECE CLASS ---
class PuzzlePiece {
  constructor(img) {
    this.img = img;
    this.x = random(width);
    this.y = random(height);
    this.rotation = random(TWO_PI);
    this.scale = 1;
    this.activated = false;
    // Tint index: 0-3: red nuances; 4-7: blue nuances; 8: reset (base state, no tint)
    this.tintIndex = 8;
    this.halfWidth = img.width / 2;
    this.halfHeight = img.height / 2;
    this.noiseX = random(1000);
    this.noiseY = random(1000);
    this.rotationSpeed = random(-0.005, 0.005);
    this.justSelected = false;
  }

  display() {
    push();
    translate(this.x, this.y);
    rotate(this.rotation);
    scale(this.scale);

    // --- Selected Piece Outline (Yellow Halo) ---
    if (this === selectedPiece) {
      push();
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (dx === 0 && dy === 0) continue;
          push();
          translate(dx, dy);
          tint(255, 215, 0); // Golden yellow.
          image(this.img, 0, 0);
          pop();
        }
      }
      pop();
    }

    // --- Tint & Opacity ---
    if (!this.activated) {
      tint(255, 204);
      image(this.img, 0, 0);
    } else {
      if (this.tintIndex < 8) {
        colorMode(HSB, 360, 100, 100);
        if (this.tintIndex < 4) {
          let b = map(this.tintIndex, 0, 3, 60, 90);
          tint(0, 30, b, 100);
        } else {
          let b = map(this.tintIndex, 4, 7, 60, 90);
          tint(220, 30, b, 100);
        }
        colorMode(RGB, 255);
        image(this.img, 0, 0);
      } else {
        noTint();
        image(this.img, 0, 0);
      }
    }
    pop();
  }

  containsPoint(mx, my) {
    let dx = mx - this.x;
    let dy = my - this.y;
    let angle = -this.rotation;
    let localX = dx * cos(angle) - dy * sin(angle);
    let localY = dx * sin(angle) + dy * cos(angle);
    localX /= this.scale;
    localY /= this.scale;
    if (
      localX < -this.halfWidth ||
      localX >= this.halfWidth ||
      localY < -this.halfHeight ||
      localY >= this.halfHeight
    ) {
      return false;
    }
    let imgX = localX + this.halfWidth;
    let imgY = localY + this.halfHeight;
    imgX = floor(constrain(imgX, 0, this.img.width - 1));
    imgY = floor(constrain(imgY, 0, this.img.height - 1));
    let c = this.img.get(imgX, imgY);
    return alpha(c) > 0;
  }
}
