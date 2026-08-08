async function request(fetchImpl, url, options) {
  const response = await fetchImpl(url, options);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw Object.assign(
      new Error(body.error?.message || `Provider request failed (${response.status})`),
      { code: "OPENAI_REQUEST_FAILED" },
    );
  }
  return body;
}

function detectImageType(bytes) {
  if (bytes?.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    return { mimeType: "image/png", extension: "png" };
  }
  if (bytes?.[0] === 255 && bytes?.[1] === 216 && bytes?.[2] === 255) {
    return { mimeType: "image/jpeg", extension: "jpg" };
  }
  if (bytes?.subarray(0, 4).toString() === "RIFF" && bytes?.subarray(8, 12).toString() === "WEBP") {
    return { mimeType: "image/webp", extension: "webp" };
  }
  throw Object.assign(new Error("Unsupported source image format"), { code: "SOURCE_IMAGE_FORMAT_UNSUPPORTED" });
}

export async function analyzeWardrobe({ fetchImpl = fetch, baseUrl, key, model, image }) {
  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      items: {
        type: "array",
        maxItems: 12,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            name: { type: "string" },
            part: { type: "string", enum: ["upperbody", "wholebody_up", "lowerbody", "accessories_up", "shoes"] },
            color: { type: "string", pattern: "^#[0-9A-Fa-f]{6}$" },
            secondaryColor: {
              anyOf: [
                { type: "string", pattern: "^#[0-9A-Fa-f]{6}$" },
                { type: "null" },
              ],
            },
            tags: { type: "array", items: { type: "string" }, maxItems: 8 },
          },
          required: ["name", "part", "color", "secondaryColor", "tags"],
        },
      },
    },
    required: ["items"],
  };
  const type = detectImageType(image);
  const body = await request(fetchImpl, `${baseUrl}/responses`, {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: "Identify every distinct wearable garment. Return concise catalog metadata only." },
            { type: "input_image", image_url: `data:${type.mimeType};base64,${image.toString("base64")}` },
          ],
        },
      ],
      text: { format: { type: "json_schema", name: "wardrobe_items", strict: true, schema } },
    }),
  });
  const text = body.output_text || body.output?.flatMap((item) => item.content || []).find((item) => item.type === "output_text")?.text;
  if (!text) throw Object.assign(new Error("Provider returned no structured output"), { code: "OPENAI_EMPTY_RESULT" });
  return JSON.parse(text);
}

export async function editImages({ fetchImpl = fetch, baseUrl, key, model, quality = "high", prompt, images, size = "1024x1024" }) {
  const form = new FormData();
  form.set("model", model);
  form.set("prompt", prompt);
  form.set("size", size);
  form.set("quality", quality);
  form.set("output_format", "png");
  images.forEach((bytes, index) => {
    const type = detectImageType(bytes);
    form.append("image[]", new Blob([bytes], { type: type.mimeType }), `image-${index + 1}.${type.extension}`);
  });
  const body = await request(fetchImpl, `${baseUrl}/images/edits`, {
    method: "POST",
    headers: { authorization: `Bearer ${key}` },
    body: form,
  });
  const encoded = body.data?.[0]?.b64_json;
  if (!encoded) throw Object.assign(new Error("Provider returned no image"), { code: "OPENAI_EMPTY_IMAGE" });
  return Buffer.from(encoded, "base64");
}
