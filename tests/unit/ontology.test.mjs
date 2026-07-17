import { test } from "node:test";
import assert from "node:assert/strict";
import { validateGarment, validateOutfit, isPublishable, ONTOLOGY } from "../../packages/fashion-schema/validate.mjs";

const base = {
  id: "import-x", name: "Test Shirt", part: "upperbody", color: "#ffffff",
  category: "tops", subcategory: "dress-shirt", garmentType: "shirt",
  season: ["all-season"], occasion: ["office"], thermalWeight: 1,
  fieldProvenance: { category: "ai_inferred", name: "human_confirmed" }
};

test("prenda válida pasa la validación", () => {
  assert.equal(validateGarment(base).ok, true);
});

test("categoría fuera de vocabulario se rechaza", () => {
  const r = validateGarment({ ...base, category: "spacesuits" });
  assert.equal(r.ok, false);
  assert.match(r.errors.join(), /category/);
});

test("subcategory debe pertenecer a su category", () => {
  const r = validateGarment({ ...base, category: "denim", subcategory: "dress-shirt" });
  assert.equal(r.ok, false);
});

test("valores desconocidos = campo omitido, sigue siendo válido", () => {
  const { category, subcategory, garmentType, ...minimal } = base;
  assert.equal(validateGarment(minimal).ok, true);
});

test("provenance inválida se rechaza", () => {
  const r = validateGarment({ ...base, fieldProvenance: { material: "guessed" } });
  assert.equal(r.ok, false);
});

test("compatibilidad: registro histórico (solo part, sin V1) valida", () => {
  const legacy = { id: "import-old", name: "Old", part: "shoes", color: "#f2f2f2", tags: [] };
  assert.equal(validateGarment(legacy).ok, true);
});

test("migración real: las 6 prendas actuales validan", async () => {
  const { readFile } = await import("node:fs/promises");
  const lib = JSON.parse(await readFile("C:/Users/temp123/repos/wardrobe/data/library.json", "utf8"));
  assert.equal(lib.length >= 6, true);
  for (const g of lib) {
    const r = validateGarment(g);
    assert.deepEqual(r.errors, [], g.id);
    assert.equal(g.schemaVersion, "garment/v0.2");
  }
});

/* ---------------- outfits ---------------- */

const garments = {
  top: { id: "top", part: "upperbody" }, out: { id: "out", part: "wholebody_up" },
  bottom: { id: "bottom", part: "lowerbody" }, shoes: { id: "shoes", part: "shoes" },
  bottom2: { id: "bottom2", part: "lowerbody" }
};
const byId = Object.fromEntries(Object.values(garments).map(g => [g.id, g]));
const outfit = { id: "test-look", name: "Test", garmentIds: ["top", "bottom", "shoes"], status: "draft" };

test("outfit válido pasa", () => {
  assert.equal(validateOutfit(outfit, byId).ok, true);
});

test("garmentId inexistente se rechaza", () => {
  const r = validateOutfit({ ...outfit, garmentIds: ["top", "ghost"] }, byId);
  assert.match(r.errors.join(), /no existe/);
});

test("conflicto de slot (dos partes inferiores) se rechaza", () => {
  const r = validateOutfit({ ...outfit, garmentIds: ["bottom", "bottom2"] }, byId);
  assert.match(r.errors.join(), /conflicto de slot/);
});

test("estado fuera de vocabulario se rechaza", () => {
  const r = validateOutfit({ ...outfit, status: "accepted" }, byId);
  assert.match(r.errors.join(), /status/);
});

test("solo approved/published son publicables", () => {
  assert.equal(isPublishable({ status: "approved" }), true);
  assert.equal(isPublishable({ status: "published" }), true);
  for (const s of ["draft", "review", "rejected"]) assert.equal(isPublishable({ status: s }), false);
});

test("catálogo exportado: sin rechazados, refs resueltas, campos V1", async () => {
  const { readFile } = await import("node:fs/promises");
  const { existsSync } = await import("node:fs");
  const cat = JSON.parse(await readFile("dist/real-catalog/catalog.json", "utf8"));
  assert.equal(cat.products.length, 6);
  const ids = new Set(cat.products.map(p => p.id));
  for (const o of cat.outfits) {
    assert.equal(["approved", "published"].includes(o.status), true, `${o.id} no publicable`);
    o.garmentIds.forEach(id => assert.equal(ids.has(id), true, `${o.id}: ref rota ${id}`));
    if (o.image) assert.equal(existsSync("dist/real-catalog/" + o.image), true);
  }
  for (const p of cat.products) {
    assert.equal(ONTOLOGY.category.values.includes(p.category), true, `${p.id} categoría inválida`);
    assert.equal(existsSync("dist/real-catalog/" + p.image), true);
  }
});
