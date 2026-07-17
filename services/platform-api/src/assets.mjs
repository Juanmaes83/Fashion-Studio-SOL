import { randomUUID } from "node:crypto";
import { ApiError } from "./errors.mjs";
import { withTransaction } from "./db.mjs";

const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp"]);
const ALLOWED_KIND = new Set(["source", "crop", "reconstruction", "editorial", "flatlay", "thumbnail"]);
const SHA256 = /^[0-9a-f]{64}$/i;
const SAFE_FILENAME = /^[^\\/\u0000-\u001f\u007f]{1,255}$/;

function publicRow(row) {
  return {
    id: row.id, projectId: row.project_id, garmentId: row.garment_id, outfitId: row.outfit_id,
    kind: row.kind, visibility: row.visibility, status: row.status, mimeType: row.mime_type,
    byteSize: Number(row.byte_size), checksumSha256: row.checksum_sha256,
    width: row.width, height: row.height, originalFilename: row.original_filename,
    uploadExpiresAt: row.upload_expires_at, completedAt: row.completed_at, createdAt: row.created_at
  };
}

async function requireOwner(pool, projectId, garmentId, outfitId) {
  if (garmentId && outfitId) throw new ApiError(422, "ASSET_OWNER_INVALID", "Asset can have only one owner");
  if (garmentId) {
    const r = await pool.query("SELECT 1 FROM garments WHERE project_id=$1 AND id=$2", [projectId, garmentId]);
    if (!r.rowCount) throw new ApiError(422, "ASSET_OWNER_INVALID", "Garment owner not found");
  }
  if (outfitId) {
    const r = await pool.query("SELECT 1 FROM outfits WHERE project_id=$1 AND id=$2", [projectId, outfitId]);
    if (!r.rowCount) throw new ApiError(422, "ASSET_OWNER_INVALID", "Outfit owner not found");
  }
}

export async function createUploadIntent(pool, storage, projectId, input, idempotencyKey, { maxAssetBytes = 15_000_000, uploadTtlSeconds = 900 } = {}) {
  if (!idempotencyKey || idempotencyKey.length > 200) throw new ApiError(400, "IDEMPOTENCY_REQUIRED", "Idempotency-Key is required");
  if (!SAFE_FILENAME.test(input.filename || "")) throw new ApiError(422, "FILENAME_INVALID", "Filename is invalid");
  if (!ALLOWED_MIME.has(input.mimeType)) throw new ApiError(422, "MIME_NOT_ALLOWED", "MIME type is not allowed");
  if (!ALLOWED_KIND.has(input.kind)) throw new ApiError(422, "ASSET_KIND_INVALID", "Asset kind is invalid");
  if (!Number.isInteger(input.byteSize) || input.byteSize < 1 || input.byteSize > maxAssetBytes) throw new ApiError(422, "ASSET_SIZE_INVALID", "Asset size is invalid");
  if (!SHA256.test(input.checksumSha256 || "")) throw new ApiError(422, "CHECKSUM_INVALID", "Checksum must be SHA-256");
  await requireOwner(pool, projectId, input.garmentId, input.outfitId);

  const existing = await pool.query("SELECT * FROM assets WHERE project_id=$1 AND idempotency_key=$2 AND status<>'deleted'", [projectId, idempotencyKey]);
  if (existing.rowCount) return intentResponse(storage, existing.rows[0]);

  const id = randomUUID();
  const storageKey = storage.makeKey({ projectId, assetId: id, visibility: "private", filename: input.filename });
  const expiresAt = new Date(Date.now() + uploadTtlSeconds * 1000);
  const result = await pool.query(`INSERT INTO assets(id,project_id,garment_id,outfit_id,kind,visibility,status,storage_key,mime_type,byte_size,checksum_sha256,width,height,metadata,original_filename,idempotency_key,upload_expires_at)
    VALUES($1,$2,$3,$4,$5,'private','pending',$6,$7,$8,$9,$10,$11,$12::jsonb,$13,$14,$15) RETURNING *`,
    [id, projectId, input.garmentId || null, input.outfitId || null, input.kind, storageKey, input.mimeType, input.byteSize, input.checksumSha256.toLowerCase(), input.width || null, input.height || null, JSON.stringify(input.metadata || {}), input.filename, idempotencyKey, expiresAt]);
  return intentResponse(storage, result.rows[0]);
}

function intentResponse(storage, row) {
  if (row.status !== "pending") return { asset: publicRow(row), alreadyCompleted: true };
  const ttl = Math.max(1, Math.floor((new Date(row.upload_expires_at).getTime() - Date.now()) / 1000));
  const signed = storage.signedPath({ method: "PUT", assetId: row.id, expiresInSeconds: ttl });
  return { asset: publicRow(row), upload: { method: "PUT", path: `/uploads/${row.id}?expires=${signed.expires}&signature=${signed.signature}`, expiresAt: row.upload_expires_at } };
}

export async function getUploadTarget(pool, assetId) {
  const result = await pool.query("SELECT * FROM assets WHERE id=$1", [assetId]);
  if (!result.rowCount) throw new ApiError(404, "ASSET_NOT_FOUND", "Asset not found");
  const row = result.rows[0];
  if (row.status !== "pending") throw new ApiError(409, "ASSET_NOT_PENDING", "Asset is not awaiting upload");
  if (new Date(row.upload_expires_at) <= new Date()) throw new ApiError(410, "UPLOAD_EXPIRED", "Upload intent expired");
  return row;
}

