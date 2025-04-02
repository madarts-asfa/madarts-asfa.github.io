let palette = ["#ff0066", "#ffcc00", "#33ccff", "#ff6600", "#ff0033"];
let cpalette;
let plength;

let num = 300; // Περισσότερα σωματιδια για καλύτερο εφέ
let fireworkArrays = []; // Πίνακας για τα πυροτεχνήματα

let age = 90; // Ο χρόνος ζωής των σωματιδίων
let explosionForce = 15; // Δύναμη έκρηξης

// Δημιουργία του context για τον ήχο
let audioContext;
let audioInitialized = false; // Δείκτης για να ελέγξουμε αν ο ήχος έχει αρχικοποιηθεί

let showStartMessage = true; // Σημείο για να δείξουμε το μήνυμα "Press the mouse to start"
let fullscreenRequested = false; // Δείκτης αν έχουμε ζητήσει πλήρη οθόνη

function setup() {
  createCanvas(windowWidth, windowHeight); // Δημιουργία καμβά με το μέγεθος του παραθύρου
  pixelDensity(1);
  noiseSeed(millis());
  background(0);
  noStroke();
  fill(0, 0, 0, 64);
  
  plength = palette.length;
  cpalette = new Array(plength);
  for (let i = 0; i < plength; i++) {
    cpalette[i] = color(palette[i]);
    cpalette[i].setAlpha(228); // Ορίστε την διαφάνεια των χρωμάτων
  }
}

function draw() {
  background(0, 20);  // Σκοτεινό φόντο με ελαφριά ανανέωση για το εφέ των πυροτεχνήματων

  // Εμφανίζουμε το μήνυμα "Press the mouse to start" αν ο χρήστης δεν έχει πατήσει το ποντίκι
  if (showStartMessage) {
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(32);
    text("Press the mouse to start", width / 2, height / 2); // Μήνυμα στο κέντρο
  }

  // Ενημέρωση των σωματιδίων για κάθε πυροτέχνημα
  for (let i = 0; i < fireworkArrays.length; i++) {
    for (let j = 0; j < fireworkArrays[i].length; j++) {
      fireworkArrays[i][j].update();
    }
  }

  // Καθαρισμός των πυροτεχνημάτων που έχουν περάσει τη διάρκεια του 1 δευτερολέπτου
  for (let i = fireworkArrays.length - 1; i >= 0; i--) {
    if (millis() - fireworkArrays[i][0].startTime > 1000) {
      fireworkArrays.splice(i, 1); // Διαγραφή πυροτεχνήματος μετά από 1 δευτερόλεπτο
    }
  }
}

// Σύνδεση των χρωμάτων
function plerp(x) {
  let c1 = cpalette[floor(map(x, 0, 1, 0, plength)) % plength];
  let c2 = cpalette[ceil(map(x, 0, 1, 0, plength)) % plength];
  let frac = fract(map(x, 0, 1, 0, plength));
  return lerpColor(c1, c2, frac);
}

// Κλάση σωματιδίου για τα πυροτεχνήματα
class particle {
  constructor(centerX, centerY, fireworkIndex, startTime) {
    this.pos = createVector(centerX, centerY); // Ξεκινά από το σημείο του κλικ
    this.velocity = createVector(random(-explosionForce, explosionForce), random(-explosionForce, explosionForce)); // Τυχαία ταχύτητα
    this.age = 0; // Ξεκινάει από 0
    this.size = random(3, 6); // Τυχαίο μέγεθος για τα σωματιδίων
    this.fireworkIndex = fireworkIndex;  // Σύνδεση με το πυροτέχνημα για να δημιουργούμε μοναδικό ήχο
    this.startTime = startTime;  // Χρόνος εκκίνησης του πυροτέχνήματος
  }

  update() {
    let elapsedTime = millis() - this.startTime;  // Υπολογισμός του χρόνου που έχει περάσει από την αρχή του πυροτεχνήματος
    
    // Αν έχει περάσει 1 δευτερόλεπτο, σταματάμε την ενημέρωση των σωματιδίων
    if (elapsedTime > 1000) {
      return;
    }

    this.pos.add(this.velocity);  // Ενημέρωση θέσης
    this.velocity.mult(0.98);  // Μείωση ταχύτητας για φυσικό αποτέλεσμα (π.χ., τριβή)
    
    let colorFactor = map(this.age, 0, age, 0, 1); // Ορίζουμε το χρώμα να αλλάζει με την ηλικία
    fill(plerp(colorFactor)); // Χρωματισμός
    noStroke();
    ellipse(this.pos.x, this.pos.y, this.size, this.size); // Σχεδίαση του σωματιδίου
    
    this.age++; // Μείωση της ηλικίας του σωματιδίου
  }
}

