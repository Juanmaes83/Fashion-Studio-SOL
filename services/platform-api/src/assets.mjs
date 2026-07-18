import { randomUUID } from "node:crypto";
import { ApiError } from "./errors.mjs";
import { withTransaction } from "./db.mjs";

const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp"]);
const ALLOWED_KIND = new Set(["source", "crop", "reconstruction", "garment", "modeled", "editorial", "flatlay", "thumbnail"]);
export const PUBLIC_AS