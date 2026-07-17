import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { existsSync, writeFileSync, mkdtempSync, cpSync } from "node:fs";
import { execFileSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateGarment, validateOutfit, isPublishable, ONTOLOGY } from "../../packages/fashion-schema/validate.mjs";

// Rutas SIEMPRE repo-relativas — nada personal. Los fixtures los crea
// `node tools/prepare-test-data.mjs` (lo ejecuta `npm test` antes que estos tests).
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const FIXTURE_WARDROBE = path.join(ROOT, "tmp", "fixture-wardrobe");
const FIXTURE_CATALOG = path.join(ROOT, "tmp", "fixture-catalog");
const node = process.execPath;

const base = {
  id: "import-x", name: "Test Shirt", part: "upperbody", color: "#ffffff",
  category: "tops", subcategory: "dress-shirt", garmentType: "shirt",
  season: ["all-season"], occasion: ["office"], thermalWeight: 1,
  fieldProvenance: { category: "ai_inferred", name: "human_confirmed" }
};

/* ---------------- Ontología: prendas ---------------- */

test("prenda válida pasa la validación", () => {
  assert.equal(validateGarment(base).ok, true);
});

test("categoría fuera de vocabulario se rechaza", () => {
  const r = validateGarment({ ...base, category: "spacesuits" });
  assert.equal(r.ok, false);
  assert.match(r.errors.join(), /category/);
});

test("subcategory debe pertenecer a su category", () => {
  assert.equal(validateGarment({ ...base, category: "denim", subcategory: "dress-shirt" }).ok, false);
});

test("valores desconocidos = campo omitido, sigue siendo válido", () => {
  const { category, subcategory, garmentType, ...minimal } = base;
  assert.equal(validateGarment(minimal).ok, true);
});

test("provenance inválida se rechaza", () => {
  assert.equal(validateGarment({ ...base, fieldProvenance: { material: "guessed" } }).ok, false);
});

test("thermalWeight es entero 1..5, no string", () => {
  assert.equal(validateGarment({ ...base, thermalWeight: 3 }).ok, true);
  assert.equal(validateGarment({ ...base, thermalWeight: "heavy" }).ok, false);
});

test("compatibilidad: registro histórico (solo part, sin V1) valida", () => {
  const legacy = { id: "import-old", name: "Old", part: "shoes", color: "#f2f2f2", tags: [] };
  assert.equal(validateGarment(legacy).ok, true);
});

/* ---------------- Ontología: outfits ---------------- */

const garments = {
  top: { id: "top", part: "upperbody" }, out: { id: "out", part: "wholebody_up" },
  bottom: { id: "bottom", part: "lowerbody" }, shoes: { id: "shoes", part: "shoes" },
  bottom2: { id: "bottom2", part: "lowerbody" }
};
const byId = Object.fromEntries(Object.values(garments).map(g => [g.id, g]));
const outfit = { id: "test-look", name: "Test", garmentIds: ["top", "bottom", "shoes"], status: "draft" };

test("outfit válido pasa", () => assert.equal(validateOutfit(outfit, byId).ok, true));
test("garmentId inexistente se rechaza", () => assert.match(validateOutfit({ ...outfit, garmentIds: ["top", "ghost"] }, byId).errors.join(), /no existe/));
test("conflicto de slot se rechaza", () => assert.match(validateOutfit({ ...outfit, garmentIds: ["bottom", "bottom2"] }, byId).errors.join(), /conflicto de slot/));
test("estado fuera de vocabulario se rechaza", () => assert.match(validateOutfit({ ...outfit, status: "accepted" }, byId).errors.join(), /status/));

test("solo approved/published son publicables", () => {
  assert.equal(isPublishable({ status: "approved" }), true);
  assert.equal(isPublishable({ status: "published" }), true);
  for (const s of ["draft", "review", "rejected"]) assert.equal(isPublishable({ status: s }), false);
});

/* ---------------- Contrato único: schemas derivados ---------------- */

test("garment/outfit.schema.json están generados desde la ontología (sin divergencia)", () => {
  // exit 0 = los JSON Schema comprometidos coinciden con ontology.json
  execFileSync(node, [path.join(ROOT, "tools", "build-schemas.mjs"), "--check"], { stdio: "pipe" });
});

