import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  createAiClosetJob,
  createClosetItemFromUpload,
  createGatewayClient,
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

