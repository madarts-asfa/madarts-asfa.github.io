let sound;
let fft;
let isFullScreen = false;
let shapes = [];
let bgHue = 0;
let symmetry = 6; // Αριθμός συμμετριών (π.χ. 6 για εξάγωνο καλειδοσκόπιο)

function preload() {
  // Φόρτωσε τον δικό σου ήχο εδώ
  sound = loadSound("./6f1864d1-ec5e-4963-94e6-e841519b9c0e.mp3"); // Αντικατέστησε με το path του ήχου σου
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100);

  // Ρύθμιση ανάλυσης συχνοτήτων
  fft = new p5.FFT();
  sound.loop();
}

function draw() {
  // Αλλαγή χρώματος φόντου στο HSB
  bgHue = (bgHue + 0.5) % 360;
  background(bgHue, 50, 100);

  // Ανάλυση συχνότητας ήχου
  let spectrum = fft.analyze();
  let bass = fft.getEnergy(20, 150); // Μπάσος (20-150 Hz)
  let treble = fft.getEnergy(2000, 5000); // Οξύς (2000-5000 Hz)
  let speed = map(bass + treble, 0, 255, 0.1, 1); // Ταχύτητα ανάλογα με τη συχνότητα

  // Δημιουργία νέων σχημάτων
  if (frameCount % 10 === 0) {
    // Δημιουργεί νέο σχήμα κάθε 10 frames
    shapes.push(new KaleidoscopeShape());
  }

  // Εμφάνιση και ενημέρωση των σχημάτων
  for (let i = shapes.length - 1; i >= 0; i--) {
    shapes[i].update(speed);
    shapes[i].display();
    if (shapes[i].isOffScreen()) {
      shapes.splice(i, 1); // Αφαίρεσε το σχήμα αν έχει εξαφανιστεί
    }
  }
}

class KaleidoscopeShape {
  constructor() {
    this.radius = 0; // Ξεκινάει από το κέντρο
    this.maxRadius = random(width, height); // Τυχαίο μέγιστο μέγεθος για κάθε σχήμα
    this.speed = 0;
    this.angle = random(TWO_PI); // Τυχαία γωνία για την αρχή του σχήματος
  }

  update(speed) {
    this.speed = speed;
    this.radius += this.speed; // Αύξηση της ακτίνας για το "zoom out" εφέ
  }

  display() {
    push();
    translate(width / 2, height / 2); // Μετακίνηση στο κέντρο της οθόνης
    for (let i = 0; i < symmetry; i++) {
      rotate(TWO_PI / symmetry); // Περιστροφή για κάθε συμμετρία
      this.drawShape();
    }
    pop();
  }

  drawShape() {
    noFill();
    stroke(0, 0, 0);
    strokeWeight(2);
    let x = this.radius * cos(this.angle);
    let y = this.radius * sin(this.angle);
    triangle(x, y, width, height); // Σχεδίαση ενός κύκλου (μπορείς να αλλάξεις το σχήμα εδώ)
  }

  isOffScreen() {
    // Ελέγχει αν το σχήμα έχει φτάσει στο μέγιστο μέγεθος
    return this.radius > this.maxRadius;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

