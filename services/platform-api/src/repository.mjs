import { createHash, randomBytes } from "node:crypto";
import { ApiError } from "./errors.mjs";
import { withTransaction } from "./db.mjs";
import { reviewTransition, sanitizeNewOutfitStatus, validateGarment, validateOutfit } from "../../../packages/fashion-schema/validate.mjs";

const hashToken = token => createHash("sha256").update(token).digest("hex");
const asJson = value => JSON.stringify(value ?? null);
const rowToGarment = row => ({
  id: row.id, name: row.name, description: row.description, bodyArea: row.body_area,
  part: row.part, category: row.category, subcategory: row.subcategory,
  garmentType: row.garment_type, material: row.material, pattern: row.pattern,
  silhouette: row.silhouette, fit: row.fit, style: row.style, season: row.season,
  occasion: row.occasion, thermalWeight: row.thermal_weight, color: row.color,
  secondaryColor: row.secondary_color, tags: row.tags, fieldProvenance: row.field_provenance,
  source: row.source, review: row.review, version: row.version
});
const rowToOutfit = row => ({
  id: row.id, name: row.name, description: row.description, style: row.style,
  occasion: row.occasion, season: row.season, tags: row.tags, status: row.status,
  source: row.source, version: row.version, garmentIds: row.garment_ids || []
});

export async function listGarments(pool, projectId) {
  const result = await pool.query("SELECT * FROM garments WHERE project_id=$1 ORDER BY created_at,id", [projectId]);
  return result.rows.map(rowToGarment);
}

export async function getGarment(pool, projectId, id) {
  const result = await pool.query("SELECT * FROM garments WHERE project_id=$1 AND id=$2", [projectId, id]);
  if (!result.rowCount) throw new ApiError(404, "GARMENT_NOT_FOUND", "Garment not found");
  return rowToGarment(result.rows[0]);
}

export async function createGarment(pool, projectId, input) {
  const garment = { ...input, id: input.id };
  const validation = validateGarment(garment);
  if (!validation.ok) throw new ApiError(422, "GARMENT_INVALID", "Garment is invalid", validation.errors);
  const values = [garment.id, projectId, garment.name, garment.description || "", garment.part || garment.bodyArea,
    garment.bodyArea || garment.part, garment.category || null, garment.subcategory || null,
    garment.garmentType || null, garment.material || null, garment.pattern || null,
    garment.silhouette || null, garment.fit || null, garment.style || null,
    asJson(garment.season || []), asJson(garment.occasion || []), garment.thermalWeight || null,
    garment.color || null, garment.secondaryColor || null, asJson(garment.tags || []),
    asJson(garment.fieldProvenance || {}), asJson(garment.source || {}), asJson(garment.review || {})];
  const sql = `INSERT INTO garments(id,project_id,name,description,part,body_area,category,subcategory,garment_type,material,pattern,silhouette,fit,style,season,occasion,thermal_weight,color,secondary_color,tags,field_provenance,source,review)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23) RETURNING *`;
  return rowToGarment((await pool.query(sql, values)).rows[0]);
}

export async function updateGarment(pool, projectId, id, patch, expectedVersion) {
  const current = await getGarment(pool, projectId, id);
  if (!Number.isInteger(expectedVersion)) throw new ApiError(428, "VERSION_REQUIRED", "If-Match version is required");
  const next = { ...current, ...patch, id };
  const validation = validateGarment(next);
  if (!validation.ok) throw new ApiError(422, "GARMENT_INVALID", "Garment is invalid", validation.errors);
  const result = await pool.query(`UPDATE garments SET name=$3,description=$4,part=$5,body_area=$6,category=$7,subcategory=$8,garment_type=$9,material=$10,pattern=$11,silhouette=$12,fit=$13,style=$14,season=$15,occasion=$16,thermal_weight=$17,color=$18,secondary_color=$19,tags=$20,field_provenance=$21,source=$22,review=$23,version=version+1,updated_at=now() WHERE project_id=$1 AND id=$2 AND version=$24 RETURNING *`,
    [projectId,id,next.name,next.description||"",next.part||next.bodyArea,next.bodyArea||next.part,next.category||null,next.subcategory||null,next.garmentType||null,next.material||null,next.pattern||null,next.silhouette||null,next.fit||null,next.style||null,asJson(next.season||[]),asJson(next.occasion||[]),next.thermalWeight||null,next.color||null,next.secondaryColor||null,asJson(next.tags||[]),asJson(next.fieldProvenance||{}),asJson(next.source||{}),asJson(next.review||{}),expectedVersion]);
  if (!result.rowCount) throw new ApiError(409, "VERSION_CONFLICT", "Garment changed since it was read");
  return rowToGarment(result.rows[0]);
}

