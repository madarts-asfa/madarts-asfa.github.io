import { cartelTemplate } from "./cartel.ts";
import { setupFullscreenToggle } from "./fullscreen.ts";
import { p5Noise } from "./noise-p5.ts";
import { setupKioskOpener } from "./openiniframe.ts";
import { pieces } from "./pieces.ts";
import "./style.css";

const content = pieces.map((p, idx) =>
  p === null ? "" : cartelTemplate(idx + 2, ...p)
);
const kiosk = document.querySelector<HTMLDivElement>("#kiosk");
if (kiosk) kiosk.insertAdjacentHTML("afterbegin", content.join(""));

p5Noise();
setupKioskOpener();
setupFullscreenToggle();
