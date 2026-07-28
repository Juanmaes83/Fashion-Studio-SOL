const BLOCKED_PROVIDER_HOSTS = [
  "api.openai.com",
  "queue.fal.run",
  "fal.run",
  "api.klingai.com",
];

const CATEGORY_TO_PART = {
  tops: "upperbody",
  knitwear: "upperbody",
  outerwear: "upperbody",
  tailoring: "upperbody",
  bottoms: "lowerbody",
  denim: "lowerbody",
  dresses: "wholebody_up",
  footwear: "shoes",
  shoes: "shoes",
  bags: "accessories_up",
  accessories: "accessories_up",
};

const AI_CLOSET_CATEGORY_MAP = {
  top: "tops",
  tops: "tops",
  shirt: "tops",
  blouse: "tops",
  tshirt: "tops",
  "t-shirt": "tops",
  sweater: "knitwear",
  cardigan: "knitwear",
  hoodie: "knitwear",
  jacket: "outerwear",
  coat: "outerwear",
  blazer: "tailoring",
  pants: "bottoms",
  trousers: "bottoms",
  jeans: "denim",
  skirt: "bottoms",
  dress: "dresses",
  dresses: "dresses",
  footwear: "footwear",
  shoes: "footwear",
  sneakers: "footwear",
  boots: "footwear",
  bag: "bags",
  bags: "bags",
  accessory: "accessories",
  accessories: "accessories",
};

const NAMED_COLORS = {
  black: "#111111",
  white: "#f7f4ef",
  ivory: "#f2eadf",
  beige: "#c8b99d",
  camel: "#b88754",
  brown: "#6f4b35",
  grey: "#8d8d8d",
  gray: "#8d8d8d",
  navy: "#1f2f4f",
  blue: "#3d6fb6",
  indigo: "#2d3d73",
  green: "#4b6f4a",
  olive: "#6f7445",
  red: "#b6423c",
  burgundy: "#6f2435",
  pink: "#d8879b",
  purple: "#72549a",
  yellow: "#d8b642",
  orange: "#c66b3d",
};

export function createClosetItemFromUpload(input) {
  assertObject(input, "input");
  const now = input.createdAt || new Date().toISOString();
  return {
    id: requiredString(input.id, "id"),
    sourceImage: requiredString(input.sourceImage, "sourceImage"),
    transparentImage: input.transparentImage || null,
    modeledImage: input.modeledImage || null,
    createdAt: now,
    updatedAt: input.updatedAt || now,
    category: input.category || "",
    subcategory: input.subcategory || "",
    tags: Array.isArray(input.tags) ? input.tags : [],
    colors: normalizeColorList(input.colors || input.color || []),
    season: normalizeStringList(input.season),
    occasion: normalizeStringList(input.occasion),
    brand: input.brand || "",
    price: Number.isFinite(input.price) ? input.price : null,
    currency: input.currency || null,
    processingStatus: {
      backgroundRemoval: input.processingStatus?.backgroundRemoval || "pending",
      categorization: input.processingStatus?.categorization || "pending",
      tryOn: input.processingStatus?.tryOn || "not_requested",
    },
    processingError: input.processingError || {},
  };
}

export function mapAiClosetItemToGarment(item, options = {}) {
  assertObject(item, "item");
  const id = requiredString(item.id, "item.id");
  const category = normalizeCategory(item.category || item.garmentType || "");
  const colors = normalizeColorList(item.colors || item.color || []);
  const image = item.transparentImage || item.backgroundRemovedImageUri || item.imageUri || item.sourceImage;

  return pruneNullish({
    id,
    name: item.name || options.defaultName || "Untitled garment",
    description: item.description || "",
    part: CATEGORY_TO_PART[category] || "accessories_up",
    bodyArea: CATEGORY_TO_PART[category] || "accessories_up",
    category,
    subcategory: item.subcategory || "",
    color: colors[0] || options.defaultColor || "#111111",
    palette: colors,
    season: normalizeStringList(item.season),
    occasion: normalizeStringList(item.occasion),
    tags: normalizeStringList(item.tags),
    image,
    thumbnail: item.thumbnail || image,
    modeledImage: item.modeledImage || null,
    brand: item.brand || options.brand || "",
    price: Number.isFinite(item.price) ? item.price : undefined,
    currency: item.currency || options.currency,
    productUrl: item.productUrl,
    schemaVersion: options.schemaVersion || "1.1.0",
    source: {
      kind: "ai-closet",
      originalId: id,
      sourceImage: item.sourceImage || item.imageUri || null,
    },
    fieldProvenance: {
      category: item.category ? "ai_inferred" : "unknown",
      subcategory: item.subcategory ? "ai_inferred" : "unknown",
      color: colors.length ? "ai_inferred" : "unknown",
      season: item.season?.length ? "ai_inferred" : "unknown",
      occasion: item.occasion?.length ? "ai_inferred" : "unknown",
    },
  });
}