// Δημιουργία ήχου έκρηξης (χρησιμοποιώντας white noise)
function createExplosionSound(fireworkIndex, soundDuration) {
  // Δημιουργία θορύβου
  let bufferSize = audioContext.sampleRate * soundDuration; // Χρησιμοποιούμε τη διάρκεια του ήχου
  let buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
  let output = buffer.getChannelData(0);
  
  // Δημιουργία white noise
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1; // Τυχαία τιμή από -1 έως 1
  }
  
  // Δημιουργία του Source από τον ήχο
  let source = audioContext.createBufferSource();
  source.buffer = buffer;
  
  // Ενίσχυση του ήχου με gain (η ένταση θα εξαρτάται από την ηλικία των σωματιδίων)
  let gainNode = audioContext.createGain();
  
  // Αρχική ένταση του ήχου και μείωση της έντασης με την ηλικία των σωματιδίων
  gainNode.gain.setValueAtTime(1, audioContext.currentTime); // Αρχική ένταση
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + soundDuration); // Μείωση έντασης αργά

  // Σύνδεση του source με το gainNode και το audioContext
  source.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  // Εκκίνηση του ήχου
  source.start();
  source.stop(audioContext.currentTime + soundDuration); // Σταματάει μετά από την διάρκεια του ήχου
}

// Δημιουργία ήχου με τυχαία συχνότητα και διάρκεια
function createRandomExplosionSound(delay) {
  let duration = random(0.8, 1.2); // Τυχαία διάρκεια του ήχου (0.8 - 1.2 δευτερόλεπτα)
  let frequency = random(100, 800); // Τυχαία συχνότητα για την έκρηξη (100Hz - 800Hz)
  
  setTimeout(() => {
    let oscillator = audioContext.createOscillator();
    oscillator.type = 'sine';  // Χρησιμοποιούμε κύμα ημιτόνου (sine wave)
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);  // Τυχαία συχνότητα
    
    let gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(1, audioContext.currentTime);  // Αρχική ένταση
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration); // Σταδιακή μείωση έντασης
    
    // Σύνδεση και αναπαραγωγή του ήχου
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  }, delay * 1000);  // Προσθέτουμε καθυστέρηση στον ήχο (σε milliseconds)
}

// Έναρξη πυροτεχνημάτων και αλλαγή fullscreen όταν το ποντίκι πατηθεί
function mousePressed() {
  if (!audioInitialized) {
    // Αρχικοποιούμε το AudioContext μόνο όταν ο χρήστης πατήσει το ποντίκι
    audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Αν το AudioContext είναι σε αναστολή, το ενεργοποιούμε με το resume
    audioContext.resume().then(() => {
      console.log("AudioContext has been resumed");
    }).catch((error) => {
      console.error("Error while resuming AudioContext: ", error);
    });

    audioInitialized = true;  // Σημειώνουμε ότι ο ήχος έχει αρχικοποιηθεί
  }

  let numFireworks = 3; // Πλήθος πυροτεχνημάτων που θέλουμε να δημιουργήσουμε ταυτόχρονα
  let startTime = millis(); // Καταγραφή του χρόνου έναρξης

  // Δημιουργούμε πυροτεχνήματα στο σημείο του κλικ του ποντίκιού
  for (let f = 0; f < numFireworks; f++) {
    let newFirework = [];
    let fireworkSoundDuration = 1; // Διάρκεια ήχου 1 δευτερόλεπτο για κάθε πυροτέχνημα
    
    // Δημιουργία νέων σωματιδίων για το πυροτέχνημα
    for (let i = 0; i < num; i++) {
      newFirework.push(new particle(mouseX, mouseY, f, startTime));  
    }
    
    // Προσθήκη των νέων σωματιδίων στο πίνακα των πυροτεχνημάτων
    fireworkArrays.push(newFirework);
    
    // Δημιουργία του ήχου με τον παλιό και τον τυχαίο ήχο
    createExplosionSound(f, fireworkSoundDuration); // Παλιός ήχος
    // Δημιουργία του τυχαίου ήχου με καθυστέρηση
    createRandomExplosionSound(0.8); // Δημιουργία τυχαίου ήχου με καθυστέρηση 0.8 δευτερόλεπτα
  }

  // Αλλαγή fullscreen όταν πατηθεί το ποντίκι, εάν δεν είναι ήδη σε fullscreen
  if (!fullscreenRequested) {
    // fullscreen(true);
    // fullscreenRequested = true; // Ρύθμιση ότι η πλήρης οθόνη έχει ζητηθεί
  }

  // Κρύβουμε το μήνυμα "Press the mouse to start" μετά το κλικ
  showStartMessage = false;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  background(0);  // Επανεκκίνηση της σκηνής κατά το resize
}

