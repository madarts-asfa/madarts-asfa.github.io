let faceApi, detections = [];
let video, canvas;
let soundAngry, soundFear, soundNeutral, soundSurprise, soundDisgusting, soundHappy, soundSad;
let emotionList = ['neutral', 'happy', 'angry', 'sad', 'disgusted', 'surprised', 'fearful'];
let soundMap = {};
let bgColors = {};
let apiReady = false;
let startTime;

let fallingEmojis = [];
let landedEmojis = [];
// New emoji sizes: 80% of previous values
let emojiRadius = 8;       // was 10
let emojiTextSize = 32;    // was 40

// Alternative emojis for each emotion:
let emojiMap = {
  angry:    ["😠", "💢", "👿", "🤬"],
  fearful:  ["😨", "💀", "🧟", "🩸"],
  neutral:  ["😐", "🍁", "☕", "🍞"],
  surprised:["😯", "🙊", "🐙", "🥷"],
  disgusted:["🤢", "🦨", "🐷", "💨"],
  happy:    ["☺️", "🏖️", "🐮", "😈"],
  sad:      ["😔", "💔", "💧", "🤦‍♀️"]
};

// Synonyms for each emotion (multiple languages)
let synonymsMap = {
  angry:    ["angry", "furious", "irate", "enraged", "mad", "cross", "en colère", "fâchée", "θυμωμένος", "enojado", "wütend", "arrabbiato", "生气", "愤怒", "怒っている", "激怒", "غاضب", "गुस्सा", "क्रोधित"],
  fearful:  ["fearful", "scared", "frightened", "terrified", "alarmed", "effrayé", "apeuré", "φοβισμένος", "asustado", "ängstlich", "spaventato", "害怕", "恐惧", "怖い", "恐れる", "خائف", "डर", "भयभीत"],
  neutral:  ["neutral", "indifferent", "impartial", "detached", "neutre", "indifférente", "ουδέτερος", "neutro", "gleichgültig", "中立", "محايد", "तटस्थ"],
  surprised:["surprised", "astonished", "amazed", "startled", "surpris", "étonnée", "έκπληκτος", "sorprendido", "überrascht", "stupito", "惊讶", "吃惊", "驚いた", "びっくり", "مندهش", "आश्चर्यचकित"],
  disgusted:["disgusted", "repulsed", "revolted", "nauseated", "dégoûtée", "αηδιασμένος", "asqueado", "angeekelt", "disgustato", "厌恶", "嫌悪", "むかつく", "مشمئز", "घृणा", "नफरत"],
  happy:    ["happy", "joyful", "elated", "cheerful", "content", "heureux", "joyeux", "χαρούμενος", "feliz", "glücklich", "allegro", "快乐", "高兴", "嬉しい", "سعيد", "खुश", "प्रसन्न"],
  sad:      ["sad", "sorrowful", "unhappy", "melancholy", "triste", "λυπημένος", "apenado", "traurig", "infelice", "悲伤", "悲しい", "حزين", "उदास", "दुखी"]
};

let poppedWords = []; // For floating synonym words

// To handle responsive repositioning when fullscreen toggles:
let oldCanvasWidth, oldCanvasHeight;

// Global variable to track the last time an emotion was detected (any value > 0)
// Do not initialize here!
let lastDetectionTime;

function preload() {
  soundAngry = loadSound('sounds/angry.mp3');
  soundFear = loadSound('sounds/fear.mp3');
  soundNeutral = loadSound('sounds/neutral.mp3');
  soundSurprise = loadSound('sounds/surprise.mp3');
  soundDisgusting = loadSound('sounds/disgusted.mp3');
  soundHappy = loadSound('sounds/happy.mp3');
  soundSad = loadSound('sounds/sad.mp3');
}

