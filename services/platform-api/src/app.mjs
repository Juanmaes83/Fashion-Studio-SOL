import { randomUUID } from "node:crypto";
import { ApiError, toErrorBody } from "./errors.mjs";
import { requireAdmin } from "./auth.mjs";
import { mapDatabaseError } from "./db.mjs";
import * as repo from "./repository.mjs";

const json = (res, status, body, requestId) => {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "x-request-id": requestId });
  res.end(JSON.stringify(body));
};

async function readJson(req, maxBytes) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) throw new ApiError(413, "PAYLOAD_TOO_LARGE", "Payload exceeds configured limit");
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { throw new ApiError(400, "INVALID_JSON", "Request body must be valid JSON"); }
}

const match = (pathname, pattern) => {
  const keys = [];
  const source = pattern.replace(/:[^/]+/g, token => { keys.push(token.slice(1)); return "([^/]+)"; });
  const result = pathname.match(new RegExp(`^${source}$`));
  if (!result) return null;
  return Object.fromEntries(keys.map((key, i) => [key, decodeURIComponent(result[i + 1])]));
};

export function createApp({ pool, adminToken, version = "dev", allowedOrigins = [], maxBodyBytes = 262144 }) {
  return async function app(req, res) {
    const requestId = typeof req.headers["x-request-id"] === "string" ? req.headers["x-request-id"].slice(0, 100) : randomUUID();
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) res.setHeader("access-control-allow-origin", origin);
    res.setHeader("vary", "origin");
    res.setHeader("access-control-allow-headers", "authorization,content-type,if-match,idempotency-key,x-request-id");
    res.setHeader("access-control-allow-methods", "GET,POST,PATCH,DELETE,OPTIONS");
    if (req.method === "OPTIONS") return json(res, 204, {}, requestId);

    try {
      const url = new URL(req.url, "http://api.local");
      const path = url.pathname;
      if (req.method === "GET" && path === "/health") return json(res, 200, { status: "ok" }, requestId);
      if (req.method === "GET" && path === "/ready") {
        await pool.query("SELECT 1");
        return json(res, 200, { status: "ready", database: "ok" }, requestId);
      }
      if (req.method === "GET" && path === "/version") return json(res, 200, { service: "platform-api", version, contract: "phase-2b/v1" }, requestId);

      let params;
      if ((params = match(path, "/public/projects/:projectSlug/catalog")) && req.method === "GET") return json(res, 200, await repo.getPublicCatalog(pool, params.projectSlug), requestId);
      if ((params = match(path, "/public/projects/:projectSlug/saved-looks")) && req.method === "POST") return json(res, 201, await repo.createSavedLook(pool, params.projectSlug, await readJson(req, maxBodyBytes)), requestId);
      if ((params = match(path, "/public/saved-looks/:token")) && req.method === "GET") return json(res, 200, await repo.getSavedLook(pool, params.token), requestId);

      if (path.startsWith("/admin/")) requireAdmin(req, adminToken);
      if ((params = match(path, "/admin/projects/:projectId/garments")) && req.method === "GET") return json(res, 200, { items: await repo.listGarments(pool, params.projectId) }, requestId);
      if ((params = match(path, "/admin/projects/:projectId/garments/:garmentId")) && req.method === "GET") return json(res, 200, await repo.getGarment(pool, params.projectId, params.garmentId), requestId);
      if ((params = match(path, "/admin/projects/:projectId/garments")) && req.method === "POST") return json(res, 201, await repo.createGarment(pool, params.projectId, await readJson(req, maxBodyBytes)), requestId);
      if ((params = match(path, "/admin/projects/:projectId/garments/:garmentId")) && req.method === "PATCH") {
        const versionHeader = req.headers["if-match"];
        const expectedVersion = Number(String(versionHeader || "").replaceAll('"', ""));
        return json(res, 200, await repo.updateGarment(pool, params.projectId, params.garmentId, await readJson(req, maxBodyBytes), expectedVersion), requestId);
      }
      if ((params = match(path, "/admin/projects/:projectId/outfits")) && req.method === "GET") return json(res, 200, { items: await repo.listOutfits(pool, params.projectId) }, requestId);
      if ((params = match(path, "/admin/projects/:projectId/outfits")) && req.method === "POST") return json(res, 201, await repo.createOutfit(pool, params.projectId, await readJson(req, maxBodyBytes)), requestId);
      if ((params = match(path, "/admin/projects/:projectId/outfits/:outfitId/transitions")) && req.method === "POST") {
        const body = await readJson(req, maxBodyBytes);
        return json(res, 200, await repo.transitionOutfit(pool, params.projectId, params.outfitId, body.action), requestId);
      }
      if ((params = match(path, "/admin/projects/:projectId/publications")) && req.method === "POST") return json(res, 201, await repo.createPublication(pool, params.projectId), requestId);
      if ((params = match(path, "/admin/projects/:projectId/publications/:publicationId/withdraw")) && req.method === "POST") return json(res, 200, await repo.withdrawPublication(pool, params.projectId, params.publicationId), requestId);
      if ((params = match(path, "/admin/projects/:projectId/saved-looks/:savedLookId")) && req.method === "DELETE") return json(res, 200, await repo.revokeSavedLook(pool, params.projectId, params.savedLookId), requestId);

      throw new ApiError(404, "NOT_FOUND", "Route not found");
    } catch (error) {
      const mapped = mapDatabaseError(error);
      const safe = toErrorBody(mapped, requestId);
      json(res, safe.status, safe.body, requestId);
    }
  };
}
