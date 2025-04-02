let song;
let amp;
let fft;
let instructions;
let isPlaying = true;

let particles = [];
let prevVol = 0;
let ellipseSize = 2;
let maxEllipseSize = 4000;
let growthRate = 0.003;

function preload() {
    song = loadSound('next.mp3');
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    song.loop();
    amp = new p5.Amplitude();
    amp.smooth(0.1);
    fft = new p5.FFT();
    background(240);

    updateMaxSize();

    instructions = createDiv("Press SPACE to Start/Pause\n");
    instructions.style("color", "black");
    instructions.style("font-size", "10px");
    instructions.style("font-family", "Arial, sans-serif");
    instructions.style("position", "absolute");
    instructions.style("text-align", "left");
    instructions.style("padding", "10px");

    positionInstructions();
}

function positionInstructions() {
    if (instructions) {
        instructions.position(10, windowHeight - 60);
    }
}

function draw() {
  drawRadialGradient();
  drawGlimmeringDust();
  
    if (ellipseSize === 4) {
        background(240);
    }

    background(240, 3);
    filter(BLUR, 3);

    let vol = amp.getLevel();
    vol = pow(vol, 2) * 30;
    let spectrum = fft.analyze();

    fill(0);
    noStroke();
    ellipse(width / 2 + random(-5, 5), height / 2 + random(-5, 5), ellipseSize, ellipseSize);

    for (let i = 0; i < 30; i++) {
        stroke(0, random(50, 150));
        point(random(width), random(height));
    }

    for (let i = 0; i < 100; i++) {
        fill(0, random(30, 80));
        ellipse(random(width), random(height), random(1, 2));
    }

    drawParticles(vol);
    drawAbsorbingEllipse();

    if (ellipseSize >= maxEllipseSize) {
        console.log("Resetting ellipse");
        resetEllipse();
    }
}

function drawParticles(vol) {
    if (vol > prevVol + 0.01) {
        let particleCount = map(vol, 0, 1, 0.1, 4);

        if (vol > 0.4) {
            particleCount *= 0.5;
        }

        for (let i = 0; i < particleCount; i++) {
            let grayShade = random(0, 100);
            let noiseSeed = random(1000);
            let side = floor(random(4));
            let p;

            if (side === 0) {
                p = { x: random(width), y: height + random(50, 150) };
            } else if (side === 1) {
                p = { x: random(width), y: -random(50, 150) };
            } else if (side === 2) {
                p = { x: -random(50, 150), y: random(height) };
            } else {
                p = { x: width + random(50, 150), y: random(height) };
            }

            p.size = random(1, 4);
            p.speed = map(vol, 0, 1, 0.1, 0.2);
            p.col = color(grayShade);
            p.noiseSeed = noiseSeed;

            // 25% of particles will resist absorption
            p.resistant = random(1) < 0.10;

            particles.push(p);
        }
    }
    prevVol = vol;
    updateParticles(vol);
}

function updateParticles(vol) {
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];

        if (p.resistant) {
            p.x += random(-6, 6);
            p.y += random(-6, 6);
        } else {
            let speedFactor = map(vol, 0, 1, 0.01, 0.03);
            let distanceToCenter = dist(p.x, p.y, width / 2, height / 2);
            let damping = map(distanceToCenter, 0, width / 2, 0.5, 1);
            speedFactor *= damping;
            p.x = lerp(p.x, width / 2, speedFactor);
            p.y = lerp(p.y, height / 2, speedFactor);
            p.size = lerp(p.size, 5, 0.1);
            p.col.setAlpha(map(p.y, height, height / 2, 255, 50));
        }

        fill(0);
        stroke(0);
        beginShape();
        for (let angle = 0; angle < TWO_PI; angle += PI / 20) {
            let offset = map(noise(p.noiseSeed + angle, frameCount * 0.005), 0, 1, -10, 12);
            let x = p.x + (p.size / 2 + offset) * cos(angle);
            let y = p.y + (p.size / 2 + offset) * sin(angle);
            vertex(x, y);
        }
        endShape(CLOSE);

        if (!p.resistant && dist(p.x, p.y, width / 2, height / 2) < 10) {
            particles.splice(i, 1);
            if (ellipseSize < maxEllipseSize) {
                ellipseSize += max(growthRate * vol * 0.5, 0.3);
            }
        }
    }
}

function drawRadialGradient() {
    let radius = max(width, height);
    for (let r = radius; r > 0; r -= 5) {
        let alpha = map(r, radius, 0, 0, 80);
        fill(240, alpha);
        noStroke();
        ellipse(width /30, height /30, r, r); //affect of the swirl, width /30, height /30 || width /2*4, height /2*4,width /4, height /4
    }
}
function drawGlimmeringDust() {
    push();
    blendMode(ADD); // Makes light blend more intensely

    noStroke();
    for (let i = 0; i < 200; i++) {
        // Closer to center with slight randomness
        let angle = random(TWO_PI);
        let radius = random(50, width / 2);
        let x = width / 2 + cos(angle) * radius + random(-10, 10);
        let y = height / 2 + sin(angle) * radius + random(-10, 10);

        // Flicker-like brightness
        let flicker = sin(frameCount * 0.1 + i) * 50 + 200;

        // Golden tones
        let r = random(220, 255);
        let g = random(180, 220);
        let b = random(60, 90);
        fill(r, g, b, 12);

        ellipse(x, y, random(0.5, 1.8));
    }

    blendMode(BLEND); // Reset to default
    pop();
}

function drawAbsorbingEllipse() {
    let innerColor = color(0);
    let outerColor = color(0);
    let layers = 5;

    for (let i = 0; i < layers; i++) {
        let t = i / (layers - 1);
        let currentColor = lerpColor(innerColor, outerColor, t);
        noStroke();
        fill(currentColor);
        push();
        translate(width / 2, height / 2);

        let s = map(i, 0, layers - 1, 0.8, 1.0);
        beginShape();
        for (let angle = 0; angle < TWO_PI; angle += PI / 20) {
            let noiseFactor = map(ellipseSize, 0, maxEllipseSize, 1, 2);
            let offset = map(noise(angle, frameCount * 0.01), 0, 1, -20, 20) * noiseFactor;
            let r = ellipseSize / 2 + offset;
            let x = r * cos(angle);
            let y = r * sin(angle);
            vertex(x, y);
        }
        endShape(CLOSE);
        pop();
    }
}



function keyPressed() {
    if (key === ' ') {
        togglePlay();
    } else if (key === 'f' || key === 'F') {
    }
}

function togglePlay() {
    if (song.isPlaying()) {
        song.pause();
        noLoop();
    } else {
        song.loop();
        loop();
    }
}

function resetEllipse() {
    console.log("Forcing ellipse reset!");
    ellipseSize = 4;
    particles = [];
}


function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    updateMaxSize();
    // resetEllipse();
    positionInstructions();
   background(240, 5);
    drawRadialGradient(); 
}

function updateMaxSize() {
    maxEllipseSize = max(windowWidth, windowHeight) * 1.1;
}

function toggleFullscreen() {
    let fs = fullscreen();
    fullscreen(!fs);
    setTimeout(() => {
        resizeCanvas(windowWidth, windowHeight);
        updateMaxSize();
        background(240, 10);
        drawRadialGradient(); 
    }, 300);
}