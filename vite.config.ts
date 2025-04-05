import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { UserConfig } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default {
  // ...
  // base: "/psimiti-kiosk/",
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        about: resolve(__dirname, "about.html"),
      },
    },
  },
} satisfies UserConfig;
