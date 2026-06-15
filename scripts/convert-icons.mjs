// scripts/convert-icons.mjs
// Erzeugt aus public/icons/icon.svg alle benoetigten PNG-Groessen in einem Durchlauf.
//
// Voraussetzung (einmalig):  npm install sharp
// Ausfuehren:                node scripts/convert-icons.mjs
//
// sharp rastert das SVG bei hoher "density" (DPI) und skaliert anschliessend
// auf die Zielgroesse herunter -> kraeftiges Supersampling, saubere Kanten,
// auch bei 16x16 bleibt das Sigma klar erkennbar.

import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SRC = resolve(ROOT, "public/icons/icon.svg");
const OUT_DIR = resolve(ROOT, "public/icons");

// Zielgroessen: [Kantenlaenge in px, Dateiname]
const TARGETS = [
  { size: 16,  file: "favicon-16x16.png" },
  { size: 32,  file: "favicon-32x32.png" },
  { size: 180, file: "apple-touch-icon.png" },   // iPhone PWA / Homescreen
  { size: 192, file: "icon-192x192.png" },        // PWA Manifest
  { size: 512, file: "icon-512x512.png" },        // PWA Manifest / Splash
];

// Hohe Render-Dichte -> das SVG wird intern gross gerastert und dann verkleinert.
const DENSITY = 512;

await mkdir(OUT_DIR, { recursive: true });

for (const { size, file } of TARGETS) {
  const outPath = resolve(OUT_DIR, file);
  await sharp(SRC, { density: DENSITY })
    .resize(size, size, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 }, // transparente Ecken
    })
    .png({ compressionLevel: 9 })
    .toFile(outPath);
  console.log(`✓  ${file.padEnd(22)} ${size}×${size}`);
}

console.log("\nFertig – 5 PNG-Icons erzeugt in public/icons/");