function setup() {
  canvas = createCanvas(windowWidth, windowHeight);
  canvas.id("canvas");
  
  // Use HSB; we define our soft pink for neutral below.
  colorMode(HSB, 360, 100, 100);
  
  // Set initial background to soft pink.
  // Soft pink: hue 340, low saturation 20, brightness 100.
  bgColors.neutral = color(340, 20, 100);
  
  // Other backgrounds remain unchanged.
  bgColors.angry    = color(0, 50, 100);       // red
  bgColors.fearful  = color(0, 0, 50);          // grey
  bgColors.happy    = color(200, 50, 100);       // sky blue
  bgColors.disgusted= color(120, 50, 100);       // green
  bgColors.sad      = color(240, 50, 50);        // night blue
  bgColors.surprised= color(0, 0, 100);          // white

  video = createCapture(VIDEO);
  video.id("video");
  video.size(width, height);
  video.hide();

  const faceOptions = {
    withLandmarks: true,
    withExpressions: true,
    withDescriptors: true,
    minConfidence: 0.5
  };

  faceApi = ml5.faceApi(video, faceOptions, faceReady);

  soundMap = {
    angry: soundAngry,
    fearful: soundFear,
    neutral: soundNeutral,
    surprised: soundSurprise,
    disgusted: soundDisgusting,
    happy: soundHappy,
    sad: soundSad
  };

  startTime = millis();
  lastDetectionTime = millis();  // Initialize after millis() is available.
  oldCanvasWidth = width;
  oldCanvasHeight = height;
}

function faceReady() {
  apiReady = true;
  faceApi.detect(gotFaces);
}

function gotFaces(error, result) {
  if (error) {
    console.log(error);
    return;
  }
  detections = result;
  faceApi.detect(gotFaces);
}

function resetEverything() {
  // Clear all animation arrays.
  fallingEmojis = [];
  landedEmojis = [];
  poppedWords = [];
  
  // Stop all sounds.
  emotionList.forEach(em => {
    let snd = soundMap[em];
    if (snd.isPlaying()) snd.stop();
  });
  
  // Reset the last detection time.
  lastDetectionTime = millis();
  
  // Optionally, reset startTime if you want to replay waiting text (comment out if not needed)
  // startTime = millis();
  
  console.log("Reset due to inactivity.");
}

