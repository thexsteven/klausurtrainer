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
const OUT_DIR = resolve(ROOT, "public/icons");

// Zwei Quellen:
//  - ROUNDED:   abgerundetes Quadrat mit transparenten Ecken (Browser-Favicons)
//  - FULLBLEED: vollflaechig + DECKEND, ohne Rundung (iOS apple-touch-icon).
//    iOS legt selbst eine Maske drueber; transparente Ecken wuerden sonst schwarz.
const SRC_ROUNDED = resolve(OUT_DIR, "icon.svg");
const SRC_FULLBLEED = resolve(OUT_DIR, "icon-fullbleed.svg");

const VIOLET = { r: 124, g: 58, b: 237 }; // #7C3AED
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

// Zielgroessen: src = Quelle, opaque = Alpha entfernen (deckend fuer iOS)
const TARGETS = [
  { size: 16,  file: "favicon-16x16.png",    src: SRC_ROUNDED },
  { size: 32,  file: "favicon-32x32.png",    src: SRC_ROUNDED },
  { size: 180, file: "apple-touch-icon.png", src: SRC_FULLBLEED, opaque: true }, // iPhone Homescreen
  { size: 192, file: "icon-192x192.png",     src: SRC_ROUNDED },                  // PWA Manifest
  { size: 512, file: "icon-512x512.png",     src: SRC_ROUNDED },                  // PWA Manifest / Splash
];

// Hohe Render-Dichte -> das SVG wird intern gross gerastert und dann verkleinert.
const DENSITY = 512;

await mkdir(OUT_DIR, { recursive: true });

for (const { size, file, src, opaque } of TARGETS) {
  const outPath = resolve(OUT_DIR, file);
  let pipeline = sharp(src, { density: DENSITY }).resize(size, size, {
    fit: "contain",
    background: opaque ? VIOLET : TRANSPARENT,
  });
  // Deckend: Alpha-Kanal komplett entfernen, damit iOS keine schwarzen Ecken zeigt.
  if (opaque) pipeline = pipeline.flatten({ background: VIOLET });
  await pipeline.png({ compressionLevel: 9 }).toFile(outPath);
  console.log(`✓  ${file.padEnd(22)} ${size}×${size}${opaque ? "  (deckend)" : ""}`);
}

console.log("\nFertig – 5 PNG-Icons erzeugt in public/icons/");
