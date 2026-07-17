#!/usr/bin/env node
// Genera un checkout de demo con el layout REAL de wardrobe (data/library.json +
// data/imported/*.png + data/outfits.json + data/outfit-images/*.png) para poder
// demostrar el vertical slice sin coste de API. PNGs con alpha real.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Canvas, hex } from "./png.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(root, "examples", "demo-wardrobe", "data");
const S = 512;

function tee(c1, c2) {
  const cv = new Canvas(S, S);
  cv.trapezoid(256, 120, 430, 220, 260, hex(c1));            // cuerpo
  cv.rect(60, 120, 110, 70, hex(c1)); cv.rect(342, 120, 110, 70, hex(c1)); // mangas
  cv.ellipse(256, 118, 52, 26, [0, 0, 0, 0]);                // escote
  cv.rect(146, 400, 220, 30, hex(c2));                       // bajo
  return cv;
}
function jacket(c1, c2) {
  const cv = new Canvas(S, S);
  cv.trapezoid(256, 100, 450, 250, 300, hex(c1));
  cv.rect(40, 100, 90, 260, hex(c1)); cv.rect(382, 100, 90, 260, hex(c1));
  cv.rect(246, 100, 20, 350, [0, 0, 0, 0]);                  // apertura central
  cv.trapezoid(200, 100, 180, 60, 20, hex(c2));              // solapa izq
  cv.trapezoid(312, 100, 180, 60, 20, hex(c2));              // solapa dcha
  return cv;
}
function pants(c1, c2) {
  const cv = new Canvas(S, S);
  cv.rect(140, 60, 232, 70, hex(c2));                        // cintura
  cv.trapezoid(196, 130, 470, 108, 84, hex(c1));             // pierna izq
  cv.trapezoid(316, 130, 470, 108, 84, hex(c1));             // pierna dcha
  return cv;
}
function sneakers(c1, c2) {
  const cv = new Canvas(S, S);
  for (const cx of [150, 362]) {
    cv.ellipse(cx, 300, 105, 55, hex(c1));
    cv.rect(cx - 105, 320, 210, 42, hex(c2));                // suela
    cv.ellipse(cx - 40, 265, 45, 35, hex(c1));               // empeine
  }
  return cv;
}
function tote(c1, c2) {
  const cv = new Canvas(S, S);
  cv.trapezoid(256, 170, 440, 250, 300, hex(c1));
  cv.ellipse(256, 165, 90, 55, [0, 0, 0, 0]);                // hueco asa
  cv.ellipse(256, 165, 110, 70, hex(c2));                    // asa
  cv.ellipse(256, 165, 90, 55, [0, 0, 0, 0]);
  cv.trapezoid(256, 170, 440, 250, 300, hex(c1));
  cv.rect(131, 170, 250, 26, hex(c2));
  return cv;
}
function dress(c1, c2) {
  const cv = new Canvas(S, S);
  cv.trapezoid(256, 90, 230, 170, 140, hex(c1));             // torso
  cv.trapezoid(256, 230, 470, 140, 340, hex(c1));            // falda
  cv.ellipse(256, 88, 46, 22, [0, 0, 0, 0]);                 // escote
  cv.rect(186, 218, 140, 18, hex(c2));                       // cintura
  return cv;
}

const GARMENTS = [
  { slug: "ivory-boxy-tee", name: "Ivory Boxy Tee", part: "upperbody", color: "#ece5d8", secondaryColor: "#b8ab90", draw: tee, tags: ["basic", "boxy", "cotton"] },
  { slug: "ink-lounge-jacket", name: "Ink Lounge Jacket", part: "wholebody_up", color: "#23211f", secondaryColor: "#b08d4f", draw: jacket, tags: ["layered", "smart-casual"] },
  { slug: "camel-wide-trousers", name: "Camel Wide Trousers", part: "lowerbody", color: "#b3814a", secondaryColor: "#6e5124", draw: pants, tags: ["wide-leg", "tailored"] },
  { slug: "terracotta-slip-dress", name: "Terracotta Slip Dress", part: "upperbody", color: "#b0654f", secondaryColor: "#7a3f2e", draw: dress, tags: ["dress", "evening"] },
  { slug: "cloud-court-sneakers", name: "Cloud Court Sneakers", part: "shoes", color: "#f4efe7", secondaryColor: "#9aa08f", draw: sneakers, tags: ["sneakers", "street"] },
  { slug: "olive-canvas-tote", name: "Olive Canvas Tote", part: "accessories_up", color: "#4a5d4a", secondaryColor: "#23211f", draw: tote, tags: ["bag", "canvas", "daily"] }
];

const OUTFITS = [
  {
    id: "studio-neutral-day", name: "Studio Neutral Day",
    garments: ["ivory-boxy-tee", "camel-wide-trousers", "cloud-court-sneakers", "olive-canvas-tote"],
    occasion: ["casual", "office"], season: ["spring", "autumn"],
    reason: "Neutros cálidos con un solo acento verde: base tonal, peso visual abajo.",
    setting: "patio de piedra clara con vegetación contenida", status: "accepted"
  },
  {
    id: "ink-evening-layer", name: "Ink Evening Layer",
    garments: ["terracotta-slip-dress", "ink-lounge-jacket", "cloud-court-sneakers"],
    occasion: ["evening", "smart-casual"], season: ["autumn"],
    reason: "La capa tinta enmarca el vestido terracota; una sola pieza saturada domina.",
    setting: "callejón de galería al atardecer", status: "accepted"
  }
];

await mkdir(path.join(dataDir, "imported"), { recursive: true });
await mkdir(path.join(dataDir, "outfit-images"), { recursive: true });

const library = [];
for (const g of GARMENTS) {
  const id = `import-${g.slug}`;
  const assetName = `${id}-garment.png`;
  await writeFile(path.join(dataDir, "imported", assetName), g.draw(g.color, g.secondaryColor).png());
  library.push({
    id, name: g.name, part: g.part, color: g.color, secondaryColor: g.secondaryColor,
    palette: [g.color, g.secondaryColor], tags: g.tags,
    image: `/api/import/library/${assetName}`, thumbnail: `/api/import/library/${assetName}`,
    modeledImage: null, importJobId: g.slug
  });
}
await writeFile(path.join(dataDir, "library.json"), JSON.stringify(library, null, 2) + "\n");

const outfits = [];
for (const o of OUTFITS) {
  // Composición flat-lay simple: prendas del look en mosaico 2x2
  const cv = new Canvas(S, S);
  o.garments.forEach((slug, i) => {
    const g = GARMENTS.find(x => x.slug === slug);
    const mini = g.draw(g.color, g.secondaryColor);
    const ox = (i % 2) * 256, oy = Math.floor(i / 2) * 256;
    for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
      const src = ((y * 2) * S + x * 2) * 4;
      if (mini.px[src + 3] > 0) cv.set(ox + x, oy + y, [mini.px[src], mini.px[src + 1], mini.px[src + 2], mini.px[src + 3]]);
    }
  });
  await writeFile(path.join(dataDir, "outfit-images", `${o.id}.png`), cv.png());
  outfits.push({
    id: o.id, name: o.name, occasion: o.occasion, season: o.season,
    garmentIds: o.garments.map(s => `import-${s}`),
    reason: o.reason, setting: o.setting,
    image: `outfit-images/${o.id}.png`, status: o.status
  });
}
await writeFile(path.join(dataDir, "outfits.json"), JSON.stringify({ version: 1, outfits }, null, 2) + "\n");

console.log(`Demo wardrobe listo en ${dataDir}: ${library.length} prendas, ${outfits.length} outfits.`);
