import { randomUUID } from "node:crypto";
import { ApiError, toErrorBody } from "./errors.mjs";
import { requireAdmin } from "./auth.mjs";
import { mapDatabaseError } from "./db.mjs";
import * as repo from "./repository.mjs";
import * as assets from "./assets.mjs";

const json = (res, status, body, requestId) => {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "x-request-id": requestId });
  res.end(status === 204 ? undefined : JSON.stringify(body));
};
const binary = (res, row, body, requestId) => {
  res.writeHead(200, { "content-type": row.mime_type, "content-length": body.length, "cache-control": row.visibility === "public" ? "public, max-age=31536000, immutable" : "private, no-store", "x-content-type-options": "nosniff", "x-request-id": requestId });
  res.end(body);
};
async function readJson(req, maxBytes) {
  let size = 0; const chunks = [];
  for await (const chunk of req) { size += chunk.length; if (size > maxBytes) throw new ApiError(413, "PAYLOAD_TOO_LARGE", "Payload exceeds configured limit"); chunks.push(chunk); }
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { throw new ApiError(400, "INVALID_JSON", "Request body must be valid JSON"); }
}
const match = (pathname, pattern) => {
  const keys = []; const source = pattern.replace(/:[^/]+/g, token => { keys.push(token.slice(1)); return "([^/]+)"; });
  const result = pathname.match(new RegExp(`^${source}$`));
  return result ? Object.fromEntries(keys.map((key, i) => [key, decodeURIComponent(result[i + 1])])) : null;
};

