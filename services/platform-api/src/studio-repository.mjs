import { ApiError } from './errors.mjs';
import * as repo from './repository.mjs';

const assetView = (row, storage) => {
  const item = {
    id: row.id,
    garmentId: row.garment_id,
    outfitId: row.outfit_id,
    kind: row.kind,
    visibility: row.visibility,
    status: row.status,
    mimeType: row.mime_type,
    byteSize: Number(row.byte_size),
    checksumSha256: row.checksum_sha256,
    createdAt: row.created_at
 