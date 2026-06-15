# Icon-Konvertierung – `icon.svg` → PNG

Es gibt **zwei** Quell-SVGs (beide self-contained, `viewBox="0 0 512 512"`):

- [`icon.svg`](./icon.svg) — abgerundetes Quadrat mit **transparenten** Ecken → Browser-Favicons.
- [`icon-fullbleed.svg`](./icon-fullbleed.svg) — vollflaechig + **deckend**, ohne Rundung → `apple-touch-icon`.
  iOS legt selbst eine abgerundete Maske drueber; transparente Ecken wuerden sonst auf dem
  iPhone-Homescreen **schwarz** erscheinen.

| Groesse   | Datei                  | Quelle               | Verwendung                          |
| --------- | ---------------------- | -------------------- | ----------------------------------- |
| 16×16     | `favicon-16x16.png`    | `icon.svg`           | Browser-Tab (klein)                 |
| 32×32     | `favicon-32x32.png`    | `icon.svg`           | Browser-Tab / Lesezeichen           |
| 180×180   | `apple-touch-icon.png` | `icon-fullbleed.svg` | iPhone Homescreen (deckend)         |
| 192×192   | `icon-192x192.png`     | `icon.svg`           | PWA Manifest                        |
| 512×512   | `icon-512x512.png`     | `icon.svg`           | PWA Manifest / Splash               |

---

## 1. Setup (einmalig)

```bash
npm install sharp
```

> `sharp` ist die einzige Abhaengigkeit. Kein globales Tool, kein ImageMagick noetig.

---

## 2. Konvertieren (alle 5 Groessen in einem Durchlauf)

Das fertige Script liegt unter [`scripts/convert-icons.mjs`](../../scripts/convert-icons.mjs).
Einfach aus dem Projekt-Root ausfuehren:

```bash
node scripts/convert-icons.mjs
```

Erwartete Ausgabe:

```
✓  favicon-16x16.png      16×16
✓  favicon-32x32.png      32×32
✓  apple-touch-icon.png   180×180
✓  icon-192x192.png       192×192
✓  icon-512x512.png       512×512

Fertig – 5 PNG-Icons erzeugt in public/icons/
```

### Optional: als npm-Script hinterlegen

In der `package.json`:

```json
{
  "scripts": {
    "icons": "node scripts/convert-icons.mjs"
  }
}
```

Dann genuegt `npm run icons`.

### Inhalt des Scripts (zur Referenz)

```js
// scripts/convert-icons.mjs
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT_DIR = resolve(ROOT, "public/icons");

// Zwei Quellen: abgerundet+transparent (Favicons) vs. vollflaechig+deckend (iOS).
const SRC_ROUNDED = resolve(OUT_DIR, "icon.svg");
const SRC_FULLBLEED = resolve(OUT_DIR, "icon-fullbleed.svg");

const VIOLET = { r: 124, g: 58, b: 237 }; // #7C3AED
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

const TARGETS = [
  { size: 16,  file: "favicon-16x16.png",    src: SRC_ROUNDED },
  { size: 32,  file: "favicon-32x32.png",    src: SRC_ROUNDED },
  { size: 180, file: "apple-touch-icon.png", src: SRC_FULLBLEED, opaque: true },
  { size: 192, file: "icon-192x192.png",     src: SRC_ROUNDED },
  { size: 512, file: "icon-512x512.png",     src: SRC_ROUNDED },
];

const DENSITY = 512; // hohe Render-Dichte -> scharfe Kanten, auch bei 16px

await mkdir(OUT_DIR, { recursive: true });

for (const { size, file, src, opaque } of TARGETS) {
  let pipeline = sharp(src, { density: DENSITY }).resize(size, size, {
    fit: "contain",
    background: opaque ? VIOLET : TRANSPARENT,
  });
  if (opaque) pipeline = pipeline.flatten({ background: VIOLET }); // kein Alpha -> keine schwarzen Ecken auf iOS
  await pipeline.png({ compressionLevel: 9 }).toFile(resolve(OUT_DIR, file));
  console.log(`✓  ${file.padEnd(22)} ${size}×${size}${opaque ? "  (deckend)" : ""}`);
}

console.log("\nFertig – 5 PNG-Icons erzeugt in public/icons/");
```

---

## 3. Einbinden in die App

### HTML `<head>`-Snippet

In [`index.html`](../../index.html) direkt nach dem `<title>` einfuegen:

```html
<!-- Favicons -->
<link rel="icon" type="image/svg+xml" href="/public/icons/icon.svg">
<link rel="icon" type="image/png" sizes="32x32" href="/public/icons/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/public/icons/favicon-16x16.png">

<!-- iOS / iPadOS Homescreen -->
<link rel="apple-touch-icon" sizes="180x180" href="/public/icons/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black">
<meta name="apple-mobile-web-app-title" content="Klausur-Trainer">

<!-- PWA -->
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#7C3AED">
```

> **Pfad-Hinweis:** Die `href`/`src`-Pfade gehen von einem Web-Root aus, unter dem
> `public/` direkt erreichbar ist. Wird `index.html` ohne Build-Tool als reine
> statische Datei geoeffnet, nutze relative Pfade ohne fuehrenden Slash
> (z. B. `public/icons/icon.svg`). Serviert dein Setup den `public/`-Ordner
> bereits als Web-Root, entfaellt das `/public`-Praefix (z. B. `/icons/icon.svg`).

### `manifest.json`-Eintrag (PWA-Icons)

```json
{
  "name": "Klausur-Trainer · TheoInf II",
  "short_name": "Klausur-Trainer",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#7C3AED",
  "background_color": "#7C3AED",
  "icons": [
    {
      "src": "/public/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/public/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    }
  ]
}
```

---

## Hinweise

- **`apple-touch-icon` ist bewusst deckend (full-bleed):** iOS legt selbst eine
  abgerundete Maske ueber das Homescreen-Icon. Transparente Ecken wuerden dabei
  **schwarz**. Deshalb wird die 180×180-PNG aus [`icon-fullbleed.svg`](./icon-fullbleed.svg)
  (Violet bis zum Rand, kein Alpha) erzeugt. Die Browser-Favicons bleiben dagegen
  abgerundet/transparent (`icon.svg`).
- **Maskable PWA-Icons (Android):** Brauchst du echte `"purpose": "maskable"`-Icons,
  erzeuge die 192/512-Groessen ebenfalls aus `icon-fullbleed.svg` (Sigma liegt im
  inneren ~60 %-Sicherheitsbereich) und setze im Manifest `"purpose": "any maskable"`.
- **Qualitaet bei 16px:** Das Sigma ist als dicker Strich (`stroke-width 56` von 512,
  ≈ 11 % der Kantenlaenge) angelegt und bleibt dadurch auch im 16×16-Favicon klar
  lesbar. Wirken Kanten zu weich, erhoehe `DENSITY` im Script (z. B. 768 oder 1024).
- **Re-Run:** Das Script ist idempotent – nach jeder Aenderung an `icon.svg`
  einfach erneut `node scripts/convert-icons.mjs` ausfuehren.