async function loadOutfit(pool, projectId, id) {
  const result = await pool.query(`SELECT o.*,COALESCE(jsonb_agg(oi.garment_id ORDER BY oi.position) FILTER (WHERE oi.garment_id IS NOT NULL),'[]') garment_ids FROM outfits o LEFT JOIN outfit_items oi ON oi.project_id=o.project_id AND oi.outfit_id=o.id WHERE o.project_id=$1 AND o.id=$2 GROUP BY o.id`, [projectId,id]);
  if (!result.rowCount) throw new ApiError(404, "OUTFIT_NOT_FOUND", "Outfit not found");
  return rowToOutfit(result.rows[0]);
}

export async function listOutfits(pool, projectId) {
  const result = await pool.query(`SELECT o.*,COALESCE(jsonb_agg(oi.garment_id ORDER BY oi.position) FILTER (WHERE oi.garment_id IS NOT NULL),'[]') garment_ids FROM outfits o LEFT JOIN outfit_items oi ON oi.project_id=o.project_id AND oi.outfit_id=o.id WHERE o.project_id=$1 GROUP BY o.id ORDER BY o.created_at,o.id`, [projectId]);
  return result.rows.map(rowToOutfit);
}

export async function createOutfit(pool, projectId, input) {
  return withTransaction(pool, async client => {
    const garments = await listGarments(client, projectId);
    const garmentMap = Object.fromEntries(garments.map(g => [g.id,g]));
    const outfit = { ...input, status: sanitizeNewOutfitStatus() };
    const validation = validateOutfit(outfit, garmentMap);
    if (!validation.ok) throw new ApiError(422, "OUTFIT_INVALID", "Outfit is invalid", validation.errors);
    const created = (await client.query(`INSERT INTO outfits(id,project_id,name,description,style,occasion,season,tags,status,source) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`, [outfit.id,projectId,outfit.name,outfit.description||"",outfit.style||null,asJson(outfit.occasion||[]),asJson(outfit.season||[]),asJson(outfit.tags||[]),outfit.status,outfit.source||"manual"])).rows[0];
    for (const [position, garmentId] of outfit.garmentIds.entries()) await client.query("INSERT INTO outfit_items(project_id,outfit_id,garment_id,position) VALUES($1,$2,$3,$4)",[projectId,outfit.id,garmentId,position]);
    return { ...rowToOutfit(created), garmentIds: outfit.garmentIds };
  });
}

export async function transitionOutfit(pool, projectId, id, action, actor="admin") {
  return withTransaction(pool, async client => {
    const current = await loadOutfit(client, projectId, id);
    const transition = reviewTransition(current.status, action);
    if (!transition.ok) throw new ApiError(409, "OUTFIT_TRANSITION_INVALID", transition.error);
    const updated = (await client.query("UPDATE outfits SET status=$3,version=version+1,updated_at=now() WHERE project_id=$1 AND id=$2 RETURNING *",[projectId,id,transition.status])).rows[0];
    await client.query("INSERT INTO state_transitions(project_id,entity_type,entity_id,from_state,to_state,action,actor) VALUES($1,'outfit',$2,$3,$4,$5,$6)",[projectId,id,current.status,transition.status,action,actor]);
    return { ...rowToOutfit(updated), garmentIds: current.garmentIds };
  });
}

export async function createPublication(pool, projectId, publishedBy="admin") {
  return withTransaction(pool, async client => {
    const outfits = (await listOutfits(client, projectId)).filter(o => ["approved","published"].includes(o.status));
    const garments = await listGarments(client, projectId);
    const garmentMap = Object.fromEntries(garments.map(g => [g.id,g]));
    for (const outfit of outfits) {
      const validation = validateOutfit(outfit, garmentMap);
      if (!validation.ok) throw new ApiError(422,"PUBLICATION_INVALID","Publication contains invalid outfits",validation.errors);
    }
    const assetRows = (await client.query(`SELECT id,garment_id,outfit_id,kind,mime_type,width,height,checksum_sha256
      FROM assets WHERE project_id=$1 AND status='ready' AND visibility='public'
      AND kind = ANY($2::text[]) ORDER BY created_at,id`, [projectId,["modeled","editorial","flatlay","thumbnail"]])).rows;
    const assets = assetRows.map(row => ({
      id: row.id,
      garmentId: row.garment_id,
      outfitId: row.outfit_id,
      kind: row.kind,
      mimeType: row.mime_type,
      width: row.width,
      height: row.height,
      checksumSha256: row.checksum_sha256,
      url: `/public/assets/${row.id}`
    }));
    const byGarment = new Map();
    const byOutfit = new Map();
    for (const asset of assets) {
      if (asset.garmentId) (byGarment.get(asset.garmentId) || byGarment.set(asset.garmentId, []).get(asset.garmentId)).push(asset);
      if (asset.outfitId) (byOutfit.get(asset.outfitId) || byOutfit.set(asset.outfitId, []).get(asset.outfitId)).push(asset);
    }
    const publishedGarments = garments.map(g => ({ ...g, assets: byGarment.get(g.id) || [] }));
    const publishedOutfits = outfits.map(o => ({ ...o, assets: byOutfit.get(o.id) || [] }));
    const snapshot = { schemaVersion: "catalog/v2", projectId, garments: publishedGarments, outfits: publishedOutfits, assets, generatedAt: new Date().toISOString() };
    const checksum = createHash("sha256").update(JSON.stringify(snapshot)).digest("hex");
    await client.query("UPDATE publications SET status='withdrawn',withdrawn_at=now() WHERE project_id=$1 AND status='active'",[projectId]);
    const version = Number((await client.query("SELECT COALESCE(MAX(version),0)+1 value FROM publications WHERE project_id=$1",[projectId])).rows[0].value);
    return (await client.query("INSERT INTO publications(project_id,version,snapshot,checksum_sha256,published_by) VALUES($1,$2,$3,$4,$5) RETURNING id,project_id,version,status,checksum_sha256,published_at",[projectId,version,asJson(snapshot),checksum,publishedBy])).rows[0];
  });
}

