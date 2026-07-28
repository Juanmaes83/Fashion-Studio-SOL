import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  createAiClosetJob,
  createClosetItemFromUpload,
  createClosetLook,
  createGatewayClient,
  mapClosetLookToOutfit,
  mapAiClosetItemToGarment,
  normalizeGatewayBaseUrl,
} from "../../packages/ai-closet-engine/index.mjs";

test("creates a portable closet item from an uploaded image", () => {
  const item = createClosetItemFromUpload({
    id: "closet-1",
    sourceImage: "/uploads/jacket.jpg",
    category: "jacket",
    color: ["navy", "white"],
  });

  assert.equal(item.id, "closet-1");
  assert.equal(item.sourceImage, "/uploads/jacket.jpg");
  assert.deepEqual(item.colors, ["#1f2f4f", "#f7f4ef"]);
  assert.equal(item.processingStatus.backgroundRemoval, "pending");
  assert.equal(item.processingStatus.categorization, "pending");
  assert.equal(item.processingStatus.tryOn, "not_requested");
});

test("models an editable closet look and maps it to the canonical outfit contract", () => {
  const look = createClosetLook({
    id: "look-1",
    name: "Office navy",
    garmentIds: ["closet-1", "closet-2"],
    canvas: {
      items: [
        { garmentId: "closet-1", x: 0.4, y: 0.2, scale: 1.1, rotation: 0, zIndex: 1 },
        { garmentId: "closet-2", x: 0.5, y: 0.72, scale: 1, rotation: 0, zIndex: 2 },
      ],
    },
  });
  const outfit = mapClosetLookToOutfit(look);

  assert.equal(look.canvas.coordinateSystem, "normalized/v1");
  assert.equal(outfit.status, "draft");
  assert.deepEqual(outfit.garmentIds, ["closet-1", "closet-2"]);
  assert.equal(outfit.canvas.items[1].zIndex, 2);
  assert.throws(() => createClosetLook({ id: "bad", name: "Bad", garmentIds: ["a", "a"] }), /duplicates/);
  assert.throws(() => createClosetLook({ id: "bad", name: "Bad", garmentIds: ["a"], status: "processing" }), /status/);
  assert.throws(() => createClosetLook({ id: "bad", name: "Bad", garmentIds: ["a"], canvas: { items: [{ garmentId: "b" }] } }), /must exist/);
  assert.throws(() => createClosetLook({ id: "bad", name: "Bad", garmentIds: ["a"], canvas: { items: [{ garmentId: "a", x: 1.1 }] } }), /between 0 and 1/);
});

test("maps ai-closet clothing data into the canonical garment contract", () => {
  const garment = mapAiClosetItemToGarment(
    {
      id: "closet-2",
      name: "Noir minimal blazer",
      imageUri: "/raw/blazer.jpg",
      backgroundRemovedImageUri: "/cutouts/blazer.png",
      category: "blazer",
      subcategory: "single breasted",
      color: ["black"],
      season: ["autumn", "winter"],
      occasion: ["office"],
      tags: ["tailored"],
      price: 129,
    },
    { brand: "SOL", currency: "EUR" },
  );

  assert.equal(garment.id, "closet-2");
  assert.equal(garment.part, "upperbody");
  assert.equal(garment.category, "tailoring");
  assert.equal(garment.color, "#111111");
  assert.equal(garment.image, "/cutouts/blazer.png");
  assert.equal(garment.brand, "SOL");
  assert.equal(garment.currency, "EUR");
  assert.equal(garment.source.kind, "ai-closet");
  assert.equal(garment.fieldProvenance.category, "ai_inferred");
});

test("creates explicit jobs for ai closet gateway work", () => {
  const job = createAiClosetJob("try-on", {
    id: "tryon-1",
    closetItemId: "closet-2",
    consentId: "consent-1",
  });

  assert.equal(job.id, "tryon-1");
  assert.equal(job.type, "try-on");
  assert.equal(job.status, "queued");
  assert.equal(job.provider, "gateway");
  assert.equal(job.payload.consentId, "consent-1");
});

test("forbids direct provider URLs in frontend gateway clients", () => {
  assert.throws(() => normalizeGatewayBaseUrl("https://api.openai.com/v1"), /backend gateway/);
  assert.throws(() => normalizeGatewayBaseUrl("https://queue.fal.run/fal-ai/birefnet/v2"), /backend gateway/);
  assert.throws(() => normalizeGatewayBaseUrl("https://api.klingai.com/v1"), /backend gateway/);
  assert.equal(normalizeGatewayBaseUrl("/api/ai-closet"), "/api/ai-closet");
});

test("gateway client calls backend paths without provider secrets", async () => {
  const calls = [];
  const client = createGatewayClient({
    baseUrl: "/api/ai-closet",
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return {
        ok: true,
        json: async () => ({ ok: true }),
      };
    },
  });

  const response = await client.categorize({ assetId: "asset-1" });

  assert.deepEqual(response, { ok: true });
  assert.equal(calls[0].url, "/api/ai-closet/categorize");
  assert.equal(calls[0].options.method, "POST");
  assert.equal(calls[0].options.headers.authorization, undefined);
  assert.equal(calls[0].options.body, JSON.stringify({ assetId: "asset-1" }));
});

test("new ai closet module docs do not reintroduce client-side AI secrets", () => {
  const readme = readFileSync(new URL("../../packages/ai-closet-engine/README.md", import.meta.url), "utf8");
  const source = readFileSync(new URL("../../packages/ai-closet-engine/index.mjs", import.meta.url), "utf8");

  assert.match(readme, /gateway propio/);
  assert.doesNotMatch(source, /EXPO_PUBLIC_/);
  assert.doesNotMatch(source, /Bearer \$\{OPENAI/);
  assert.doesNotMatch(source, /Key \$\{FAL/);
  assert.doesNotMatch(source, /expo-jwt/);
});

test("gateway contract v0.1 declares the complete versioned backend boundary", () => {
  const contract = JSON.parse(readFileSync(new URL("../../packages/ai-closet-engine/gateway-contract.v0.1.json", import.meta.url), "utf8"));

  assert.equal(contract.version, "ai-closet-gateway/v0.1");
  assert.equal(contract.basePath, "/api/ai-closet");
  assert.equal(contract.operations.submitTryOn.path, "/try-on");
  assert.equal(contract.$defs["try-on-request"].properties.schema.const, "mirrora-tryon-request/v0.1");
  assert.deepEqual(contract.$defs.job.properties.status.enum, ["queued", "processing", "completed", "failed", "purged"]);
  assert.equal(contract.transport.idempotencyHeader, "Idempotency-Key");
});
