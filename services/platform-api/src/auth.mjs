import { timingSafeEqual } from "node:crypto";
import { ApiError } from "./errors.mjs";

function equalSecret(a, b) {
  const left = Buffer.from(a || "");
  const right = Buffer.from(b || "");
  if (left.length !== right.length || left.length === 0) return false;
  return timingSafeEqual(left, right);
}

function isLoopback(req) {
  const remote = String(req.socket?.remoteAddress || "");
  return remote === "127.0.0.1" || remote === "::1" || remote === "::ffff:127.0.0.1";
}

export function requireAdmin(req, expectedToken, { allowLocalDemo = false } = {}) {
  if (allowLocalDemo && isLoopback(req)) return;
  if (!expectedToken) throw new ApiError(503, "AUTH_NOT_CONFIGURED", "Admin authentication is not configured");
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!equalSecret(token, expectedToken)) throw new ApiError(401, "UNAUTHORIZED", "Valid admin credentials are required");
}
