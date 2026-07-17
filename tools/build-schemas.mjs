#!/usr/bin/env node
// Genera garment.schema.json y outfit.schema.json DESDE ontology.json.
// Los JSON Schema son artefactos DERIVADOS: nunca se editan a mano y nunca pueden
// contradecir la ontología canónica. `--check` falla si los archivos comprometidos
// están desincronizados (lo usa CI para impedir divergencias).
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(here, "../packages/fashion-schema");
const ONT = JSON.parse(await readFile(path.join(dir, "ontology.json"), "utf8"));
const vocab = k => ONT[k].values;

const HEX = { type: "string", pattern: "^#[0-9a-fA-F]{6}$" };
const nullableHex = { anyOf: [HEX, { type: "null" }] };

const garmentSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: `https://fashion-studio-sol.dev/schemas/garment/${ONT.version}`,
  title: "Garment",
  _generated: "Generado por tools/build-schemas.mjs desde ontology.json. NO EDITAR.",
  description: "Prenda. Vocabularios y reglas derivados de la Ontología V1 canónica.",
  type: "object",
  required: ["id", "name", "part"],
  properties: {
    id: { type: "string", minLength: 1 },
    name: { type: "string", minLength: 1, maxLength: 120 },
    description: { type: "string" },
    part: { enum: vocab("bodyArea") },
    bodyArea: { enum: vocab("bodyArea") },
    color: HEX,
    secondaryColor: nullableHex,
    palette: { type: "array", items: HEX },
    category: { enum: vocab("category") },
    subcategory: { type: "string" },
    garmentType: { enum: vocab("garmentType") },
    material: { enum: vocab("material") },
    pattern: { enum: vocab("pattern") },
    silhouette: { enum: vocab("silhouette") },
    fit: { enum: vocab("fit") },
    style: { enum: vocab("style") },
    season: { type: "array", items: { enum: vocab("season") } },
    occasion: { type: "array", items: { enum: vocab("occasion") } },
    thermalWeight: { enum: [...vocab("thermalWeight"), null] },
    tags: { type: "array", items: { type: "string" }, maxItems: 24 },
    image: { type: "string" },
    thumbnail: { type: "string" },
    modeledImage: { anyOf: [{ type: "string" }, { type: "null" }] },
    importJobId: { type: "string" },
    schemaVersion: { type: "string" },
    fieldProvenance: {
      type: "object",
      additionalProperties: { enum: ONT.provenance }
    },
    source: { type: "object" },
    review: { type: "object" },
    sku: { type: "string" },
    brand: { type: "string" },
    collection: { type: "string" },
    price: { type: "number", minimum: 0 },
    currency: { type: "string", minLength: 3, maxLength: 3 },
    sizes: { type: "array", items: { type: "string" } },
    stock: { type: "integer", minimum: 0 },
    productUrl: { type: "string" }
  },
  additionalProperties: true,
  $comment: "subcategory se valida contra category en validate.mjs (dependencia condicional que JSON Schema puro no expresa cómodamente)."
};

const outfitSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: `https://fashion-studio-sol.dev/schemas/outfit/${ONT.version}`,
  title: "Outfit",
  _generated: "Generado por tools/build-schemas.mjs desde ontology.json. NO EDITAR.",
  description: "Outfit. Estados y vocabularios derivados de la Ontología V1 canónica.",
  type: "object",
  required: ["id", "name", "garmentIds"],
  properties: {
    id: { type: "string", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" },
    name: { type: "string", minLength: 1 },
    garmentIds: { type: "array", items: { type: "string" }, minItems: 1 },
    occasion: { type: "array", items: { enum: vocab("occasion") } },
    season: { type: "array", items: { enum: vocab("season") } },
    style: { anyOf: [{ enum: vocab("style") }, { type: "null" }] },
    description: { type: "string" },
    reason: { type: "string" },
    setting: { type: "string" },
    tags: { type: "array", items: { type: "string" } },
    image: { anyOf: [{ type: "string" }, { type: "null" }] },
    modeledImage: { type: "string" },
    flatLayImage: { anyOf: [{ type: "string" }, { type: "null" }] },
    status: { enum: ONT.outfitStatus.values },
    source: { type: "string" },
    createdAt: { type: "string" },
    updatedAt: { type: "string" },
    history: { type: "array" }
  },
  additionalProperties: true,
  $comment: "Conflictos de slot y existencia de garmentIds se validan contra la biblioteca en validate.mjs (no expresable en JSON Schema puro)."
};

const targets = [
  ["garment.schema.json", garmentSchema],
  ["outfit.schema.json", outfitSchema]
];

const check = process.argv.includes("--check");
let stale = 0;
for (const [file, obj] of targets) {
  const full = path.join(dir, file);
  const next = JSON.stringify(obj, null, 2) + "\n";
  if (check) {
    const cur = await readFile(full, "utf8").catch(() => "");
    if (cur !== next) { console.error(`DESINCRONIZADO: ${file} (ejecuta: node tools/build-schemas.mjs)`); stale++; }
  } else {
    await writeFile(full, next);
    console.log("generado", file);
  }
}
if (check && stale) process.exit(1);
if (check) console.log("schemas sincronizados con ontology.json");
