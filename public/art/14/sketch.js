let mic;
let fft;
let isFullScreen = false;
let circles = [];
let bgHue = 0;
let frameCounter = 0;
let circleCenterX, circleCenterY; // Μεταβλητές για το κέντρο του κύκλου
let mouseDirectionX = 0; // Κατεύθυνση του ποντικιού στον άξονα Χ
let mouseDirectionY = 0; // Κατεύθυνση του ποντικιού στον άξονα Υ
let lastMouseX, lastMouseY; // Προηγούμενες θέσεις του ποντικιού

function preload() {
  // Δεν χρειάζεται να φορτώσουμε ήχο, αφού θα χρησιμοποιήσουμε το μικρόφωνο
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100);

  // Ρύθμιση του μικροφώνου
  mic = new p5.AudioIn();
  mic.start();

  // Ρύθμιση ανάλυσης συχνοτήτων
  fft = new p5.FFT();
  fft.setInput(mic);

  // Αρχικό κέντρο του κύκλου
  circleCenterX = width / 2;
  circleCenterY = height / 2;

  // Αρχικές τιμές για την κατεύθυνση του ποντικιού
  lastMouseX = mouseX;
  lastMouseY = mouseY;
}

function draw() {
  // Αλλαγή χρώματος φόντου στο HSB
  bgHue = (bgHue + 0.5) % 360;
  background(bgHue, 50, 100);

  // Ανάλυση συχνότητας ήχου από το μικρόφωνο
  let spectrum = fft.analyze();
  let bass = fft.getEnergy(20, 150); // Μπάσος (20-150 Hz)
  let treble = fft.getEnergy(2000, 5000); // Οξύς (2000-5000 Hz)
  let speed = map(bass + treble, 0, 255, 0.1, 1); // Ταχύτητα ανάλογα με τη συχνότητα

  // Υπολογισμός κατεύθυνσης του ποντικιού
  mouseDirectionX = mouseX - lastMouseX;
  mouseDirectionY = mouseY - lastMouseY;
  lastMouseX = mouseX;
  lastMouseY = mouseY;

  // Δημιουργία νέων κύκλων στη θέση του κέρσορα
  if (frameCount % 10 === 0) {
    // Δημιουργεί νέο κύκλο κάθε 10 frames
    let hasColor = mic.getLevel() > 0.1; // Αν υπάρχει ήχος, ο κύκλος θα έχει χρώμα
    circles.push(
      new Circle(mouseX, mouseY, mouseDirectionX, mouseDirectionY, hasColor)
    );
  }

  // Εμφάνιση και ενημέρωση των κύκλων
  for (let i = circles.length - 1; i >= 0; i--) {
    circles[i].update(speed);
    circles[i].display();
    if (circles[i].isOffScreen()) {
      circles.splice(i, 1); // Αφαίρεσε τον κύκλο αν έχει εξαφανιστεί
    }
  }

  // Τρεμούλιασμα του κύκλου αν υπάρχει ήχος
  if (mic.getLevel() > 0.01) {
    circleCenterX += random(-5, 5);
    circleCenterY += random(-5, 5);
  }
}

class Circle {
  constructor(x, y, dirX, dirY, hasColor) {
    this.x = x; // Κέντρο του κύκλου στον άξονα Χ
    this.y = y; // Κέντρο του κύκλου στον άξονα Υ
    this.dirX = dirX; // Κατεύθυνση στον άξονα Χ
    this.dirY = dirY; // Κατεύθυνση στον άξονα Υ
    this.radius = 0; // Ξεκινάει από το κέντρο
    this.maxRadius = random(width, height); // Τυχαίο μέγιστο μέγεθος για κάθε κύκλο
    this.speed = 0;
    this.hasColor = hasColor; // Αν ο κύκλος έχει χρώμα ή είναι μαύρος
  }

  update(speed) {
    this.speed = speed;
    this.radius += this.speed; // Αύξηση της ακτίνας για το "zoom out" εφέ
    this.x += this.dirX * 0.1; // Μετακίνηση του κύκλου ανάλογα με την κατεύθυνση του ποντικιού
    this.y += this.dirY * 0.1;
  }

  display() {
    noFill();
    if (this.hasColor) {
      // Πολύχρωμοι κύκλοι αν υπάρχει ήχος
      stroke(random(360), 100, 100);
    } else {
      // Μαύροι κύκλοι αν δεν υπάρχει ήχος
      stroke(0, 0, 0);
    }
    strokeWeight(2);
    ellipse(this.x, this.y, this.radius * 2); // Σχεδίαση κύκλου
  }

  isOffScreen() {
    // Ελέγχει αν ο κύκλος έχει φτάσει στο μέγιστο μέγεθος
    return this.radius > this.maxRadius;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

