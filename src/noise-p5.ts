import p5, { Graphics } from "p5";

export function p5Noise() {
  const pixelSize = 10;
  const cacheSize = 10;

  new p5((p) => {
    let cache: Graphics[] = [];

    p.setup = () => {
      const canvas = p.createCanvas(p.displayWidth, p.displayHeight);
      canvas.id("p5-canvas"); // assign an id for CSS positioning
      p.noStroke();
    };

    p.draw = () => {
      if (!cache[p.frameCount % cacheSize]) {
        const offscreen = p.createGraphics(p.displayWidth, p.displayHeight);
        offscreen.noStroke();
        for (let x = 0; x < offscreen.width; x += pixelSize) {
          for (let y = 0; y < offscreen.height; y += pixelSize) {
            offscreen.fill(p.random(255));
            offscreen.rect(x, y, pixelSize, pixelSize);
          }
        }
        p.image(offscreen, 0, 0);
        cache[p.frameCount % cacheSize] = offscreen;
      } else {
        p.image(cache[p.frameCount % cacheSize], 0, 0);
      }
    };

    p.windowResized = () => {
      p.resizeCanvas(p.displayWidth, p.displayHeight);
    };
  });
}