export function createApp({ pool, storage, adminToken, version = "dev", allowedOrigins = [], maxBodyBytes = 262144, maxAssetBytes = 15000000, uploadTtlSeconds = 900 }) {
  return async function app(req, res) {
    const requestId = typeof req.headers["x-request-id"] === "string" ? req.headers["x-request-id"].slice(0, 100) : randomUUID();
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) res.setHeader("access-control-allow-origin", origin);
    res.setHeader("vary", "origin");
    res.setHeader("access-control-allow-headers", "authorization,content-type,if-match,idempotency-key,x-request-id");
    res.setHeader("access-control-allow-methods", "GET,PUT,POST,PATCH,DELETE,OPTIONS");
    if (req.method === "OPTIONS") return json(res, 204, {}, requestId);
    try {
      const url = new URL(req.url, "http://api.local"); const path = url.pathname; let params;
      if (req.method === "GET" && path === "/health") return json(res, 200, { status: "ok" }, requestId);
      if (req.method === "GET" && path === "/ready") { await pool.query("SELECT 1"); return json(res, 200, { status: "ready", database: "ok", storage: "ok" }, requestId); }
      if (req.method === "GET" && path === "/version") return json(res, 200, { service: "platform-api", version, contract: "phase-2c/v1" }, requestId);

      if ((params = match(path, "/uploads/:assetId")) && req.method === "PUT") {
        storage.verifySignedPath({ method: "PUT", assetId: params.assetId, expires: url.searchParams.get("expires"), signature: url.searchParams.get("signature") });
        const row = await assets.getUploadTarget(pool, params.assetId);
        await storage.putAtomic({ key: row.storage_key, body: req, expectedSize: Number(row.byte_size), expectedChecksum: row.checksum_sha256, mimeType: row.mime_type });
        return json(res, 200, { uploaded: true, assetId: row.id }, requestId);
      }
      if ((params = match(path, "/assets/:assetId")) && req.method === "GET") {
        storage.verifySignedPath({ method: "GET", assetId: params.assetId, expires: url.searchParams.get("expires"), signature: url.searchParams.get("signature") });
        const row = await assets.getReadableAsset(pool, params.assetId); return binary(res, row, await storage.read(row.storage_key), requestId);
      }
      if ((params = match(path, "/public/assets/:assetId")) && req.method === "GET") {
        const row = await assets.getReadableAsset(pool, params.assetId, true); return binary(res, row, await storage.read(row.storage_key), requestId);
      }
      if ((params = match(path, "/public/projects/:projectSlug/catalog")) && req.method === "GET") return json(res, 200, await repo.getPublicCatalog(pool, params.projectSlug), requestId);
      if ((params = match(path, "/public/projects/:projectSlug/saved-looks")) && req.method === "POST") return json(res, 201, await repo.createSavedLook(pool, params.projectSlug, await readJson(req, maxBodyBytes)), requestId);
      if ((params = match(path, "/public/saved-looks/:token")) && req.method === "GET") return json(res, 200, await repo.getSavedLook(pool, params.token), requestId);

      if (path.startsWith("/admin/")) requireAdmin(req, adminToken);
      if ((params = match(path, "/admin/projects/:projectId/assets/upload-intent")) && req.method === "POST") return json(res, 201, await assets.createUploadIntent(pool, storage, params.projectId, await readJson(req, maxBodyBytes), req.headers["idempotency-key"], { maxAssetBytes, uploadTtlSeconds }), requestId);
      if ((params = match(path, "/admin/projects/:projectId/assets/:assetId/complete")) && req.method === "POST") return json(res, 200, await assets.completeAsset(pool, storage, params.projectId, params.assetId), requestId);
      if ((params = match(path, "/admin/projects/:projectId/assets/:assetId/promote")) && req.method === "POST") return json(res, 200, await assets.promoteAsset(pool, storage, params.projectId, params.assetId, await readJson(req, maxBodyBytes)), requestId);
      if ((params = match(path, "/admin/projects/:projectId/assets/:assetId/withdraw")) && req.method === "POST") return json(res, 200, await assets.withdrawAsset(pool, storage, params.projectId, params.assetId), requestId);
      if ((params = match(path, "/admin/projects/:projectId/assets/:assetId")) && req.method === "GET") return json(res, 200, await assets.getAsset(pool, storage, params.projectId, params.assetId), requestId);
      if ((params = match(path, "/admin/projects/:projectId/assets/:assetId")) && req.method === "DELETE") return json(res, 200, await assets.deleteAsset(pool, storage, params.projectId, params.assetId), requestId);
      if ((params = match(path, "/admin/projects/:projectId/garments")) && req.method === "GET") return json(res, 200, { items: await repo.listGarments(pool, params.projectId) }, requestId);
      if ((params = match(path, "/admin/projects/:projectId/garments/:garmentId")) && req.method === "GET") return json(res, 200, await repo.getGarment(pool, params.projectId, params.garmentId), requestId);
      if ((params = match(path, "/admin/projects/:projectId/garments")) && req.method === "POST") return json(res, 201, await repo.createGarment(pool, params.projectId, await readJson(req, maxBodyBytes)), requestId);
      if ((params = match(path, "/admin/projects/:projectId/garments/:garmentId")) && req.method === "PATCH") return json(res, 200, await repo.updateGarment(pool, params.projectId, params.garmentId, await readJson(req, maxBodyBytes), Number(String(req.headers["if-match"] || "").replaceAll('"', ""))), requestId);
      if ((params = match(path, "/admin/projects/:projectId/outfits")) && req.method === "GET") return json(res, 200, { items: await repo.listOutfits(pool, params.projectId) }, requestId);
      if ((params = match(path, "/admin/projects/:projectId/outfits")) && req.method === "POST") return json(res, 201, await repo.createOutfit(pool, params.projectId, await readJson(req, maxBodyBytes)), requestId);
      if ((params = match(path, "/admin/projects/:projectId/outfits/:outfitId/transitions")) && req.method === "POST") { const body = await readJson(req, maxBodyBytes); return json(res, 200, await repo.transitionOutfit(pool, params.projectId, params.outfitId, body.action), requestId); }
      if ((params = match(path, "/admin/projects/:projectId/publications")) && req.method === "POST") return json(res, 201, await repo.createPublication(pool, params.projectId), requestId);
      if ((params = match(path, "/admin/projects/:projectId/publications/:publicationId/withdraw")) && req.method === "POST") return json(res, 200, await repo.withdrawPublication(pool, params.projectId, params.publicationId), requestId);
      if ((params = match(path, "/admin/projects/:projectId/saved-looks/:savedLookId")) && req.method === "DELETE") return json(res, 200, await repo.revokeSavedLook(pool, params.projectId, params.savedLookId), requestId);
      throw new ApiError(404, "NOT_FOUND", "Route not found");
    } catch (error) {
      const safe = toErrorBody(mapDatabaseError(error), requestId); json(res, safe.status, safe.body, requestId);
    }
  };
}