function draw() {
  // For the first 10 seconds, show waiting text on soft pink background.
  if (millis() - startTime < 10000) {
    background(bgColors.neutral);
    fill(0);
    textAlign(CENTER, CENTER);
    textSize(20);
    text("The Empathy Automaton Feels What You Feel\nYour Expressive Emotions Fill It Up With Digital Sensations", width / 2, height / 2);
    return;
  }
  
  // Determine background color based on dominant emotion.
  let bgColor = bgColors.neutral;
  let detectionActive = false;
  if (detections.length > 0) {
    let exp = detections[0].expressions;
    let mapping = {
      angry: exp.angry,
      fearful: exp.fearful,
      neutral: exp.neutral,
      happy: exp.happy,
      disgusted: exp.disgusted,
      sad: exp.sad,
      surprised: exp.surprised
    };
    let dominantEmotion = "neutral";
    let maxVal = 0;
    for (let em in mapping) {
      if (mapping[em] > maxVal) {
        maxVal = mapping[em];
        dominantEmotion = em;
      }
      if (mapping[em] > 0) detectionActive = true;
    }
    bgColor = bgColors[dominantEmotion] || bgColors.neutral;
    
    // Log expression percentages.
    console.log({
      neutral: nf(exp.neutral * 100, 2, 2) + "%",
      happy: nf(exp.happy * 100, 2, 2) + "%",
      angry: nf(exp.angry * 100, 2, 2) + "%",
      sad: nf(exp.sad * 100, 2, 2) + "%",
      disgusted: nf(exp.disgusted * 100, 2, 2) + "%",
      surprised: nf(exp.surprised * 100, 2, 2) + "%",
      fear: nf(exp.fearful * 100, 2, 2) + "%"
    });
    
    // Process sounds, spawn falling emojis, and pop words.
    emotionList.forEach(em => {
      let value = exp[em];
      let snd = soundMap[em];
      if (value > 0) {
        if (!snd.isPlaying()) snd.loop();
        snd.setVolume(value);
      } else {
        if (snd.isPlaying()) snd.stop();
      }
      
      // Spawn falling emoji (dropping faster).
      if (random(1) < value) {
        let chosenEmoji = random(emojiMap[em]);
        fallingEmojis.push({
          x: random(emojiRadius, width - emojiRadius),
          y: 0,
          speed: random(5, 8),
          emoji: chosenEmoji
        });
      }
      
      // ---- Word Pop ----
      // Spawn words continuously: at 10% intensity ~2/sec, at 100% ~20/sec.
      if (value > 0) {
        let wordsPerSecond = lerp(2, 20, value);
        let wordsPerFrame = wordsPerSecond / 60; // approx 60fps
        if (random(1) < wordsPerFrame) {
          let synonym = random(synonymsMap[em]);
          // Word size scales from 10px to 40px.
          let wordSize = 10 + 30 * value;
          poppedWords.push({
            x: random(0, width),
            y: random(0, height),
            word: synonym,
            size: wordSize,
            born: millis(),
            lifetime: 1000,
            emotion: em
          });
        }
      }
    });
  } else {
    // If no detections, ensure sounds are stopped and use neutral background.
    emotionList.forEach(em => {
      let snd = soundMap[em];
      if (snd.isPlaying()) snd.stop();
    });
    bgColor = bgColors.neutral;
  }
  
  background(bgColor);
  
  // Update falling emojis with natural accumulation.
  for (let i = fallingEmojis.length - 1; i >= 0; i--) {
    let fe = fallingEmojis[i];
    let newY = fe.y + fe.speed;
    let landingY = newY;
    if (newY >= height - emojiRadius) {
      landingY = height - emojiRadius;
    }
    // Check collisions with landed emojis.
    for (let le of landedEmojis) {
      let d = dist(fe.x, newY, le.x, le.y);
      if (d < 2 * emojiRadius) {
        let dx = abs(fe.x - le.x);
        let possibleY = le.y - sqrt((2 * emojiRadius) ** 2 - dx * dx);
        if (possibleY < landingY) landingY = possibleY;
      }
    }
    if (landingY < newY) {
      fe.y = landingY;
      landedEmojis.push({ x: fe.x, y: fe.y, emoji: fe.emoji });
      fallingEmojis.splice(i, 1);
    } else {
      fe.y = newY;
    }
  }
  
  // Draw falling and landed emojis.
  textSize(emojiTextSize);
  noStroke();
  fill(0);
  fallingEmojis.forEach(fe => {
    text(fe.emoji, fe.x, fe.y);
  });
  landedEmojis.forEach(le => {
    text(le.emoji, le.x, le.y);
  });
  
  // Update and draw popped words.
  for (let i = poppedWords.length - 1; i >= 0; i--) {
    let pw = poppedWords[i];
    let age = millis() - pw.born;
    if (age > pw.lifetime) {
      poppedWords.splice(i, 1);
    } else {
      let alphaVal = map(age, 0, pw.lifetime, 150, 0);
      fill(0, 0, 0, alphaVal);
      textSize(pw.size);
      textAlign(CENTER, CENTER);
      text(pw.word, pw.x, pw.y);
    }
  }
  
  // Draw the video in the upper right corner (200px wide, 150px high)
  image(video, width - 200, 0, 200, 150);
  
  // Check if there's no detection (all expressions at 0) for over 60 seconds.
  if (!detectionActive && millis() - lastDetectionTime > 60000) {
    resetEverything();
  } else if (detectionActive) {
    lastDetectionTime = millis();
  }
}

function keyPressed() {
  if (key === 'F' || key === 'f') {
    fullscreen(!fullscreen());
  }
}

function windowResized() {
  // Capture new dimensions.
  let newW = windowWidth;
  let newH = windowHeight;
  
  // Resize canvas and video.
  resizeCanvas(newW, newH);
  if (video) video.size(newW, newH);
  
  // Reposition falling and landed emojis relative to the new canvas size.
  let xRatio = newW / oldCanvasWidth;
  let yRatio = newH / oldCanvasHeight;
  
  fallingEmojis.forEach(fe => {
    fe.x *= xRatio;
    fe.y *= yRatio;
  });
  landedEmojis.forEach(le => {
    le.x *= xRatio;
    le.y *= yRatio;
  });
  
  oldCanvasWidth = newW;
  oldCanvasHeight = newH;
}
