import p5, { Graphics } from "p5";

export function p5Noise() {
  const pixelSize = 10;

  new p5((p) => {
    let offscreen: Graphics;

    p.setup = () => {
      const canvas = p.createCanvas(p.displayWidth, p.displayHeight);
      canvas.id("p5-canvas"); // assign an id for CSS positioning
      p.noStroke();

      offscreen = p.createGraphics(p.displayWidth, p.displayHeight);
      offscreen.noStroke();
    };

    p.draw = () => {
      for (let x = 0; x < offscreen.width; x += pixelSize) {
        for (let y = 0; y < offscreen.height; y += pixelSize) {
          offscreen.fill(p.random(255));
          offscreen.rect(x, y, pixelSize, pixelSize);
        }
      }

      p.image(offscreen, 0, 0);
    };

    p.windowResized = () => {
      p.resizeCanvas(p.displayWidth, p.displayHeight);
    };
  });
}
