import * as repo from './repository.mjs';
import { PUBLIC_ASSET_KINDS } from './assets.mjs';

function assetView(row, storage) {
  const publishEligible = PUBLIC_ASSET_KINDS.has(row.kind);
  const item = {
    id: row.id,
    garmentId: row.garment_id,
    outfitId: row.outfit_id,
    kind: row.kind,
    visibility: row.visibility,
    status: row.status,
    publishEligible,
    mimeType: row.mime_type,
    byteSize: Number(row.byte_size),
    checksumSha256: row.checksum_sha256,
    createdAt: row.created_at
  };

  if (row.status === 'ready') {
    const signed = storage.signedPath({ method: 'GET', assetId: row.id, expiresInSeconds: 3600 });
    item.url = `/assets/${row.id}?expires=${signed.expires}&signature=${signed.signature}`;
    if (row.visibility === 'public') item.publicUrl = `/public/assets/${row.id}`;
  }

  return item;
}

export async function getStudioSnapshot(pool, storage, projectId) {
  const [projectResult, garments, outfits, assetsResult, jobsResult, publicationResult] = await Promise.all([
    pool.query(`SELECT p.id,p.slug,p.name,b.name brand_name,w.name workspace_name
      FROM projects p JOIN brands b ON b.id=p.brand_id JOIN workspaces w ON w.id=p.workspace_id
      WHERE p.id=$1`, [projectId]),
    repo.listGarments(pool, projectId),
    repo.listOutfits(pool, projectId),
    pool.query(`SELECT * FROM assets WHERE project_id=$1 AND status<>'deleted'
      ORDER BY created_at,id`, [projectId]),
    pool.query(`SELECT id,job_type,target_type,target_id,status,progress,attempt_count,max_attempts,
      provider,model,error_code,error_message,created_at,updated_at,finished_at
      FROM generation_jobs WHERE project_id=$1 ORDER BY created_at DESC LIMIT 50`, [projectId]),
    pool.query(`SELECT id,version,status,checksum_sha256,published_at,withdrawn_at
      FROM publications WHERE project_id=$1 ORDER BY version DESC LIMIT 10`, [projectId])
  ]);

  const project = projectResult.rows[0] || { id: projectId, slug: null, name: projectId };
  const assets = assetsResult.rows.map(row => assetView(row, storage));
  const assetsByGarment = new Map();
  const assetsByOutfit = new Map();

  for (const asset of assets) {
    if (asset.garmentId) {
      const list = assetsByGarment.get(asset.garmentId) || [];
      list.push(asset);
      assetsByGarment.set(asset.garmentId, list);
    }
    if (asset.outfitId) {
      const list = assetsByOutfit.get(asset.outfitId) || [];
      list.push(asset);
      assetsByOutfit.set(asset.outfitId, list);
    }
  }

  const eligibleAssets = assets.filter(asset => asset.status === 'ready' && asset.publishEligible);
  const blockedAssets = assets.filter(asset => asset.status === 'ready' && !asset.publishEligible);

  return {
    contract: 'phase-2f/studio-snapshot/v1',
    project,
    counts: {
      garments: garments.length,
      outfits: outfits.length,
      assets: assets.length,
      jobs: jobsResult.rows.length
    },
    publicationPlan: {
      eligible: eligibleAssets.length,
      blocked: blockedAssets.length,
      eligibleKinds: [...PUBLIC_ASSET_KINDS],
      blockedKinds: [...new Set(blockedAssets.map(asset => asset.kind))]
    },
    garments: garments.map(garment => ({ ...garment, assets: assetsByGarment.get(garment.id) || [] })),
    outfits: outfits.map(outfit => ({ ...outfit, assets: assetsByOutfit.get(outfit.id) || [] })),
    jobs: jobsResult.rows.map(row => ({
      id: row.id,
      jobType: row.job_type,
      targetType: row.target_type,
      targetId: row.target_id,
      status: row.status,
      progress: Number(row.progress || 0),
      attemptCount: row.attempt_count,
      maxAttempts: row.max_attempts,
      provider: row.provider,
      model: row.model,
      errorCode: row.error_code,
      errorMessage: row.error_message,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      finishedAt: row.finished_at
    })),
    publications: publicationResult.rows.map(row => ({
      id: row.id,
      version: row.version,
      status: row.status,
      checksumSha256: row.checksum_sha256,
      publishedAt: row.published_at,
      withdrawnAt: row.withdrawn_at
    }))
  };
}
