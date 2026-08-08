#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const moduleRoot = dirname(fileURLToPath(import.meta.url));
const library = JSON.parse(readFileSync(resolve(moduleRoot, "data/female-pose-library.v1.json"), "utf8"));
const integrity = JSON.parse(readFileSync(resolve(moduleRoot, "data/prompt-integrity.sha256.json"), "utf8"));
const requiredFields = ["id", "name", "what", "pose", "location", "additional"];
const expectedEcommerceIds = Array.from({ length: 10 }, (_, index) => `S${String(index + 1).padStart(2, "0")}`);
const expectedEditorialIds = Array.from({ length: 10 }, (_, index) => `ED${index + 1}`);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function composePose(pose) {
  return `What\n${pose.what}\n\nPose\n${pose.pose}\n\nLocation\n${pose.location}\n\nAdditional\n${pose.additional}`;
}

function validateGroup(name, poses, expectedIds) {
  assert(Array.isArray(poses), `${name} must be an array`);
  assert(poses.length === 10, `${name} must contain exactly 10 poses`);
  assert(JSON.stringify(poses.map(({ id }) => id)) === JSON.stringify(expectedIds), `${name} IDs or order changed`);

  for (const pose of poses) {
    for (const field of requiredFields) {
      assert(typeof pose[field] === "string" && pose[field].length > 0, `${pose.id}.${field} is required`);
    }
    assert(sha256(composePose(pose)) === integrity.entries[pose.id], `${pose.id} canonical prompt integrity failed`);
  }
}

assert(library.schemaVersion === "1.0.0", "Unexpected schemaVersion");
assert(library.libraryId === "female-ecom-editorial-v1", "Unexpected libraryId");
assert(library.reference?.id === "FREF-01", "Canonical reference ID changed");
assert(typeof library.reference?.prompt === "string" && library.reference.prompt.length > 0, "Reference prompt is required");
assert(sha256(library.reference.prompt) === integrity.entries["FREF-01"], "Reference prompt integrity failed");
validateGroup("ecommerce", library.poses?.ecommerce, expectedEcommerceIds);
validateGroup("editorial", library.poses?.editorial, expectedEditorialIds);

const allIds = [
  library.reference.id,
  ...library.poses.ecommerce.map(({ id }) => id),
  ...library.poses.editorial.map(({ id }) => id)
];
assert(new Set(allIds).size === 21, "All 21 canonical IDs must be unique");

console.log("Pose library valid: 1 reference, 10 e-commerce poses, 10 editorial poses, integrity hashes verified.");