test("los schemas derivados usan el vocabulario canónico (no strings antiguos)", async () => {
  const g = JSON.parse(await readFile(path.join(ROOT, "packages/fashion-schema/garment.schema.json"), "utf8"));
  const o = JSON.parse(await readFile(path.join(ROOT, "packages/fashion-schema/outfit.schema.json"), "utf8"));
  assert.deepEqual(g.properties.thermalWeight.enum, [...ONTOLOGY.thermalWeight.values, null]);
  assert.deepEqual(g.properties.season.items.enum, ONTOLOGY.season.values);
  assert.deepEqual(o.properties.status.enum, ONTOLOGY.outfitStatus.values);
});

/* ---------------- Cadena reproducible (fixtures deterministas) ---------------- */

test("fixture migrado: todas las prendas validan y llevan schemaVersion", async () => {
  assert.ok(existsSync(FIXTURE_WARDROBE), "falta fixture — ejecuta: node tools/prepare-test-data.mjs");
  const lib = JSON.parse(await readFile(path.join(FIXTURE_WARDROBE, "data/library.json"), "utf8"));
  assert.equal(lib.length, 6);
  for (const g of lib) {
    assert.deepEqual(validateGarment(g).errors, [], g.id);
    assert.equal(g.schemaVersion, "garment/v0.2");
    assert.equal(ONTOLOGY.category.values.includes(g.category), true, `${g.id} categoría inválida`);
  }
});

test("catálogo exportado: solo publicables, refs resueltas, campos V1, imágenes presentes", async () => {
  const cat = JSON.parse(await readFile(path.join(FIXTURE_CATALOG, "catalog.json"), "utf8"));
  const ids = new Set(cat.products.map(p => p.id));
  assert.equal(cat.products.length, 6);
  assert.equal(cat.outfits.length >= 1, true);
  for (const o of cat.outfits) {
    assert.equal(["approved", "published"].includes(o.status), true, `${o.id} no publicable en catálogo`);
    o.garmentIds.forEach(id => assert.equal(ids.has(id), true, `${o.id}: ref rota ${id}`));
    if (o.image) assert.equal(existsSync(path.join(FIXTURE_CATALOG, o.image)), true, `${o.id}: imagen ausente`);
  }
  for (const p of cat.products) {
    assert.equal(ONTOLOGY.category.values.includes(p.category), true, `${p.id} categoría inválida`);
    assert.equal(existsSync(path.join(FIXTURE_CATALOG, p.image)), true, `${p.id}: imagen ausente`);
  }
});

test("el outfit rechazado NO aparece en el catálogo público", async () => {
  const cat = JSON.parse(await readFile(path.join(FIXTURE_CATALOG, "catalog.json"), "utf8"));
  assert.equal(cat.outfits.some(o => o.id === "ink-evening-layer"), false);
});

test("el exportador BLOQUEA un outfit approved pero inválido (fail-closed)", () => {
  // Inyecta en un fixture desechable un outfit approved con conflicto de slot.
  const scratch = mkdtempSync(path.join(os.tmpdir(), "fss-broken-"));
  cpSync(FIXTURE_WARDROBE, scratch, { recursive: true });
  const outfitsFile = path.join(scratch, "data/outfits.json");
  const data = JSON.parse(execFileSync(node, ["-e", `process.stdout.write(require('fs').readFileSync(${JSON.stringify(outfitsFile)},'utf8'))`]).toString());
  data.outfits.push({
    id: "broken-approved", name: "Broken", status: "approved",
    garmentIds: ["import-camel-wide-trousers", "import-ivory-boxy-tee", "import-terracotta-slip-dress"] // dos upperbody = conflicto
  });
  writeFileSync(outfitsFile, JSON.stringify(data, null, 2));
  let failed = false;
  try {
    execFileSync(node, [path.join(ROOT, "tools/export-to-mirrora.mjs"), "--wardrobe", scratch, "--out", path.join(scratch, "out"), "--price", "0"], { stdio: "pipe" });
  } catch { failed = true; }
  assert.equal(failed, true, "el exportador debería fallar ante un outfit approved inválido");
});
