# Icon-Konvertierung – `icon.svg` → PNG

Das Master-Icon ist [`icon.svg`](./icon.svg) (skalierbar, `viewBox="0 0 512 512"`, self-contained,
keine externen Ressourcen). Aus dieser einen Datei werden alle PNG-Groessen abgeleitet.

| Groesse   | Datei                  | Verwendung                          |
| --------- | ---------------------- | ----------------------------------- |
| 16×16     | `favicon-16x16.png`    | Browser-Tab (klein)                 |
| 32×32     | `favicon-32x32.png`    | Browser-Tab / Lesezeichen           |
| 180×180   | `apple-touch-icon.png` | iPhone PWA / Homescreen             |
| 192×192   | `icon-192x192.png`     | PWA Manifest                        |
| 512×512   | `icon-512x512.png`     | PWA Manifest / Splash               |

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
const SRC = resolve(ROOT, "public/icons/icon.svg");
const OUT_DIR = resolve(ROOT, "public/icons");

const TARGETS = [
  { size: 16,  file: "favicon-16x16.png" },
  { size: 32,  file: "favicon-32x32.png" },
  { size: 180, file: "apple-touch-icon.png" },
  { size: 192, file: "icon-192x192.png" },
  { size: 512, file: "icon-512x512.png" },
];

const DENSITY = 512; // hohe Render-Dichte -> scharfe Kanten, auch bei 16px

await mkdir(OUT_DIR, { recursive: true });

for (const { size, file } of TARGETS) {
  await sharp(SRC, { density: DENSITY })
    .resize(size, size, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9 })
    .toFile(resolve(OUT_DIR, file));
  console.log(`✓  ${file.padEnd(22)} ${size}×${size}`);
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

- **`apple-touch-icon` & Maskable-Icons:** iOS legt selbst eine abgerundete Maske
  ueber das Icon, und maskable PWA-Icons werden teils zu einem Kreis beschnitten.
  Das aktuelle Master-SVG hat transparente Ecken (abgerundetes Quadrat). Das ist
  fuer Tab-Favicons ideal. Falls auf manchen iOS-Versionen schwarze Ecken
  auftauchen oder du echte `"purpose": "maskable"`-Icons brauchst, erzeuge eine
  randlose Variante (Violet bis zum Rand, Sigma im inneren 80 %-Sicherheitsbereich –
  das Sigma liegt hier bereits bei ~60 %, passt also) und referenziere diese
  zusaetzlich.
- **Qualitaet bei 16px:** Das Sigma ist als dicker Strich (`stroke-width 56` von 512,
  ≈ 11 % der Kantenlaenge) angelegt und bleibt dadurch auch im 16×16-Favicon klar
  lesbar. Wirken Kanten zu weich, erhoehe `DENSITY` im Script (z. B. 768 oder 1024).
- **Re-Run:** Das Script ist idempotent – nach jeder Aenderung an `icon.svg`
  einfach erneut `node scripts/convert-icons.mjs` ausfuehren.