export async function withdrawPublication(pool, projectId, publicationId) {
  const result = await pool.query("UPDATE publications SET status='withdrawn',withdrawn_at=now() WHERE project_id=$1 AND id=$2 AND status='active' RETURNING id,status,withdrawn_at",[projectId,publicationId]);
  if (!result.rowCount) throw new ApiError(404,"PUBLICATION_NOT_FOUND","Active publication not found");
  return result.rows[0];
}

export async function getPublicCatalog(pool, projectSlug) {
  const result = await pool.query(`SELECT p.snapshot FROM publications p JOIN projects pr ON pr.id=p.project_id WHERE pr.slug=$1 AND p.status='active' ORDER BY p.version DESC LIMIT 1`,[projectSlug]);
  if (!result.rowCount) throw new ApiError(404,"CATALOG_NOT_FOUND","Published catalog not found");
  return result.rows[0].snapshot;
}

export async function createSavedLook(pool, projectSlug, input) {
  const project = await pool.query("SELECT id FROM projects WHERE slug=$1",[projectSlug]);
  if (!project.rowCount) throw new ApiError(404,"PROJECT_NOT_FOUND","Project not found");
  const projectId = project.rows[0].id;
  const catalog = await getPublicCatalog(pool, projectSlug);
  const allowed = new Set(catalog.garments.map(g => g.id));
  if (!Array.isArray(input.garmentIds) || !input.garmentIds.length || input.garmentIds.some(id => !allowed.has(id))) throw new ApiError(422,"SAVED_LOOK_INVALID","SavedLook contains unavailable garments");
  if (input.outfitId && !catalog.outfits.some(o => o.id === input.outfitId)) throw new ApiError(422,"SAVED_LOOK_INVALID","SavedLook outfit is unavailable");
  const token = randomBytes(32).toString("base64url");
  const expiresAt = input.expiresAt || null;
  const row = (await pool.query("INSERT INTO saved_looks(project_id,public_token_hash,outfit_id,garment_ids,expires_at) VALUES($1,$2,$3,$4,$5) RETURNING id,expires_at,created_at",[projectId,hashToken(token),input.outfitId||null,asJson(input.garmentIds),expiresAt])).rows[0];
  return { ...row, token, url: `/public/saved-looks/${token}` };
}

export async function getSavedLook(pool, token) {
  const result = await pool.query(`SELECT sl.id,sl.project_id,pr.slug project_slug,sl.outfit_id,sl.garment_ids,sl.expires_at,sl.revoked_at,sl.created_at
    FROM saved_looks sl JOIN projects pr ON pr.id=sl.project_id WHERE sl.public_token_hash=$1`,[hashToken(token)]);
  if (!result.rowCount) throw new ApiError(404,"SAVED_LOOK_NOT_FOUND","SavedLook not found");
  const row = result.rows[0];
  if (row.revoked_at || (row.expires_at && new Date(row.expires_at) <= new Date())) throw new ApiError(410,"SAVED_LOOK_UNAVAILABLE","SavedLook is no longer available");
  await pool.query("UPDATE saved_looks SET last_accessed_at=now() WHERE id=$1",[row.id]);
  const catalog = await getPublicCatalog(pool, row.project_slug);
  const garmentSet = new Set(row.garment_ids || []);
  return {
    id: row.id,
    projectId: row.project_id,
    projectSlug: row.project_slug,
    outfitId: row.outfit_id,
    garmentIds: row.garment_ids,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    garments: catalog.garments.filter(g => garmentSet.has(g.id)),
    outfit: row.outfit_id ? catalog.outfits.find(o => o.id === row.outfit_id) || null : null
  };
}

export async function revokeSavedLook(pool, projectId, id) {
  const result = await pool.query("UPDATE saved_looks SET revoked_at=now() WHERE project_id=$1 AND id=$2 AND revoked_at IS NULL RETURNING id,revoked_at",[projectId,id]);
  if (!result.rowCount) throw new ApiError(404,"SAVED_LOOK_NOT_FOUND","SavedLook not found");
  return result.rows[0];
}