export function createAiClosetJob(type, payload = {}) {
  const allowed = ["categorize", "remove-background", "try-on", "purge"];
  if (!allowed.includes(type)) {
    throw new Error(`Unsupported AI Closet job type: ${type}`);
  }
  return {
    id: payload.id || `${type}-${Date.now()}`,
    type,
    status: "queued",
    createdAt: payload.createdAt || new Date().toISOString(),
    provider: payload.provider || "gateway",
    payload,
  };
}

export function createGatewayClient({ baseUrl, fetchImpl = globalThis.fetch, tokenProvider } = {}) {
  const normalizedBaseUrl = normalizeGatewayBaseUrl(baseUrl);
  if (typeof fetchImpl !== "function") {
    throw new Error("fetchImpl is required");
  }

  async function request(path, options = {}) {
    const headers = {
      "content-type": "application/json",
      ...(options.headers || {}),
    };
    const token = typeof tokenProvider === "function" ? await tokenProvider() : null;
    if (token) headers.authorization = `Bearer ${token}`;

    const response = await fetchImpl(`${normalizedBaseUrl}${path}`, {
      ...options,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`AI Closet gateway error ${response.status}`);
    }
    return response.json();
  }

  return {
    categorize: (body) => request("/categorize", { method: "POST", body }),
    removeBackground: (body) => request("/remove-background", { method: "POST", body }),
    submitTryOn: (body) => request("/try-on", { method: "POST", body }),
    getTryOnStatus: (jobId) => request(`/try-on/${encodeURIComponent(jobId)}`, { method: "GET" }),
    getTryOnResult: (jobId) => request(`/try-on/${encodeURIComponent(jobId)}/result`, { method: "GET" }),
    purgeTryOn: (jobId) => request(`/try-on/${encodeURIComponent(jobId)}`, { method: "DELETE" }),
  };
}

export function normalizeGatewayBaseUrl(baseUrl) {
  const value = requiredString(baseUrl, "baseUrl").replace(/\/+$/, "");
  let host = "";
  try {
    host = new URL(value, "https://local.invalid").host;
  } catch {
    throw new Error("baseUrl must be a valid URL or absolute app path");
  }
  if (BLOCKED_PROVIDER_HOSTS.some((blockedHost) => host === blockedHost || host.endsWith(`.${blockedHost}`))) {
    throw new Error("AI provider URLs are forbidden in frontend modules. Use the backend gateway.");
  }
  return value;
}

function normalizeCategory(value) {
  const key = String(value || "").trim().toLowerCase();
  return AI_CLOSET_CATEGORY_MAP[key] || (CATEGORY_TO_PART[key] ? key : "accessories");
}

function normalizeColorList(values) {
  return normalizeStringList(values)
    .map((value) => value.trim().toLowerCase())
    .map((value) => {
      if (/^#[0-9a-f]{6}$/i.test(value)) return value.toLowerCase();
      return NAMED_COLORS[value] || null;
    })
    .filter(Boolean)
    .filter((value, index, all) => all.indexOf(value) === index)
    .slice(0, 5);
}

function normalizeStringList(values) {
  if (!values) return [];
  const source = Array.isArray(values) ? values : [values];
  return source.map((value) => String(value).trim()).filter(Boolean);
}

function pruneNullish(object) {
  return Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined));
}

function assertObject(value, name) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${name} must be an object`);
  }
}

function requiredString(value, name) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${name} is required`);
  }
  return value.trim();
}