export async function completeAsset(pool, storage, projectId, assetId) {
  const result = await pool.query("SELECT * FROM assets WHERE project_id=$1 AND id=$2", [projectId, assetId]);
  if (!result.rowCount) throw new ApiError(404, "ASSET_NOT_FOUND", "Asset not found");
  const row = result.rows[0];
  if (row.status === "ready") return publicRow(row);
  if (row.status !== "pending") throw new ApiError(409, "ASSET_STATE_INVALID", "Asset cannot be completed");
  if (!await storage.exists(row.storage_key)) throw new ApiError(409, "UPLOAD_MISSING", "Uploaded object is missing");
  const updated = await pool.query("UPDATE assets SET status='ready',completed_at=now(),updated_at=now() WHERE project_id=$1 AND id=$2 AND status='pending' RETURNING *", [projectId, assetId]);
  return publicRow(updated.rows[0]);
}

export async function getAsset(pool, storage, projectId, assetId) {
  const result = await pool.query("SELECT * FROM assets WHERE project_id=$1 AND id=$2 AND status<>'deleted'", [projectId, assetId]);
  if (!result.rowCount) throw new ApiError(404, "ASSET_NOT_FOUND", "Asset not found");
  const row = result.rows[0];
  const response = publicRow(row);
  if (row.status === "ready") {
    const signed = storage.signedPath({ method: "GET", assetId: row.id });
    response.download = { path: `/assets/${row.id}?expires=${signed.expires}&signature=${signed.signature}`, expires: signed.expires };
  }
  if (row.visibility === "public" && row.status === "ready") response.publicPath = `/public/assets/${row.id}`;
  return response;
}

export async function getReadableAsset(pool, assetId, requirePublic = false) {
  const result = await pool.query("SELECT * FROM assets WHERE id=$1 AND status='ready'", [assetId]);
  if (!result.rowCount || (requirePublic && result.rows[0].visibility !== "public")) throw new ApiError(404, "ASSET_NOT_FOUND", "Asset not found");
  return result.rows[0];
}

export async function promoteAsset(pool, storage, projectId, assetId, input, actor = "admin") {
  if (input.decision !== "approved") throw new ApiError(422, "ASSET_APPROVAL_REQUIRED", "Explicit approval is required");
  return withTransaction(pool, async client => {
    const result = await client.query("SELECT * FROM assets WHERE project_id=$1 AND id=$2 FOR UPDATE", [projectId, assetId]);
    if (!result.rowCount) throw new ApiError(404, "ASSET_NOT_FOUND", "Asset not found");
    const row = result.rows[0];
    if (row.status !== "ready") throw new ApiError(409, "ASSET_NOT_READY", "Only ready assets can be promoted");
    if (row.visibility === "public") return publicRow(row);
    const publicKey = storage.makeKey({ projectId, assetId, visibility: "public", filename: row.original_filename });
    await storage.move(row.storage_key, publicKey);
    await client.query("INSERT INTO reviews(project_id,entity_type,entity_id,decision,note,actor) VALUES($1,'asset',$2,'approved',$3,$4)", [projectId, assetId, input.note || null, actor]);
    const updated = await client.query("UPDATE assets SET visibility='public',storage_key=$3,updated_at=now() WHERE project_id=$1 AND id=$2 RETURNING *", [projectId, assetId, publicKey]);
    return publicRow(updated.rows[0]);
  });
}

export async function withdrawAsset(pool, storage, projectId, assetId) {
  return withTransaction(pool, async client => {
    const result = await client.query("SELECT * FROM assets WHERE project_id=$1 AND id=$2 FOR UPDATE", [projectId, assetId]);
    if (!result.rowCount) throw new ApiError(404, "ASSET_NOT_FOUND", "Asset not found");
    const row = result.rows[0];
    if (row.status !== "ready" || row.visibility !== "public") throw new ApiError(409, "ASSET_NOT_PUBLIC", "Asset is not public");
    const internalKey = storage.makeKey({ projectId, assetId, visibility: "internal", filename: row.original_filename });
    await storage.move(row.storage_key, internalKey);
    const updated = await client.query("UPDATE assets SET visibility='internal',storage_key=$3,updated_at=now() WHERE project_id=$1 AND id=$2 RETURNING *", [projectId, assetId, internalKey]);
    return publicRow(updated.rows[0]);
  });
}

export async function deleteAsset(pool, storage, projectId, assetId) {
  const result = await pool.query("SELECT * FROM assets WHERE project_id=$1 AND id=$2 AND status<>'deleted'", [projectId, assetId]);
  if (!result.rowCount) throw new ApiError(404, "ASSET_NOT_FOUND", "Asset not found");
  const row = result.rows[0];
  if (row.visibility === "public") throw new ApiError(409, "PUBLIC_ASSET_PROTECTED", "Withdraw public asset before deleting it");
  await storage.delete(row.storage_key);
  const updated = await pool.query("UPDATE assets SET status='deleted',deleted_at=now(),updated_at=now() WHERE project_id=$1 AND id=$2 RETURNING id,status,deleted_at", [projectId, assetId]);
  return updated.rows[0];
}
