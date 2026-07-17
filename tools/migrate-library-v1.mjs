#!/usr/bin/env node
// Fase 3: migra wardrobe/data/library.json a Ontología V1.
// - No cambia ids ni rutas de imágenes.
// - Añade clasificación y características inferidas (fieldProvenance = ai_inferred).
// - part se conserva; bodyArea lo espeja (compat total con datos anteriores).
// - Crea backup library.pre-v1.json la primera vez. Idempotente.
// Uso: node tools/migrate-library-v1.mjs --wardrobe <dir> [--dry-run]
import { readFile, writeFile, copyFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { validateGarment, ONTOLOGY } from "../packages/fashion-schema/validate.mjs";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const wIdx = args.indexOf("--wardrobe");
const wardrobeDir = path.resolve(wIdx >= 0 ? args[wIdx + 1] : "../wardrobe");
const libFile = path.join(wardrobeDir, "data", "library.json");

// Reglas de inferencia V1 por palabras clave del nombre (+ part como red de seguridad).
const RULES = [
  { match: /blazer|suit jacket/i, category: "outerwear", subcategory: "blazer", garmentType: "blazer", material: "wool", silhouette: "straight", fit: "regular", style: "tailored", occasion: ["office", "event"], season: ["autumn", "winter", "spring"], thermalWeight: 3 },
  { match: /coat|trench/i, category: "outerwear", garmentType: "coat", thermalWeight: 4 },
  { match: /sweater|jumper|crewneck|knit/i, category: "knitwear", subcategory: "crewneck", garmentType: "sweater", material: "merino", pattern: "solid", silhouette: "fitted", fit: "regular", style: "minimal", occasion: ["casual", "office"], season: ["autumn", "winter"], thermalWeight: 3 },
  { match: /jeans|denim/i, category: "denim", subcategory: "straight", garmentType: "jeans", material: "denim", pattern: "solid", silhouette: "straight", fit: "regular", style: "casual", occasion: ["casual", "weekend"], season: ["all-season"], thermalWeight: 2 },
  { match: /pants|trouser/i, category: "bottoms", subcategory: "tailored-trousers", garmentType: "trousers", material: "wool", pattern: "solid", silhouette: "straight", fit: "regular", style: "tailored", occasion: ["office", "evening"], season: ["all-season"], thermalWeight: 2 },
  { match: /shirt|blouse/i, category: "tops", subcategory: "dress-shirt", garmentType: "shirt", material: "poplin", pattern: "solid", silhouette: "fitted", fit: "regular", style: "smart-casual", occasion: ["office", "event"], season: ["all-season"], thermalWeight: 1 },
  { match: /dress(?!\s*(pants|shirt))/i, category: "dresses", garmentType: "dress", thermalWeight: 1 },
  { match: /sneaker|trainer/i, category: "footwear", subcategory: "low-top-sneaker", garmentType: "sneakers", material: "leather", pattern: "solid", style: "casual", occasion: ["casual", "weekend", "travel"], season: ["all-season"], thermalWeight: 1 },
  { match: /boot/i, category: "footwear", subcategory: "boot", garmentType: "boots", thermalWeight: 3 },
  { match: /tote|bag|clutch|crossbody/i, category: "bags", garmentType: "tote", thermalWeight: 1 }
];
const BY_PART = { upperbody: "tops", wholebody_up: "outerwear", lowerbody: "bottoms", shoes: "footwear", accessories_up: "accessories" };

function infer(record) {
  const rule = RULES.find(r => r.match.test(record.name)) || {};
  const out = { ...rule };
  delete out.match;
  if (!out.category) out.category = BY_PART[record.part] || "accessories";
  return out;
}

const library = JSON.parse(await readFile(libFile, "utf8"));
const backup = libFile.replace(/library\.json$/, "library.pre-v1.json");
if (!existsSync(backup) && !dryRun) await copyFile(libFile, backup);

let migrated = 0;
const next = library.map(rec => {
  if (rec.schemaVersion === "garment/v0.2") return rec; // idempotente
  const inf = infer(rec);
  const fieldProvenance = {};
  for (const k of Object.keys(inf)) fieldProvenance[k] = "ai_inferred";
  fieldProvenance.name = "ai_inferred";
  fieldProvenance.color = "ai_inferred";
  fieldProvenance.part = "human_confirmed"; // revisado en el pipeline (crop/garment aprobados a mano)
  migrated++;
  return {
    schemaVersion: "garment/v0.2",
    ...rec,
    bodyArea: rec.part,
    description: rec.description || "",
    ...inf,
    fieldProvenance,
    source: rec.source || {
      kind: "wardrobe-import",
      importJobId: rec.importJobId || null,
      provider: "openai",
      model: "gpt-image-2",
      detectedBy: "gpt-5.4-mini"
    },
    review: rec.review || { status: "approved", by: "pipeline-human-review", at: new Date().toISOString() }
  };
});

const errors = next.flatMap(g => validateGarment(g).errors);
if (errors.length) {
  console.error("Validación fallida:\n- " + errors.join("\n- "));
  process.exit(1);
}
if (!dryRun) await writeFile(libFile, JSON.stringify(next, null, 2) + "\n");
console.log(JSON.stringify({
  ontology: ONTOLOGY.version, total: next.length, migrated, dryRun,
  categories: Object.fromEntries(next.map(g => [g.id.slice(0, 15), g.category + "/" + (g.subcategory || "-")]))
}, null, 2));
