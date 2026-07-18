import assert from "node:assert/strict";
import { createHash } from "node:crypto";

const base = process.env.API_BASE_URL || "http://127.0.0.1:8787";
const token = process.env.ADMIN_API_TOKEN || "phase2-test-token";
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
const checksum = createHash("sha256").update(png).digest("hex");

async function jsonCall(path, { method = "GET", body, auth = false, headers = {} } = {}) {
  const response = await fetch(base + path, {
    method,
    headers: { ...(body ? { "content-type": "application/json" } : {}), ...(auth ? { authorization: `Bearer ${token}` } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined
  });
  const payload = await response.json();
  return { response, payload };
}

async function uploadAsset({ key, kind }) {
  let result = await jsonCall("/admin/projects/project-sol/assets/upload-intent", {
    method: "POST", auth: true, headers: { "idempotency-key": key },
    body: { filename: `${kind}.png`, mimeType: "image/png", byteSize: png.length, checksumSha256: checksum, kind, garmentId: "shirt-white", width: 1, height: 1 }
  });
  assert.equal(result.response.status, 201, JSON.stringify(result.payload));
  const assetId = result.payload.asset.id;
  const upload = await fetch(base + result.payload.upload.path, { method: "PUT", body: png, headers: { "content-type": "application/octet-stream" } });
  assert.equal(upload.status, 200, await upload.text());
  result = await jsonCall(`/admin/projects/project-sol/assets/${assetId}/complete`, { method: "POST", auth: true });
  assert.equal(result.response.status, 200, JSON.stringify(result.payload));
  return assetId;
}

const assetId = await uploadAsset({ key: "asset-smoke-1", kind: "thumbnail" });
let result = await jsonCall(`/admin/projects/project-sol/assets/${assetId}`, { auth: true });
assert.equal(result.response.status, 200);
assert.ok(result.payload.download.path);
let privateRead = await fetch(base + result.payload.download.path);
assert.equal(privateRead.status, 200);
assert.deepEqual(Buffer.from(await privateRead.arrayBuffer()), png);
assert.equal((await fetch(`${base}/public/assets/${assetId}`)).status, 404);

result = await jsonCall(`/admin/projects/project-sol/assets/${assetId}/promote`, { method: "POST", auth: true, body: { decision: "rejected" } });
assert.equal(result.response.status, 422);
result = await jsonCall(`/admin/projects/project-sol/assets/${assetId}/promote`, { method: "POST", auth: true, body: { decision: "approved", note: "phase2c smoke" } });
assert.equal(result.response.status, 200, JSON.stringify(result.payload));
assert.equal(result.payload.visibility, "public");
assert.equal((await fetch(`${base}/public/assets/${assetId}`)).status, 200);
assert.equal((await jsonCall(`/admin/projects/project-sol/assets/${assetId}`, { method: "DELETE", auth: true })).response.status, 409);

result = await jsonCall(`/admin/projects/project-sol/assets/${assetId}/withdraw`, { method: "POST", auth: true });
assert.equal(result.response.status, 200, JSON.stringify(result.payload));
assert.equal(result.payload.visibility, "internal");
assert.equal((await fetch(`${base}/public/assets/${assetId}`)).status, 404);
result = await jsonCall(`/admin/projects/project-sol/assets/${assetId}`, { method: "DELETE", auth: true });
assert.equal(result.response.status, 200, JSON.stringify(result.payload));
assert.equal(result.payload.status, "deleted");

const sourceAssetId = await uploadAsset({ key: "asset-smoke-source-block", kind: "source" });
result = await jsonCall(`/admin/projects/project-sol/assets/${sourceAssetId}/promote`, { method: "POST", auth: true, body: { decision: "approved" } });
assert.equal(result.response.status, 422, JSON.stringify(result.payload));
assert.equal(result.payload.error.code, "ASSET_KIND_NOT_PUBLIC");
result = await jsonCall(`/admin/projects/project-sol/assets/${sourceAssetId}`, { method: "DELETE", auth: true });
assert.equal(result.response.status, 200, JSON.stringify(result.payload));

console.log("Phase 2C asset lifecycle and safe publication smoke: PASS");
