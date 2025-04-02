let mic;
let cam;
let canvas;
let isFullScreen = false;

function setup() {
  // Δημιουργία canvas
  canvas = createCanvas(windowWidth, windowHeight);

  // Αρχικοποίηση μικροφώνου
  mic = new p5.AudioIn();
  mic.start();

  // Αρχικοποίηση κάμερας
  cam = createCapture(VIDEO);
  cam.size(width, height);
  cam.hide(); // Κρύβει την προεπιλεγμένη εμφάνιση της κάμερας
}

function draw() {
  background(0); // Καθαρίζει το canvas σε κάθε frame

  // Λήψη του επιπέδου έντασης του ήχου
  let vol = mic.getLevel();

  // Εμφάνιση της εικόνας από την κάμερα με mirror effect
  push();
  translate(width, 0); // Μετακινεί την αρχή των αξόνων στο πάνω δεξιά σημείο
  scale(-1, 1); // Αναστρέφει την εικόνα οριζόντια
  image(cam, 0, 0, width, height); // Σχεδιάζει την εικόνα
  pop();

  // Αν η ένταση του ήχου είναι μεγαλύτερη από ένα όριο, κάνε την εικόνα ασπρόμαυρη και πρόσθεσε glitch
  if (vol > 0.01) {
    filter(GRAY); // Κάνε την εικόνα ασπρόμαυρη
    applyGlitchEffect(); // Εφαρμογή του glitch effect
  }
}

function applyGlitchEffect() {
  // Τυχαία μετατόπιση οριζόντιων λωρίδων της εικόνας
  let sliceHeight = 70; // Ύψος κάθε λωρίδας
  for (let y = 0; y < height; y += sliceHeight) {
    if (random() > 0.8) {
      // 20% πιθανότητα να γλιτσάρει μια λωρίδα
      let offsetX = random(-20, 20); // Τυχαία μετατόπιση στον άξονα Χ
      copy(cam, 0, y, width, sliceHeight, offsetX, y, width, sliceHeight);
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  cam.size(width, height);
}

