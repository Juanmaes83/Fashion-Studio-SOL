#!/usr/bin/env node
// Copia el contrato canónico de ontología a los consumidores (wardrobe).
// El canónico vive en packages/fashion-schema/ontology.json; las copias llevan
// la marca _generatedFrom y no deben editarse a mano.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const wIdx = args.indexOf("--wardrobe");
const wardrobeDir = path.resolve(wIdx >= 0 ? args[wIdx + 1] : "../wardrobe");
const src = path.resolve("packages/fashion-schema/ontology.json");
const ont = JSON.parse(await readFile(src, "utf8"));
ont._generatedFrom = "Fashion-Studio-SOL/packages/fashion-schema/ontology.json — NO EDITAR A MANO";
const dest = path.join(wardrobeDir, "public", "ontology.json");
await mkdir(path.dirname(dest), { recursive: true });
await writeFile(dest, JSON.stringify(ont, null, 2) + "\n");
console.log("ontología", ont.version, "→", dest);
