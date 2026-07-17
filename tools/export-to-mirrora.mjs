#!/usr/bin/env node
// Fase 1 — ADR 0001: exporta un checkout de wardrobe (data/library.json [+ outfits])
// a un paquete de catálogo MIRRORA (catalog.json + images/), validando contra el
// contrato de packages/fashion-schema (validación ligera integrada; Zod/ajv en Fase 3).
//
// Uso:
//   node tools/export-to-mirrora.mjs --wardrobe <dir> [--out <dir>] [--brand id]
//        [--campaign id] [--currency EUR] [--price 0]
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const args = {};
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i += 2) {
  if (!argv[i].startsWith("--") || argv[i + 1] === undefined) {
    console.error("Argumentos inválidos. Ver cabecera del script."); process.exit(1);
  }
  args[argv[i].slice(2)] = argv[i + 1];
}
if (!args.wardrobe) { console.error("--wardrobe <dir> es obligatorio"); process.exit(1); }

const wardrobeDir = path.resolve(args.wardrobe);
const dataDir = path.join(wardrobeDir, "data");
const outDir = path.resolve(args.out || "dist/mirrora-catalog");
const brandId = args.brand || "fashion-studio-sol-demo";
const campaignId = args.campaign || "slice-1";
const currency = args.currency || "EUR";
const defaultPrice = Number(args.price ?? 0);

const HEX = /^#[0-9a-f]{6}$/i;
const PARTS = new Set(["upperbody", "wholebody_up", "lowerbody", "accessories_up", "shoes"]);
const PART_LABEL = {
  upperbody: "Parte superior", wholebody_up: "Capa exterior",
  lowerbody: "Parte inferior", accessories_up: "Accesorio", shoes: "Calzado"
};

async function readJson(file, fallback) {
  try { return JSON.parse(await readFile(file, "utf8")); }
  catch (e) { if (e.code === "ENOENT") return fallback; throw e; }
}

function resolveAsset(ref, kind) {
  // Contratos reales de wardrobe: "/api/import/library/X.png" → data/imported/X.png
  //                               "outfit-images/X.png" | "/api/import/outfits/X.png" → data/outfit-images/X.png
  if (typeof ref !== "string" || !ref) return null;
  const base = path.basename(ref);
  const dir = kind === "outfit" ? "outfit-images" : "imported";
  const abs = path.join(dataDir, dir, base);
  return existsSync(abs) ? { abs, base } : null;
}

const errors = [];
const library = await readJson(path.join(dataDir, "library.json"), null);
if (!Array.isArray(library) || !library.length) {
  console.error(`No hay prendas en ${path.join(dataDir, "library.json")}`); process.exit(1);
}

const products = [];
const assets = [];
for (const g of library) {
  const where = `garment ${g.id || "?"}`;
  if (!g.id || !g.name) { errors.push(`${where}: id/name obligatorios`); continue; }
  if (!PARTS.has(g.part)) { errors.push(`${where}: part inválido (${g.part})`); continue; }
  if (!HEX.test(g.color || "")) { errors.push(`${where}: color inválido`); continue; }
  const asset = resolveAsset(g.image, "garment");
  if (!asset) { errors.push(`${where}: asset no resuelve (${g.image})`); continue; }
  assets.push(asset);
  const modeled = resolveAsset(g.modeledImage, "garment");
  if (modeled) assets.push(modeled);
  products.push({
    id: g.id,
    name: g.name,
    line: PART_LABEL[g.part],
    part: g.part,
    price: typeof g.price === "number" ? g.price : defaultPrice,
    color: g.color.toLowerCase(),
    secondaryColor: g.secondaryColor?.toLowerCase?.() || null,
    tags: Array.isArray(g.tags) ? g.tags : [],
    image: `images/${asset.base}`,
    modeledImage: modeled ? `images/${modeled.base}` : null
  });
}

const outfitsRaw = await readJson(path.join(dataDir, "outfits.json"), { outfits: [] });
const productIds = new Set(products.map(p => p.id));
const outfits = [];
for (const o of outfitsRaw.outfits || []) {
  const where = `outfit ${o.id || "?"}`;
  if (!o.id || !o.name || !Array.isArray(o.garmentIds) || !o.garmentIds.length) {
    errors.push(`${where}: id/name/garmentIds obligatorios`); continue;
  }
  const missing = o.garmentIds.filter(id => !productIds.has(id));
  if (missing.length) { errors.push(`${where}: garmentIds no resueltos: ${missing.join(", ")}`); continue; }
  const asset = resolveAsset(o.image, "outfit");
  if (asset) assets.push(asset);
  outfits.push({
    id: o.id, name: o.name, garmentIds: o.garmentIds,
    occasion: o.occasion || [], season: o.season || [],
    description: o.reason || o.description || "",
    image: asset ? `images/${asset.base}` : null,
    status: o.status || "draft"
  });
}

if (errors.length) {
  console.error(`Validación fallida (${errors.length}):\n- ` + errors.join("\n- "));
  process.exit(1);
}

await mkdir(path.join(outDir, "images"), { recursive: true });
for (const a of assets) await copyFile(a.abs, path.join(outDir, "images", a.base));

const catalog = {
  schema: "mirrora-catalog/v0.1",
  brandId, campaignId, currency,
  generatedAt: new Date().toISOString(),
  source: "wardrobe",
  products, outfits
};
await writeFile(path.join(outDir, "catalog.json"), JSON.stringify(catalog, null, 2) + "\n");

console.log(JSON.stringify({
  out: outDir, products: products.length, outfits: outfits.length,
  images: new Set(assets.map(a => a.base)).size
}, null, 2));
