#!/usr/bin/env node
// Prepara datos de test DETERMINISTAS y reproducibles desde un clon limpio.
// No usa rutas personales, ni datos privados, ni el catálogo generado a mano.
// Cadena: genera fixture-wardrobe sintético → migra a Ontología V1 → exporta a MIRRORA.
// Salidas (todas repo-relativas, gitignoradas):
//   tmp/fixture-wardrobe/data/{library.json,outfits.json,imported,outfit-images}
//   tmp/fixture-catalog/{catalog.json,images}
import { execFileSync } from "node:child_process";
import { cp, rm, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tmp = path.join(root, "tmp");
const fixtureWardrobe = path.join(tmp, "fixture-wardrobe");
const fixtureCatalog = path.join(tmp, "fixture-catalog");
const run = (script, args) => execFileSync(process.execPath, [path.join(root, "tools", script), ...args], { stdio: "inherit" });

await rm(tmp, { recursive: true, force: true });
await mkdir(fixtureWardrobe, { recursive: true });

// 1) fixture sintético con el layout real de wardrobe (PNGs alpha deterministas)
run("make-demo-fixtures.mjs", []);
await cp(path.join(root, "examples", "demo-wardrobe", "data"), path.join(fixtureWardrobe, "data"), { recursive: true });

// 2) migración a Ontología V1
run("migrate-library-v1.mjs", ["--wardrobe", fixtureWardrobe]);

// 3) exportación con validación íntegra + gate de publicación
run("export-to-mirrora.mjs", ["--wardrobe", fixtureWardrobe, "--out", fixtureCatalog, "--brand", "fixture-brand", "--campaign", "fixture", "--price", "0"]);

console.log("\nDatos de test listos:\n  " + fixtureWardrobe + "\n  " + fixtureCatalog);
