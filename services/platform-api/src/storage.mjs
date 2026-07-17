import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { mkdir, open, readFile, rename, rm, stat } from "node:fs/promises";
import path from "node:path";
import { ApiError } from "./errors.mjs";

const SHA256 = /^[0-9a-f]{64}$/i;
const MIME_MAGIC = {
  "image/png": b => b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])),
  "image/jpeg": b => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  "image/webp": b => b.length >= 12 && b.subarray(0,4).toString() === "RIFF" && b.subarray(8,12).toString() === "WEBP"
};

const safeSegment = value => String(value || "").replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120);
const signaturePayload = ({ method, assetId, expires }) => `${method}\n${assetId}\n${expires}`;

function secureEqualHex(a, b) {
  if (!/^[0-9a-f]+$/i.test(a || "") || !/^[0-9a-f]+$/i.test(b || "") || a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
}

export function createStorage({ root, signingSecret }) {
  if (!root) throw new Error("STORAGE_ROOT is required");
  if (!signingSecret || signingSecret.length < 32) throw new Error("STORAGE_SIGNING_SECRET must be at least 32 characters");
  const absoluteRoot = path.resolve(root);

  const resolveKey = key => {
    const normalized = String(key || "").replaceAll("\\", "/");
    if (!normalized || normalized.startsWith("/") || normalized.split("/").includes("..")) throw new ApiError(422, "STORAGE_KEY_INVALID", "Storage key is invalid");
    const target = path.resolve(absoluteRoot, normalized);
    if (target !== absoluteRoot && !target.startsWith(`${absoluteRoot}${path.sep}`)) throw new ApiError(422, "STORAGE_KEY_INVALID", "Storage key is invalid");
    return target;
  };

  const sign = ({ method, assetId, expires }) => createHmac("sha256", signingSecret).update(signaturePayload({ method, assetId, expires })).digest("hex");
  const verify = ({ method, assetId, expires, signature }) => {
    const exp = Number(expires);
    if (!Number.isInteger(exp) || exp <= Math.floor(Date.now() / 1000)) throw new ApiError(403, "SIGNED_URL_EXPIRED", "Signed URL expired");
    const expected = sign({ method, assetId, expires: exp });
    if (!secureEqualHex(expected, String(signature || ""))) throw new ApiError(403, "SIGNED_URL_INVALID", "Signed URL is invalid");
  };

  return {
    root: absoluteRoot,
    makeKey({ projectId, assetId, visibility, filename }) {
      const ext = path.extname(filename || "").toLowerCase().replace(/[^.a-z0-9]/g, "").slice(0, 10);
      return `projects/${safeSegment(projectId)}/${visibility}/${safeSegment(assetId)}${ext}`;
    },
    signedPath({ method, assetId, expiresInSeconds = 900 }) {
      const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;
      const signature = sign({ method, assetId, expires });
      return { expires, signature };
    },
    verifySignedPath: verify,
    async putAtomic({ key, body, expectedSize, expectedChecksum, mimeType }) {
      if (!SHA256.test(expectedChecksum || "")) throw new ApiError(422, "CHECKSUM_INVALID", "Checksum must be SHA-256");
      const target = resolveKey(key);
      await mkdir(path.dirname(target), { recursive: true });
      const temp = `${target}.upload-${process.pid}-${Date.now()}`;
      const handle = await open(temp, "wx", 0o600);
      const hash = createHash("sha256");
      let size = 0;
      let prefix = Buffer.alloc(0);
      try {
        for await (const chunk of body) {
          size += chunk.length;
          if (size > expectedSize) throw new ApiError(413, "ASSET_TOO_LARGE", "Uploaded file exceeds declared size");
          if (prefix.length < 16) prefix = Buffer.concat([prefix, chunk]).subarray(0, 16);
          hash.update(chunk);
          await handle.write(chunk);
        }
        await handle.sync();
      } catch (error) {
        await handle.close();
        await rm(temp, { force: true });
        throw error;
      }
      await handle.close();
      const checksum = hash.digest("hex");
      if (size !== expectedSize) { await rm(temp, { force: true }); throw new ApiError(422, "SIZE_MISMATCH", "Uploaded file size does not match intent"); }
      if (!secureEqualHex(checksum, expectedChecksum)) { await rm(temp, { force: true }); throw new ApiError(422, "CHECKSUM_MISMATCH", "Uploaded file checksum does not match intent"); }
      const magic = MIME_MAGIC[mimeType];
      if (!magic || !magic(prefix)) { await rm(temp, { force: true }); throw new ApiError(422, "MIME_MISMATCH", "Uploaded content does not match declared MIME type"); }
      await rename(temp, target);
      return { byteSize: size, checksumSha256: checksum };
    },
    async exists(key) { try { return (await stat(resolveKey(key))).isFile(); } catch (e) { if (e.code === "ENOENT") return false; throw e; } },
    async read(key) { return readFile(resolveKey(key)); },
    async move(fromKey, toKey) {
      const from = resolveKey(fromKey); const to = resolveKey(toKey);
      await mkdir(path.dirname(to), { recursive: true }); await rename(from, to);
    },
    async delete(key) { await rm(resolveKey(key), { force: true }); }
  };
}
