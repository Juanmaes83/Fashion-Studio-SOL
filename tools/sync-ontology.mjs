#!/usr/bin/env node
// Vendoriza el contrato canónico COMPLETO (ontología + validador) a los consumidores.
// Wardrobe importa el MISMO código ejecutable, no una réplica manual: ninguna regla
// puede divergir. Las copias llevan cabecera _generated y no deben editarse a mano.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(here, "../packages/fashion-schema");
const args = process.argv.slice(2);
const wIdx = args.indexOf("--wardrobe");
const wardrobeDir = path.resolve(wIdx >= 0 ? args[wIdx + 1] : "../wardrobe");
const destDir = path.join(wardrobeDir, "vendor", "fashion-schema");
await mkdir(destDir, { recursive: true });

const ont = JSON.parse(await readFile(path.join(srcDir, "ontology.json"), "utf8"));

// ontology.json (con marca)
const ontOut = { ...ont, _generatedFrom: "Fashion-Studio-SOL/packages/fashion-schema — NO EDITAR A MANO" };
await writeFile(path.join(destDir, "ontology.json"), JSON.stringify(ontOut, null, 2) + "\n");

// validate.mjs (copia byte-a-byte + cabecera; resuelve ontology.json en su propio dir)
const validator = await readFile(path.join(srcDir, "validate.mjs"), "utf8");
const header = `// GENERADO por Fashion-Studio-SOL/tools/sync-ontology.mjs — NO EDITAR.\n` +
  `// Copia canónica de packages/fashion-schema/validate.mjs (ontología v${ont.version}).\n`;
await writeFile(path.join(destDir, "validate.mjs"), header + validator);

console.log(`vendorizado contrato v${ont.version} → ${destDir} (ontology.json + validate.mjs)`);
