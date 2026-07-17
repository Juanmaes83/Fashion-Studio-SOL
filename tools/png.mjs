// Mini-encoder PNG RGBA sin dependencias (zlib nativo de Node).
// Suficiente para fixtures del slice; producción usará sharp (ya presente en wardrobe).
import zlib from "node:zlib";

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

export function encodePNG(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

export class Canvas {
  constructor(w, h) { this.w = w; this.h = h; this.px = Buffer.alloc(w * h * 4); }
  set(x, y, [r, g, b, a]) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 4;
    this.px[i] = r; this.px[i + 1] = g; this.px[i + 2] = b; this.px[i + 3] = a;
  }
  rect(x, y, w, h, c) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, c);
  }
  ellipse(cx, cy, rx, ry, c) {
    for (let j = cy - ry; j <= cy + ry; j++)
      for (let i = cx - rx; i <= cx + rx; i++)
        if (((i - cx) ** 2) / (rx * rx) + ((j - cy) ** 2) / (ry * ry) <= 1) this.set(i, j, c);
  }
  // trapecio vertical: ancho superior→inferior interpolado
  trapezoid(cx, yTop, yBottom, wTop, wBottom, c) {
    for (let j = yTop; j <= yBottom; j++) {
      const t = (j - yTop) / Math.max(1, yBottom - yTop);
      const half = Math.round((wTop + (wBottom - wTop) * t) / 2);
      for (let i = cx - half; i <= cx + half; i++) this.set(i, j, c);
    }
  }
  png() { return encodePNG(this.w, this.h, this.px); }
}

export const hex = (h, a = 255) => [
  parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16), a
];
